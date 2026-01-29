import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = createSupabaseServiceClient();
    
    // For now, let's get all images without user filtering
    // In production, you'd want to filter by user_id
    const { data: images, error } = await supabase
      .from('generated_images')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      // Return mock data as fallback
      const mockImages = [
        {
          id: "mock-1",
          prompt: "A beautiful sunset over mountains",
          image_url: "/api/placeholder/512/512",
          liked: false,
          created_at: new Date().toISOString(),
          user_id: "mock-user"
        },
        {
          id: "mock-2", 
          prompt: "Abstract digital art with vibrant colors",
          image_url: "/api/placeholder/512/512",
          liked: true,
          created_at: new Date().toISOString(),
          user_id: "mock-user"
        }
      ];
      return NextResponse.json({ images: mockImages });
    }

    return NextResponse.json({ images: images || [] });

  } catch (error) {
    console.error('Error in images GET:', error);
    
    // Return mock data as fallback
    const mockImages = [
      {
        id: "mock-1",
        prompt: "A beautiful sunset over mountains",
        image_url: "/api/placeholder/512/512",
        liked: false,
        created_at: new Date().toISOString(),
        user_id: "mock-user"
      }
    ];
    return NextResponse.json({ images: mockImages });
  }
}

// POST - Save new image (simple version - mainly for fallback)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, image_url } = body;

    if (!prompt || !image_url) {
      return NextResponse.json({ error: 'Prompt and image_url are required' }, { status: 400 });
    }

    const supabase = createSupabaseServiceClient();
    
    // For now, use a mock user_id since we don't have auth
    const mockUserId = "00000000-0000-0000-0000-000000000000";
    
    const { data: savedImage, error } = await supabase
      .from('generated_images')
      .insert({
        user_id: mockUserId,
        prompt: prompt.trim(),
        image_url,
        liked: false
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      // Return mock response as fallback
      const mockImage = {
        id: `generated-${Date.now()}`,
        prompt: prompt.trim(),
        image_url,
        liked: false,
        created_at: new Date().toISOString(),
        user_id: mockUserId
      };
      return NextResponse.json({ image: mockImage });
    }

    return NextResponse.json({ image: savedImage });

  } catch (error) {
    console.error('Error in images POST:', error);
    
    // Return mock response as fallback
    const mockImage = {
      id: `generated-${Date.now()}`,
      prompt: "Mock image",
      image_url: "/api/placeholder/512/512",
      liked: false,
      created_at: new Date().toISOString(),
      user_id: "mock-user"
    };
    return NextResponse.json({ image: mockImage });
  }
}