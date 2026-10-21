"use client";

import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { FormField } from './ui/FormField';
import { Input } from './ui/Input';
import { createNodeType } from '@/lib/actions';
import { IconPicker } from './IconPicker';
import { PlannerColorPicker } from './PlannerColorPicker';

interface EcosystemCreationOverlayProps {
  projectId: string;
  onClose: () => void;
}

export function EcosystemCreationOverlay({ projectId, onClose }: Readonly<EcosystemCreationOverlayProps>) {
  const [newName, setNewName] = useState("");
  const [color, setColor] = useState("#4f46e5");
  const [icon, setIcon] = useState("Target");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("name", newName);
      formData.append("color", color);
      formData.append("icon", icon);
      await createNodeType(projectId, formData);
      onClose();
    } catch {
      setError("Couldn't create the item type. Try a different name.");
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="New item type" subtitle="For example Epic, Story, Task, Bug, Milestone." maxWidth="480px">
      <form onSubmit={handleCreate} className="flex flex-col gap-4 pt-2">
        <FormField label="Name">
          <Input autoFocus variant="planner" placeholder="e.g. Feature" value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={120} required />
        </FormField>
        <div>
          <p className="form-field-label mb-2">Icon</p>
          <IconPicker currentIcon={icon} onSelect={setIcon} color={color} />
        </div>
        <div>
          <p className="form-field-label mb-2">Colour</p>
          <PlannerColorPicker currentColor={color} onSelect={setColor} />
        </div>
        {error && <p className="text-sm text-danger" role="alert">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Create type</Button>
        </div>
      </form>
    </Modal>
  );
}
