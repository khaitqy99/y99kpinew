'use server';
/**
 * @fileOverview A server-only flow for uploading files to Google Drive.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { DriveService } from '@/services/drive';
import type {
  UploadFileInput,
  UploadFileOutput,
} from '@/ai/flows/upload-file';

export const UploadFileInputSchema = z.object({
  fileName: z.string().describe('The name of the file to upload.'),
  fileContent: z.string().describe('The Base64 encoded content of the file.'),
  mimeType: z.string().describe('The MIME type of the file.'),
});

export const UploadFileOutputSchema = z.object({
  fileUrl: z.string().describe('The web view link of the uploaded file.'),
});

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
