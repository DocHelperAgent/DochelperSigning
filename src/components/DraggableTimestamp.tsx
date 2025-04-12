import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Calendar, ArrowUpDown, Palette } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';

interface DraggableTimestampProps {
  id: string;
  timestamp: Date;
  position: { x: number; y: number };
}

const DraggableTimestamp: React.FC<DraggableTimestampProps> = ({ 
  id, 
  timestamp, 
  position 
}) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id,
  });

  const [fontSize, setFontSize] = useState(14);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [textColor, setTextColor] = useState('#374151'); // text-gray-700

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
    fontSize: `${fontSize}px`,
    color: textColor,
  } as const;

  const formattedTimestamp = timestamp.toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  });

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseFloat(e.target.value) * 14;
    setFontSize(size);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="group bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded shadow-sm border border-gray-200 hover:ring-2 hover:ring-blue-500 hover:ring-opacity-50 active:cursor-grabbing flex items-center gap-2"
    >
      <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 bg-white rounded-md shadow-sm border border-gray-200 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-gray-500" />
          <input
            type="range"
            min="0.8"
            max="1.5"
            step="0.1"
            defaultValue="1"
            className="w-24"
            onChange={handleSizeChange}
          />
        </div>
        <div className="relative">
          <button
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex items-center gap-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md px-2 py-1 w-full"
          >
            <Palette className="w-4 h-4" />
            <div
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: textColor }}
            />
          </button>
          {showColorPicker && (
            <div className="absolute z-20 mt-2">
              <HexColorPicker color={textColor} onChange={setTextColor} />
            </div>
          )}
        </div>
      </div>
      <Calendar className="w-4 h-4 text-blue-500" />
      <span>Signed on: {formattedTimestamp}</span>
    </div>
  );
};

export default DraggableTimestamp;