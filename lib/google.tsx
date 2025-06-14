import { google } from 'googleapis';

/**
 * Creates an authenticated Google JWT client using environment variables.
 */
export function getGoogleAuth() {
  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error('Missing Google service account credentials in environment variables.');
  }

  return new google.auth.JWT(
    {
        email: process.env.GOOGLE_CLIENT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'), // note the double escaping here
        scopes: ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/spreadsheets']
    }
  );
}

// Helper function to validate Google Drive and Sheets access
export async function validateGoogleAccess() {
  try {
    const auth = getGoogleAuth();
    const drive = google.drive({ version: 'v3', auth });
    const sheets = google.sheets({ version: 'v4', auth });

    // Test Drive access
    await drive.files.list({ pageSize: 1 });
    
    // Test Sheets access if sheet ID is provided
    if (process.env.GOOGLE_SHEET_ID) {
      await sheets.spreadsheets.get({
        spreadsheetId: process.env.GOOGLE_SHEET_ID
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Google API validation failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
