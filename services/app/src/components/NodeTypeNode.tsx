import { Settings, Braces } from 'lucide-react';
import { Handle, Position } from 'reactflow';
import { IconRenderer } from './IconPicker';

export const NodeTypeNode = ({ data }: any) => {
  return (
    <div 
      className={`blueprint-flow-node ${data.isSelected ? 'selected' : ''}`} 
      style={{ '--node-color': data.color || 'var(--primary)' } as any}
      onClick={data.onClick}
    >
      <Handle type="target" position={Position.Top} className="flow-handle-target" />
      
      <div className="blueprint-node-header">
        <div className="blueprint-node-icon" style={{ backgroundColor: `color-mix(in srgb, ${data.color}, transparent 80%)`, color: data.color }}>
          <IconRenderer name={data.icon} size={20} />
        </div>
        <div className="flex-1">
          <div className="text-10px font-bold opacity-40 uppercase tracking-widest">Blueprint</div>
          <div className="text-editorial text-sm font-black leading-tight">{data.label}</div>
        </div>
        <div 
          className="blueprint-node-settings hover:bg-white/10" 
          onClick={(e) => { e.stopPropagation(); data.onClick(); }}
        >
          <Settings size={14} className="opacity-40" />
        </div>
      </div>

      {data.fields && data.fields.length > 0 && (
        <div className="blueprint-node-fields">
          <div className="flex items-center gap-xs mb-xs opacity-30">
            <Braces size={10} />
            <span className="text-10px font-bold uppercase">Properties</span>
          </div>
          <div className="flex flex-wrap gap-xs">
            {data.fields.map((f: any) => (
              <div key={f.id} className="blueprint-field-tag">
                {f.name}
              </div>
            ))}
          </div>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="flow-handle-source" />
    </div>
  );
};
