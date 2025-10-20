'use client';
/**
 * @fileOverview A client-safe function for uploading files.
 *
 * - uploadFile - A function that handles the file upload process by calling a server action.
 * - UploadFileInput - The input type for the uploadFile function.
 * - UploadFileOutput - The return type for the uploadFile function.
 */

import { z } from 'zod';
import { uploadFileAction } from '@/ai/actions/upload-file-action';

export const UploadFileInputSchema = z.object({
  fileName: z.string().describe('The name of the file to upload.'),
  fileContent: z.string().describe('The Base64 encoded content of the file.'),
  mimeType: z.string().describe('The MIME type of the file.'),
});
export type UploadFileInput = z.infer<typeof UploadFileInputSchema>;

export const UploadFileOutputSchema = z.object({
  fileUrl: z.string().describe('The web view link of the uploaded file.'),
});
export type UploadFileOutput = z.infer<typeof UploadFileOutputSchema>;


export async function uploadFile(
  input: UploadFileInput
): Promise<UploadFileOutput> {
  return uploadFileAction(input);
}
