import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export function getBase64(file) {
  const buffer = Buffer.from(file);
  return `data:image/jpeg;base64,${buffer.toString('base64')}`;
}

export async function uploadFilesToCloudinary(files) {
  const promises = files.map(async (file) => {
    const buffer = Buffer.from(await file.arrayBuffer());
    
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'StealthyNote' },
        (error, result) => {
          if (error) reject(error);
          else resolve({ public_id: result.public_id, url: result.secure_url });
        }
      );
      
      Readable.from(buffer).pipe(stream);
    });
  });
  
  const results = await Promise.all(promises);
  return results;
}

export async function deleteFilesFromCloudinary(publicIds) {
  // Optional: implement deletion if needed
  return [];
}

export { cloudinary };
