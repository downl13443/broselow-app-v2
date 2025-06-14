
import { useState, useEffect, useRef, useCallback } from 'react';
import { QualityMetrics } from '@/types/camera';
import { analyzeImageQuality, updateFeedbackMessage } from '@/utils/imageAnalysis';

export const useCamera = (
  captureType: 'front' | 'left' | 'right',
  onCapture: (imageData: string, type: 'front' | 'left' | 'right') => void
) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analysisCanvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
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
  const [frameHistory, setFrameHistory] = useState<ImageData[]>([]);

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
      const metrics = analyzeImageQuality(imageData, canvas.width, canvas.height, frameHistory);
      setQualityMetrics(metrics);
      const message = updateFeedbackMessage(metrics);
      setFeedbackMessage(message);
      
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
  }, [isCapturing, frameHistory]);

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
    setIsAnalyzing(true);
  };

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
      }, 1000);
      
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  useEffect(() => {
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

  return {
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
  };
};
