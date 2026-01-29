"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Wand2,
  Download,
  RefreshCw,
  Sparkles,
  Settings,
  Image as ImageIcon,
  Palette,
  Clock,
  Copy,
  RotateCcw,
} from "lucide-react";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  style: string;
  steps: number;
  seed: number;
  isGenerating?: boolean;
  error?: string;
}

export default function GeneratePage() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<GeneratedImage | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);

  // Load images from database on component mount
  useEffect(() => {
    const loadImages = async () => {
      try {
        const response = await fetch('/api/images');
        if (response.ok) {
          const data = await response.json();
          // Transform database format to component format
          const transformedImages = (data.images || []).map((img: {
            id: string;
            image_url: string;
            prompt: string;
            created_at: string;
            liked: boolean;
          }) => ({
            id: img.id,
            url: img.image_url,
            prompt: img.prompt,
            style: "default",
            steps: 20,
            seed: Math.floor(Math.random() * 1000000),
            createdAt: img.created_at,
            liked: img.liked,
          })).filter((img: {url: string}) => img.url && !img.url.startsWith('blob:')); // Filter out blob URLs
          setHistory(transformedImages.slice(0, 10)); // Keep last 10 images
        } else {
          console.error('Failed to load images from database');
        }
      } catch (error) {
        console.error('Error loading images:', error);
      }
    };

    loadImages();
  }, []);

  const promptSuggestions = [
    "A majestic dragon soaring through clouds",
    "Cyberpunk city at night with neon lights",
    "Beautiful landscape with mountains and lake",
    "Portrait of a wise old wizard",
    "Futuristic spaceship in deep space",
    "Enchanted forest with magical creatures",
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    
    const tempImage: GeneratedImage = {
      id: Date.now().toString(),
      url: "",
      prompt: prompt,
      style: "default",
      steps: 20,
      seed: Math.floor(Math.random() * 1000000),
      isGenerating: true,
    };

    setGeneratedImage(tempImage);

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt: prompt.trim() // Use original prompt without style enhancement
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${res.status} ${res.statusText}`);
      }

      const blob = await res.blob();
      const imageUrl = URL.createObjectURL(blob);
      
      // Get the original URL from response headers if available
      const originalUrl = res.headers.get('X-Original-URL');
      
      const finalImage: GeneratedImage = {
        ...tempImage,
        url: originalUrl || imageUrl, // Use original URL if available, fallback to blob
        isGenerating: false,
      };

      setGeneratedImage(finalImage);
      setHistory(prev => [finalImage, ...prev.slice(0, 9)]); // Keep last 10 images
      
    } catch (error) {
      console.error("Error generating image:", error);
      
      setGeneratedImage({
        ...tempImage,
        isGenerating: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async (image: GeneratedImage) => {
    if (!image.url) return;
    
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-generated-${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const retryGeneration = () => {
    if (generatedImage) {
      setPrompt(generatedImage.prompt);
      handleGenerate();
    }
  };

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg">
              <Wand2 className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 bg-clip-text text-transparent">
                AI Image Generator
              </h1>
              <p className="text-slate-600 text-lg">Advanced image generation with custom controls</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Controls Panel */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Generation Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Prompt */}
                <div className="space-y-3">
                  <Label htmlFor="prompt" className="text-sm font-semibold">
                    Describe Your Image
                  </Label>
                  <Textarea
                    id="prompt"
                    placeholder="A beautiful landscape with mountains..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[100px] resize-none border-2 focus:border-purple-400 rounded-xl"
                  />
                  <div className="text-xs text-slate-500">{prompt.length}/500</div>
                </div>

                {/* Generate Button */}
                <Button 
                  onClick={handleGenerate} 
                  disabled={!prompt.trim() || isGenerating}
                  className="w-full h-12 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-3 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-5 w-5 mr-3" />
                      Generate Image
                      <Sparkles className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                {/* Test API Button */}
                {/* <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-800 mb-2">
                    <strong>Testing:</strong> Test the new LongCat API:
                  </p>
                  <Button 
                    onClick={async () => {
                      try {
                        const testPrompt = "A beautiful cat sitting in a garden";
                        console.log("Testing LongCat API with prompt:", testPrompt);
                        
                        const res = await fetch("/api/generate-image", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ prompt: testPrompt }),
                        });
                        
                        console.log("LongCat API Response:", res.status, res.statusText);
                        
                        if (res.ok) {
                          const blob = await res.blob();
                          console.log("Blob received:", blob.size, "bytes");
                          
                          const img = document.createElement("img");
                          img.src = URL.createObjectURL(blob);
                          img.style.height = "200px";
                          img.style.borderRadius = "8px";
                          img.style.marginTop = "10px";
                          img.style.border = "2px solid #10b981";
                          
                          // Remove any existing test image
                          const existing = document.getElementById("test-image");
                          if (existing) existing.remove();
                          
                          img.id = "test-image";
                          document.body.appendChild(img);
                          alert("✅ LongCat API Test Successful! Check the image at bottom of page.");
                        } else {
                          const errorData = await res.json().catch(() => ({}));
                          console.error("LongCat API Error:", errorData);
                          alert(`❌ LongCat API Test Failed: ${res.status} ${res.statusText}\n${JSON.stringify(errorData)}`);
                        }
                      } catch (error) {
                        console.error("Test Error:", error);
                        alert(`❌ LongCat API Test Error: ${error}`);
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="text-blue-700 border-blue-300 hover:bg-blue-100"
                  >
                    🧪 Test LongCat API
                  </Button>
                </div> */}
              </CardContent>
            </Card>

            {/* Quick Prompts */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Quick Prompts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {promptSuggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      className="justify-start text-left h-auto p-3 rounded-xl hover:bg-purple-50"
                      onClick={() => setPrompt(suggestion)}
                    >
                      <div className="text-sm">{suggestion}</div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Generation Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Generation */}
            <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Generated Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl overflow-hidden relative">
                  {!generatedImage ? (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
                          <ImageIcon className="h-8 w-8 text-purple-600" />
                        </div>
                        <p className="text-slate-500 text-lg">Your generated image will appear here</p>
                        <p className="text-slate-400 text-sm mt-2">Enter a prompt and click generate to start</p>
                      </div>
                    </div>
                  ) : generatedImage.isGenerating ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
                      <div className="text-center">
                        <div className="relative mb-6">
                          <RefreshCw className="h-16 w-16 text-purple-600 animate-spin mx-auto" />
                          <div className="absolute inset-0 h-16 w-16 rounded-full bg-purple-600/20 animate-ping mx-auto"></div>
                        </div>
                        <p className="text-lg font-medium text-purple-700">Creating your masterpiece...</p>
                        <div className="mt-4 w-64 h-2 bg-purple-200 rounded-full mx-auto overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-pulse"></div>
                        </div>
                      </div>
                    </div>
                  ) : generatedImage.error ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
                      <div className="text-center p-6">
                        <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                          <RefreshCw className="h-8 w-8 text-red-600" />
                        </div>
                        <p className="text-lg font-medium text-red-700 mb-2">Generation Failed</p>
                        <p className="text-sm text-red-600 mb-4">{generatedImage.error}</p>
                        <Button
                          onClick={retryGeneration}
                          className="bg-red-600 hover:bg-red-700 text-white"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Retry Generation
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Image
                        src={generatedImage.url}
                        alt={generatedImage.prompt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-white/90 hover:bg-white backdrop-blur-sm"
                          onClick={() => downloadImage(generatedImage)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-white/90 hover:bg-white backdrop-blur-sm"
                          onClick={() => copyPrompt(generatedImage.prompt)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>

                {/* Image Details */}
                {generatedImage && !generatedImage.isGenerating && !generatedImage.error && (
                  <div className="mt-6 space-y-4">
                    <div className="p-4 bg-slate-50 rounded-xl">
                      <Label className="text-sm font-medium text-slate-700">Prompt</Label>
                      <p className="text-sm text-slate-900 mt-1">{generatedImage.prompt}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Generation History */}
            {history.length > 0 && (
              <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Generations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {history.map((image) => (
                      <div
                        key={image.id}
                        className="group relative aspect-square bg-slate-100 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300"
                        onClick={() => setGeneratedImage(image)}
                      >
                        <Image
                          src={image.url}
                          alt={image.prompt}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-300"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <p className="text-white text-xs font-medium line-clamp-2">
                            {image.prompt}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}