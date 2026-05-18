"use client";

import { useState } from "react";
import { Plus, Trash2, Type, Hash, Calendar, CheckCircle2 } from "lucide-react";
import { addFieldDefinition, removeFieldDefinition } from "@/lib/actions";
import { motion, AnimatePresence } from "framer-motion";
import { Modal } from "./ui/Modal";
import { FormField } from "./ui/FormField";
import { Button } from "./ui/Button";

import { NodeType } from "@/lib/types";

interface FieldEditorProps {
  projectId: string;
  nodeType: NodeType | null;
  isOpen: boolean;
  onClose: () => void;
}

const FIELD_TYPES = [
    { type: "TEXT", icon: Type },
    { type: "NUMBER", icon: Hash },
    { type: "DATE", icon: Calendar },
    { type: "CHECKBOX", icon: CheckCircle2 }
];

export function FieldEditor({ projectId, nodeType, isOpen, onClose }: Readonly<FieldEditorProps>) {
  const [fieldName, setFieldName] = useState("");
  const [fieldType, setFieldType] = useState("TEXT");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddField = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fieldName || !nodeType) return;
    await addFieldDefinition(projectId, nodeType.id, fieldName, fieldType);
    setFieldName("");
    setIsAdding(false);
  };

  return (
    <Modal 
        isOpen={isOpen} 
        onClose={onClose} 
        title="Attribute Governance" 
        subtitle={`Defining data structures for ${nodeType?.name}`}
        footer={
            <p className="attribute-footer-text">
                Changes to governance rules are synchronized across all nodes of this type.
            </p>
        }
    >
        <div className="flex flex-col gap-2xl">
          <div>
            <span className="text-meta block mb-lg">Active Attributes</span>
            <div className="flex flex-col gap-md">
              {nodeType?.fields?.map((field) => {
                const Icon = FIELD_TYPES.find((t) => t.type === field.type)?.icon || Type;
                return (
                  <div key={field.id} className="attribute-row">
                    <div className="flex items-center gap-lg">
                      <div className="text-primary"><Icon size={18} /></div>
                      <div>
                        <span className="text-sm font-bold">{field.name}</span>
                        <span className="attribute-type-badge">{field.type}</span>
                      </div>
                    </div>
                    <Button 
                        variant="ghost" 
                        onClick={() => removeFieldDefinition(projectId, field.id)} 
                        icon={<Trash2 size={16} />} 
                        className="text-error" 
                    />
                  </div>
                );
              })}
              {(nodeType?.fields?.length ?? 0) === 0 && (
                <div className="attribute-empty-state">
                  <p className="text-on-surface-variant text-sm italic">No attributes defined yet.</p>
                </div>
              )}
            </div>
          </div>

          <AnimatePresence>
            {isAdding ? (
              <motion.form 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }} 
                onSubmit={handleAddField} 
                className="attribute-creation-form"
              >
                <FormField label="Attribute Identity">
                  <input autoFocus className="input-premium" placeholder="e.g. Priority, Estimate, ROI..." value={fieldName} onChange={(e) => setFieldName(e.target.value)} required />
                </FormField>
                
                <FormField label="Data Format">
                  <div className="grid grid-cols-2 gap-md">
                    {FIELD_TYPES.map(({ type, icon: Icon }) => (
                      <Button key={type} type="button" onClick={() => setFieldType(type)} variant={fieldType === type ? 'primary' : 'secondary'} size="sm" icon={<Icon size={14} />}>
                        {type}
                      </Button>
                    ))}
                  </div>
                </FormField>

                <div className="flex gap-md">
                  <Button type="submit" className="flex-1">Initialize Attribute</Button>
                  <Button type="button" variant="ghost" onClick={() => setIsAdding(false)}>Discard</Button>
                </div>
              </motion.form>
            ) : (
              <Button onClick={() => setIsAdding(true)} className="w-full p-lg" icon={<Plus size={18} />}>
                Add New Attribute
              </Button>
            )}
          </AnimatePresence>
        </div>
    </Modal>
  );
}
