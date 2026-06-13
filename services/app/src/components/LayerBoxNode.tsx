"use client";

import React from 'react';
import { Milestone, LayoutGrid, Calendar } from 'lucide-react';
import { updateNodeTypeBoardConfig } from '@/lib/actions';
import { BoardConfig } from '@/lib/types';

interface LayerBoxNodeProps {
  data: {
    depth: number;
    label: string;
    projectId: string;
    isReadOnly?: boolean;
    isSprintEligible: boolean;
    showOnKanban: boolean;
    showOnGantt: boolean;
    nodeTypesData: { id: string; boardConfig: BoardConfig }[];
  };
}

export const LayerBoxNode = ({ data }: Readonly<LayerBoxNodeProps>) => {
  const [localSprint, setLocalSprint] = React.useState(data.isSprintEligible);
  const [localKanban, setLocalKanban] = React.useState(data.showOnKanban);
  const [localGantt, setLocalGantt] = React.useState(data.showOnGantt);

  React.useEffect(() => {
    setLocalSprint(data.isSprintEligible);
  }, [data.isSprintEligible]);

  React.useEffect(() => {
    setLocalKanban(data.showOnKanban);
  }, [data.showOnKanban]);

  React.useEffect(() => {
    setLocalGantt(data.showOnGantt);
  }, [data.showOnGantt]);

  const toggleSprint = async () => {
    if (data.isReadOnly) return;
    const newVal = !localSprint;
    setLocalSprint(newVal);
    try {
      await Promise.all(data.nodeTypesData.map(async (t) => {
        await updateNodeTypeBoardConfig(data.projectId, t.id, {
          ...t.boardConfig,
          isSprintEligible: newVal,
        });
      }));
      window.dispatchEvent(new CustomEvent("project-mutated"));
    } catch (err) {
      setLocalSprint(!newVal);
      console.error(err);
    }
  };

  const toggleVisibility = async (key: 'showOnKanban' | 'showOnGantt') => {
    if (data.isReadOnly) return;
    const newVal = key === 'showOnKanban' ? !localKanban : !localGantt;
    if (key === 'showOnKanban') {
      setLocalKanban(newVal);
    } else {
      setLocalGantt(newVal);
    }
    try {
      await Promise.all(data.nodeTypesData.map(async (t) => {
        await updateNodeTypeBoardConfig(data.projectId, t.id, {
          ...t.boardConfig,
          [key]: newVal,
          isSprintEligible: localSprint,
        });
      }));
      window.dispatchEvent(new CustomEvent("project-mutated"));
    } catch (err) {
      if (key === 'showOnKanban') {
        setLocalKanban(!newVal);
      } else {
        setLocalGantt(!newVal);
      }
      console.error(err);
    }
  };

  return (
    <div className="blueprint-layer-box">
      <div className="blueprint-layer-box-header">
        <div className="blueprint-layer-box-title">
          {data.label}
        </div>
        <div className="blueprint-layer-box-toggles pointer-events-auto flex items-center gap-sm">
          <button
            onClick={(e) => { e.stopPropagation(); toggleVisibility('showOnKanban'); }}
            disabled={data.isReadOnly}
            className={`blueprint-layer-pill ${localKanban ? 'active-kanban' : ''}`}
            title="Toggle Kanban visibility for this layer"
          >
            <LayoutGrid size={10} />
            <span>Kanban</span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); toggleVisibility('showOnGantt'); }}
            disabled={data.isReadOnly}
            className={`blueprint-layer-pill ${localGantt ? 'active-gantt' : ''}`}
            title="Toggle Gantt visibility for this layer"
          >
            <Calendar size={10} />
            <span>Gantt</span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); toggleSprint(); }}
            disabled={data.isReadOnly}
            className={`blueprint-layer-pill ${localSprint ? 'active-sprint' : ''}`}
            title="Toggle Sprint eligibility for this layer"
          >
            <Milestone size={10} />
            <span>Sprint</span>
          </button>
        </div>
      </div>
    </div>
  );
};
