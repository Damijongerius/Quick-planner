import os from 'os';
import net from 'net';

let discoveredUrl: string | null = null;

/**
 * Identify the local subnet and scan for port 11434 (Ollama)
 */
export async function discoverOllama(): Promise<string> {
    if (discoveredUrl) return discoveredUrl;

    // In Docker on Mac/Windows, the host is accessible via host.docker.internal
    const isDockerHost = await checkPort('host.docker.internal', 11434);
    if (isDockerHost) {
        discoveredUrl = 'http://host.docker.internal:11434';
        return discoveredUrl;
    }

    // In development or if localhost is available, check it next
    const isLocalhost = await checkPort('127.0.0.1', 11434);
    if (isLocalhost) {
        discoveredUrl = 'http://127.0.0.1:11434';
        return discoveredUrl;
    }

    const interfaces = os.networkInterfaces();
    const addresses: string[] = [];

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]!) {
            if (iface.family === 'IPv4' && !iface.internal) {
                addresses.push(iface.address);
            }
        }
    }

    if (addresses.length === 0) return 'http://localhost:11434';

    // Scan the subnet for the first active address
    const baseIp = addresses[0].split('.').slice(0, 3).join('.');
    const scanRange = Array.from({ length: 254 }, (_, i) => `${baseIp}.${i + 1}`);

    try {
        const foundIp = await raceToPort(scanRange, 11434);
        if (foundIp) {
            discoveredUrl = `http://${foundIp}:11434`;
            console.log(`[AI Discovery] Found Ollama at ${discoveredUrl}`);
            return discoveredUrl;
        }
    } catch (e) {
        console.warn('[AI Discovery] Subnet scan failed, falling back to localhost');
    }

    discoveredUrl = 'http://localhost:11434';
    return discoveredUrl;
}

/**
 * Ensure the specified model is available on the Ollama instance
 */
export async function ensureModel(baseUrl: string, modelName: string) {
    try {
        // 1. Check if model exists
        const tagsResponse = await fetch(`${baseUrl}/api/tags`);
        if (!tagsResponse.ok) return;
        
        const { models } = await tagsResponse.json();
        const exists = models.some((m: any) => m.name === modelName || m.name.startsWith(modelName + ':'));
        
        if (exists) {
            console.log(`[AI Discovery] Model ${modelName} is ready.`);
            return;
        }

        console.log(`[AI Discovery] Model ${modelName} not found. Initiating pull...`);
        
        // 2. Pull with streaming to show progress
        const response = await fetch(`${baseUrl}/api/pull`, {
            method: 'POST',
            body: JSON.stringify({ name: modelName, stream: true })
        });

        if (!response.body) throw new Error('No response body from Ollama');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let lastLoggedProgress = -1;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(Boolean);

            for (const line of lines) {
                try {
                    const json = JSON.parse(line);
                    if (json.status === 'downloading' && json.total) {
                        const progress = Math.round((json.completed / json.total) * 100);
                        // Only log every 5% to keep console clean
                        if (progress % 5 === 0 && progress !== lastLoggedProgress) {
                            console.log(`[AI Discovery] Pulling ${modelName}: ${progress}%`);
                            lastLoggedProgress = progress;
                        }
                    } else if (json.status === 'success') {
                        console.log(`[AI Discovery] Model ${modelName} successfully pulled.`);
                    }
                } catch (e) {
                    // Ignore malformed JSON chunks
                }
            }
        }
    } catch (e: any) {
        console.error(`[AI Discovery] Error ensuring model:`, e.message);
    }
}

/**
 * Triggered on server startup to ensure the system is warm
 */
export async function warmupAI() {
    console.log('[AI Discovery] Server started. Warming up AI dependencies...');
    try {
        const url = await discoverOllama();
        await ensureModel(url, 'gemma4:e2b');
    } catch (e) {
        console.warn('[AI Discovery] Warmup failed. AI will attempt to recover on first request.');
    }
}

function checkPort(host: string, port: number, timeout = 200): Promise<boolean> {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(timeout);
        
        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });

        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });

        socket.connect(port, host);
    });
}

async function raceToPort(hosts: string[], port: number): Promise<string | null> {
    // We scan in chunks to avoid overwhelming the system
    const chunkSize = 32;
    for (let i = 0; i < hosts.length; i += chunkSize) {
        const chunk = hosts.slice(i, i + chunkSize);
        const results = await Promise.all(chunk.map(async (host) => {
            const up = await checkPort(host, port, 300);
            return up ? host : null;
        }));
        
        const found = results.find(r => r !== null);
        if (found) return found;
    }
    return null;
}
