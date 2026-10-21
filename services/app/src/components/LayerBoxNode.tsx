"use client";

import React from 'react';
import { Milestone, LayoutGrid, Calendar } from 'lucide-react';
import { updateNodeTypeBoardConfig } from '@/lib/actions';
import { BoardConfig } from '@/lib/types';

interface LayerBoxNodeProps {
  data: {
    depth: number;
    width: number;
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
    <div className="blueprint-layer-box" style={{ width: data.width }}>
      <div className="blueprint-layer-box-header">
        <div className="blueprint-layer-box-title">{data.label}</div>
        <div className="blueprint-layer-box-toggles">
          <button
            onClick={(e) => { e.stopPropagation(); toggleVisibility('showOnKanban'); }}
            disabled={data.isReadOnly}
            className={`blueprint-layer-pill ${localKanban ? 'active' : ''}`}
            title="Show items of this level on the board"
            aria-pressed={localKanban}
          >
            <LayoutGrid size={12} />
            <span>Board</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toggleVisibility('showOnGantt'); }}
            disabled={data.isReadOnly}
            className={`blueprint-layer-pill ${localGantt ? 'active' : ''}`}
            title="Show items of this level on the timeline"
            aria-pressed={localGantt}
          >
            <Calendar size={12} />
            <span>Timeline</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); toggleSprint(); }}
            disabled={data.isReadOnly}
            className={`blueprint-layer-pill ${localSprint ? 'active' : ''}`}
            title="Allow items of this level to be planned in sprints"
            aria-pressed={localSprint}
          >
            <Milestone size={12} />
            <span>Sprints</span>
          </button>
        </div>
      </div>
    </div>
  );
};
