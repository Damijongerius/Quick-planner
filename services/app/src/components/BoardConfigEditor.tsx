"use client";

import { useState } from "react";
import { LayoutGrid, Calendar, Save } from "lucide-react";
import { updateNodeTypeBoardConfig } from "@/lib/actions";
import { motion } from "framer-motion";
import { Modal } from "./ui/Modal";
import { FormField } from "./ui/FormField";
import { Button } from "./ui/Button";
import { Select } from "./ui/Select";

import { NodeType, BoardConfig } from "@/lib/types";

interface BoardConfigEditorProps {
  projectId: string;
  nodeType: NodeType | null;
  isOpen: boolean;
  onClose: () => void;
}

export function BoardConfigEditor({ projectId, nodeType, isOpen, onClose }: Readonly<BoardConfigEditorProps>) {
  const [showOnKanban, setShowOnKanban] = useState(true);
  const [showOnGantt, setShowOnGantt] = useState(true);
  const [isSprintEligible, setIsSprintEligible] = useState(true);
  const [sprintBoardLayer, setSprintBoardLayer] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [prevNodeId, setPrevNodeId] = useState<string | null>(nodeType?.id || null);

  if (nodeType?.id !== prevNodeId) {
    setPrevNodeId(nodeType?.id || null);
    const config = (nodeType?.boardConfig as BoardConfig) || {};
    setShowOnKanban(config.showOnKanban !== false);
    setShowOnGantt(config.showOnGantt !== false);
    setIsSprintEligible(nodeType?.isSprintEligible ?? true);
    setSprintBoardLayer(config.sprintBoardLayer ?? null);
  }

  const handleSave = async () => {
    if (!nodeType?.id) return;
    const nodeId = nodeType.id;
    setIsSaving(true);
    try {
      await updateNodeTypeBoardConfig(projectId, nodeId, { 
        showOnKanban, 
        showOnGantt, 
        isSprintEligible,
        sprintBoardLayer
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

          <FormField label="Sprint Board Layer Role" description="Configure where this node type fits in the layered sprint board view.">
            <Select 
              options={[
                { value: "none", label: "No Layer (Hidden / Flat)" },
                { value: "0", label: "Layer 0: Portfolio (Epic / Feature)" },
                { value: "1", label: "Layer 1: Swimlane Row (Story / Bug)" },
                { value: "2", label: "Layer 2: Draggable Card (Task)" }
              ]}
              value={sprintBoardLayer === null ? "none" : String(sprintBoardLayer)}
              onChange={(val) => setSprintBoardLayer(val === "none" ? null : Number(val))}
            />
          </FormField>

          <div className="card-planner p-xl bg-container-low border-none">
              <div className="flex justify-between items-center">
                  <div>
                      <h4 className="text-sm font-bold text-on-surface">Sprint Eligibility</h4>
                      <p className="text-xs text-on-surface-variant mt-xs">Allow assignment to strategic cycles.</p>
                  </div>
                  <label className="flex items-center cursor-pointer">
                      <span className="sr-only">Enable Sprint Eligibility</span>
                      <input 
                        type="checkbox"
                        checked={isSprintEligible}
                        onChange={(e) => setIsSprintEligible(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`toggle-track ${isSprintEligible ? 'active' : ''}`}>
                          <motion.div animate={{ x: isSprintEligible ? 20 : 0 }} className="toggle-thumb" />
                      </div>
                  </label>
              </div>
          </div>
          
          <div className="info-box-primary">
              <p className="text-xs text-primary leading-relaxed">
                  Items like Legendaries that aren&apos;t eligible for sprints will show based on global project timelines.
              </p>
          </div>
        </div>
    </Modal>
  );
}
