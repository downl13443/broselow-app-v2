import type { NextApiRequest, NextApiResponse } from 'next';
import { google } from 'googleapis';
import { getGoogleAuth } from '../../lib/google';

interface SubmissionPayload {
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

interface SuccessResponse {
  success: true;
  folderId: string;
  folderUrl: string;
  timestamp: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  details?: string;
}

type ApiResponse = SuccessResponse | ErrorResponse;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed'
    });
  }

  // Validate environment variables
  if (!process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID) {
    return res.status(500).json({
      success: false,
      error: 'Server configuration error',
      details: 'GOOGLE_DRIVE_PARENT_FOLDER_ID not configured'
    });
  }

  if (!process.env.GOOGLE_SHEET_ID) {
    return res.status(500).json({
      success: false,
      error: 'Server configuration error',
      details: 'GOOGLE_SHEET_ID not configured'
    });
  }

  try {
    // Parse and validate request body
    const { images, metadata } = req.body as SubmissionPayload;

    if (!images || !metadata) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request body',
        details: 'Both images and metadata are required'
      });
    }

    // Validate required images
    if (!images.front || !images.left || !images.right) {
      return res.status(400).json({
        success: false,
        error: 'Missing required images',
        details: 'Front, left, and right view images are required'
      });
    }

    // Validate metadata
    if (!metadata.age || !metadata.height || !metadata.weight) {
      return res.status(400).json({
        success: false,
        error: 'Missing required metadata',
        details: 'Age, height, and weight are required'
      });
    }

    // Initialize Google APIs
    const auth = getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    const timestamp = new Date().toISOString();
    const folderName = `Infant_${Date.now()}`;

    // 1. Create Drive Folder
    const folderRes = await drive.files.create({
      requestBody: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID!]
      },
      fields: 'id'
    });

    const folderId = folderRes.data.id;
    if (!folderId) {
      throw new Error('Failed to create folder: No folder ID returned');
    }

    // 2. Upload Images
    const imageEntries = Object.entries(images) as [string, string][];
    const uploadPromises = imageEntries.map(async ([position, base64]) => {
      // Validate base64 format
      if (!base64.startsWith('data:image/')) {
        throw new Error(`Invalid image format for ${position} view`);
      }

      const buffer = Buffer.from(base64.split(',')[1], 'base64');
      
      return drive.files.create({
        requestBody: {
          name: `${position}.jpg`,
          parents: [folderId],
          mimeType: 'image/jpeg'
        },
        media: {
          mimeType: 'image/jpeg',
          body: buffer
        }
      });
    });

    // Wait for all images to upload
    await Promise.all(uploadPromises);

    // 3. Append Metadata to Google Sheet
    const folderUrl = `https://drive.google.com/drive/folders/${folderId}`;
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID!,
      range: 'Sheet1!A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[
          timestamp,
          metadata.age,
          metadata.height,
          metadata.weight,
          folderUrl,
          folderName
        ]]
      }
    });

    return res.status(200).json({
      success: true,
      folderId,
      folderUrl,
      timestamp
    });

  } catch (error) {
    console.error('Submit API Error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
}

// Increase body size limit for image uploads
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
}