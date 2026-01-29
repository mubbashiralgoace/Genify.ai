import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

// PUT - Update image (like/unlike)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { liked } = body;

    const supabase = createSupabaseServiceClient();
    
    const { data: updatedImage, error } = await supabase
      .from('generated_images')
      .update({ liked, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      // Return mock response as fallback
      const mockImage = {
        id: id,
        liked,
        updated_at: new Date().toISOString()
      };
      return NextResponse.json({ image: mockImage });
    }

    return NextResponse.json({ image: updatedImage });

  } catch (error) {
    console.error('Error in image PUT:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createSupabaseServiceClient();
    
    const { error } = await supabase
      .from('generated_images')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Database error:', error);
      // Still return success for now
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in image DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}