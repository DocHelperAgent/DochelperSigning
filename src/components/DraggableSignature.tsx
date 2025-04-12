import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { X, ArrowUpDown } from 'lucide-react';

interface DraggableSignatureProps {
  id: string;
  signature: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  onRemove?: () => void;
  onSizeChange?: (size: { width: number; height: number }) => void;
}

const DraggableSignature: React.FC<DraggableSignatureProps> = ({ 
  id, 
  signature, 
  position,
  size,
  onRemove,
  onSizeChange
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const style = {
    position: 'absolute',
    left: `${position.x}%`,
    top: `${position.y}%`,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    cursor: 'grab',
    touchAction: 'none',
    zIndex: 1000,
    userSelect: 'none',
    WebkitUserSelect: 'none',
    width: `${size.width}px`,
    height: `${size.height}px`,
  } as const;

  const handleResize = (e: React.ChangeEvent<HTMLInputElement>) => {
    const scale = parseFloat(e.target.value);
    if (onSizeChange) {
      onSizeChange({
        width: 200 * scale,
        height: 100 * scale
      });
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="group hover:ring-2 hover:ring-blue-500 hover:ring-opacity-50 rounded active:cursor-grabbing"
    >
      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white rounded-md shadow-sm border border-gray-200 p-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
        <ArrowUpDown className="w-4 h-4 text-gray-500" />
        <input
          type="range"
          min="0.5"
          max="2"
          step="0.1"
          defaultValue="1"
          className="w-20 h-1"
          onChange={handleResize}
        />
      </div>
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      )}
      <img
        src={signature}
        alt="Signature"
        className="w-full h-full object-contain select-none"
        draggable={false}
        onDragStart={e => e.preventDefault()}
      />
    </div>
  );
};

export default DraggableSignature;