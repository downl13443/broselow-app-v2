
interface SubmitInfantDataRequest {
  images: {
    front: string;
    left: string;
    right: string;
  };
  anthropometricData: {
    ageMonths: number;
    heightCm: number;
    weightKg: number;
  };
}

interface SubmitInfantDataResponse {
  message: string;
  id: string;
}

export const submitInfantData = async (data: SubmitInfantDataRequest): Promise<SubmitInfantDataResponse> => {
  console.log('Submitting infant data to API...');
  
  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to submit data');
  }

  const result = await response.json();
  console.log('Data submitted successfully:', result);
  
  return result;
};
