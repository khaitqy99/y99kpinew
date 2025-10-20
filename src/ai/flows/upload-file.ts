'use client';
/**
 * @fileOverview A client-safe function for uploading files.
 *
 * - uploadFile - A function that handles the file upload process by calling a server action.
 * - UploadFileInput - The input type for the uploadFile function.
 * - UploadFileOutput - The return type for the uploadFile function.
 */

import { z } from 'zod';
import { uploadFileAction, UploadFileInputSchema, UploadFileOutputSchema } from '@/ai/actions/upload-file-action';

export type UploadFileInput = z.infer<typeof UploadFileInputSchema>;
export type UploadFileOutput = z.infer<typeof UploadFileOutputSchema>;


export async function uploadFile(
  input: UploadFileInput
): Promise<UploadFileOutput> {
  return uploadFileAction(input);
}
