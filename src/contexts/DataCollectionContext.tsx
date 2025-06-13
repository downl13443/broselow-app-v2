
import React, { createContext, useContext, useState } from 'react';

interface ImageData {
  front?: string;
  left?: string;
  right?: string;
}

interface AnthropometricData {
  ageMonths: number;
  heightCm: number;
  weightKg: number;
}

interface DataCollectionContextType {
  images: ImageData;
  setImages: React.Dispatch<React.SetStateAction<ImageData>>;
  anthropometricData: AnthropometricData;
  setAnthropometricData: React.Dispatch<React.SetStateAction<AnthropometricData>>;
  resetData: () => void;
}

const DataCollectionContext = createContext<DataCollectionContextType | undefined>(undefined);

export const DataCollectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [images, setImages] = useState<ImageData>({});
  const [anthropometricData, setAnthropometricData] = useState<AnthropometricData>({
    ageMonths: 0,
    heightCm: 0,
    weightKg: 0,
  });

  const resetData = () => {
    setImages({});
    setAnthropometricData({
      ageMonths: 0,
      heightCm: 0,
      weightKg: 0,
    });
  };

  return (
    <DataCollectionContext.Provider value={{
      images,
      setImages,
      anthropometricData,
      setAnthropometricData,
      resetData,
    }}>
      {children}
    </DataCollectionContext.Provider>
  );
};

export const useDataCollection = () => {
  const context = useContext(DataCollectionContext);
  if (context === undefined) {
    throw new Error('useDataCollection must be used within a DataCollectionProvider');
  }
  return context;
};
