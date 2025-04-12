import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Eraser, Download, Palette } from 'lucide-react';
import { HexColorPicker } from 'react-colorful';

interface SignaturePadProps {
  onSave: (signature: string) => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave }) => {
  const signatureRef = useRef<SignatureCanvas>(null);
  const [color, setColor] = useState('#000000');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [penSize, setPenSize] = useState(2);

  const clear = () => {
    signatureRef.current?.clear();
  };

  const save = () => {
    if (signatureRef.current) {
      const dataUrl = signatureRef.current.toDataURL();
      onSave(dataUrl);
      clear();
    }
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    if (signatureRef.current) {
      signatureRef.current.penColor = newColor;
    }
  };

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const size = parseFloat(e.target.value);
    setPenSize(size);
    if (signatureRef.current) {
      signatureRef.current.penSize = size;
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="border-2 border-gray-200 rounded">
        <SignatureCanvas
          ref={signatureRef}
          canvasProps={{
            className: 'signature-canvas w-full h-40 bg-white',
          }}
          penColor={color}
          minWidth={penSize}
          maxWidth={penSize}
        />
      </div>
      <div className="mt-4 space-y-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md"
            >
              <Palette className="w-4 h-4 mr-2" />
              <div
                className="w-4 h-4 rounded-full border border-gray-300"
                style={{ backgroundColor: color }}
              />
            </button>
            {showColorPicker && (
              <div className="absolute z-10 mt-2">
                <HexColorPicker color={color} onChange={handleColorChange} />
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-1">
            <span className="text-sm text-gray-600">Size:</span>
            <input
              type="range"
              min="1"
              max="5"
              step="0.5"
              value={penSize}
              onChange={handleSizeChange}
              className="w-32"
            />
          </div>
        </div>
        <div className="flex justify-between">
          <button
            onClick={clear}
            className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md"
          >
            <Eraser className="w-4 h-4 mr-2" />
            Clear
          </button>
          <button
            onClick={save}
            className="flex items-center px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md"
          >
            <Download className="w-4 h-4 mr-2" />
            Save Signature
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignaturePad;