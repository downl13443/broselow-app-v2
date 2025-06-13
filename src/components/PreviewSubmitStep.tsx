
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, Download } from 'lucide-react';
import { useDataCollection } from '@/contexts/DataCollectionContext';

interface PreviewSubmitStepProps {
  onPrev: () => void;
  onRestart: () => void;
}

const PreviewSubmitStep: React.FC<PreviewSubmitStepProps> = ({ onPrev, onRestart }) => {
  const { images, anthropometricData, resetData } = useDataCollection();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Stub implementation - to be wired up later
    console.log('Submitting data:', {
      images,
      anthropometricData,
      timestamp: new Date().toISOString(),
    });

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleNewEntry = () => {
    resetData();
    setIsSubmitted(false);
    onRestart();
  };

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
          <p className="text-gray-600">
            The infant data has been collected and submitted for AI training.
          </p>
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
              <img
                src={images[view.key as keyof typeof images]}
                alt={view.label}
                className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
              />
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
          disabled={isSubmitting}
          className="flex-1 h-12 bg-green-600 hover:bg-green-700 text-white"
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
