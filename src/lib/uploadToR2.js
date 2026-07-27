import { base44 } from '@/api/base44Client';

/**
 * Uploads a file using Base44's built-in UploadFile integration.
 * Returns { file_url }.
 */
export async function uploadToR2(file) {
  const { file_url } = await base44.integrations.Core.UploadFile({ file });
  return { file_url };
}