
import { CameraInstructions } from '@/types/camera';

export const getCameraInstructions = (captureType: 'front' | 'left' | 'right'): CameraInstructions => {
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
