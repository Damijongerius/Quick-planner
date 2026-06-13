# QuickPlanner Desktop Setup Guide

This guide describes how to run and compile the Local Desktop Application version of QuickPlanner, connected to a centralized Backend API with local client-side AI integration using **Ollama**.

---

## Architecture Overview

```mermaid
graph TD
    subgraph User's Machine [User's Local Machine]
        Tauri[Tauri Desktop App Shell]
        NextJS[Next.js Client SPA: Port 3003]
        Ollama[Local Ollama API: http://localhost:11434]
    end
    
    subgraph Server [Central Backend Server]
        API[Express.js Backend API: Port 3000]
        DB[(PostgreSQL Database)]
    end

    Tauri -->|Renders & Embeds| NextJS
    NextJS -->|Client-side REST Calls with JWT| API
    NextJS -->|Direct API Call / Tool Loop| Ollama
    API -->|Prisma ORM| DB
```

1. **Tauri Native Wrapper (`services/desktop`)**: Manages the desktop window lifecycle, runs Next.js in a native webview, and handles static page delivery.
2. **Next.js SPA (`services/app`)**: Compiled as a fully static SPA (`output: 'export'`). Performs all data fetching dynamically in client-side runtime via REST requests to the Backend API.
3. **Central Backend API (`services/backend`)**: Standard Express.js server providing user registration, JWT-based authentication, project configuration, sprint/planning node CRUD endpoints, and Wake-on-LAN services.
4. **Local Ollama Integration**: Runs completely client-side in the browser/webview. Intercepts user prompts, calls local Ollama endpoints (e.g. `http://localhost:11434`), coordinates the tool execution loops client-side, and calls Backend API routes on behalf of the user. **Zero server-side LLM costs!**

---

## Prerequisites

1. **Node.js**: v18 or later.
2. **Rust & Cargo**: Required to compile the Tauri native wrapper. Follow the [Tauri Prerequisites Guide](https://tauri.app/v1/guides/getting-started/prerequisites) to install.
3. **PostgreSQL**: Ensure a local or remote PostgreSQL instance is running.
4. **Ollama**: Download and install [Ollama](https://ollama.com/) locally.

---

## Step 1: Database & Backend Setup

1. Open a terminal and navigate to `services/backend`.
2. Verify or create `.env` file containing the database credentials and a JWT secret:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/planner?schema=public"
   JWT_SECRET="9be36b2890786576f3f0e0c8b6a1d4f2a5e9d8c7b6a5f4e3d2c1b0a9f8e7d6c5"
   PORT=3000
   ```
3. Initialize the database schemas:
   ```bash
   npx prisma db push
   ```
4. Start the backend API dev server:
   ```bash
   npm run dev
   ```
   The backend will start listening on port `3000`.

---

## Step 2: Running the Desktop Application

During development, Tauri will load the Next.js dev server on port `3003` to allow hot reloading.

1. Open another terminal and navigate to `services/desktop`.
2. Run the Tauri dev task:
   ```bash
   npm run dev
   ```
   This command will:
   - Automatically spin up the Next.js dev server on port `3003`.
   - Compile the Tauri Rust wrapper binary.
   - Launch the desktop application UI window.

---

## Step 3: Local AI (Ollama) Integration

To enable the AI planning assistant, you must launch Ollama with CORS origins enabled so the desktop webview can talk to it directly.

### Enable CORS in Ollama:
- **macOS**:
  Quit Ollama from the menu bar, then launch it from your terminal:
  ```bash
  OLLAMA_ORIGINS="*" ollama serve
  ```
- **Windows**:
  1. Quit Ollama from the taskbar.
  2. Open System Environment Variables and add a new environment variable:
     - Name: `OLLAMA_ORIGINS`
     - Value: `*`
  3. Launch Ollama again.
- **Linux**:
  Configure the systemd service to include `Environment="OLLAMA_ORIGINS=*"` under the `[Service]` section of `/etc/systemd/system/ollama.service`, run `systemctl daemon-reload`, and restart the service.

### In the Desktop Application:
1. Open the **AI Chat** from the sidebar.
2. Click the **Settings (Gear Icon)** in the header.
3. Verify your Ollama Endpoint (default: `http://localhost:11434`).
4. Click **Test Connection**. It will fetch all installed models (like `qwen2.5:7b` or `llama3.1`).
5. Choose your model, close the settings panel, and start planning!

---

## Building for Production

When you are ready to compile a production binary:

1. Navigate to `services/desktop`.
2. Compile the application:
   ```bash
   npm run build
   ```
   This script triggers `npm run build` in the `services/app` folder to export static HTML/JS files into `services/app/out`, then packages them into a native standalone desktop executable located in `services/desktop/src-tauri/target/release/bundle`.
