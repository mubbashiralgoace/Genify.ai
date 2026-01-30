import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { prompt, model = "flux", width = 1024, height = 1024 } = await request.json();
    
    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    console.log('🎯 Generating AI image for prompt:', prompt);

    // Option 1: Try Hugging Face (if token available)
    const HF_TOKEN = process.env.HUGGINGFACE_API_TOKEN;
    
    if (HF_TOKEN && HF_TOKEN !== "your-token-here") {
      console.log('🤗 Trying Hugging Face first...');
      
      const endpoints = [
        "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell",
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5"
      ];

      for (const endpoint of endpoints) {
        try {
          const hfResponse = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${HF_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              inputs: prompt,
              parameters: {
                width: Math.min(width, 1024),
                height: Math.min(height, 1024),
              }
            })
          });

          if (hfResponse.ok) {
            const imageBlob = await hfResponse.blob();
            if (imageBlob.size > 1000) {
              const imageBuffer = await imageBlob.arrayBuffer();
              const base64Image = Buffer.from(imageBuffer).toString('base64');
              const imageUrl = `data:image/png;base64,${base64Image}`;
              
              console.log('✅ Hugging Face success');
              return NextResponse.json({ 
                imageUrl: imageUrl,
                model: "Hugging Face AI",
                prompt: prompt,
                source: "Hugging Face",
                success: true
              });
            }
          }
        } catch (error) {
          console.log('⚠️ HF endpoint failed, trying next...');
          continue;
        }
      }
      
      console.log('⚠️ All Hugging Face models failed, using free alternative...');
    }

    // Option 2: Use Pollinations AI (completely free, no API key needed)
    try {
      console.log('🌸 Using Pollinations AI...');
      
      // Try different Pollinations endpoints
      const pollinationsEndpoints = [
        `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=flux&nologo=true&enhance=true&seed=${Math.floor(Math.random() * 1000000)}`,
        `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&model=turbo&nologo=true&enhance=true&seed=${Math.floor(Math.random() * 1000000)}`,
        `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${width}&height=${height}&nologo=true&enhance=true&seed=${Math.floor(Math.random() * 1000000)}`
      ];

      for (const pollinationsUrl of pollinationsEndpoints) {
        try {
          // Create AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
          
          const testResponse = await fetch(pollinationsUrl, { 
            method: 'GET', // Changed to GET instead of HEAD
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
          if (testResponse.ok) {
            // Check if response is actually an image
            const contentType = testResponse.headers.get('content-type');
            if (contentType && contentType.startsWith('image/')) {
              console.log('✅ Pollinations AI success with valid image');
              return NextResponse.json({ 
                imageUrl: pollinationsUrl,
                model: "Pollinations AI",
                prompt: prompt,
                source: "Pollinations AI",
                success: true
              });
            } else {
              console.log('⚠️ Pollinations returned non-image content, trying next endpoint...');
              continue;
            }
          }
        } catch (fetchError) {
          console.log('⚠️ Pollinations endpoint failed, trying next...');
          continue;
        }
      }
      
      console.log('⚠️ All Pollinations endpoints failed');
    } catch (pollError) {
      console.log('⚠️ Pollinations failed completely, trying next...');
    }

    // Option 3: Use DeepAI (free tier with quickstart key)
    try {
      console.log('🎨 Trying DeepAI...');
      
      const deepaiResponse = await fetch('https://api.deepai.org/api/text2img', {
        method: 'POST',
        headers: {
          'Api-Key': 'quickstart-QUdJIGlzIGNvbWluZy4uLi4K', // Free quickstart key
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: prompt
        })
      });

      if (deepaiResponse.ok) {
        const deepaiData = await deepaiResponse.json();
        if (deepaiData.output_url) {
          console.log('✅ DeepAI success');
          return NextResponse.json({ 
            imageUrl: deepaiData.output_url,
            model: "DeepAI Text2Image",
            prompt: prompt,
            source: "DeepAI",
            success: true
          });
        }
      }
    } catch (deepaiError) {
      console.log('⚠️ DeepAI failed, using final fallback...');
    }

    // Final Option: Generate a colorful placeholder that looks AI-generated
    console.log('🎭 Generating colorful placeholder...');
    
    // Create a unique seed from the prompt
    const seed = prompt.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
    
    // Use Picsum with vibrant colors (remove grayscale)
    const placeholderUrl = `https://picsum.photos/seed/${seed}/${width}/${height}`;
    
    return NextResponse.json({ 
      imageUrl: placeholderUrl,
      model: "Colorful Placeholder",
      prompt: prompt,
      source: "Fallback",
      message: "AI services unavailable - showing colorful placeholder",
      isPlaceholder: true
    });

  } catch (error) {
    console.error('❌ Error generating image:', error);
    
    // Emergency fallback
    const safePrompt = String(prompt || 'AI Image');
    const shortPrompt = safePrompt.length > 20 ? safePrompt.slice(0, 20) + '...' : safePrompt;
    const emergencyUrl = `https://via.placeholder.com/1024x1024/6366f1/ffffff?text=${encodeURIComponent('AI Image: ' + shortPrompt)}`;
    
    return NextResponse.json({ 
      imageUrl: emergencyUrl,
      message: "Error: " + (error instanceof Error ? error.message : 'Unknown error'),
      isError: true
    });
  }
}