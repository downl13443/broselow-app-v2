
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CameraCaptureProps {
  captureType: 'front' | 'left' | 'right';
  onCapture: (imageData: string, type: 'front' | 'left' | 'right') => void;
  onCancel: () => void;
}

interface QualityMetrics {
  isFramed: boolean;
  isCentered: boolean;
  isStable: boolean;
  overallQuality: 'poor' | 'good' | 'excellent';
}

const CameraCapture: React.FC<CameraCaptureProps> = ({ captureType, onCapture, onCancel }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics>({
    isFramed: false,
    isCentered: false,
    isStable: false,
    overallQuality: 'poor'
  });
  const [feedbackMessage, setFeedbackMessage] = useState('Position infant in the frame');
  const [isCapturing, setIsCapturing] = useState(false);
  const [showManualCapture, setShowManualCapture] = useState(false);
  const [analysisStartTime, setAnalysisStartTime] = useState<number | null>(null);
  const [frameHistory, setFrameHistory] = useState<ImageData[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

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

  const analyzeFrame = useCallback(() => {
    if (!videoRef.current || !analysisCanvasRef.current || isCapturing) return;

    const video = videoRef.current;
    const canvas = analysisCanvasRef.current;
    const context = canvas.getContext('2d');
    
    if (!context || video.videoWidth === 0 || video.videoHeight === 0) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Analyze frame quality
      const metrics = analyzeImageQuality(imageData, canvas.width, canvas.height);
      setQualityMetrics(metrics);
      updateFeedbackMessage(metrics);
      
      // Store frame for motion analysis
      setFrameHistory(prev => {
        const newHistory = [...prev.slice(-2), imageData]; // Keep last 3 frames
        return newHistory;
      });
      
      // Auto-capture logic
      if (metrics.overallQuality === 'excellent' && !isCapturing) {
        handleAutoCapture();
      }
    } catch (err) {
      console.log('Frame analysis error:', err);
    }
  }, [isCapturing]);

  const analyzeImageQuality = (imageData: ImageData, width: number, height: number): QualityMetrics => {
    const data = imageData.data;
    
    // Define bounding box region (center 70% of frame)
    const boxLeft = Math.floor(width * 0.15);
    const boxRight = Math.floor(width * 0.85);
    const boxTop = Math.floor(height * 0.2);
    const boxBottom = Math.floor(height * 0.8);
    
    // Analyze content in bounding box
    let totalBrightness = 0;
    let pixelCount = 0;
    let edgePixels = 0;
    
    for (let y = boxTop; y < boxBottom; y++) {
      for (let x = boxLeft; x < boxRight; x++) {
        const index = (y * width + x) * 4;
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        
        // Calculate brightness
        const brightness = (r + g + b) / 3;
        totalBrightness += brightness;
        pixelCount++;
        
        // Simple edge detection (brightness difference with neighbors)
        if (x < boxRight - 1 && y < boxBottom - 1) {
          const nextIndex = ((y * width) + (x + 1)) * 4;
          const belowIndex = (((y + 1) * width) + x) * 4;
          const nextBrightness = (data[nextIndex] + data[nextIndex + 1] + data[nextIndex + 2]) / 3;
          const belowBrightness = (data[belowIndex] + data[belowIndex + 1] + data[belowIndex + 2]) / 3;
          
          if (Math.abs(brightness - nextBrightness) > 30 || Math.abs(brightness - belowBrightness) > 30) {
            edgePixels++;
          }
        }
      }
    }
    
    const avgBrightness = totalBrightness / pixelCount;
    const edgeRatio = edgePixels / pixelCount;
    
    // Quality heuristics
    const isFramed = avgBrightness > 50 && avgBrightness < 200; // Not too dark or bright
    const isCentered = edgeRatio > 0.05; // Has enough detail/edges in center
    const isStable = checkMotionStability();
    
    let overallQuality: 'poor' | 'good' | 'excellent' = 'poor';
    if (isFramed && isCentered && isStable) {
      overallQuality = 'excellent';
    } else if (isFramed || isCentered) {
      overallQuality = 'good';
    }
    
    return { isFramed, isCentered, isStable, overallQuality };
  };

  const checkMotionStability = (): boolean => {
    if (frameHistory.length < 2) return false;
    
    const currentFrame = frameHistory[frameHistory.length - 1];
    const previousFrame = frameHistory[frameHistory.length - 2];
    
    if (!currentFrame || !previousFrame) return false;
    
    // Simple motion detection by comparing pixel differences
    let diffSum = 0;
    const sampleSize = Math.min(currentFrame.data.length, previousFrame.data.length);
    const step = 16; // Sample every 16th pixel for performance
    
    for (let i = 0; i < sampleSize; i += step) {
      const diff = Math.abs(currentFrame.data[i] - previousFrame.data[i]);
      diffSum += diff;
    }
    
    const avgDiff = diffSum / (sampleSize / step);
    return avgDiff < 15; // Low motion threshold
  };

  const updateFeedbackMessage = (metrics: QualityMetrics) => {
    if (metrics.overallQuality === 'excellent') {
      setFeedbackMessage('Perfect! Capturing image...');
    } else if (!metrics.isFramed) {
      setFeedbackMessage('Move closer or adjust positioning');
    } else if (!metrics.isCentered) {
      setFeedbackMessage('Center the infant in the frame');
    } else if (!metrics.isStable) {
      setFeedbackMessage('Hold still...');
    } else {
      setFeedbackMessage('Almost there, keep steady');
    }
  };

  const handleAutoCapture = async () => {
    if (!videoRef.current || !canvasRef.current || isCapturing) return;

    setIsCapturing(true);
    setFeedbackMessage('Captured!');
    
    // Wait a moment to ensure stable frame
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    onCapture(imageData, captureType);
  };

  const handleManualCapture = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    onCapture(imageData, captureType);
  };

  const handleRetry = () => {
    setShowManualCapture(false);
    setAnalysisStartTime(Date.now());
    setIsAnalyzing(true);
  };

  useEffect(() => {
    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        
        // Start analysis after camera loads
        setTimeout(() => {
          setIsAnalyzing(true);
          setAnalysisStartTime(Date.now());
        }, 1000);
        
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
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isAnalyzing && !isCapturing) {
      intervalRef.current = setInterval(analyzeFrame, 400); // Analyze every 400ms
      
      // Show manual capture option after 10 seconds
      const timeoutId = setTimeout(() => {
        setShowManualCapture(true);
      }, 10000);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
        clearTimeout(timeoutId);
      };
    }
  }, [isAnalyzing, isCapturing, analyzeFrame]);

  const instructions = getInstructions();
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
