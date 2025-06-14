
export interface QualityMetrics {
  isFramed: boolean;
  isCentered: boolean;
  isStable: boolean;
  overallQuality: 'poor' | 'good' | 'excellent';
}

export interface CameraCaptureProps {
  captureType: 'front' | 'left' | 'right';
  onCapture: (imageData: string, type: 'front' | 'left' | 'right') => void;
  onCancel: () => void;
}

export interface CameraInstructions {
  title: string;
  instruction: string;
  guidelines: string;
}
