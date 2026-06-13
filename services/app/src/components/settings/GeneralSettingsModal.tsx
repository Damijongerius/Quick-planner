"use client";

import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { Cpu, Save, Globe } from "lucide-react";
import "./GeneralSettingsModal.css";
import { useOllamaSettings } from "./useOllamaSettings";
import { OllamaSettingsTab } from "./OllamaSettingsTab";

interface GeneralSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GeneralSettingsModal({ isOpen, onClose }: Readonly<GeneralSettingsModalProps>) {
  const [activeTab, setActiveTab] = useState<"ollama" | "about">("ollama");
  
  const ollamaProps = useOllamaSettings(isOpen);

  const handleSave = () => {
    localStorage.setItem("qp_ollama_url", ollamaProps.ollamaUrl);
    localStorage.setItem("qp_ollama_model", ollamaProps.ollamaModel);
    
    // Dispatch custom event for reactive updates in other components (like AIChat)
    window.dispatchEvent(new Event("qp_settings_changed"));
    
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Settings"
      subtitle="Configure application preferences and integrations"
      maxWidth="760px"
    >
      <div className="settings-layout">
        <aside className="settings-sidebar">
          <button 
            type="button"
            className={`settings-nav-item ${activeTab === 'ollama' ? 'active' : ''}`}
            onClick={() => setActiveTab('ollama')}
          >
            <Cpu size={16} />
            <span>Ollama AI</span>
          </button>
          
          <button 
            type="button"
            className={`settings-nav-item ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            <Globe size={16} />
            <span>About</span>
          </button>
        </aside>

        <main className="settings-content">
          {activeTab === 'ollama' && <OllamaSettingsTab {...ollamaProps} />}

          {activeTab === 'about' && (
            <div className="settings-section">
              <h4 className="settings-section-title">About QuickPlanner</h4>
              <p className="settings-section-subtitle">
                Version 1.0.0 — Strategic Hierarchical Planning
              </p>
              <div className="settings-info-box mt-md">
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  QuickPlanner is an offline-first desktop planning tool, designed to manage high-level Epics, mid-level Stories, and low-level Tasks inside local projects.
                </p>
                <p className="text-sm text-on-surface-variant leading-relaxed mt-sm">
                  Powered by next-generation web technologies: Tauri, Next.js SPA, and local LLM orchestration.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      <div className="flex justify-end gap-md border-t pt-xl mt-lg">
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave} icon={<Save size={16} />}>
          Save Settings
        </Button>
      </div>
    </Modal>
  );
}
