"use client";

import {useState, useEffect, useRef} from "react";
import Image from "next/image";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Slider} from "@/components/ui/slider";
import {Badge} from "@/components/ui/badge";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {
  Edit3,
  Download,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Type,
  Palette,
  Sliders,
  Save,
  Undo,
  Grid3X3,
  Search,
  ImageIcon,
  Brush,
  Sun,
  Contrast,
  Droplets,
  Zap,
  Camera,
  RefreshCw,
} from "lucide-react";

interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  createdAt: string;
  liked: boolean;
  user_id?: string;
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

interface EditSettings {
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  grayscale: boolean;
  sepia: boolean;
}

export default function EditorPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [editSettings, setEditSettings] = useState<EditSettings>({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
    rotation: 0,
    flipX: false,
    flipY: false,
    grayscale: false,
    sepia: false,
  });
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [textOverlay, setTextOverlay] = useState("");
  const [textColor, setTextColor] = useState("#ffffff");
  const [textSize, setTextSize] = useState(24);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  // Load images from database
  useEffect(() => {
    const loadImages = async () => {
      try {
        const response = await fetch("/api/images");
        if (response.ok) {
          const data = await response.json();
          const transformedImages = (data.images || []).map((img: any) => ({
            id: img.id,
            url: img.image_url,
            prompt: img.prompt,
            createdAt: img.created_at,
            liked: img.liked,
            user_id: img.user_id,
          }));
          setImages(transformedImages);
        }
      } catch (error) {
        console.error("Error loading images:", error);
      }
    };

    loadImages();
  }, []);

  // Simple Canvas Image Loader - GUARANTEED TO WORK
  const loadImageToCanvas = (imageUrl: string) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.error("Canvas not found");
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      console.error("Canvas context not found");
      return;
    }

    setIsLoading(true);
    console.log("🎯 Loading image:", imageUrl);

    const img = new window.Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const imgWidth = img.naturalWidth || img.width;
        const imgHeight = img.naturalHeight || img.height;

        console.log("📏 Original image size:", imgWidth, "x", imgHeight);

        // Calculate canvas size to fit image properly
        const maxWidth = 900;
        const maxHeight = 700;
        
        const scaleX = maxWidth / imgWidth;
        const scaleY = maxHeight / imgHeight;
        const scale = Math.min(scaleX, scaleY, 1);

        const canvasWidth = Math.floor(imgWidth * scale);
        const canvasHeight = Math.floor(imgHeight * scale);

        // Set canvas size
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvas.style.width = canvasWidth + "px";
        canvas.style.height = canvasHeight + "px";

        setCanvasSize({ width: canvasWidth, height: canvasHeight });

        console.log("🎨 Canvas size set to:", canvasWidth, "x", canvasHeight);

        // Clear and draw image
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);

        // Store original image data
        const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
        setOriginalImageData(imageData);

        console.log("✅ Image loaded successfully");
        setIsLoading(false);
      } catch (error) {
        console.error("❌ Error loading image:", error);
        setIsLoading(false);
      }
    };

    img.onerror = (error) => {
      console.error("❌ Failed to load image:", error);
      setIsLoading(false);
    };

    img.src = imageUrl;
  };

  // Apply all edits
  const applyEdits = () => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImageData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Create temporary canvas
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.putImageData(originalImageData, 0, 0);

    // Clear main canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();

    // Apply transformations
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.translate(centerX, centerY);

    // Rotation
    if (editSettings.rotation !== 0) {
      ctx.rotate((editSettings.rotation * Math.PI) / 180);
    }

    // Flips
    ctx.scale(editSettings.flipX ? -1 : 1, editSettings.flipY ? -1 : 1);
    ctx.translate(-centerX, -centerY);

    // Build filter string
    let filterString = "";
    if (editSettings.brightness !== 100) {
      filterString += `brightness(${editSettings.brightness}%) `;
    }
    if (editSettings.contrast !== 100) {
      filterString += `contrast(${editSettings.contrast}%) `;
    }
    if (editSettings.saturation !== 100) {
      filterString += `saturate(${editSettings.saturation}%) `;
    }
    if (editSettings.blur > 0) {
      filterString += `blur(${editSettings.blur}px) `;
    }
    if (editSettings.grayscale) {
      filterString += "grayscale(100%) ";
    }
    if (editSettings.sepia) {
      filterString += "sepia(100%) ";
    }

    ctx.filter = filterString || "none";

    // Draw image
    ctx.drawImage(tempCanvas, 0, 0);

    // Add text overlay
    if (textOverlay.trim()) {
      ctx.filter = "none";
      ctx.fillStyle = textColor;
      ctx.font = `bold ${textSize}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      ctx.fillText(textOverlay, centerX, centerY);
    }

    ctx.restore();
  };

  // Reset edits
  const resetEdits = () => {
    setEditSettings({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      rotation: 0,
      flipX: false,
      flipY: false,
      grayscale: false,
      sepia: false,
    });
    setTextOverlay("");

    if (selectedImage) {
      loadImageToCanvas(selectedImage.url);
    }
  };

  // Download image
  const downloadEditedImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `edited-${selectedImage?.id || "image"}.png`;
    link.href = canvas.toDataURL("image/png", 1.0);
    link.click();
    console.log("✅ Download completed");
  };

  // Save image
  const saveEditedImage = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !selectedImage) return;

    setIsLoading(true);

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append("image", blob, `edited-${selectedImage.id}.png`);
        formData.append("prompt", `Edited: ${selectedImage.prompt}`);

        const response = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setImages((prev) => [data.image, ...prev]);
          alert("✅ Image saved successfully!");
        } else {
          alert("❌ Failed to save image");
        }

        setIsLoading(false);
      });
    } catch (error) {
      console.error("Error saving:", error);
      setIsLoading(false);
    }
  };

  // Apply edits when settings change
  useEffect(() => {
    if (selectedImage && originalImageData) {
      applyEdits();
    }
  }, [editSettings, textOverlay, textColor, textSize]);

  // Handle image selection
  const handleImageSelect = (image: GeneratedImage) => {
    console.log("🖼️ Image selected:", image.id);
    setSelectedImage(image);
    setEditSettings({
      brightness: 100,
      contrast: 100,
      saturation: 100,
      blur: 0,
      rotation: 0,
      flipX: false,
      flipY: false,
      grayscale: false,
      sepia: false,
    });
    setTextOverlay("");
    setOriginalImageData(null);
    loadImageToCanvas(image.url);
  };

  const filteredImages = images.filter((img) =>
    img.prompt.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900 via-pink-900 to-indigo-800 p-8 text-white shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 h-40 w-40 rounded-full bg-gradient-to-br from-pink-400/20 to-purple-600/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-0 -mb-6 -ml-6 h-32 w-32 rounded-full bg-gradient-to-tr from-blue-400/20 to-indigo-600/20 blur-2xl animate-pulse delay-1000" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
              <Edit3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-purple-200 text-sm font-medium tracking-wide uppercase">
                Simple Canvas Editor
              </span>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1 w-8 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full"></div>
                <div className="h-1 w-4 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full"></div>
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white via-purple-100 to-pink-100 bg-clip-text text-transparent">
            Edit Your AI Images
          </h1>
          <p className="text-purple-100 max-w-2xl text-lg leading-relaxed">
            Simple and reliable image editing with HTML5 Canvas. No complex libraries - just pure canvas power with automatic image sizing.
          </p>
          <div className="flex items-center gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm text-purple-200">
              <div className="h-2 w-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Canvas Ready</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-purple-200">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span>Auto Sizing</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-purple-200">
              <Brush className="h-4 w-4 text-blue-400" />
              <span>Real-time Filters</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:gap-6 lg:gap-8 grid-cols-1 lg:grid-cols-12">
        {/* Image Gallery Sidebar */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" />
                Your Images
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search images..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl border-2 focus:border-purple-400"
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4 max-h-[400px] md:max-h-[500px] lg:max-h-[600px] overflow-y-auto">
              {filteredImages.length === 0 ? (
                <div className="text-center py-8">
                  <ImageIcon className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-500">No images found</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-4">
                  {filteredImages.map((image) => (
                    <div
                      key={image.id}
                      className={`group relative aspect-square bg-slate-100 rounded-xl overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-300 ${
                        selectedImage?.id === image.id
                          ? "ring-4 ring-purple-500 ring-offset-2"
                          : ""
                      }`}
                      onClick={() => handleImageSelect(image)}
                    >
                      <Image
                        src={image.url}
                        alt={image.prompt}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        sizes="200px"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-white text-xs font-medium line-clamp-2">
                          {image.prompt}
                        </p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          {formatDate(image.createdAt)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Editor */}
        <div className="lg:col-span-7 space-y-4 md:space-y-6">
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <Edit3 className="h-4 w-4 md:h-5 md:w-5" />
                Canvas Editor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-6 flex items-center justify-center min-h-[500px]">
                {/* Always render canvas - hidden when no image */}
                <canvas
                  ref={canvasRef}
                  className={`border-2 border-slate-300 rounded-xl shadow-2xl bg-white max-w-full max-h-full ${
                    selectedImage ? 'block' : 'hidden'
                  }`}
                />
                
                {/* Show placeholder when no image selected */}
                {!selectedImage && (
                  <div className="text-center py-20">
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center mx-auto mb-4">
                      <Edit3 className="h-10 w-10 text-purple-600" />
                    </div>
                    <p className="text-slate-600 text-xl font-semibold">
                      Select an image to start editing
                    </p>
                    <p className="text-slate-400 text-sm mt-2">
                      Choose from your gallery on the left
                    </p>
                    <p className="text-slate-400 text-xs mt-2">
                      🎨 Simple HTML5 Canvas - Always Works!
                    </p>
                  </div>
                )}
                
                {/* Show loading overlay when processing */}
                {selectedImage && isLoading && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-xl">
                    <div className="text-center">
                      <RefreshCw className="h-12 w-12 text-purple-600 animate-spin mx-auto mb-4" />
                      <p className="text-slate-600 font-semibold">Loading image...</p>
                    </div>
                  </div>
                )}
              </div>

              {selectedImage && (
                <div className="flex flex-wrap gap-3 mt-6">
                  <Button
                    onClick={downloadEditedImage}
                    className="flex-1 min-w-[120px] bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button
                    onClick={saveEditedImage}
                    disabled={isLoading}
                    className="flex-1 min-w-[120px] bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  >
                    {isLoading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save to Gallery
                  </Button>
                  <Button
                    onClick={resetEdits}
                    variant="outline"
                    className="border-2 border-slate-300 hover:bg-slate-100"
                  >
                    <Undo className="h-4 w-4 mr-2" />
                    Reset
                  </Button>
                </div>
              )}

              {/* Status */}
              {selectedImage && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm">
                  <div className="flex items-center gap-2 text-green-700">
                    <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                    <span>Canvas Size: {canvasSize.width} x {canvasSize.height}px</span>
                    <span className="ml-4">✅ Ready for editing</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Editing Tools */}
        <div className="lg:col-span-3 space-y-4 md:space-y-6">
          {selectedImage && (
            <Tabs defaultValue="filters" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3 bg-slate-100/80 backdrop-blur-sm p-1 rounded-2xl">
                <TabsTrigger value="filters" className="rounded-xl">
                  <Sliders className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="transform" className="rounded-xl">
                  <RotateCw className="h-4 w-4" />
                </TabsTrigger>
                <TabsTrigger value="text" className="rounded-xl">
                  <Type className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>

              {/* Filters Tab */}
              <TabsContent value="filters">
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Palette className="h-5 w-5" />
                      Filters & Adjustments
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Brightness */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4 text-yellow-500" />
                        <Label className="text-sm font-medium">Brightness</Label>
                        <span className="text-xs text-slate-500 ml-auto">
                          {editSettings.brightness}%
                        </span>
                      </div>
                      <Slider
                        value={[editSettings.brightness]}
                        onValueChange={(value) =>
                          setEditSettings((prev) => ({
                            ...prev,
                            brightness: value[0],
                          }))
                        }
                        min={0}
                        max={200}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Contrast */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Contrast className="h-4 w-4 text-slate-600" />
                        <Label className="text-sm font-medium">Contrast</Label>
                        <span className="text-xs text-slate-500 ml-auto">
                          {editSettings.contrast}%
                        </span>
                      </div>
                      <Slider
                        value={[editSettings.contrast]}
                        onValueChange={(value) =>
                          setEditSettings((prev) => ({
                            ...prev,
                            contrast: value[0],
                          }))
                        }
                        min={0}
                        max={200}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Saturation */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Droplets className="h-4 w-4 text-blue-500" />
                        <Label className="text-sm font-medium">Saturation</Label>
                        <span className="text-xs text-slate-500 ml-auto">
                          {editSettings.saturation}%
                        </span>
                      </div>
                      <Slider
                        value={[editSettings.saturation]}
                        onValueChange={(value) =>
                          setEditSettings((prev) => ({
                            ...prev,
                            saturation: value[0],
                          }))
                        }
                        min={0}
                        max={200}
                        step={1}
                        className="w-full"
                      />
                    </div>

                    {/* Blur */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Camera className="h-4 w-4 text-purple-500" />
                        <Label className="text-sm font-medium">Blur</Label>
                        <span className="text-xs text-slate-500 ml-auto">
                          {editSettings.blur}px
                        </span>
                      </div>
                      <Slider
                        value={[editSettings.blur]}
                        onValueChange={(value) =>
                          setEditSettings((prev) => ({...prev, blur: value[0]}))
                        }
                        min={0}
                        max={10}
                        step={0.5}
                        className="w-full"
                      />
                    </div>

                    {/* Filter Buttons */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        variant={editSettings.grayscale ? "default" : "outline"}
                        onClick={() =>
                          setEditSettings((prev) => ({
                            ...prev,
                            grayscale: !prev.grayscale,
                          }))
                        }
                        className="text-sm"
                      >
                        Grayscale
                      </Button>
                      <Button
                        variant={editSettings.sepia ? "default" : "outline"}
                        onClick={() =>
                          setEditSettings((prev) => ({
                            ...prev,
                            sepia: !prev.sepia,
                          }))
                        }
                        className="text-sm"
                      >
                        Sepia
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Transform Tab */}
              <TabsContent value="transform">
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <RotateCw className="h-5 w-5" />
                      Transform
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Rotation */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Rotation</Label>
                      <div className="grid grid-cols-4 gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setEditSettings((prev) => ({
                              ...prev,
                              rotation: (prev.rotation - 90) % 360,
                            }))
                          }
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setEditSettings((prev) => ({
                              ...prev,
                              rotation: (prev.rotation + 90) % 360,
                            }))
                          }
                        >
                          <RotateCw className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setEditSettings((prev) => ({
                              ...prev,
                              flipX: !prev.flipX,
                            }))
                          }
                        >
                          <FlipHorizontal className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setEditSettings((prev) => ({
                              ...prev,
                              flipY: !prev.flipY,
                            }))
                          }
                        >
                          <FlipVertical className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-center text-xs text-slate-500">
                        Current rotation: {editSettings.rotation}°
                      </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Current State</Label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <Badge
                          variant={editSettings.flipX ? "default" : "secondary"}
                        >
                          Flip X: {editSettings.flipX ? "On" : "Off"}
                        </Badge>
                        <Badge
                          variant={editSettings.flipY ? "default" : "secondary"}
                        >
                          Flip Y: {editSettings.flipY ? "On" : "Off"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Text Tab */}
              <TabsContent value="text">
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Type className="h-5 w-5" />
                      Text Overlay
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Text Input */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Text</Label>
                      <Input
                        placeholder="Enter text to overlay..."
                        value={textOverlay}
                        onChange={(e) => setTextOverlay(e.target.value)}
                        className="rounded-xl border-2 focus:border-purple-400"
                      />
                    </div>

                    {/* Text Color */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="w-16 h-10 rounded-xl border-2"
                        />
                        <Input
                          value={textColor}
                          onChange={(e) => setTextColor(e.target.value)}
                          className="flex-1 rounded-xl border-2 focus:border-purple-400"
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>

                    {/* Text Size */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Label className="text-sm font-medium">Size</Label>
                        <span className="text-xs text-slate-500 ml-auto">
                          {textSize}px
                        </span>
                      </div>
                      <Slider
                        value={[textSize]}
                        onValueChange={(value) => setTextSize(value[0])}
                        min={12}
                        max={72}
                        step={2}
                        className="w-full"
                      />
                    </div>

                    {/* Preview */}
                    {textOverlay && (
                      <div className="p-4 bg-slate-100 rounded-xl">
                        <Label className="text-sm font-medium">Preview</Label>
                        <div
                          className="mt-2 text-center"
                          style={{
                            color: textColor,
                            fontSize: `${Math.min(textSize, 32)}px`,
                            fontFamily: "Arial",
                            fontWeight: "bold",
                          }}
                        >
                          {textOverlay}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>
    </div>
  );
}