import { useState } from 'react';

interface SubmissionData {
  images: {
    front: string;
    left: string;
    right: string;
  };
  metadata: {
    age: number;
    height: number;
    weight: number;
  };
}

interface SubmissionResult {
  success: boolean;
  folderId?: string;
  folderUrl?: string;
  timestamp?: string;
  error?: string;
  details?: string;
}

interface UseSubmitDataReturn {
  submitData: (data: SubmissionData) => Promise<SubmissionResult>;
  isSubmitting: boolean;
  error: string | null;
  clearError: () => void;
}

export function useSubmitData(): UseSubmitDataReturn {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitData = async (data: SubmissionData): Promise<SubmissionResult> => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate data before sending
      if (!data.images.front || !data.images.left || !data.images.right) {
        throw new Error('All three images (front, left, right) are required');
      }

      if (!data.metadata.age || !data.metadata.height || !data.metadata.weight) {
        throw new Error('Age, height, and weight are required');
      }

      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      if (!result.success) {
        throw new Error(result.error || 'Submission failed');
      }

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearError = () => setError(null);

  return {
    submitData,
    isSubmitting,
    error,
    clearError
  };
}