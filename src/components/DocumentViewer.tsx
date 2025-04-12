import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, AlertCircle, Loader } from 'lucide-react';
import { DndContext, DragEndEvent, useSensor, useSensors, PointerSensor, MouseSensor, TouchSensor } from '@dnd-kit/core';
import DraggableSignature from './DraggableSignature';
import DraggableTimestamp from './DraggableTimestamp';
import DraggableStamp from './DraggableStamp';

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

interface SignatureInstance {
  id: string;
  dataUrl: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  page: number;
  timestamp: Date;
  timestampPosition: { x: number; y: number };
  timestampSize: number;
  showTimestamp: boolean;
}

interface StampInstance {
  id: string;
  dataUrl: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  page: number;
}

interface DocumentViewerProps {
  file: File;
  signatures: SignatureInstance[];
  stamps: StampInstance[];
  onPageChange?: (page: number) => void;
  onSignaturePositionChange?: (id: string, position: { x: number; y: number }) => void;
  onSignatureSizeChange?: (id: string, size: { width: number; height: number }) => void;
  onStampPositionChange?: (id: string, position: { x: number; y: number }) => void;
  onStampSizeChange?: (id: string, size: { width: number; height: number }) => void;
  onTimestampPositionChange?: (id: string, position: { x: number; y: number }) => void;
  onTimestampSizeChange?: (id: string, size: number) => void;
  onRemoveSignature?: (id: string) => void;
  onRemoveStamp?: (id: string) => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ 
  file, 
  signatures,
  stamps,
  onPageChange,
  onSignaturePositionChange,
  onSignatureSizeChange,
  onStampPositionChange,
  onStampSizeChange,
  onTimestampPositionChange,
  onTimestampSizeChange,
  onRemoveSignature,
  onRemoveStamp
}) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    setError(error);
    setIsLoading(false);
  };

  const changePage = (offset: number) => {
    const newPage = Math.min(Math.max(1, pageNumber + offset), numPages || 1);
    setPageNumber(newPage);
    onPageChange?.(newPage);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!containerRef) return;

    const container = containerRef.getBoundingClientRect();
    const { delta } = event;
    const id = event.active.id as string;
    
    if (id.startsWith('timestamp-')) {
      const signatureId = id.replace('timestamp-', '');
      if (onTimestampPositionChange) {
        const signature = signatures.find(sig => sig.id === signatureId);
        if (!signature) return;

        const newPosition = {
          x: Math.max(0, Math.min(100, signature.timestampPosition.x + (delta.x / container.width) * 100)),
          y: Math.max(0, Math.min(100, signature.timestampPosition.y + (delta.y / container.height) * 100))
        };
        
        onTimestampPositionChange(signatureId, newPosition);
      }
    } else if (id.startsWith('stamp-')) {
      if (onStampPositionChange) {
        const stamp = stamps.find(s => s.id === id);
        if (!stamp) return;

        const newPosition = {
          x: Math.max(0, Math.min(100, stamp.position.x + (delta.x / container.width) * 100)),
          y: Math.max(0, Math.min(100, stamp.position.y + (delta.y / container.height) * 100))
        };
        
        onStampPositionChange(id, newPosition);
      }
    } else {
      if (onSignaturePositionChange) {
        const signature = signatures.find(sig => sig.id === id);
        if (!signature) return;

        const newPosition = {
          x: Math.max(0, Math.min(100, signature.position.x + (delta.x / container.width) * 100)),
          y: Math.max(0, Math.min(100, signature.position.y + (delta.y / container.height) * 100))
        };
        
        onSignaturePositionChange(id, newPosition);
      }
    }
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Failed to load PDF</h3>
        <p className="text-sm text-gray-600 mb-4">
          There was an error loading the document. Please make sure it's a valid PDF file.
        </p>
        <p className="text-xs text-red-600">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center bg-white rounded-lg shadow p-4">
      {isLoading && (
        <div className="flex flex-col items-center justify-center p-8">
          <Loader className="w-8 h-8 text-blue-500 animate-spin mb-4" />
          <p className="text-sm text-gray-600">Loading document...</p>
        </div>
      )}
      
      <DndContext 
        sensors={sensors} 
        onDragEnd={handleDragEnd}
      >
        <div 
          className="relative w-full"
          ref={setContainerRef}
        >
          <Document
            file={file}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={null}
            className="max-w-full"
          >
            <Page 
              pageNumber={pageNumber}
              className="max-w-full"
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading={null}
            />
          </Document>

          {signatures.map(sig => (
            <React.Fragment key={sig.id}>
              <DraggableSignature
                id={sig.id}
                signature={sig.dataUrl}
                position={sig.position}
                size={sig.size}
                onRemove={() => onRemoveSignature?.(sig.id)}
                onSizeChange={(size) => onSignatureSizeChange?.(sig.id, size)}
              />
              {sig.showTimestamp && (
                <DraggableTimestamp
                  id={`timestamp-${sig.id}`}
                  timestamp={sig.timestamp}
                  position={sig.timestampPosition}
                  size={sig.timestampSize}
                  onSizeChange={(size) => onTimestampSizeChange?.(sig.id, size)}
                />
              )}
            </React.Fragment>
          ))}

          {stamps.map(stamp => (
            <DraggableStamp
              key={stamp.id}
              id={stamp.id}
              stamp={stamp.dataUrl}
              position={stamp.position}
              size={stamp.size}
              onRemove={() => onRemoveStamp?.(stamp.id)}
              onSizeChange={(size) => onStampSizeChange?.(stamp.id, size)}
            />
          ))}
        </div>
      </DndContext>
      
      {!isLoading && !error && (
        <div className="flex items-center gap-4 mt-4">
          <button
            onClick={() => changePage(-1)}
            disabled={pageNumber <= 1}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <p className="text-sm">
            Page {pageNumber} of {numPages || '--'}
          </p>
          
          <button
            onClick={() => changePage(1)}
            disabled={pageNumber >= (numPages || 1)}
            className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DocumentViewer;