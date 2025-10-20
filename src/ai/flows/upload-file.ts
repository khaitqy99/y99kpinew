'use server';
/**
 * @fileOverview A flow for uploading files to Google Drive.
 *
 * - uploadFile - A function that handles the file upload process.
 * - UploadFileInput - The input type for the uploadFile function.
 * - UploadFileOutput - The return type for the uploadFile function.
 */

import { ai } from '@/ai/genkit';
import { DriveService } from '@/services/drive';
import { z } from 'genkit';

export const UploadFileInputSchema = z.object({
  fileName: z.string().describe('The name of the file to upload.'),
  fileContent: z.string().describe("The Base64 encoded content of the file."),
  mimeType: z.string().describe("The MIME type of the file."),
});
export type UploadFileInput = z.infer<typeof UploadFileInputSchema>;

export const UploadFileOutputSchema = z.object({
  fileUrl: z.string().describe('The web view link of the uploaded file.'),
});
export type UploadFileOutput = z.infer<typeof UploadFileOutputSchema>;


export const uploadFileFlow = ai.defineFlow(
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

export async function uploadFile(input: UploadFileInput): Promise<UploadFileOutput> {
    return uploadFileFlow(input);
}
