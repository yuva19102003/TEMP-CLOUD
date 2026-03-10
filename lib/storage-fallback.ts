import { supabase } from './supabase'

export interface FallbackUploadResult {
  success: boolean
  filePath?: string
  error?: string
}

export interface FallbackDownloadResult {
  success: boolean
  url?: string
  error?: string
}

// Fallback upload using standard Supabase client
export const uploadFileToSupabase = async (
  file: File,
  fileName: string
): Promise<FallbackUploadResult> => {
  try {
    console.log('Using Supabase fallback upload for:', fileName)
    
    const filePath = `temp-files/${fileName}`
    
    const { data, error } = await supabase.storage
      .from('temp-cloud')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      console.error('Supabase Upload Error:', error)
      return { success: false, error: error.message }
    }

    console.log('Supabase Upload Success:', data)
    return { success: true, filePath }
  } catch (error) {
    console.error('Supabase Upload Exception:', error)
    return { success: false, error: `Upload failed: ${error}` }
  }
}

// Fallback download using standard Supabase client
export const getSupabaseDownloadUrl = async (
  filePath: string,
  expiresIn: number = 300
): Promise<FallbackDownloadResult> => {
  try {
    console.log('Using Supabase fallback download for:', filePath)
    
    const { data, error } = await supabase.storage
      .from('temp-cloud')
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      console.error('Supabase Download Error:', error)
      return { success: false, error: error.message }
    }

    console.log('Supabase Download Success')
    return { success: true, url: data.signedUrl }
  } catch (error) {
    console.error('Supabase Download Exception:', error)
    return { success: false, error: `Download failed: ${error}` }
  }
}