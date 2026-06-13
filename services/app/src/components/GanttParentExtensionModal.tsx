import React from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { AlertCircle } from "lucide-react";
import { updateNode } from "@/lib/actions/nodes";
import { PendingExtension } from "./useGanttInteraction";

export interface GanttParentExtensionModalProps {
  projectId: string;
  pendingExtension: PendingExtension;
  setPendingExtension: (ext: PendingExtension | null) => void;
}

export function GanttParentExtensionModal({
  projectId,
  pendingExtension,
  setPendingExtension
}: Readonly<GanttParentExtensionModalProps>) {
  return (
    <Modal
      isOpen={!!pendingExtension}
      onClose={() => setPendingExtension(null)}
      title="Extend Parent Timeline?"
      subtitle="Timeline Alignment Warning"
      maxWidth="460px"
      footer={
        <div className="flex justify-end gap-sm w-full">
          <Button variant="ghost" onClick={() => setPendingExtension(null)}>
            Keep Parent
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              try {
                await updateNode(projectId, pendingExtension.parentNodeId, {
                  startDate: pendingExtension.updatedParentStart,
                  endDate: pendingExtension.updatedParentEnd
                });
              } catch (err) {
                console.error("Failed to extend parent node:", err);
              } finally {
                setPendingExtension(null);
              }
            }}
          >
            Yes, Extend Parent
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-md py-md">
        <div className="flex items-start gap-md">
          <div className="p-sm rounded-lg bg-[rgba(235,87,87,0.1)] text-error shrink-0 mt-xs">
            <AlertCircle size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold mb-xs">Timeline conflict detected</p>
            <p className="text-xs text-secondary leading-relaxed">
              The item <strong className="text-on-surface">'{pendingExtension.childTitle}'</strong> now extends outside the timeline of its parent <strong className="text-on-surface">'{pendingExtension.parentTitle}'</strong>.
            </p>
          </div>
        </div>
        <div className="mt-sm p-md rounded-lg bg-surface-container-high border border-outline-variant flex flex-col gap-sm">
          <div className="flex justify-between text-xs">
            <span className="text-secondary">Proposed Parent Start:</span>
            <span className="font-mono font-medium">{new Date(pendingExtension.updatedParentStart).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-secondary">Proposed Parent End:</span>
            <span className="font-mono font-medium">{new Date(pendingExtension.updatedParentEnd).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
