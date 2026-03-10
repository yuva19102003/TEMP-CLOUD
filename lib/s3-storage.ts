import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// S3 Client configuration using your Supabase storage credentials
const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINTS!,
  region: process.env.REGION!,
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
  },
  forcePathStyle: true, // Required for Supabase S3 compatibility
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME!

export interface S3UploadResult {
  success: boolean
  filePath?: string
  error?: string
}

export interface S3DownloadResult {
  success: boolean
  url?: string
  error?: string
}

// Upload file to S3-compatible storage
export const uploadFileToS3 = async (
  file: File,
  fileName: string
): Promise<S3UploadResult> => {
  try {
    console.log('Uploading to S3:', {
      bucket: BUCKET_NAME,
      fileName,
      endpoint: process.env.S3_ENDPOINTS,
      region: process.env.REGION
    })

    const filePath = `temp-files/${fileName}`
    
    // Convert File to ArrayBuffer for S3 upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = new Uint8Array(arrayBuffer)
    
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
      Body: buffer,
      ContentType: file.type,
      ContentLength: file.size,
    })

    const result = await s3Client.send(uploadCommand)
    console.log('S3 Upload Success:', result)
    
    return { success: true, filePath }
  } catch (error) {
    console.error('S3 Upload Error:', error)
    return { success: false, error: `Failed to upload file to storage: ${error}` }
  }
}

// Generate signed URL for file download
export const getDownloadUrl = async (
  filePath: string,
  expiresIn: number = 300 // 5 minutes default
): Promise<S3DownloadResult> => {
  try {
    console.log('Generating download URL for:', filePath)
    
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
    })

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn })
    console.log('Generated signed URL successfully')
    
    return { success: true, url: signedUrl }
  } catch (error) {
    console.error('S3 Download URL Error:', error)
    return { success: false, error: 'Failed to generate download URL' }
  }
}

// Delete file from S3-compatible storage
export const deleteFileFromS3 = async (filePath: string): Promise<boolean> => {
  try {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: filePath,
    })

    await s3Client.send(deleteCommand)
    return true
  } catch (error) {
    console.error('S3 Delete Error:', error)
    return false
  }
}

// Batch delete multiple files
export const deleteMultipleFiles = async (filePaths: string[]): Promise<number> => {
  let deletedCount = 0
  
  for (const filePath of filePaths) {
    const success = await deleteFileFromS3(filePath)
    if (success) deletedCount++
  }
  
  return deletedCount
}