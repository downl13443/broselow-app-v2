
import { supabase } from '../src/integrations/supabase/client';
import type { VercelRequest, VercelResponse } from '@vercel/node';

interface SubmitData {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { images, anthropometricData }: SubmitData = req.body;

    // Validate required fields
    if (!images || !images.front || !images.left || !images.right) {
      console.error('Missing image data');
      return res.status(400).json({ error: 'Missing image data' });
    }

    if (!anthropometricData || !anthropometricData.ageMonths || !anthropometricData.heightCm || !anthropometricData.weightKg) {
      console.error('Missing anthropometric data');
      return res.status(400).json({ error: 'Missing anthropometric data' });
    }

    console.log('Starting data submission process...');

    // Generate a unique ID for this infant record
    const infantId = crypto.randomUUID();
    console.log(`Generated infant ID: ${infantId}`);

    // Function to validate and upload base64 image
    const uploadImage = async (base64Data: string, imageName: string): Promise<string> => {
      // Remove data URL prefix if present
      const base64Content = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');
      
      // Convert base64 to buffer
      const imageBuffer = Buffer.from(base64Content, 'base64');
      
      // Validate image size (5MB limit)
      if (imageBuffer.length > 5 * 1024 * 1024) {
        throw new Error(`Image ${imageName} exceeds 5MB limit`);
      }

      console.log(`Uploading ${imageName} image (${imageBuffer.length} bytes)...`);

      // Upload to Supabase storage
      const filePath = `${infantId}/${imageName}.jpg`;
      const { data, error } = await supabase.storage
        .from('infant-images')
        .upload(filePath, imageBuffer, {
          contentType: 'image/jpeg',
          upsert: false
        });

      if (error) {
        console.error(`Upload error for ${imageName}:`, error);
        throw new Error(`Failed to upload ${imageName} image: ${error.message}`);
      }

      console.log(`Successfully uploaded ${imageName} to ${data.path}`);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('infant-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    };

    // Upload all three images
    console.log('Uploading images...');
    const [frontUrl, leftUrl, rightUrl] = await Promise.all([
      uploadImage(images.front, 'front'),
      uploadImage(images.left, 'left'),
      uploadImage(images.right, 'right')
    ]);

    console.log('All images uploaded successfully');

    // Insert record into infants table
    console.log('Inserting record into database...');
    const { data: infantData, error: insertError } = await supabase
      .from('infants')
      .insert({
        id: infantId,
        age: anthropometricData.ageMonths,
        height: anthropometricData.heightCm,
        weight: anthropometricData.weightKg,
        front_url: frontUrl,
        left_url: leftUrl,
        right_url: rightUrl,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Database insert error:', insertError);
      return res.status(500).json({ error: 'Failed to save infant data' });
    }

    console.log('Record inserted successfully:', infantData);

    return res.status(200).json({
      message: 'Success',
      id: infantId
    });

  } catch (error) {
    console.error('Submission error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}
