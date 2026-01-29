import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    console.log('Calling LongCat API with prompt:', prompt);

    const API_URL = "https://longcat.chat/api/v1/chat-completion";
    const payload = {
      agentId: "genImage",
      content: prompt,
      conversationId: "6a099a5e-fa80-4cb5-8de7-611f292c23cc",
      creationParam: { width: 2, height: 3, style: "" },
      files: [],
      parentMessageId: 0,
      reasonEnabled: 0,
      searchEnabled: 0
    };

    const headers = {
      "Content-Type": "application/json",
      "Accept": "text/event-stream,application/json",
      "Accept-Encoding": "gzip, deflate, br, zstd",
      "Accept-Language": "en-US,en;q=0.9",
      "m-appkey": "fe_com.sankuai.friday.fe.longcat",
      "Cookie": "_lxsdk_cuid=19b68f61132c8-05455fd2a22c2c8-26061a51-1fa400-19b68f61132c8; passport_token_key=AgXrI8Y6cdraj-M2G7sprtcoI-ZqSMEZMvGg0VLhz7rmZL8UqaCr6WuOgjROgMgJWqqsfbi0HPgADAAAAADTBAAAEuGqZ2GHd7jiUOrERnmnqKmPErbffpct29jtowbpANYuf7H-BYA9aSPiQGtxxqE3; long_cat_region_key=2; com.sankuai.friday.fe.longcat_strategy=; _lxsdk_s=19c0434c3ee-522-96c-f0%7C%7C8"
    };

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`LongCat API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.text();
    console.log('LongCat API response received, length:', data.length);

    // Extract image URLs from the response using regex
    const urlMatches = [...data.matchAll(/"url":"(https:[^"]+)"/g)];
    const imageUrls = urlMatches.map(match => match[1]);

    console.log('Extracted image URLs:', imageUrls);

    if (imageUrls.length === 0) {
      throw new Error('No image URLs found in response');
    }

    const originalImageUrl = imageUrls[0];
    
    // Save to database with the original URL
    try {
      const supabase = createSupabaseServiceClient();
      const mockUserId = "00000000-0000-0000-0000-000000000000";
      
      const { data: savedImage, error: dbError } = await supabase
        .from('generated_images')
        .insert({
          user_id: mockUserId,
          prompt: prompt.trim(),
          image_url: originalImageUrl, // Store original URL
          liked: false
        })
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
      } else {
        console.log('✅ Image saved to database with original URL:', savedImage);
      }
    } catch (dbSaveError) {
      console.error('Error saving to database:', dbSaveError);
    }
    
    // Fetch the actual image and return it as blob for display
    const imageResponse = await fetch(originalImageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    const imageBlob = await imageResponse.blob();
    console.log('Image blob received:', imageBlob.size, 'bytes');
    
    return new Response(imageBlob, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'X-Original-URL': originalImageUrl, // Include original URL in header
      },
    });

  } catch (error) {
    console.error('LongCat image generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}