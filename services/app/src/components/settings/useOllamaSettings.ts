import { useState, useEffect } from "react";

export function useOllamaSettings(isOpen: boolean) {
  const [ollamaUrl, setOllamaUrl] = useState("http://localhost:11434");
  const [ollamaModel, setOllamaModel] = useState("qwen2.5:7b");
  const [installedModels, setInstalledModels] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      const savedUrl = localStorage.getItem("qp_ollama_url") || "http://localhost:11434";
      const savedModel = localStorage.getItem("qp_ollama_model") || "qwen2.5:7b";
      setOllamaUrl(savedUrl);
      setOllamaModel(savedModel);
      setConnectionStatus('idle');
      setErrorMessage("");
      testConnection(savedUrl);
    }
  }, [isOpen]);

  const testConnection = async (urlToTest = ollamaUrl) => {
    setIsTesting(true);
    setConnectionStatus("idle");
    setErrorMessage("");
    try {
      const res = await fetch(`${urlToTest}/api/tags`);
      if (res.ok) {
        const data = await res.json();
        const models = data.models?.map((m: any) => m.name) || [];
        setInstalledModels(models);
        setConnectionStatus("success");
      } else {
        setConnectionStatus("error");
        setErrorMessage(`Server returned status ${res.status}`);
      }
    } catch (err: any) {
      console.error("Ollama connection error:", err);
      setConnectionStatus("error");
      setErrorMessage(err.message || "Failed to connect. Make sure Ollama is running and CORS is enabled.");
    } finally {
      setIsTesting(false);
    }
  };

  return {
    ollamaUrl, setOllamaUrl,
    ollamaModel, setOllamaModel,
    installedModels, isTesting,
    connectionStatus, errorMessage,
    testConnection
  };
}
