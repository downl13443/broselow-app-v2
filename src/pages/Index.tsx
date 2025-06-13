
import React, { useState } from 'react';
import { DataCollectionProvider } from '@/contexts/DataCollectionContext';
import StepIndicator from '@/components/StepIndicator';
import ImageCaptureStep from '@/components/ImageCaptureStep';
import AnthropometricForm from '@/components/AnthropometricForm';
import PreviewSubmitStep from '@/components/PreviewSubmitStep';

const Index = () => {
  const [currentStep, setCurrentStep] = useState(1);

  const nextStep = () => {
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  return (
    <DataCollectionProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-6 max-w-md">
          {/* Header */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-blue-900 mb-2">
              Infant Data Collection
            </h1>
            <p className="text-blue-700 text-sm">
              Healthcare Worker Portal
            </p>
          </div>

          {/* Step Indicator */}
          <StepIndicator currentStep={currentStep} />

          {/* Main Content */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mt-6">
            {currentStep === 1 && (
              <ImageCaptureStep onNext={nextStep} />
            )}
            {currentStep === 2 && (
              <AnthropometricForm onNext={nextStep} onPrev={prevStep} />
            )}
            {currentStep === 3 && (
              <PreviewSubmitStep onPrev={prevStep} onRestart={() => setCurrentStep(1)} />
            )}
          </div>
        </div>
      </div>
    </DataCollectionProvider>
  );
};

export default Index;
