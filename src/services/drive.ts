import { google } from 'googleapis';
import { Readable } from 'stream';

export class DriveService {
  private drive;

  constructor() {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_OAUTH_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
    });

    this.drive = google.drive({
      version: 'v3',
      auth: oauth2Client,
    });
  }

  public async uploadFile(fileName: string, base64Content: string, mimeType: string): Promise<string> {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID!;
    
    const buffer = Buffer.from(base64Content, 'base64');
    const stream = new Readable();
    stream.push(buffer);
    stream.push(null);

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    const media = {
      mimeType: mimeType,
      body: stream,
    };

    const file = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, webViewLink'
    });

    if (!file.data.id) {
        throw new Error('File upload failed, no file ID returned.');
    }

    // Make the file publicly readable
    await this.drive.permissions.create({
        fileId: file.data.id,
        requestBody: {
            role: 'reader',
            type: 'anyone'
        }
    });

    if (!file.data.webViewLink) {
        throw new Error('Could not get web view link for the file.');
    }

    return file.data.webViewLink;
  }
}
