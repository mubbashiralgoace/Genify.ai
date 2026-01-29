import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServiceClient();
    
    // For now, we'll skip user authentication and use a mock user
    const mockUserId = "00000000-0000-0000-0000-000000000000";

    // Get the image blob from request
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const prompt = formData.get('prompt') as string;

    if (!imageFile || !prompt) {
      return NextResponse.json({ error: 'Image and prompt are required' }, { status: 400 });
    }

    // Generate unique filename
    const fileExt = 'jpg'; // Since our API returns JPEG
    const fileName = `${mockUserId}/${Date.now()}.${fileExt}`;

    // Try to upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('generated-images')
      .upload(fileName, imageFile, {
        contentType: 'image/jpeg',
        upsert: false
      });

    let publicUrl = '';
    
    if (uploadError) {
      console.error('Error uploading to storage:', uploadError);
      
      // If storage fails, convert to base64 and store in database
      try {
        const arrayBuffer = await imageFile.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        publicUrl = `data:image/jpeg;base64,${base64}`;
        console.log('Fallback: Using base64 data URL');
      } catch (base64Error) {
        console.error('Error creating base64:', base64Error);
        return NextResponse.json({ error: 'Failed to process image' }, { status: 500 });
      }
    } else {
      // Get public URL from Supabase Storage
      const { data: { publicUrl: storageUrl } } = supabase.storage
        .from('generated-images')
        .getPublicUrl(fileName);
      publicUrl = storageUrl;
      console.log('Success: Using Supabase storage URL');
    }

    // Save image record to database
    const { data: savedImage, error: dbError } = await supabase
      .from('generated_images')
      .insert({
        user_id: mockUserId,
        prompt: prompt.trim(),
        image_url: publicUrl,
        liked: false
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error saving to database:', dbError);
      
      // If we uploaded to storage but DB failed, try to clean up
      if (!uploadError) {
        await supabase.storage.from('generated-images').remove([fileName]);
      }
      
      return NextResponse.json({ error: 'Failed to save image record' }, { status: 500 });
    }

    return NextResponse.json({ 
      image: {
        id: savedImage.id,
        url: publicUrl,
        prompt: savedImage.prompt,
        createdAt: savedImage.created_at,
        liked: savedImage.liked
      }
    });

  } catch (error) {
    console.error('Error in upload-image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}