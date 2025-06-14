
import { QualityMetrics } from '@/types/camera';

export const analyzeImageQuality = (
  imageData: ImageData, 
  width: number, 
  height: number,
  frameHistory: ImageData[]
): QualityMetrics => {
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
  const isStable = checkMotionStability(frameHistory);
  
  let overallQuality: 'poor' | 'good' | 'excellent' = 'poor';
  if (isFramed && isCentered && isStable) {
    overallQuality = 'excellent';
  } else if (isFramed || isCentered) {
    overallQuality = 'good';
  }
  
  return { isFramed, isCentered, isStable, overallQuality };
};

export const checkMotionStability = (frameHistory: ImageData[]): boolean => {
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

export const updateFeedbackMessage = (metrics: QualityMetrics): string => {
  if (metrics.overallQuality === 'excellent') {
    return 'Perfect! Capturing image...';
  } else if (!metrics.isFramed) {
    return 'Move closer or adjust positioning';
  } else if (!metrics.isCentered) {
    return 'Center the infant in the frame';
  } else if (!metrics.isStable) {
    return 'Hold still...';
  } else {
    return 'Almost there, keep steady';
  }
};
