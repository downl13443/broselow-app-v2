
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDataCollection } from '@/contexts/DataCollectionContext';

interface AnthropometricFormProps {
  onNext: () => void;
  onPrev: () => void;
}

const AnthropometricForm: React.FC<AnthropometricFormProps> = ({ onNext, onPrev }) => {
  const { anthropometricData, setAnthropometricData } = useDataCollection();
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Age validation (0-144 months)
    if (!anthropometricData.ageMonths || anthropometricData.ageMonths < 0 || anthropometricData.ageMonths > 144) {
      newErrors.ageMonths = 'Age must be between 0 and 144 months';
    }

    // Height validation (above 0)
    if (!anthropometricData.heightCm || anthropometricData.heightCm <= 0) {
      newErrors.heightCm = 'Height must be above 0 cm';
    }

    // Weight validation (above 0)
    if (!anthropometricData.weightKg || anthropometricData.weightKg <= 0) {
      newErrors.weightKg = 'Weight must be above 0 kg';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext();
    }
  };

  const handleInputChange = (field: keyof typeof anthropometricData) => (value: string) => {
    const numValue = parseFloat(value) || 0;
    setAnthropometricData(prev => ({ ...prev, [field]: numValue }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const generateAgeOptions = () => {
    const options = [];
    for (let i = 0; i <= 144; i++) {
      let label = `${i} ${i === 1 ? 'month' : 'months'}`;
      
      // Add year brackets for 12 months and above
      if (i >= 12) {
        const years = Math.floor(i / 12);
        const remainingMonths = i % 12;
        
        if (remainingMonths === 0) {
          // Exact year
          label += ` (${years} ${years === 1 ? 'year' : 'years'})`;
        } else {
          // Year and months
          label += ` (${years} ${years === 1 ? 'year' : 'years'} ${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'})`;
        }
      }
      
      options.push({ value: i, label });
    }
    return options;
  };

  const ageOptions = generateAgeOptions();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-blue-900 mb-2">
          Anthropometric Measurements
        </h2>
        <p className="text-gray-600 text-sm">
          Enter standardized measurements
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Age in Months */}
        <div className="space-y-2">
          <Label htmlFor="age" className="text-sm font-medium text-gray-700">
            Age (months) *
          </Label>
          <Select
            value={anthropometricData.ageMonths.toString()}
            onValueChange={(value) => handleInputChange('ageMonths')(value)}
          >
            <SelectTrigger className={`h-12 ${errors.ageMonths ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select age in months" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              {ageOptions.map((age) => (
                <SelectItem key={age.value} value={age.value.toString()}>
                  {age.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.ageMonths && (
            <p className="text-red-500 text-xs">{errors.ageMonths}</p>
          )}
        </div>

        {/* Height */}
        <div className="space-y-2">
          <Label htmlFor="height" className="text-sm font-medium text-gray-700">
            Height (cm) *
          </Label>
          <div className="relative">
            <Input
              id="height"
              type="number"
              step="0.1"
              placeholder="Enter height in cm"
              value={anthropometricData.heightCm || ''}
              onChange={(e) => handleInputChange('heightCm')(e.target.value)}
              className={`h-12 pr-12 ${errors.heightCm ? 'border-red-500' : ''}`}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              cm
            </span>
          </div>
          <p className="text-xs text-gray-500">Must be above 0 cm</p>
          {errors.heightCm && (
            <p className="text-red-500 text-xs">{errors.heightCm}</p>
          )}
        </div>

        {/* Weight */}
        <div className="space-y-2">
          <Label htmlFor="weight" className="text-sm font-medium text-gray-700">
            Weight (kg) *
          </Label>
          <div className="relative">
            <Input
              id="weight"
              type="number"
              step="0.01"
              placeholder="Enter weight in kg"
              value={anthropometricData.weightKg || ''}
              onChange={(e) => handleInputChange('weightKg')(e.target.value)}
              className={`h-12 pr-12 ${errors.weightKg ? 'border-red-500' : ''}`}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
              kg
            </span>
          </div>
          <p className="text-xs text-gray-500">Must be above 0 kg</p>
          {errors.weightKg && (
            <p className="text-red-500 text-xs">{errors.weightKg}</p>
          )}
        </div>

        <div className="flex space-x-3 pt-4">
          <Button
            type="button"
            onClick={onPrev}
            variant="outline"
            className="flex-1 h-12"
          >
            Back to Images
          </Button>
          <Button
            type="submit"
            className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Continue to Review
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AnthropometricForm;
