
import React, { useRef, useEffect, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraCaptureProps {
  captureType: 'front' | 'left' | 'right';
  onCapture: (imageData: string, type: 'front' | 'left' | 'right') => void;
  onCancel: () => void;
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ captureType, onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getInstructions = () => {
    switch (captureType) {
      case 'front':
        return {
          title: 'Front View Capture',
          instruction: 'Position infant facing camera',
          guidelines: 'Center the infant\'s face within the guide frame'
        };
      case 'left':
        return {
          title: 'Left Profile Capture',
          instruction: 'Position infant\'s left side towards camera',
          guidelines: 'Align the profile within the guide frame'
        };
      case 'right':
        return {
          title: 'Right Profile Capture',
          instruction: 'Position infant\'s right side towards camera',
          guidelines: 'Align the profile within the guide frame'
        };
    }
  };

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Use back camera on mobile
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('Unable to access camera. Please ensure camera permissions are granted.');
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert to base64
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    // Stop the stream
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    onCapture(imageData, captureType);
  };

  const instructions = getInstructions();

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

      <div className="relative">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-64 object-cover rounded-lg bg-gray-900"
        />
        
        {/* Guide overlay */}
        <div className="absolute inset-0 pointer-events-none">
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Guide frame */}
            <rect
              x="15"
              y="20"
              width="70"
              height="60"
              fill="none"
              stroke="rgba(59, 130, 246, 0.8)"
              strokeWidth="0.5"
              strokeDasharray="2,1"
              rx="2"
            />
            {/* Center cross */}
            <line
              x1="50"
              y1="25"
              x2="50"
              y2="75"
              stroke="rgba(59, 130, 246, 0.6)"
              strokeWidth="0.3"
            />
            <line
              x1="20"
              y1="50"
              x2="80"
              y2="50"
              stroke="rgba(59, 130, 246, 0.6)"
              strokeWidth="0.3"
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
        <Button
          onClick={handleCapture}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Camera size={16} className="mr-2" />
          Capture
        </Button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraCapture;
