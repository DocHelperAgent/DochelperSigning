import React from 'react';
import { Calendar, Clock, X } from 'lucide-react';

interface TimestampEditorProps {
  signature: {
    id: string;
    timestamp: Date;
    showTimestamp: boolean;
  };
  onUpdate: (timestamp: Date, showTimestamp: boolean) => void;
}

const TimestampEditor: React.FC<TimestampEditorProps> = ({ signature, onUpdate }) => {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(signature.timestamp);
    const [year, month, day] = e.target.value.split('-').map(Number);
    newDate.setFullYear(year);
    newDate.setMonth(month - 1);
    newDate.setDate(day);
    onUpdate(newDate, signature.showTimestamp);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(signature.timestamp);
    const [hours, minutes] = e.target.value.split(':').map(Number);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    onUpdate(newDate, signature.showTimestamp);
  };

  const toggleTimestamp = () => {
    onUpdate(signature.timestamp, !signature.showTimestamp);
  };

  return (
    <div className="bg-gray-50 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700">Timestamp Settings</h4>
        <button
          onClick={toggleTimestamp}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            signature.showTimestamp ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              signature.showTimestamp ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {signature.showTimestamp && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={signature.timestamp.toISOString().split('T')[0]}
              onChange={handleDateChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <input
              type="time"
              value={`${String(signature.timestamp.getHours()).padStart(2, '0')}:${String(
                signature.timestamp.getMinutes()
              ).padStart(2, '0')}`}
              onChange={handleTimeChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TimestampEditor;