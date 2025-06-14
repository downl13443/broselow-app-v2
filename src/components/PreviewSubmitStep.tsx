import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Download, AlertCircle } from 'lucide-react';
import { useDataCollection } from '@/contexts/DataCollectionContext';
import { useSubmitData } from '@/hooks/useSubmitData';

interface PreviewSubmitStepProps {
  onPrev: () => void;
  onRestart: () => void;
}

const PreviewSubmitStep: React.FC<PreviewSubmitStepProps> = ({ onPrev, onRestart }) => {
  const { images, anthropometricData, resetData } = useDataCollection();
  const { submitData, isSubmitting, error, clearError } = useSubmitData();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    folderUrl?: string;
    timestamp?: string;
  } | null>(null);

  const handleSubmit = async () => {
    clearError(); // Clear any previous errors
    
    try {
      // Prepare the data in the format expected by our API
      const result = await submitData({
        images: {
          front: images.front || '',
          left: images.left || '',
          right: images.right || ''
        },
        metadata: {
          age: anthropometricData.ageMonths || 0,
          height: anthropometricData.heightCm || 0,
          weight: anthropometricData.weightKg || 0
        }
      });

      if (result.success) {
        setSubmissionResult({
          folderUrl: result.folderUrl,
          timestamp: result.timestamp
        });
        setIsSubmitted(true);
        console.log('✅ Submission successful:', result);
      } else {
        console.error('❌ Submission failed:', result.error);
        // Error is automatically handled by the useSubmitData hook
      }
    } catch (err) {
      console.error('❌ Unexpected error:', err);
    }
  };

  const handleNewEntry = () => {
    resetData();
    setIsSubmitted(false);
    setSubmissionResult(null);
    clearError();
    onRestart();
  };

  // Success Screen
  if (isSubmitted) {
    return (
      <div className="text-center space-y-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <Check size={40} className="text-green-600" />
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold text-green-800 mb-2">
            Record Submitted Successfully
          </h2>
          <p className="text-gray-600 mb-4">
            The infant data has been collected and submitted for AI training.
          </p>
          
          {/* Show submission details */}
          {submissionResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
              <h4 className="font-medium text-green-800 mb-2">Submission Details:</h4>
              <div className="text-sm text-green-700 space-y-1">
                {submissionResult.timestamp && (
                  <p>
                    <span className="font-medium">Submitted:</span>{' '}
                    {new Date(submissionResult.timestamp).toLocaleString()}
                  </p>
                )}
                {submissionResult.folderUrl && (
                  <p>
                    <span className="font-medium">Data Location:</span>{' '}
                    <a 
                      href={submissionResult.folderUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      View in Google Drive
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={handleNewEntry}
          className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white"
        >
          Start New Entry
        </Button>
      </div>
    );
  }

  // Main Preview & Submit Screen
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-blue-900 mb-2">
          Review & Submit
        </h2>
        <p className="text-gray-600 text-sm">
          Please review all data before submission
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
          <AlertCircle size={20} className="text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <h4 className="font-medium text-red-800 mb-1">Submission Failed</h4>
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={clearError}
              className="text-xs text-red-600 hover:text-red-800 underline mt-2"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Images Preview */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Captured Images</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { key: 'front', label: 'Front View' },
            { key: 'left', label: 'Left Profile' },
            { key: 'right', label: 'Right Profile' },
          ].map((view) => (
            <div key={view.key} className="space-y-2">
              {images[view.key as keyof typeof images] ? (
                <img
                  src={images[view.key as keyof typeof images]}
                  alt={view.label}
                  className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
                />
              ) : (
                <div className="w-full h-24 bg-gray-100 rounded-lg border-2 border-gray-300 border-dashed flex items-center justify-center">
                  <span className="text-xs text-gray-500">No image</span>
                </div>
              )}
              <p className="text-xs text-center text-gray-600">{view.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Anthropometric Data Preview */}
      <div className="space-y-4">
        <h3 className="font-medium text-gray-900">Measurements</h3>
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">Age:</span>
            <span className="font-medium">
              {anthropometricData.ageMonths} {anthropometricData.ageMonths === 1 ? 'month' : 'months'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Height:</span>
            <span className="font-medium">{anthropometricData.heightCm} cm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Weight:</span>
            <span className="font-medium">{anthropometricData.weightKg} kg</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3 pt-4">
        <Button
          onClick={onPrev}
          variant="outline"
          className="flex-1 h-12"
          disabled={isSubmitting}
        >
          Back to Edit
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !images.front || !images.left || !images.right}
          className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
        >
          {isSubmitting ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Submitting...
            </div>
          ) : (
            <>
              <Download size={16} className="mr-2" />
              Submit Record
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default PreviewSubmitStep;