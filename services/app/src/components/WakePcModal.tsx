"use client";

import { useState } from "react";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Power, Check, AlertCircle } from "lucide-react";
import { wakePc } from "@/app/profile/actions";

export function WakePcModal({ isOpen, onClose }: Readonly<{ isOpen: boolean, onClose: () => void }>) {
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

    const handleWake = async () => {
        setStatus('loading');
        try {
            const res = await wakePc();
            if (res.success) {
                setStatus('success');
                setTimeout(() => {
                    setStatus('idle');
                    onClose();
                }, 2000);
            }
        } catch {
            setStatus('error');
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Wake Local Machine"
            subtitle="Send a Wake-on-LAN magic packet to 9C:6B:00:37:97:94"
        >
            <div className="flex flex-col items-center gap-xl py-xl">
                <div className="w-24 h-24 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant shadow-sm">
                    <Power size={48} className={status === 'success' ? 'text-success' : 'text-primary'} />
                </div>
                
                <div className="text-center">
                    <h3 className="text-lg font-bold">Main Workstation</h3>
                    <p className="text-sm text-meta">MAC: 9C:6B:00:37:97:94</p>
                </div>

                {status === 'error' && (
                    <div className="text-error flex items-center gap-sm text-sm bg-error/10 px-md py-sm rounded-lg">
                        <AlertCircle size={16} /> Failed to send packet
                    </div>
                )}

                <Button 
                    onClick={handleWake} 
                    loading={status === 'loading'}
                    variant={status === 'success' ? 'secondary' : 'primary'}
                    className="w-full mt-md"
                    icon={status === 'success' ? <Check size={18} /> : <Power size={18} />}
                >
                    {status === 'success' ? 'Magic Packet Sent!' : 'Power On Machine'}
                </Button>
            </div>
        </Modal>
    );
}
