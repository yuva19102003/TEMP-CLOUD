import { supabase, generateShareCode } from './supabase'
import { uploadFileToS3, getDownloadUrl } from './s3-storage'
import { uploadFileToSupabase, getSupabaseDownloadUrl } from './storage-fallback'

export interface FileUploadResult {
  success: boolean
  shareCode?: string
  error?: string
}

export interface FileShareData {
  id: string
  share_code: string
  file_name: string
  file_size: number
  file_type: string
  file_path: string
  download_count: number
  max_downloads: number | null
  expires_at: string | null
  created_at: string
}

// Upload file with fallback strategy
export const uploadFile = async (
  file: File,
  maxDownloads?: number,
  expiryHours?: number
): Promise<FileUploadResult> => {
  try {
    const shareCode = generateShareCode()
    const fileName = `${shareCode}_${file.name}`

    console.log('Starting file upload:', { fileName, size: file.size, type: file.type })

    // Try Supabase standard client first (more reliable)
    let uploadResult = await uploadFileToSupabase(file, fileName)
    
    // If that fails, try S3 approach
    if (!uploadResult.success) {
      console.log('Supabase upload failed, trying S3 approach...')
      uploadResult = await uploadFileToS3(file, fileName)
    }

    if (!uploadResult.success || !uploadResult.filePath) {
      return { success: false, error: uploadResult.error || 'Upload failed' }
    }

    // Calculate expiry date
    let expiresAt = null
    if (expiryHours) {
      expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString()
    }

    console.log('Creating database record...')

    // Create database record
    const { error: dbError } = await supabase
      .from('file_shares')
      .insert({
        share_code: shareCode,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        file_path: uploadResult.filePath,
        max_downloads: maxDownloads,
        expires_at: expiresAt,
      })

    if (dbError) {
      console.error('Database Error:', dbError)
      return { success: false, error: `Database error: ${dbError.message}` }
    }

    console.log('Upload completed successfully!')
    return { success: true, shareCode }
  } catch (error) {
    console.error('Upload Error:', error)
    return { success: false, error: `Upload failed: ${error}` }
  }
}

// Get file share data by code
export const getFileByCode = async (shareCode: string): Promise<FileShareData | null> => {
  try {
    console.log('Looking up file by code:', shareCode)
    
    const { data, error } = await supabase
      .from('file_shares')
      .select('*')
      .eq('share_code', shareCode.toUpperCase())
      .single()

    if (error || !data) {
      console.error('Database lookup error:', error)
      return null
    }

    // Check if file has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      console.log('File has expired')
      return null
    }

    // Check if download limit reached
    if (data.max_downloads && data.download_count >= data.max_downloads) {
      console.log('Download limit reached')
      return null
    }

    return data
  } catch (error) {
    console.error('Get File Error:', error)
    return null
  }
}

// Download file with fallback strategy
export const downloadFile = async (shareCode: string): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    const fileData = await getFileByCode(shareCode)
    
    if (!fileData) {
      return { success: false, error: 'File not found or expired' }
    }

    console.log('Generating download URL for:', fileData.file_path)

    // Try Supabase standard client first
    let downloadResult = await getSupabaseDownloadUrl(fileData.file_path, 300)
    
    // If that fails, try S3 approach
    if (!downloadResult.success) {
      console.log('Supabase download failed, trying S3 approach...')
      downloadResult = await getDownloadUrl(fileData.file_path, 300)
    }

    if (!downloadResult.success || !downloadResult.url) {
      return { success: false, error: downloadResult.error || 'Failed to generate download link' }
    }

    // Increment download count
    const { error: updateError } = await supabase
      .from('file_shares')
      .update({ download_count: fileData.download_count + 1 })
      .eq('share_code', shareCode.toUpperCase())

    if (updateError) {
      console.error('Update Error:', updateError)
      // Still return the download URL even if count update fails
    }

    return { success: true, url: downloadResult.url }
  } catch (error) {
    console.error('Download Error:', error)
    return { success: false, error: `Download failed: ${error}` }
  }
}

// Clean up expired files (this would typically run as a cron job)
export const cleanupExpiredFiles = async () => {
  try {
    const { data: expiredFiles } = await supabase
      .from('file_shares')
      .select('*')
      .or(`expires_at.lt.${new Date().toISOString()},and(max_downloads.not.is.null,download_count.gte.max_downloads)`)

    if (expiredFiles && expiredFiles.length > 0) {
      // Delete database records first
      const expiredIds = expiredFiles.map(file => file.id)
      await supabase
        .from('file_shares')
        .delete()
        .in('id', expiredIds)

      console.log(`Cleaned up ${expiredFiles.length} expired file records`)
    }
  } catch (error) {
    console.error('Cleanup failed:', error)
  }
}