import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    console.log('Getting image URL from LongCat API for prompt:', prompt);

    const API_URL = "https://longcat.chat/api/v1/chat-completion"
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
    console.log('LongCat API response received for URL extraction');

    // Extract image URLs from the response using regex
    const urlMatches = [...data.matchAll(/"url":"(https:[^"]+)"/g)];
    const imageUrls = urlMatches.map(match => match[1]);

    console.log('Extracted image URLs:', imageUrls);

    if (imageUrls.length === 0) {
      throw new Error('No image URLs found in response');
    }

    // Return the first image URL
    return NextResponse.json({ 
      imageUrl: imageUrls[0],
      allUrls: imageUrls 
    });

  } catch (error) {
    console.error('Error getting image URL:', error);
    return NextResponse.json(
      { error: 'Failed to get image URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}