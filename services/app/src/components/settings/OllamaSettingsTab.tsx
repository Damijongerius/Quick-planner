import React from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";
import { Cpu, Check, Loader2, AlertTriangle } from "lucide-react";

interface Props {
  ollamaUrl: string;
  setOllamaUrl: (url: string) => void;
  ollamaModel: string;
  setOllamaModel: (model: string) => void;
  installedModels: string[];
  isTesting: boolean;
  connectionStatus: 'idle' | 'success' | 'error';
  errorMessage: string;
  testConnection: () => void;
}

export function OllamaSettingsTab({
  ollamaUrl, setOllamaUrl,
  ollamaModel, setOllamaModel,
  installedModels, isTesting,
  connectionStatus, errorMessage,
  testConnection
}: Props) {
  return (
    <div className="settings-section">
      <h4 className="settings-section-title">Ollama Integration</h4>
      <p className="settings-section-subtitle">
        QuickPlanner uses local Ollama instances to run LLMs on your machine. This provides privacy and eliminates API costs.
      </p>

      <div className="settings-form-group">
        <label className="settings-label">Ollama Endpoint URL</label>
        <div className="flex gap-md w-full">
          <Input 
            variant="planner"
            type="text" 
            value={ollamaUrl} 
            onChange={(e) => setOllamaUrl(e.target.value)} 
            placeholder="e.g. http://localhost:11434"
            className="flex-1"
          />
          <Button 
            onClick={() => testConnection()} 
            loading={isTesting}
            variant="secondary"
            className="shrink-0"
          >
            Test Connection
          </Button>
        </div>
      </div>

      <div className="settings-form-group">
        <label className="settings-label">Model Selection</label>
        <div className="model-input-row">
          <select 
            value={installedModels.includes(ollamaModel) ? ollamaModel : (["qwen2.5:7b", "llama3.1", "mistral", "gemma2"].includes(ollamaModel) ? ollamaModel : "")} 
            onChange={(e) => {
              if (e.target.value) setOllamaModel(e.target.value);
            }}
            className="settings-select flex-1"
          >
            <option value="" disabled>-- Select installed model --</option>
            {installedModels.length > 0 ? (
              installedModels.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))
            ) : (
              <>
                <option value="qwen2.5:7b">qwen2.5:7b (Recommended)</option>
                <option value="llama3.1">llama3.1</option>
                <option value="mistral">mistral</option>
                <option value="gemma2">gemma2</option>
              </>
            )}
          </select>
          
          <div className="flex flex-col gap-xs flex-1">
            <Input 
              variant="planner"
              type="text" 
              value={ollamaModel} 
              onChange={(e) => setOllamaModel(e.target.value)} 
              placeholder="Or specify custom model name..."
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="connection-status-banner">
        {connectionStatus === 'success' && (
          <div className="status-badge success text-success">
            <Check size={16} />
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm">Connection Successful</span>
              <span className="text-xs opacity-80">Found {installedModels.length} models installed on your Ollama server.</span>
            </div>
          </div>
        )}
        {connectionStatus === 'error' && (
          <div className="status-badge error text-error">
            <AlertTriangle size={16} />
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm">Connection Failed</span>
              <span className="text-xs opacity-90">{errorMessage}</span>
            </div>
          </div>
        )}
        {connectionStatus === 'idle' && !isTesting && (
          <div className="status-badge info">
            <Cpu size={16} />
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm">Ollama Server Offline or Not Tested</span>
              <span className="text-xs opacity-80">Run <code>ollama run qwen2.5:7b</code> or start Ollama daemon.</span>
            </div>
          </div>
        )}
        {isTesting && (
          <div className="status-badge info">
            <Loader2 size={16} className="spinner" />
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm">Testing Connection...</span>
              <span className="text-xs opacity-80">Contacting local Ollama endpoint.</span>
            </div>
          </div>
        )}
      </div>

      <div className="settings-info-box mt-md">
        <span className="font-bold text-xs text-meta">CORS Configuration Tip</span>
        <p className="text-xs text-on-surface-variant leading-relaxed mt-xs">
          If the connection fails despite Ollama running, verify it bypasses browser CORS. Run:
          <code className="block mt-xs p-sm bg-surface-container-high rounded font-mono text-[11px]">
            OLLAMA_ORIGINS="*" ollama serve
          </code>
          or configure system-wide env variables for Ollama.
        </p>
      </div>
    </div>
  );
}
