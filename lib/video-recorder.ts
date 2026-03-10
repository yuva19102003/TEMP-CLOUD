'use client'

import { supabase } from './supabase'

export interface RecordingOptions {
  videoBitsPerSecond?: number
  audioBitsPerSecond?: number
  mimeType?: string
}

export interface RecordingMetadata {
  id: string
  roomId: string
  title: string
  duration: number
  fileSize: number
  thumbnailUrl?: string
  createdAt: Date
  hostName: string
}

class VideoRecorderService {
  private mediaRecorder: MediaRecorder | null = null
  private recordedChunks: Blob[] = []
  private isRecording = false
  private startTime: number = 0
  private stream: MediaStream | null = null

  async startRecording(
    stream: MediaStream, 
    roomId: string, 
    hostName: string,
    options: RecordingOptions = {},
    recordingType: 'camera' | 'screen' | 'combined' = 'camera'
  ): Promise<boolean> {
    try {
      if (this.isRecording) {
        console.warn('Recording already in progress')
        return false
      }

      this.stream = stream
      this.recordedChunks = []

      // Default recording options based on type
      const defaultOptions: RecordingOptions = {
        videoBitsPerSecond: recordingType === 'combined' ? 4000000 : 2500000, // Higher bitrate for combined
        audioBitsPerSecond: 128000,
        mimeType: 'video/webm;codecs=vp9,opus'
      }

      const recordingOptions = { ...defaultOptions, ...options }

      // Check if the browser supports the preferred codec
      if (!MediaRecorder.isTypeSupported(recordingOptions.mimeType!)) {
        // Fallback to a more widely supported format
        recordingOptions.mimeType = 'video/webm'
        if (!MediaRecorder.isTypeSupported(recordingOptions.mimeType)) {
          recordingOptions.mimeType = 'video/mp4'
        }
      }

      this.mediaRecorder = new MediaRecorder(stream, recordingOptions)

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data)
        }
      }

      this.mediaRecorder.onstop = async () => {
        await this.saveRecording(roomId, hostName, recordingType)
      }

      this.mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event)
        this.isRecording = false
      }

      this.startTime = Date.now()
      this.mediaRecorder.start(1000) // Collect data every second
      this.isRecording = true

      console.log(`🎥 Recording started (${recordingType} mode)`)
      return true

    } catch (error) {
      console.error('Failed to start recording:', error)
      return false
    }
  }

  stopRecording(): Promise<RecordingMetadata | null> {
    return new Promise((resolve) => {
      if (!this.isRecording || !this.mediaRecorder) {
        resolve(null)
        return
      }

      this.mediaRecorder.onstop = async () => {
        const metadata = await this.saveRecording('', '')
        resolve(metadata)
      }

      this.mediaRecorder.stop()
      this.isRecording = false
      console.log('🛑 Recording stopped')
    })
  }

  private async saveRecording(roomId: string, hostName: string, recordingType: string = 'camera'): Promise<RecordingMetadata | null> {
    try {
      if (this.recordedChunks.length === 0) {
        console.warn('No recorded data to save')
        return null
      }

      // Create blob from recorded chunks
      const blob = new Blob(this.recordedChunks, { 
        type: this.mediaRecorder?.mimeType || 'video/webm' 
      })

      const duration = Math.floor((Date.now() - this.startTime) / 1000)
      const recordingId = `recording_${roomId}_${Date.now()}`
      const fileName = `${recordingId}.webm`
      
      // Create title based on recording type
      const typeLabel = recordingType === 'combined' ? 'Screen + Camera' : 
                       recordingType === 'screen' ? 'Screen Share' : 'Camera'
      const title = `${typeLabel} Recording - ${new Date().toLocaleDateString()}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('temp-cloud')
        .upload(`recordings/${fileName}`, blob, {
          contentType: blob.type,
          upsert: false
        })

      if (uploadError) {
        console.error('Failed to upload recording:', uploadError)
        return null
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('temp-cloud')
        .getPublicUrl(`recordings/${fileName}`)

      // Generate thumbnail (optional)
      const thumbnailUrl = await this.generateThumbnail(blob)

      // Save metadata to database
      const metadata: RecordingMetadata = {
        id: recordingId,
        roomId,
        title,
        duration,
        fileSize: blob.size,
        thumbnailUrl,
        createdAt: new Date(),
        hostName
      }

      const { error: dbError } = await supabase
        .from('stream_recordings')
        .insert({
          id: recordingId,
          room_id: roomId,
          title: metadata.title,
          file_path: uploadData.path,
          file_url: urlData.publicUrl,
          duration: duration,
          file_size: blob.size,
          thumbnail_url: thumbnailUrl,
          host_name: hostName,
          recording_type: recordingType,
          created_at: new Date().toISOString()
        })

      if (dbError) {
        console.error('Failed to save recording metadata:', dbError)
        return null
      }

      console.log('✅ Recording saved successfully:', metadata)
      return metadata

    } catch (error) {
      console.error('Error saving recording:', error)
      return null
    }
  }

  private async generateThumbnail(videoBlob: Blob): Promise<string | undefined> {
    try {
      return new Promise((resolve) => {
        const video = document.createElement('video')
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        video.onloadedmetadata = () => {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          
          video.currentTime = Math.min(5, video.duration / 2) // Thumbnail at 5s or middle
        }

        video.onseeked = () => {
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            canvas.toBlob((blob) => {
              if (blob) {
                const thumbnailUrl = URL.createObjectURL(blob)
                resolve(thumbnailUrl)
              } else {
                resolve(undefined)
              }
            }, 'image/jpeg', 0.8)
          } else {
            resolve(undefined)
          }
        }

        video.onerror = () => resolve(undefined)
        video.src = URL.createObjectURL(videoBlob)
        video.load()
      })
    } catch (error) {
      console.error('Failed to generate thumbnail:', error)
      return undefined
    }
  }

  async getRecordings(roomId?: string): Promise<RecordingMetadata[]> {
    try {
      let query = supabase
        .from('stream_recordings')
        .select('*')
        .order('created_at', { ascending: false })

      if (roomId) {
        query = query.eq('room_id', roomId)
      }

      const { data, error } = await query

      if (error) {
        console.error('Failed to fetch recordings:', error)
        return []
      }

      return data.map(record => ({
        id: record.id,
        roomId: record.room_id,
        title: record.title,
        duration: record.duration,
        fileSize: record.file_size,
        thumbnailUrl: record.thumbnail_url,
        createdAt: new Date(record.created_at),
        hostName: record.host_name
      }))

    } catch (error) {
      console.error('Error fetching recordings:', error)
      return []
    }
  }

  async deleteRecording(recordingId: string): Promise<boolean> {
    try {
      // Get recording info first
      const { data: recording, error: fetchError } = await supabase
        .from('stream_recordings')
        .select('file_path')
        .eq('id', recordingId)
        .single()

      if (fetchError || !recording) {
        console.error('Recording not found:', fetchError)
        return false
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('temp-cloud')
        .remove([recording.file_path])

      if (storageError) {
        console.error('Failed to delete file from storage:', storageError)
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('stream_recordings')
        .delete()
        .eq('id', recordingId)

      if (dbError) {
        console.error('Failed to delete recording from database:', dbError)
        return false
      }

      console.log('✅ Recording deleted successfully')
      return true

    } catch (error) {
      console.error('Error deleting recording:', error)
      return false
    }
  }

  isCurrentlyRecording(): boolean {
    return this.isRecording
  }

  getRecordingDuration(): number {
    if (!this.isRecording) return 0
    return Math.floor((Date.now() - this.startTime) / 1000)
  }

  // Utility function to format duration
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  // Utility function to format file size
  static formatFileSize(bytes: number): string {
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }
}

export const videoRecorder = new VideoRecorderService()
export default videoRecorder