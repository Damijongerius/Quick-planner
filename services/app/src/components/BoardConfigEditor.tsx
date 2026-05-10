"use client";

import { useState, useEffect } from "react";
import { LayoutGrid, Calendar, Save } from "lucide-react";
import { updateNodeTypeBoardConfig } from "@/lib/actions";
import { motion } from "framer-motion";
import { Modal } from "./ui/Modal";
import { FormField } from "./ui/FormField";
import { Button } from "./ui/Button";

interface BoardConfigEditorProps {
  projectId: string;
  nodeType: any;
  isOpen: boolean;
  onClose: () => void;
}

export function BoardConfigEditor({ projectId, nodeType, isOpen, onClose }: BoardConfigEditorProps) {
  const [showOnKanban, setShowOnKanban] = useState(true);
  const [showOnGantt, setShowOnGantt] = useState(true);
  const [isSprintEligible, setIsSprintEligible] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (nodeType) {
      const config = nodeType.boardConfig || {};
      setShowOnKanban(config.showOnKanban !== false);
      setShowOnGantt(config.showOnGantt !== false);
      setIsSprintEligible(nodeType.isSprintEligible);
    }
  }, [nodeType]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateNodeTypeBoardConfig(projectId, nodeType.id, { 
        showOnKanban, 
        showOnGantt, 
        isSprintEligible 
      });
      onClose();
    } catch (error) {
      console.error("Failed to save board config", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="Governance Logic" 
        subtitle={`Behavioral rules for ${nodeType?.name}`}
        footer={
            <div className="flex gap-md">
                <Button onClick={handleSave} loading={isSaving} className="flex-1" icon={<Save size={18} />}>
                    Apply Governance
                </Button>
                <Button variant="ghost" onClick={onClose}>Discard</Button>
            </div>
        }
    >
        <div className="flex flex-col gap-xl">
          <FormField label="Board Visibility" description="Control which views nodes of this type appear in.">
            <div className="grid grid-cols-2 gap-md">
                <Button 
                    onClick={() => setShowOnKanban(!showOnKanban)}
                    variant={showOnKanban ? 'primary' : 'secondary'}
                    className="flex-col h-24 gap-sm"
                >
                    <LayoutGrid size={24} />
                    <div className="text-center">
                        <span className="block font-bold">Kanban Board</span>
                        <span className="text-meta opacity-60">{showOnKanban ? 'VISIBLE' : 'HIDDEN'}</span>
                    </div>
                </Button>
                <Button 
                    onClick={() => setShowOnGantt(!showOnGantt)}
                    variant={showOnGantt ? 'primary' : 'secondary'}
                    className="flex-col h-24 gap-sm"
                >
                    <Calendar size={24} />
                    <div className="text-center">
                        <span className="block font-bold">Gantt Timeline</span>
                        <span className="text-meta opacity-60">{showOnGantt ? 'VISIBLE' : 'HIDDEN'}</span>
                    </div>
                </Button>
            </div>
          </FormField>

          <div className="card-sanctuary p-xl bg-container-low border-none">
              <div className="flex justify-between items-center">
                  <div>
                      <h4 className="text-sm font-bold text-on-surface">Sprint Eligibility</h4>
                      <p className="text-xs text-on-surface-variant mt-xs">Allow assignment to strategic cycles.</p>
                  </div>
                  <div 
                    onClick={() => setIsSprintEligible(!isSprintEligible)}
                    className={`toggle-track ${isSprintEligible ? 'active' : ''}`}
                  >
                      <motion.div animate={{ x: isSprintEligible ? 24 : 0 }} className="toggle-thumb" />
                  </div>
              </div>
          </div>
          
          <div className="info-box-primary">
              <p className="text-xs text-primary leading-relaxed">
                  Items like Legendaries that aren't eligible for sprints will show based on global project timelines.
              </p>
          </div>
        </div>
    </Modal>
  );
}
