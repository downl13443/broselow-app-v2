
import React from 'react';
import { Camera, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CameraCaptureProps } from '@/types/camera';
import { getCameraInstructions } from '@/utils/cameraInstructions';
import { useCamera } from '@/hooks/useCamera';

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
    handleRetry
  } = useCamera(captureType, onCapture);

  const instructions = getCameraInstructions(captureType);
  const boundingBoxColor = qualityMetrics.overallQuality === 'excellent' ? '#10B981' : 
                          qualityMetrics.overallQuality === 'good' ? '#F59E0B' : '#EF4444';

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

      <div className="text-center space-y-2">
        <p className="text-blue-700 font-medium">{instructions.instruction}</p>
        <p className="text-sm text-gray-600">{instructions.guidelines}</p>
      </div>

      {/* Live feedback */}
      <div className="text-center p-3 rounded-lg" style={{ 
        backgroundColor: boundingBoxColor === '#10B981' ? '#DEF7EC' : 
                        boundingBoxColor === '#F59E0B' ? '#FEF3C7' : '#FEE2E2',
        color: boundingBoxColor === '#10B981' ? '#047857' : 
               boundingBoxColor === '#F59E0B' ? '#92400E' : '#991B1B'
      }}>
        <p className="font-medium">{feedbackMessage}</p>
      </div>

      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-64 object-cover rounded-lg bg-gray-900"
        />
        
        {/* Intelligent bounding box overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Dynamic guide frame */}
            <rect
              x="15"
              y="20"
              width="70"
              height="60"
              fill="none"
              stroke={boundingBoxColor}
              strokeWidth="1"
              strokeDasharray={qualityMetrics.overallQuality === 'excellent' ? "none" : "2,1"}
              rx="2"
            />
            {/* Center cross - only show when not perfect */}
            {qualityMetrics.overallQuality !== 'excellent' && (
              <>
                <line
                  x1="50"
                  y1="25"
                  x2="50"
                  y2="75"
                  stroke={boundingBoxColor}
                  strokeWidth="0.5"
                  opacity="0.6"
                />
                <line
                  x1="20"
                  y1="50"
                  x2="80"
                  y2="50"
                  stroke={boundingBoxColor}
                  strokeWidth="0.5"
                  opacity="0.6"
                />
              </>
            )}
            {/* Quality indicators */}
            <circle
              cx="85"
              cy="15"
              r="2"
              fill={qualityMetrics.isFramed ? '#10B981' : '#EF4444'}
            />
            <circle
              cx="85"
              cy="25"
              r="2"
              fill={qualityMetrics.isCentered ? '#10B981' : '#EF4444'}
            />
            <circle
              cx="85"
              cy="35"
              r="2"
              fill={qualityMetrics.isStable ? '#10B981' : '#EF4444'}
            />
          </svg>
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
