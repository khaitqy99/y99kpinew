import { google } from 'googleapis';
import { Readable } from 'stream';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });
config({ path: '.env' });

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
    
    // First, verify the folder exists and we have access to it
    try {
      await this.drive.files.get({
        fileId: folderId,
        fields: 'id, name, mimeType',
        supportsAllDrives: true
      });
    } catch (error) {
      console.error('Folder access error:', error);
      throw new Error(`Cannot access folder with ID: ${folderId}. Please check if the folder exists and you have permission to access it.`);
    }
    
    const buffer = Buffer.from(base64Content, 'base64');
    
    // Check file size (Google Drive has limits)
    const fileSizeMB = buffer.length / (1024 * 1024);
    if (fileSizeMB > 100) { // 100MB limit
      throw new Error(`File too large: ${fileSizeMB.toFixed(2)}MB. Maximum size is 100MB.`);
    }

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
    };

    // Retry logic for upload
    const maxRetries = 3;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Upload attempt ${attempt}/${maxRetries} for file: ${fileName}`);
        
        // Create a new stream for each attempt
        const stream = new Readable({
          read() {
            this.push(buffer);
            this.push(null);
          }
        });

        const media = {
          mimeType: mimeType,
          body: stream,
        };

        // Upload with timeout
        const uploadPromise = this.drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: 'id, webViewLink',
          supportsAllDrives: true
        });

        // Add timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Upload timeout')), 60000); // 60 seconds
        });

        const file = await Promise.race([uploadPromise, timeoutPromise]) as any;

        if (!file.data.id) {
          throw new Error('File upload failed, no file ID returned.');
        }

        console.log(`File uploaded successfully on attempt ${attempt}: ${file.data.id}`);

        // Make the file publicly readable
        try {
          await this.drive.permissions.create({
            fileId: file.data.id,
            requestBody: {
              role: 'reader',
              type: 'anyone'
            },
            supportsAllDrives: true
          });
        } catch (permError) {
          console.warn('Warning: Could not set public permissions:', permError);
          // Continue anyway, file is still uploaded
        }

        if (!file.data.webViewLink) {
          throw new Error('Could not get web view link for the file.');
        }

        return file.data.webViewLink;

      } catch (error: any) {
        lastError = error;
        
        // Extract detailed error information
        let errorDetails = 'Unknown error';
        if (error?.response) {
          // Google API error response
          errorDetails = `Status: ${error.response.status}, Message: ${error.response.statusText || JSON.stringify(error.response.data || {})}`;
        } else if (error?.message) {
          errorDetails = error.message;
        } else if (typeof error === 'string') {
          errorDetails = error;
        }
        
        console.error(`Upload attempt ${attempt}/${maxRetries} failed:`, {
          error: errorDetails,
          fileName,
          fileSize: `${(buffer.length / (1024 * 1024)).toFixed(2)}MB`,
          errorType: error?.code || error?.name || 'Unknown',
          fullError: error
        });
        
        // If this is not the last attempt, wait before retrying
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // If all retries failed
    console.error('All upload attempts failed:', {
      fileName,
      lastError,
      errorMessage: lastError?.message,
      errorCode: lastError?.code,
      errorResponse: lastError?.response
    });
    
    // Provide more specific error messages
    let userFriendlyError = 'Không thể upload file. Vui lòng thử lại sau.';
    
    if (lastError?.response) {
      const status = lastError.response.status;
      if (status === 401 || status === 403) {
        userFriendlyError = 'Lỗi xác thực Google Drive. Vui lòng kiểm tra lại cấu hình token.';
      } else if (status === 404) {
        userFriendlyError = 'Không tìm thấy thư mục trên Google Drive. Vui lòng kiểm tra lại GOOGLE_DRIVE_FOLDER_ID.';
      } else if (status === 429) {
        userFriendlyError = 'Quá nhiều yêu cầu. Vui lòng đợi và thử lại sau.';
      } else if (status >= 500) {
        userFriendlyError = 'Lỗi server Google Drive. Vui lòng thử lại sau.';
      } else {
        userFriendlyError = `Lỗi từ Google Drive (${status}): ${lastError.response.statusText || 'Unknown error'}`;
      }
    } else if (lastError?.message) {
      if (lastError.message.includes('timeout')) {
        userFriendlyError = 'Upload quá lâu. Vui lòng kiểm tra kết nối mạng hoặc thử lại với file nhỏ hơn.';
      } else if (lastError.message.includes('unexpected response')) {
        userFriendlyError = 'Phản hồi không đúng định dạng từ server. Có thể do token Google Drive hết hạn hoặc lỗi kết nối.';
      } else {
        userFriendlyError = lastError.message;
      }
    }
    
    throw new Error(userFriendlyError);
  }
}
