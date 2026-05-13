"use client";

import React from 'react';
import { ArrowRight, Calendar, Plus } from 'lucide-react';

export function AIImportReview({ parsedData }: { parsedData: any }) {
  return (
    <div className="card-planner p-xl bg-surface-container-lowest">
        <h3 className="text-editorial text-lg font-bold mb-md flex items-center gap-md">
            <ArrowRight size={20} className="text-primary" /> Ready to Implement
        </h3>
        <div className="flex flex-col gap-xl">
            {parsedData.nodeTypes?.length > 0 && (
                <div>
                    <h4 className="text-meta mb-sm">Architecture Blueprints ({parsedData.nodeTypes.length})</h4>
                    <div className="flex flex-wrap gap-sm">
                        {parsedData.nodeTypes.map((t: any, i: number) => (
                            <div key={i} className="flex items-center gap-sm px-md py-xs rounded-xl bg-primary/10 border border-primary/30">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color || 'var(--primary)' }} />
                                <span className="font-bold text-xs text-primary">{t.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {parsedData.relations?.length > 0 && (
                <div>
                    <h4 className="text-meta mb-sm">Structural Links ({parsedData.relations.length})</h4>
                    <div className="flex flex-wrap gap-sm">
                        {parsedData.relations.map((r: any, i: number) => (
                            <div key={i} className="flex items-center gap-xs px-md py-xs rounded-xl bg-surface-container-high border border-outline-variant text-[10px] font-bold">
                                <span>{r.parent}</span>
                                <ArrowRight size={10} className="opacity-40" />
                                <span>{r.child}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {parsedData.sprints?.length > 0 && (
                <div>
                    <h4 className="text-meta mb-sm">Sprints To Initialize</h4>
                    <div className="flex flex-wrap gap-sm">
                        {parsedData.sprints.map((s: any, i: number) => (
                            <div key={i} className="flex items-center gap-sm px-md py-xs rounded-xl bg-tertiary/10 border border-tertiary/30">
                                <Calendar size={14} className="text-tertiary" />
                                <span className="font-bold text-xs text-tertiary">{s.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {parsedData.nodes?.length > 0 && (
                <div>
                    <h4 className="text-meta mb-sm">New Items ({parsedData.nodes.length})</h4>
                    <div className="max-h-60 overflow-y-auto border border-outline-variant rounded-2xl">
                        {parsedData.nodes.map((n: any, i: number) => (
                            <div key={i} className="px-md py-sm border-b border-outline-variant last:border-b-0 flex justify-between items-center">
                                <div className="flex items-center gap-md">
                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                    <div>
                                        <div className="font-bold text-sm">{n.title}</div>
                                        <div className="text-10px opacity-60">{n.type}</div>
                                    </div>
                                </div>
                                <Plus size={14} className="opacity-30" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    </div>
  );
}
