"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Image as ImageIcon,
  Wand2,
  Download,
  Share2,
  Heart,
  Sparkles,
  Zap,
  Clock,
  Grid3X3,
  Maximize,
  RotateCcw,
  RefreshCw,
  Star,
  Trash2,
  Search,
  Plus,
  Camera,
  Layers,
  Brush,
} from "lucide-react";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  createdAt: string;
  liked: boolean;
  isGenerating?: boolean;
  error?: string;
  user_id?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export default function DashboardPage() {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [activeTab, setActiveTab] = useState("generate");
  const [searchQuery, setSearchQuery] = useState("");

  // Load images from database
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
            user_id: string;
          }) => ({
            id: img.id,
            url: img.image_url,
            prompt: img.prompt,
            createdAt: img.created_at,
            liked: img.liked,
            user_id: img.user_id
          }));
          setGeneratedImages(transformedImages);
        } else {
          console.error('Failed to load images');
          // Keep mock data as fallback
          const mockImages: GeneratedImage[] = [
            {
              id: "1",
              url: "/api/placeholder/512/512",
              prompt: "A futuristic cityscape at sunset with flying cars",
              createdAt: "2024-01-20T10:30:00Z",
              liked: true,
            },
            {
              id: "2",
              url: "/api/placeholder/512/512",
              prompt: "Abstract digital art with vibrant colors and geometric shapes",
              createdAt: "2024-01-20T09:15:00Z",
              liked: false,
            },
          ];
          setGeneratedImages(mockImages);
        }
      } catch (error) {
        console.error('Error loading images:', error);
      }
    };

    loadImages();
  }, []);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    
    // Create a temporary image entry
    const tempImage: GeneratedImage = {
      id: Date.now().toString(),
      url: "",
      prompt: prompt,
      createdAt: new Date().toISOString(),
      liked: false,
      isGenerating: true,
    };

    setGeneratedImages(prev => [tempImage, ...prev]);

    try {
      // Use our Next.js API route to avoid CORS issues
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt: prompt.trim()
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${res.status} ${res.statusText}`);
      }

      const blob = await res.blob();
      const imageUrl = URL.createObjectURL(blob);
      
      // Save to database and storage
      try {
        // Create FormData to send the blob to our upload API
        const formData = new FormData();
        formData.append('image', blob, 'generated-image.jpg');
        formData.append('prompt', prompt.trim());
        
        const saveResponse = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData, // Send as FormData, not JSON
        });

        if (saveResponse.ok) {
          const saveData = await saveResponse.json();
          // Update with database record, use the Supabase storage URL
          setGeneratedImages(prev => 
            prev.map(img => 
              img.id === tempImage.id 
                ? { 
                    ...saveData.image,
                    url: saveData.image.url, // Use Supabase storage URL
                    isGenerating: false 
                  }
                : img
            )
          );
        } else {
          // If save fails, still show the image with blob URL
          setGeneratedImages(prev => 
            prev.map(img => 
              img.id === tempImage.id 
                ? { ...img, url: imageUrl, isGenerating: false }
                : img
            )
          );
          console.error('Failed to save image to storage');
        }
      } catch (saveError) {
        console.error('Error saving image:', saveError);
        // Still show the image even if save fails
        setGeneratedImages(prev => 
          prev.map(img => 
            img.id === tempImage.id 
              ? { ...img, url: imageUrl, isGenerating: false }
              : img
          )
        );
      }

      // Clear the prompt after successful generation
      setPrompt("");
      
    } catch (error) {
      console.error("Error generating image:", error);
      
      // Update the image with error state instead of removing it
      setGeneratedImages(prev => 
        prev.map(img => 
          img.id === tempImage.id 
            ? { 
                ...img, 
                isGenerating: false, 
                error: error instanceof Error ? error.message : 'Unknown error occurred'
              }
            : img
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleLike = async (id: string) => {
    // Optimistic update
    const currentImage = generatedImages.find(img => img.id === id);
    if (!currentImage) return;

    const newLikedState = !currentImage.liked;
    
    setGeneratedImages(prev =>
      prev.map(img =>
        img.id === id ? { ...img, liked: newLikedState } : img
      )
    );

    // Update in database
    try {
      const response = await fetch(`/api/images/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ liked: newLikedState }),
      });

      if (!response.ok) {
        // Revert on failure
        setGeneratedImages(prev =>
          prev.map(img =>
            img.id === id ? { ...img, liked: currentImage.liked } : img
          )
        );
        console.error('Failed to update like status');
      }
    } catch (error) {
      // Revert on error
      setGeneratedImages(prev =>
        prev.map(img =>
          img.id === id ? { ...img, liked: currentImage.liked } : img
        )
      );
      console.error('Error updating like status:', error);
    }
  };

  const deleteImage = async (id: string) => {
    const imageToDelete = generatedImages.find(img => img.id === id);
    if (!imageToDelete) return;

    // Optimistic update - remove from UI immediately
    setGeneratedImages(prev => prev.filter(img => img.id !== id));

    // Clean up blob URL
    if (imageToDelete.url && imageToDelete.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageToDelete.url);
    }

    // Delete from database
    try {
      const response = await fetch(`/api/images/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        // Revert on failure
        setGeneratedImages(prev => [...prev, imageToDelete].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
        console.error('Failed to delete image from database');
      }
    } catch (error) {
      // Revert on error
      setGeneratedImages(prev => [...prev, imageToDelete].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
      console.error('Error deleting image:', error);
    }
  };

  const downloadImage = async (image: GeneratedImage) => {
    if (!image.url) return;
    
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ai-generated-${image.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Failed to download image');
    }
  };

  const shareImage = async (image: GeneratedImage) => {
    if (!image.url) return;
    
    try {
      if (navigator.share) {
        // Use native sharing if available
        const response = await fetch(image.url);
        const blob = await response.blob();
        const file = new File([blob], `ai-generated-${image.id}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: 'AI Generated Image',
          text: image.prompt,
          files: [file]
        });
      } else {
        // Fallback: copy image URL to clipboard
        await navigator.clipboard.writeText(image.url);
        alert('Image URL copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing image:', error);
      alert('Failed to share image');
    }
  };

  const retryGeneration = async (imageId: string) => {
    const imageToRetry = generatedImages.find(img => img.id === imageId);
    if (!imageToRetry) return;

    // Update image to show it's generating again
    setGeneratedImages(prev => 
      prev.map(img => 
        img.id === imageId 
          ? { ...img, isGenerating: true, error: undefined }
          : img
      )
    );

    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          prompt: imageToRetry.prompt
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${res.status} ${res.statusText}`);
      }

      const blob = await res.blob();
      const imageUrl = URL.createObjectURL(blob);

      setGeneratedImages(prev => 
        prev.map(img => 
          img.id === imageId 
            ? { ...img, url: imageUrl, isGenerating: false, error: undefined }
            : img
        )
      );
      
    } catch (error) {
      console.error("Error retrying image generation:", error);
      
      setGeneratedImages(prev => 
        prev.map(img => 
          img.id === imageId 
            ? { 
                ...img, 
                isGenerating: false, 
                error: error instanceof Error ? error.message : 'Unknown error'
              }
            : img
        )
      );
    }
  };

  const filteredImages = generatedImages.filter(img => {
    const matchesSearch = img.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6" style={{ position: 'relative', zIndex: 1 }}>
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 p-8 text-white shadow-2xl border border-white/10">
        {/* Animated background elements */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-40 w-40 rounded-full bg-gradient-to-br from-pink-400/20 to-purple-600/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 -mb-6 -ml-6 h-32 w-32 rounded-full bg-gradient-to-tr from-blue-400/20 to-indigo-600/20 blur-2xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-24 w-24 rounded-full bg-gradient-to-r from-yellow-400/10 to-orange-500/10 blur-xl animate-pulse delay-500" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-r from-yellow-400 to-orange-500 shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-indigo-200 text-sm font-medium tracking-wide uppercase">
                AI Image Generation Studio
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1 w-8 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full"></div>
                <div className="h-1 w-4 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full"></div>
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent">
            Create Stunning Images with AI
          </h1>
          <p className="text-indigo-100 max-w-2xl text-lg leading-relaxed">
            Transform your imagination into breathtaking visuals using cutting-edge AI models. 
            Generate, customize, and manage your creative masterpieces with professional tools.
          </p>
          <div className="flex items-center gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm text-indigo-200">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>AI Models Active</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-indigo-200">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span>High-Speed Generation</span>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-slate-700 group-hover:text-purple-700 transition-colors">
              Images Generated
            </CardTitle>
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <ImageIcon className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-slate-900 mb-2 group-hover:text-purple-900 transition-colors">
              {generatedImages.length}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <Zap className="h-3 w-3" />
                <span>Total creations</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-rose-50 to-pink-50 hover:from-rose-100 hover:to-pink-100 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-rose-600/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-slate-700 group-hover:text-rose-700 transition-colors">
              Liked Images
            </CardTitle>
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Heart className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-slate-900 mb-2 group-hover:text-rose-900 transition-colors">
              {generatedImages.filter(img => img.liked).length}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                <Star className="h-3 w-3" />
                <span>Favorites saved</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-cyan-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">
              AI Models
            </CardTitle>
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Layers className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-slate-900 mb-2 group-hover:text-blue-900 transition-colors">
              1
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                <Brush className="h-3 w-3" />
                <span>Stable Diffusion XL</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-gradient-to-br from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 to-teal-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardHeader className="flex flex-row items-center justify-between pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-slate-700 group-hover:text-emerald-700 transition-colors">
              This Month
            </CardTitle>
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-4xl font-bold text-slate-900 mb-2 group-hover:text-emerald-900 transition-colors">
              {generatedImages.filter(img => {
                const imgDate = new Date(img.createdAt);
                const now = new Date();
                return imgDate.getMonth() === now.getMonth() && imgDate.getFullYear() === now.getFullYear();
              }).length}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                <Camera className="h-3 w-3" />
                <span>Recent images</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <div className="flex justify-center">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100/80 backdrop-blur-sm p-1 rounded-2xl shadow-lg border border-white/20">
            <TabsTrigger 
              value="generate" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-purple-600 transition-all duration-300"
            >
              <Wand2 className="h-4 w-4" />
              <span className="hidden sm:inline">Generate</span>
            </TabsTrigger>
            <TabsTrigger 
              value="gallery" 
              className="flex items-center gap-2 rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-purple-600 transition-all duration-300"
            >
              <Grid3X3 className="h-4 w-4" />
              <span className="hidden sm:inline">Gallery</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Simplified Generate Tab - Only Prompt */}
        <TabsContent value="generate" className="space-y-8">
          <div className="max-w-4xl mx-auto">
            {/* Single Generation Panel */}
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-white to-slate-50/50 backdrop-blur-sm overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5" />
              <CardHeader className="relative z-10 pb-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg">
                    <Wand2 className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-slate-900">Create AI Image</CardTitle>
                    <CardDescription className="text-slate-600">
                      Describe your vision and watch AI bring it to life
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 relative z-10">
                <div className="space-y-3">
                  <Label htmlFor="prompt" className="text-sm font-semibold text-slate-700">
                    Describe Your Image
                  </Label>
                  <div className="relative">
                    <Textarea
                      id="prompt"
                      placeholder="A majestic dragon soaring through clouds above a mystical mountain range, golden hour lighting, cinematic composition, highly detailed digital art..."
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[120px] resize-none border-2 border-slate-200 focus:border-purple-400 rounded-2xl p-4 text-slate-700 placeholder:text-slate-400 bg-white/80 backdrop-blur-sm shadow-inner transition-all duration-300"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-slate-400">
                      {prompt.length}/500
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                    <Sparkles className="h-3 w-3" />
                    <span>Powered by Stable Diffusion XL - Advanced AI model for high-quality images</span>
                  </div>
                </div>

                {/* Test API Button */}
                {/* <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>Testing:</strong> If generation fails, try this test to check API connectivity:
                  </p>
                  <Button 
                    onClick={async () => {
                      try {
                        const testPrompt = "A cute cat";
                        console.log("Testing API with prompt:", testPrompt);
                        
                        // Test our Next.js API route instead of direct call
                        const res = await fetch("/api/generate-image", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ prompt: testPrompt }),
                        });
                        
                        console.log("API Response:", res.status, res.statusText);
                        
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
                          alert("✅ API Test Successful! Check the image at bottom of page.");
                        } else {
                          const errorData = await res.json().catch(() => ({}));
                          console.error("API Error:", errorData);
                          alert(`❌ API Test Failed: ${res.status} ${res.statusText}\n${JSON.stringify(errorData)}`);
                        }
                      } catch (error) {
                        console.error("Test Error:", error);
                        alert(`❌ API Test Error: ${error}`);
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                  >
                    🧪 Test API Connection
                  </Button>
                </div> */}

                <Button 
                  onClick={handleGenerate} 
                  disabled={!prompt.trim() || isGenerating}
                  className="w-full h-14 bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 text-white font-semibold rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-3 animate-spin" />
                      <span>Creating Magic...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-5 w-5 mr-3" />
                      <span>Generate Image</span>
                      <Sparkles className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Enhanced Gallery Tab */}
        <TabsContent value="gallery" className="space-y-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-purple-900 to-indigo-900 bg-clip-text text-transparent">
                Your Creative Gallery
              </h2>
              <p className="text-slate-600 text-lg">Browse and manage your AI-generated masterpieces</p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input
                  placeholder="Search your creations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 w-full sm:w-80 h-12 rounded-2xl border-2 border-slate-200 focus:border-purple-400 bg-white/80 backdrop-blur-sm shadow-lg"
                />
              </div>
            </div>
          </div>

          {filteredImages.length === 0 ? (
            <Card className="border-0 shadow-2xl bg-gradient-to-br from-slate-50 to-white overflow-hidden">
              <CardContent className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-8">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center animate-pulse">
                    <ImageIcon className="h-12 w-12 text-purple-600" />
                  </div>
                  <div className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-slate-700 mb-3">No images found</h3>
                <p className="text-slate-500 text-center max-w-md text-lg leading-relaxed mb-6">
                  {searchQuery 
                    ? "Try adjusting your search criteria to find your creations"
                    : "Your creative journey starts here! Generate your first AI masterpiece"
                  }
                </p>
                {!searchQuery && (
                  <Button 
                    onClick={() => setActiveTab("generate")} 
                    className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 hover:from-purple-700 hover:via-pink-700 hover:to-indigo-700 text-white font-semibold px-8 py-3 rounded-2xl shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create Your First Masterpiece
                    <Sparkles className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredImages.map((image) => (
                <Card key={image.id} className="group border-0 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden bg-white">
                  <div className="relative aspect-square bg-gradient-to-br from-slate-100 to-slate-200">
                    {image.isGenerating ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
                        <div className="text-center">
                          <div className="relative mb-4">
                            <RefreshCw className="h-12 w-12 text-purple-600 animate-spin mx-auto" />
                            <div className="absolute inset-0 h-12 w-12 rounded-full bg-purple-600/20 animate-ping mx-auto"></div>
                          </div>
                          <p className="text-sm font-medium text-purple-700">Creating magic...</p>
                          <div className="mt-2 w-32 h-1 bg-purple-200 rounded-full mx-auto overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-purple-600 to-pink-600 rounded-full animate-pulse"></div>
                          </div>
                        </div>
                      </div>
                    ) : image.error ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
                        <div className="text-center p-4">
                          <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                            <RefreshCw className="h-6 w-6 text-red-600" />
                          </div>
                          <p className="text-sm font-medium text-red-700 mb-2">Generation Failed</p>
                          <p className="text-xs text-red-600 mb-3 line-clamp-2">{image.error}</p>
                          <Button
                            size="sm"
                            onClick={() => retryGeneration(image.id)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1"
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Retry
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Image
                          src={image.url}
                          alt={image.prompt}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-500"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          onError={() => {
                            // Handle image load error
                            setGeneratedImages(prev => 
                              prev.map(img => 
                                img.id === image.id 
                                  ? { ...img, error: 'Failed to load image' }
                                  : img
                              )
                            );
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-10 w-10 p-0 bg-white/90 hover:bg-white backdrop-blur-sm rounded-xl shadow-lg hover:scale-110 transition-all duration-200"
                            onClick={() => setSelectedImage(image)}
                          >
                            <Maximize className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            className={`h-10 w-10 p-0 backdrop-blur-sm rounded-xl shadow-lg hover:scale-110 transition-all duration-200 ${
                              image.liked 
                                ? 'bg-red-500 hover:bg-red-600 text-white' 
                                : 'bg-white/90 hover:bg-white text-slate-700'
                            }`}
                            onClick={() => toggleLike(image.id)}
                          >
                            <Heart className={`h-4 w-4 ${image.liked ? 'fill-current' : ''}`} />
                          </Button>
                        </div>
                        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-lg">
                            <p className="text-xs font-medium text-slate-800 line-clamp-2 leading-relaxed">
                              {image.prompt}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <CardContent className="p-4 bg-gradient-to-br from-white to-slate-50/50">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <p className="text-sm text-slate-700 font-medium line-clamp-2 flex-1 leading-relaxed">
                        {image.prompt}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 flex-shrink-0 rounded-lg transition-all duration-200 z-10"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('Delete button clicked for image:', image.id);
                          deleteImage(image.id);
                        }}
                        title="Delete image"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs px-2 py-1 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border-0 rounded-lg">
                          Stable Diffusion XL
                        </Badge>
                      </div>
                      <span className="text-slate-500 font-medium">{formatDate(image.createdAt)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Image Details
            </DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="relative aspect-square bg-slate-100 rounded-lg overflow-hidden">
                <Image
                  src={selectedImage.url}
                  alt={selectedImage.prompt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-slate-700">Prompt</Label>
                  <p className="text-sm text-slate-900 mt-1 p-3 bg-slate-50 rounded-lg">
                    {selectedImage.prompt}
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Model</Label>
                    <p className="text-sm text-slate-900 mt-1">Stable Diffusion XL</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-slate-700">Created</Label>
                    <p className="text-sm text-slate-900 mt-1">{formatDate(selectedImage.createdAt)}</p>
                  </div>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button 
                    className="flex-1"
                    onClick={() => selectedImage && downloadImage(selectedImage)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => selectedImage && shareImage(selectedImage)}
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => selectedImage && toggleLike(selectedImage.id)}
                    className={selectedImage?.liked ? "text-red-600 border-red-200 bg-red-50" : ""}
                  >
                    <Heart className={`h-4 w-4 ${selectedImage?.liked ? 'fill-red-500' : ''}`} />
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      if (selectedImage) {
                        deleteImage(selectedImage.id);
                        setSelectedImage(null); // Close dialog after delete
                      }
                    }}
                    className="text-white bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}