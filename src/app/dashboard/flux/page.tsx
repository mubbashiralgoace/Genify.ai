"use client";

import {useState, useEffect} from "react";
import Image from "next/image";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Badge} from "@/components/ui/badge";
import {
  Sparkles,
  Download,
  Zap,
  Clock,
  Star,
  RefreshCw,
  ImageIcon,
  Wand2,
  Rocket,
  Crown,
  CheckCircle,
} from "lucide-react";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  createdAt: string;
  model: string;
}

export default function FluxPage() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedModel, setSelectedModel] = useState("flux-schnell");

  // Load previous images from localStorage
  useEffect(() => {
    const savedImages = localStorage.getItem("flux-images");
    if (savedImages) {
      setGeneratedImages(JSON.parse(savedImages));
    }
  }, []);

  // Save images to localStorage
  const saveToStorage = (images: GeneratedImage[]) => {
    localStorage.setItem("flux-images", JSON.stringify(images));
  };

  // Generate image with Flux AI
  const generateImage = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt!");
      return;
    }

    setIsGenerating(true);

    try {
      // Using multi-source AI API
      const response = await fetch("/api/flux-generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          model: selectedModel,
          width: 1024,
          height: 1024,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.imageUrl) {
        const newImage: GeneratedImage = {
          id: Date.now().toString(),
          url: data.imageUrl,
          prompt: prompt.trim(),
          createdAt: new Date().toISOString(),
          model: data.model || selectedModel,
        };

        // Save to localStorage
        const updatedImages = [newImage, ...generatedImages];
        setGeneratedImages(updatedImages);
        saveToStorage(updatedImages);
        
        console.log("✅ Flux image generated and automatically saved to database");
      } else {
        throw new Error("No image URL received");
      }
    } catch (error) {
      console.error("❌ Error generating image:", error);
      alert("Failed to generate image. Please try again!");
    } finally {
      setIsGenerating(false);
    }
  };

  // Download image
  const downloadImage = async (imageUrl: string, prompt: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = url;
      link.download = `flux-${prompt.slice(0, 30)}-${Date.now()}.png`;
      link.click();
      
      window.URL.revokeObjectURL(url);
      console.log("✅ Image downloaded");
    } catch (error) {
      console.error("❌ Download failed:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-8 text-white shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-40 w-40 rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-600/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 -mb-6 -ml-6 h-32 w-32 rounded-full bg-gradient-to-tr from-cyan-400/20 to-blue-600/20 blur-2xl animate-pulse delay-1000" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-yellow-200 text-sm font-medium tracking-wide uppercase">
                Next-Gen AI Image Generation
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1 w-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"></div>
                <div className="h-1 w-4 bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full"></div>
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-yellow-100 to-orange-100 bg-clip-text text-transparent">
            Free AI Generator
          </h1>
          <p className="text-purple-100 max-w-2xl text-lg leading-relaxed mb-6">
            Multi-source AI image generation with automatic fallbacks and auto-save to gallery. 
            Tries Hugging Face always generates something!
          </p>

          {/* Features Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm text-green-200 bg-green-500/10 rounded-lg p-3">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>Auto-Save</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-200 bg-blue-500/10 rounded-lg p-3">
              <Zap className="h-4 w-4 text-blue-400" />
              <span>Multi-Source</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-purple-200 bg-purple-500/10 rounded-lg p-3">
              <Crown className="h-4 w-4 text-purple-400" />
              <span>Free Fallbacks</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-yellow-200 bg-yellow-500/10 rounded-lg p-3">
              <Star className="h-4 w-4 text-yellow-400" />
              <span>No Limits</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Generation Panel */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="h-5 w-5 text-purple-600" />
                Generate with Flux AI
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
        

              {/* Prompt Input */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Prompt</Label>
                <div className="relative">
                  <Input
                    placeholder="Describe the image you want to create..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="pr-12 rounded-xl border-2 focus:border-purple-400 min-h-[100px]"
                    style={{ resize: "vertical" }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.ctrlKey) {
                        generateImage();
                      }
                    }}
                  />
                  <div className="absolute bottom-2 right-2 text-xs text-slate-400">
                    Ctrl+Enter to generate
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={generateImage}
                disabled={isGenerating || !prompt.trim()}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3 rounded-xl"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Image
                  </>
                )}
              </Button>

              {/* Quick Prompts */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Quick Prompts</Label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    "A futuristic cityscape at sunset with flying cars",
                    "Portrait of a wise old wizard with glowing eyes",
                    "A magical forest with bioluminescent plants",
                    "Cyberpunk street scene with neon lights",
                    "A majestic dragon soaring through clouds"
                  ].map((quickPrompt, index) => (
                    <button
                      key={index}
                      onClick={() => setPrompt(quickPrompt)}
                      className="text-left p-2 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all text-sm"
                    >
                      {quickPrompt}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generated Images */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Generated Images ({generatedImages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {generatedImages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-10 w-10 text-purple-600" />
                  </div>
                  <p className="text-slate-600 text-xl font-semibold mb-2">
                    No images generated yet
                  </p>
                  <p className="text-slate-400 text-sm">
                    Enter a prompt and click generate to create your first Flux AI image
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {generatedImages.map((image) => (
                    <div
                      key={image.id}
                      className="group relative bg-slate-50 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <div className="aspect-square relative">
                        <Image
                          src={image.url}
                          alt={image.prompt}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          sizes="400px"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        {/* Action Buttons */}
                        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <Button
                            size="sm"
                            onClick={() => downloadImage(image.url, image.prompt)}
                            className="bg-white/90 hover:bg-white text-slate-700 shadow-lg"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Image Info */}
                      <div className="p-4">
                        <p className="text-sm font-medium text-slate-800 line-clamp-2 mb-2">
                          {image.prompt}
                        </p>
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            <span>{formatDate(image.createdAt)}</span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            Flux AI
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}