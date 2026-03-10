import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recordingId = params.id

    // Get recording metadata from database
    const { data: recording, error } = await supabase
      .from('stream_recordings')
      .select('*')
      .eq('id', recordingId)
      .single()

    if (error || !recording) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      )
    }

    // Increment view count
    await supabase
      .from('stream_recordings')
      .update({ views: (recording.views || 0) + 1 })
      .eq('id', recordingId)

    // Get signed URL from Supabase Storage
    const { data: urlData, error: urlError } = await supabase.storage
      .from('temp-cloud')
      .createSignedUrl(recording.file_path, 3600) // 1 hour expiry

    if (urlError || !urlData) {
      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      )
    }

    // Redirect to the signed URL
    return NextResponse.redirect(urlData.signedUrl)

  } catch (error) {
    console.error('Error serving recording:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recordingId = params.id

    // Get recording info first
    const { data: recording, error: fetchError } = await supabase
      .from('stream_recordings')
      .select('file_path')
      .eq('id', recordingId)
      .single()

    if (fetchError || !recording) {
      return NextResponse.json(
        { error: 'Recording not found' },
        { status: 404 }
      )
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
      return NextResponse.json(
        { error: 'Failed to delete recording' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting recording:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}