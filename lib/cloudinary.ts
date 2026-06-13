import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";
import { env } from "@/lib/env";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export function uploadBuffer(
  buffer: Buffer,
  folder: string,
  publicId: string
): Promise<UploadApiResponse> {
  const dataUri = `data:application/octet-stream;base64,${buffer.toString("base64")}`;
  return cloudinary.uploader.upload(dataUri, {
    folder,
    public_id: publicId,
    resource_type: "raw",
    timeout: 120000,
  });
}

export function uploadImageBuffer(
  buffer: Buffer,
  folder: string,
  publicId: string
): Promise<UploadApiResponse> {
  const dataUri = `data:application/octet-stream;base64,${buffer.toString("base64")}`;
  return cloudinary.uploader.upload(dataUri, {
    folder,
    public_id: publicId,
    resource_type: "image",
    timeout: 120000,
  });
}

export async function deleteFile(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
}

export async function deleteImage(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
}
