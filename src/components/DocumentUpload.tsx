import React from 'react';
import { Upload, File } from 'lucide-react';

interface DocumentUploadProps {
  onFileSelect: (file: File) => void;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onFileSelect }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <input
        type="file"
        onChange={handleFileChange}
        accept=".pdf"
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="cursor-pointer flex flex-col items-center"
      >
        <File className="w-12 h-12 text-gray-400 mb-4" />
        <div className="text-lg font-medium text-gray-700">Upload Document</div>
        <p className="text-sm text-gray-500 mt-2">
          Drop your PDF here or click to browse
        </p>
      </label>
    </div>
  );
};

export default DocumentUpload;