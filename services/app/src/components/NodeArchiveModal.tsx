import React from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isArchiving: boolean;
  onArchiveAll: () => void;
  onArchiveNodeOnly: () => void;
}

export function NodeArchiveModal({
  isOpen,
  onClose,
  isArchiving,
  onArchiveAll,
  onArchiveNodeOnly
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Archive Children as well?"
      subtitle="This node has child nodes. Choose how you would like to proceed."
      footer={
        <div className="flex gap-md w-full">
          <Button 
            variant="danger" 
            className="flex-1" 
            loading={isArchiving}
            onClick={onArchiveAll}
          >
            Archive All
          </Button>
          <Button 
            variant="secondary" 
            className="flex-1"
            loading={isArchiving}
            onClick={onArchiveNodeOnly}
          >
            Archive Node Only
          </Button>
          <Button 
            variant="ghost" 
            onClick={onClose}
            disabled={isArchiving}
          >
            Cancel
          </Button>
        </div>
      }
    >
      <p className="text-sm text-on-surface-variant leading-relaxed">
        Archiving this node will remove it from your active views. Since it contains child items, you can either archive the children along with it, or keep the children active (they will appear in the backlog without this parent).
      </p>
    </Modal>
  );
}
