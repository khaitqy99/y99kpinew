'use server';
/**
 * @fileOverview A server-only flow for uploading files to Google Drive.
 */

import { ai } from '@/ai/genkit';
import { DriveService } from '@/services/drive';
import {
  UploadFileInput,
  UploadFileInputSchema,
  UploadFileOutput,
  UploadFileOutputSchema,
} from '@/ai/flows/upload-file';

const uploadFileFlow = ai.defineFlow(
  {
    name: 'uploadFileFlow',
    inputSchema: UploadFileInputSchema,
    outputSchema: UploadFileOutputSchema,
  },
  async (input) => {
    const driveService = new DriveService();
    const fileUrl = await driveService.uploadFile(
      input.fileName,
      input.fileContent,
      input.mimeType
    );
    return { fileUrl };
  }
);

export async function uploadFileAction(
  input: UploadFileInput
): Promise<UploadFileOutput> {
  return uploadFileFlow(input);
}
