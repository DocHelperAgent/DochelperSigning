import React from 'react';
import { Stamp, Upload } from 'lucide-react';

interface StampUploadProps {
  onSave: (stamp: string) => void;
}

const StampUpload: React.FC<StampUploadProps> = ({ onSave }) => {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if the file is an accepted image type
      const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/gif', 'image/bmp'];
      if (!acceptedTypes.includes(file.type)) {
        alert('Please upload a valid image file (JPG, JPEG, GIF, or BMP)');
        return;
      }

      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB');
        return;
      }

      try {
        // Convert the image to base64
        const reader = new FileReader();
        reader.onload = (e) => {
          const base64 = e.target?.result as string;
          onSave(base64);
        };
        reader.onerror = () => {
          alert('Error reading file. Please try again.');
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error processing image:', error);
        alert('Failed to process image. Please try again.');
      }
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white">
      <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 flex flex-col items-center justify-center">
        <Stamp className="w-12 h-12 text-gray-400 mb-4" />
        <label htmlFor="stamp-upload" className="cursor-pointer">
          <div className="text-center">
            <p className="text-sm font-medium text-blue-600 hover:text-blue-500">
              Upload a stamp
            </p>
            <p className="text-xs text-gray-500 mt-1">
              JPG, JPEG, BMP, GIF up to 10MB
            </p>
          </div>
          <input
            id="stamp-upload"
            type="file"
            className="hidden"
            accept=".jpg,.jpeg,.gif,.bmp"
            onChange={handleFileChange}
          />
        </label>
      </div>
    </div>
  );
};

export default StampUpload;