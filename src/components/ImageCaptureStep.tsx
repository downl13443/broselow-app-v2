
import React, { useState, useRef, useCallback } from 'react';
import { Camera, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDataCollection } from '@/contexts/DataCollectionContext';
import CameraCapture from '@/components/CameraCapture';

interface ImageCaptureStepProps {
  onNext: () => void;
}

const ImageCaptureStep: React.FC<ImageCaptureStepProps> = ({ onNext }) => {
  const { images, setImages } = useDataCollection();
  const [activeCapture, setActiveCapture] = useState<'front' | 'left' | 'right' | null>(null);

  const captureTypes = [
    { key: 'front' as const, label: 'Front View', description: 'Face the infant towards camera' },
    { key: 'left' as const, label: 'Left Profile', description: 'Left side of infant facing camera' },
    { key: 'right' as const, label: 'Right Profile', description: 'Right side of infant facing camera' },
  ];

  const handleCapture = useCallback((imageData: string, type: 'front' | 'left' | 'right') => {
    setImages(prev => ({ ...prev, [type]: imageData }));
    setActiveCapture(null);
  }, [setImages]);

  const handleRetake = (type: 'front' | 'left' | 'right') => {
    setImages(prev => ({ ...prev, [type]: undefined }));
  };

  const allImagesCaptured = images.front && images.left && images.right;

  if (activeCapture) {
    return (
      <CameraCapture
        captureType={activeCapture}
        onCapture={handleCapture}
        onCancel={() => setActiveCapture(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-blue-900 mb-2">
          Image Capture
        </h2>
        <p className="text-gray-600 text-sm">
          Capture 3 standardized views of the infant
        </p>
      </div>

      <div className="space-y-4">
        {captureTypes.map((type) => {
          const isCapturing = activeCapture === type.key;
          const isCaptured = images[type.key];

          return (
            <div
              key={type.key}
              className={`border-2 rounded-xl p-4 transition-all ${
                isCaptured 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{type.label}</h3>
                  <p className="text-sm text-gray-600 mt-1">{type.description}</p>
                </div>
                
                {isCaptured ? (
                  <div className="flex items-center space-x-2">
                    <img
                      src={isCaptured}
                      alt={`${type.label} preview`}
                      className="w-16 h-16 object-cover rounded-lg border-2 border-green-500"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRetake(type.key)}
                      className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    >
                      <RotateCcw size={16} className="mr-1" />
                      Retake
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setActiveCapture(type.key)}
                    disabled={isCapturing}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Camera size={16} className="mr-2" />
                    Capture
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {allImagesCaptured && (
        <div className="pt-4">
          <Button
            onClick={onNext}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
          >
            Continue to Measurements
          </Button>
        </div>
      )}
    </div>
  );
};

export default ImageCaptureStep;
