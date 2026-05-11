import { X, Braces, LayoutGrid, Trash2, Milestone, Settings2 } from 'lucide-react';
import { IconRenderer, IconPicker } from './IconPicker';
import { SanctuaryColorPicker } from './SanctuaryColorPicker';
import { Button } from './ui/Button';
import { updateNodeType, deleteNodeType } from '@/lib/actions';

interface EcosystemSidePanelProps {
  projectId: string;
  activeNodeType: any;
  onClose: () => void;
  onOpenFieldEditor: () => void;
  onOpenBoardEditor: () => void;
}

export function EcosystemSidePanel({ 
  projectId, 
  activeNodeType, 
  onClose,
  onOpenFieldEditor,
  onOpenBoardEditor
}: EcosystemSidePanelProps) {
  const [name, setName] = React.useState(activeNodeType.name);
  const [isSprintEligible, setIsSprintEligible] = React.useState(activeNodeType.isSprintEligible);

  React.useEffect(() => {
    setName(activeNodeType.name);
    setIsSprintEligible(activeNodeType.isSprintEligible);
  }, [activeNodeType]);
  
  const handleUpdateIcon = async (icon: string) => {
    await updateNodeType(projectId, activeNodeType.id, activeNodeType.name, activeNodeType.color, icon, isSprintEligible);
  };

  const handleUpdateColor = async (color: string) => {
    await updateNodeType(projectId, activeNodeType.id, name, color, activeNodeType.icon, isSprintEligible);
  };

  const handleUpdateName = async () => {
    if (name === activeNodeType.name) return;
    await updateNodeType(projectId, activeNodeType.id, name, activeNodeType.color, activeNodeType.icon, isSprintEligible);
  };

  const handleToggleSprint = async () => {
    const newVal = !isSprintEligible;
    setIsSprintEligible(newVal);
    await updateNodeType(projectId, activeNodeType.id, name, activeNodeType.color, activeNodeType.icon, newVal);
  };

  const handleDelete = async () => {
    if(confirm(`Are you sure you want to delete the ${activeNodeType.name} blueprint? This cannot be undone.`)) {
        await deleteNodeType(projectId, activeNodeType.id);
        onClose();
    }
  };

  return (
    <div className="absolute right-md top-md bottom-md w-96 glass-dark p-xl z-50 flex flex-col gap-xl overflow-y-auto animate-in slide-in-from-right shadow-sanctuary rounded-2xl border border-outline-variant">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-md">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-surface-container-high shadow-sm" style={{ color: activeNodeType.color }}>
                <IconRenderer name={activeNodeType.icon} size={28} />
            </div>
            <div className="flex-1">
                <input 
                    className="text-editorial font-bold text-xl bg-transparent border-none p-0 w-full focus:outline-none focus:ring-0" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    onBlur={handleUpdateName}
                />
                <p className="text-meta text-10px tracking-widest opacity-60">BLUEPRINT SETTINGS</p>
            </div>
        </div>
        <button onClick={onClose} className="p-sm hover:bg-surface-container-high rounded-full transition-colors">
            <X size={18} />
        </button>
      </div>

      <div className="space-y-xl">
        <section className="card-sanctuary bg-white/5 p-lg border-none">
            <label className="text-meta text-10px mb-md block opacity-60">BLUEPRINT IDENTITY</label>
            <div className="flex flex-col gap-lg">
                <div>
                    <p className="text-10px font-bold mb-sm opacity-40 uppercase">Icon Representation</p>
                    <IconPicker currentIcon={activeNodeType.icon} onSelect={handleUpdateIcon} color={activeNodeType.color} />
                </div>
                <div>
                    <p className="text-10px font-bold mb-sm opacity-40 uppercase">Color Signature</p>
                    <SanctuaryColorPicker currentColor={activeNodeType.color} onSelect={handleUpdateColor} />
                </div>
            </div>
        </section>

        <section className="card-sanctuary bg-white/5 p-lg border-none">
            <label className="text-meta text-10px mb-md block opacity-60">STRATEGIC FLOW</label>
            <div className="flex flex-col gap-md">
                <div className="flex items-center justify-between p-md bg-white/5 rounded-xl">
                    <div className="flex items-center gap-md">
                        <Milestone size={18} className="opacity-60" />
                        <div>
                            <p className="text-xs font-bold">Sprint Eligibility</p>
                            <p className="text-10px opacity-50">Can nodes of this type be assigned to cycles?</p>
                        </div>
                    </div>
                    <div 
                        onClick={handleToggleSprint}
                        className={`toggle-track ${isSprintEligible ? 'active' : ''}`}
                    >
                        <div className={`toggle-thumb ${isSprintEligible ? 'translate-x-5' : 'translate-x-0'} transition-transform duration-200`} />
                    </div>
                </div>

                <Button onClick={onOpenBoardEditor} variant="secondary" size="sm" icon={<LayoutGrid size={16} />} className="w-full justify-start h-12 px-lg rounded-xl">
                    Configure Board View & Type
                </Button>
            </div>
        </section>

        <section className="card-sanctuary bg-white/5 p-lg border-none">
            <div className="flex justify-between items-center mb-md">
                <label className="text-meta text-10px block opacity-60 uppercase">Property Definitions</label>
                <Button onClick={onOpenFieldEditor} variant="ghost" size="sm" icon={<Settings2 size={12} />} className="h-6 text-[10px] px-sm">
                    Manage
                </Button>
            </div>
            <div className="flex flex-wrap gap-xs">
                {activeNodeType.fields?.map((f: any) => (
                    <span key={f.id} className="px-sm py-xs bg-white/10 rounded-lg text-10px font-bold text-white border border-white/10">
                        {f.name.toUpperCase()}
                    </span>
                ))}
                {activeNodeType.fields?.length === 0 && <p className="text-10px italic opacity-40">No custom properties defined</p>}
            </div>
        </section>
      </div>

      <div className="mt-auto pt-xl border-t border-white/10">
        <Button onClick={handleDelete} variant="ghost" size="sm" className="text-error w-full justify-start hover:bg-error/10" icon={<Trash2 size={16} />}>
            Destroy Blueprint Type
        </Button>
      </div>
    </div>
  );
}
