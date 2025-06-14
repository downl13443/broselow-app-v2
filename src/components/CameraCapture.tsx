
import React from 'react';
import { X, RotateCcw, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CameraCaptureProps } from '@/types/camera';
import { getCameraInstructions } from '@/utils/cameraInstructions';
import { useCamera } from '@/hooks/useCamera';
import BoundingBoxOverlay from './BoundingBoxOverlay';
import LiveFeedbackMessage from './LiveFeedbackMessage';
import CameraInstructionsPanel from './CameraInstructionsPanel';

const boundingBoxColors = {
  excellent: '#10B981',
  good: '#F59E0B',
  poor: '#EF4444',
};

const CameraCapture: React.FC<CameraCaptureProps> = ({ captureType, onCapture, onCancel }) => {
  const {
    videoRef,
    canvasRef,
    analysisCanvasRef,
    error,
    qualityMetrics,
    feedbackMessage,
    isCapturing,
    showManualCapture,
    handleManualCapture,
    handleRetry,
  } = useCamera(captureType, onCapture);

  const instructions = getCameraInstructions(captureType);
  const boundingBoxColor = boundingBoxColors[qualityMetrics.overallQuality];

  if (error) {
    return (
      <div className="text-center space-y-4">
        <div className="text-red-600 text-sm bg-red-50 p-4 rounded-lg">
          {error}
        </div>
        <Button onClick={onCancel} variant="outline">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-blue-900">
          {instructions.title}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </Button>
      </div>
      <CameraInstructionsPanel instructions={instructions} />

      <LiveFeedbackMessage boundingBoxColor={boundingBoxColor} feedbackMessage={feedbackMessage} />

      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-64 object-cover rounded-lg bg-gray-900"
        />
        <div className="absolute inset-0 pointer-events-none">
          <BoundingBoxOverlay qualityMetrics={qualityMetrics} />
        </div>
      </div>

      <div className="flex space-x-3">
        <Button
          onClick={onCancel}
          variant="outline"
          className="flex-1"
        >
          Cancel
        </Button>
        {showManualCapture && (
          <>
            <Button
              onClick={handleRetry}
              variant="outline"
              className="flex-1 text-blue-600 border-blue-600 hover:bg-blue-50"
            >
              <RotateCcw size={16} className="mr-2" />
              Retry
            </Button>
            <Button
              onClick={handleManualCapture}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Camera size={16} className="mr-2" />
              Capture
            </Button>
          </>
        )}
      </div>

      {/* Hidden canvases for analysis */}
      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={analysisCanvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;
