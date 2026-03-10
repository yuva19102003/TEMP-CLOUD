import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      file_shares: {
        Row: {
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
          uploader_ip: string | null
        }
        Insert: {
          id?: string
          share_code: string
          file_name: string
          file_size: number
          file_type: string
          file_path: string
          download_count?: number
          max_downloads?: number | null
          expires_at?: string | null
          created_at?: string
          uploader_ip?: string | null
        }
        Update: {
          id?: string
          share_code?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_path?: string
          download_count?: number
          max_downloads?: number | null
          expires_at?: string | null
          created_at?: string
          uploader_ip?: string | null
        }
      }
    }
  }
}

// Generate random share code
export const generateShareCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}