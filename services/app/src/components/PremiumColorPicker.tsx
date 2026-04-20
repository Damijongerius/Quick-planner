"use client";

const PREMIUM_PALETTE = [
  "#3b82f6", // Blue
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#ef4444", // Red
  "#f59e0b", // Amber
  "#10b981", // Emerald
  "#06b6d4", // Cyan
  "#6366f1", // Indigo
  "#f43f5e", // Rose
  "#84cc16", // Lime
  "#a855f7", // Purple
  "#64748b"  // Slate
];

interface PremiumColorPickerProps {
  currentColor: string;
  onSelect: (color: string) => void;
}

export function PremiumColorPicker({ currentColor, onSelect }: PremiumColorPickerProps) {
  const isCustomColor = !PREMIUM_PALETTE.includes(currentColor);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
        {PREMIUM_PALETTE.map(color => {
          const isActive = currentColor === color;
          return (
            <button
              key={color}
              type="button"
              onClick={() => onSelect(color)}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: color,
                border: isActive ? '2px solid white' : '2px solid transparent',
                boxShadow: isActive ? `0 0 10px ${color}` : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                transform: isActive ? 'scale(1.1)' : 'scale(1)'
              }}
            />
          );
        })}
      </div>
      
      <div 
        style={{ 
          width: '32px', 
          height: '32px', 
          borderRadius: '50%', 
          overflow: 'hidden', 
          position: 'relative',
          border: isCustomColor ? '2px solid white' : '2px solid rgba(255,255,255,0.2)',
          boxShadow: isCustomColor ? `0 0 10px ${currentColor}` : 'none',
          cursor: 'pointer',
          transform: isCustomColor ? 'scale(1.1)' : 'scale(1)',
          transition: 'all 0.2s'
        }}
        title="Custom Color"
      >
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isCustomColor ? currentColor : 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)', pointerEvents: 'none' }}>
        </div>
        <input 
          type="color" 
          value={currentColor} 
          onChange={(e) => onSelect(e.target.value)}
          style={{ width: '200%', height: '200%', transform: 'translate(-25%, -25%)', cursor: 'pointer', opacity: 0 }}
        />
      </div>
    </div>
  );
}
