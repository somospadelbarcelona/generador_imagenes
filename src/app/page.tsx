'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Image as ImageIcon, Wand2, Palette, Download, Trash2, Copy, 
  Loader2, Upload, X, Plus, Check, History, Camera, Brush, Lightbulb, Layers, 
  Edit3, PenTool, Zap, Search, Heart, Scissors, Expand, Droplet, 
  Eye, Columns, Clock, Maximize, Minimize, Aperture, Info,
  Sparkle, FileImage, Wand2Icon, XCircle, AlertCircle, Video, Film, Play, Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Types
interface GeneratedImage {
  id: string;
  prompt: string;
  negativePrompt?: string;
  imageUrl: string;
  type: string;
  size: string;
  isFavorite: boolean;
  createdAt: string;
}

interface PromptHistoryItem {
  id: string;
  prompt: string;
  enhancedPrompt?: string;
  negativePrompt?: string;
  timestamp: Date;
}

interface ColorInfo {
  hex: string;
  name?: string;
}

interface PaletteResult {
  dominant: ColorInfo[];
  accent: ColorInfo[];
  palette: string[];
  mood: string;
  suggestedUse: string;
}

const IMAGE_SIZES = [
  { value: '1024x1024', label: 'Cuadrado', desc: '1024×1024' },
  { value: '768x1344', label: 'Retrato', desc: '768×1344' },
  { value: '1344x768', label: 'Paisaje', desc: '1344×768' },
  { value: '1440x720', label: 'Banner', desc: '1440×720' },
  { value: '720x1440', label: 'Historia', desc: '720×1440' },
];

const EDIT_TYPES = [
  { value: 'background', label: 'Fondo', icon: Layers, desc: 'Cambiar el fondo' },
  { value: 'style', label: 'Estilo', icon: Brush, desc: 'Cambiar estilo artístico' },
  { value: 'lighting', label: 'Iluminación', icon: Lightbulb, desc: 'Ajustar luz' },
  { value: 'elements', label: 'Elementos', icon: Edit3, desc: 'Modificar elementos' },
  { value: 'custom', label: 'Personalizado', icon: Wand2, desc: 'Edición libre' },
];

const QUICK_PRESETS = [
  { id: 'cinematic', label: '🎬 Cinematográfico', prompt: ', cinematic lighting, movie scene, dramatic atmosphere' },
  { id: 'professional', label: '📸 Profesional', prompt: ', professional photography, studio lighting, commercial quality' },
  { id: 'artistic', label: '🎨 Artístico', prompt: ', artistic style, creative interpretation, expressive' },
  { id: 'minimal', label: '⬜ Minimalista', prompt: ', minimalist design, clean composition, elegant' },
  { id: 'vibrant', label: '🌈 Vibrante', prompt: ', vibrant colors, bold contrast, vivid palette' },
  { id: 'moody', label: '🌙 Ambiental', prompt: ', moody atmosphere, dramatic shadows, emotional' },
];

const TOOL_OPTIONS = [
  { id: 'image-to-prompt', label: 'Analizar Imagen', desc: 'Extraer descripción', icon: Eye },
  { id: 'background-remove', label: 'Quitar Fondo', desc: 'Eliminar fondo', icon: Scissors },
  { id: 'object-remove', label: 'Eliminar Objeto', desc: 'Quitar elementos', icon: X },
  { id: 'outpaint', label: 'Expandir', desc: 'Ampliar imagen', icon: Expand },
  { id: 'color-palette', label: 'Colores', desc: 'Extraer paleta', icon: Droplet },
];

const VIDEO_QUALITY_OPTIONS = [
  { value: 'quality', label: 'Calidad', desc: 'Mayor calidad visual' },
  { value: 'speed', label: 'Rápido', desc: 'Generación más veloz' },
];

const VIDEO_DURATION_OPTIONS = [
  { value: 10, label: '10 segundos' },
  { value: 5, label: '5 segundos' },
];

const VIDEO_FPS_OPTIONS = [
  { value: 60, label: '60 FPS' },
  { value: 30, label: '30 FPS' },
];

const VIDEO_SIZES = [
  { value: '1920x1080', label: 'Full HD', desc: '1920×1080' },
  { value: '1344x768', label: 'Horizontal', desc: '1344×768' },
  { value: '1024x1024', label: 'Cuadrado', desc: '1024×1024' },
  { value: '768x1344', label: 'Vertical', desc: '768×1344' },
];

// Retry utility
async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      lastError = error as Error;
      if (i < retries - 1) await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw lastError;
}

export default function ImageGeneratorPage() {
  // Core State
  const [activeTab, setActiveTab] = useState('text');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [size, setSize] = useState('1024x1024');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImage | null>(null);
  
  // Features State
  const [batchCount, setBatchCount] = useState(4);
  const [showBatchOptions, setShowBatchOptions] = useState(false);
  const [promptHistory, setPromptHistory] = useState<PromptHistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activePresets, setActivePresets] = useState<string[]>([]);
  
  // Tools State
  const [activeTool, setActiveTool] = useState('image-to-prompt');
  const [toolSourceImage, setToolSourceImage] = useState<string | null>(null);
  const [toolResult, setToolResult] = useState<any>(null);
  const [objectToRemove, setObjectToRemove] = useState('');
  const [expandDirection, setExpandDirection] = useState('all');
  const [extractedPalette, setExtractedPalette] = useState<PaletteResult | null>(null);
  
  // Comparison State
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonImages, setComparisonImages] = useState<GeneratedImage[]>([]);
  
  // Suggestions State
  const [suggestions, setSuggestions] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Edit State
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [editType, setEditType] = useState('background');
  const [editSettings, setEditSettings] = useState({
    background: '', style: '', lighting: '', elements: '', customPrompt: ''
  });
  
  // Video State
  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoSourceImage, setVideoSourceImage] = useState<string | null>(null);
  const [videoQuality, setVideoQuality] = useState('quality');
  const [videoDuration, setVideoDuration] = useState(10);
  const [videoFps, setVideoFps] = useState(60);
  const [videoSize, setVideoSize] = useState('1920x1080');
  const [videoWithAudio, setVideoWithAudio] = useState(false);
  const [videoTaskId, setVideoTaskId] = useState<string | null>(null);
  const [videoStatus, setVideoStatus] = useState<string>('');
  const [videoResult, setVideoResult] = useState<string | null>(null);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  
  // Gallery State
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toolFileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  
  // Load data on mount
  useEffect(() => {
    fetchImages();
    
    // Check if first visit
    const hasVisited = localStorage.getItem('ai-studio-visited');
    if (!hasVisited) {
      setShowOnboarding(true);
      localStorage.setItem('ai-studio-visited', 'true');
    }
  }, []);
  
  const fetchImages = useCallback(async () => {
    try {
      const response = await fetchWithRetry('/api/images?limit=100', {}, 2);
      const data = await response.json();
      if (data.success) {
        setGeneratedImages(data.images);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  }, []);
  
  // File handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo es muy grande (máx 10MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setSourceImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  
  const handleToolImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo es muy grande (máx 10MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setToolSourceImage(reader.result as string);
        setToolResult(null);
        setExtractedPalette(null);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Save prompt to history
  const saveToHistory = (promptText: string, enhanced?: string, negative?: string) => {
    const item: PromptHistoryItem = {
      id: Date.now().toString(),
      prompt: promptText,
      enhancedPrompt: enhanced,
      negativePrompt: negative,
      timestamp: new Date()
    };
    setPromptHistory(prev => [item, ...prev.slice(0, 30)]);
  };
  
  // API Functions
  const enhancePrompt = async () => {
    if (!prompt.trim()) {
      toast.error('Escribe un prompt primero');
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('Mejorando prompt con IA...');
    
    try {
      const response = await fetchWithRetry('/api/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      }, 2);
      
      const data = await response.json();
      
      if (data.success) {
        setEnhancedPrompt(data.enhancedPrompt);
        setNegativePrompt(data.negativePrompt || '');
        saveToHistory(prompt, data.enhancedPrompt, data.negativePrompt);
        toast.success('¡Prompt mejorado!');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error('Error al mejorar el prompt');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };
  
  const getSuggestions = async () => {
    if (!prompt.trim()) {
      toast.error('Escribe un prompt primero');
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('Generando sugerencias...');
    
    try {
      const response = await fetchWithRetry('/api/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      }, 2);
      
      const data = await response.json();
      
      if (data.success) {
        setSuggestions(data.suggestions);
        setShowSuggestions(true);
      }
    } catch {
      toast.error('Error al obtener sugerencias');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };
  
  const generateFromText = async (useBatch = false) => {
    const finalPrompt = enhancedPrompt || prompt;
    if (!finalPrompt.trim()) {
      toast.error('Por favor, escribe una descripción');
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage(useBatch ? `Generando ${batchCount} imágenes...` : 'Generando imagen...');
    
    saveToHistory(prompt, enhancedPrompt || undefined, negativePrompt || undefined);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 180000);
      
      const endpoint = useBatch ? '/api/generate/batch' : '/api/generate/text-to-image';
      const body = useBatch 
        ? { prompt: finalPrompt, negativePrompt, size, count: batchCount }
        : { prompt: finalPrompt, negativePrompt, size };
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data.success) {
        if (useBatch) {
          setGeneratedImages(prev => [...data.images, ...prev]);
          toast.success(`¡${data.successful} imágenes generadas!`);
        } else {
          setGeneratedImages(prev => [data.image, ...prev]);
          toast.success('¡Imagen generada!');
        }
        setPrompt('');
        setEnhancedPrompt('');
        setNegativePrompt('');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.error('Tiempo de espera agotado. Intenta de nuevo.');
      } else {
        toast.error(error instanceof Error ? error.message : 'Error al generar');
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };
  
  // Tools execution
  const runTool = async () => {
    if (!toolSourceImage) {
      toast.error('Sube una imagen primero');
      return;
    }
    
    setIsLoading(true);
    const tool = TOOL_OPTIONS.find(t => t.id === activeTool);
    setLoadingMessage(`Procesando: ${tool?.label}...`);
    
    try {
      let endpoint = '';
      let body: any = { imageUrl: toolSourceImage };
      
      switch (activeTool) {
        case 'image-to-prompt':
          endpoint = '/api/analyze/image-to-prompt';
          break;
        case 'background-remove':
          endpoint = '/api/tools/background-remove';
          break;
        case 'object-remove':
          if (!objectToRemove.trim()) {
            toast.error('Describe el objeto a eliminar');
            setIsLoading(false);
            setLoadingMessage('');
            return;
          }
          endpoint = '/api/tools/object-remove';
          body.objectDescription = objectToRemove;
          break;
        case 'outpaint':
          endpoint = '/api/tools/outpaint';
          body.direction = expandDirection;
          break;
        case 'color-palette':
          endpoint = '/api/tools/color-palette';
          break;
      }
      
      const response = await fetchWithRetry(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      }, 2);
      
      const data = await response.json();
      
      if (data.success) {
        if (activeTool === 'color-palette') {
          setExtractedPalette(data.palette);
        } else if (activeTool === 'image-to-prompt') {
          setToolResult(data.analysis);
          if (data.analysis.suggestedPrompt) {
            setPrompt(data.analysis.suggestedPrompt);
          }
        } else {
          setToolResult(data);
          if (data.image) {
            setGeneratedImages(prev => [data.image, ...prev]);
          }
        }
        toast.success('¡Proceso completado!');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error en el procesamiento');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };
  
  // Edit image
  const editImage = async () => {
    if (!sourceImage) {
      toast.error('Sube una imagen para editar');
      return;
    }
    
    const editValue = editSettings[editType as keyof typeof editSettings];
    if (editType !== 'custom' && !editValue?.trim()) {
      toast.error('Describe los cambios');
      return;
    }
    
    setIsLoading(true);
    setLoadingMessage('Editando imagen...');
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);
      
      const response = await fetch('/api/generate/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceImage, editType, settings: editSettings, size }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data.success) {
        setGeneratedImages(prev => [data.image, ...prev]);
        toast.success('¡Imagen editada!');
        setSourceImage(null);
        setEditSettings({ background: '', style: '', lighting: '', elements: '', customPrompt: '' });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error('Error al editar la imagen');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };
  
  // Video generation
  const generateVideo = async () => {
    if (!videoPrompt.trim() && !videoSourceImage) {
      toast.error('Escribe una descripción o sube una imagen');
      return;
    }
    
    setIsVideoLoading(true);
    setVideoStatus('Iniciando...');
    setVideoResult(null);
    
    try {
      const response = await fetch('/api/generate/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: videoPrompt,
          imageUrl: videoSourceImage,
          quality: videoQuality,
          duration: videoDuration,
          fps: videoFps,
          size: videoSize,
          withAudio: videoWithAudio
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setVideoTaskId(data.taskId);
        setVideoStatus('Procesando...');
        toast.success('Video en generación. Esto puede tardar unos minutos...');
        
        // Start polling
        pollVideoStatus(data.taskId);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al generar video');
      setIsVideoLoading(false);
      setVideoStatus('');
    }
  };
  
  const pollVideoStatus = async (taskId: string) => {
    const maxPolls = 120; // 10 minutes max
    const pollInterval = 5000; // 5 seconds
    let pollCount = 0;
    
    const poll = async () => {
      try {
        const response = await fetch(`/api/video/status?taskId=${taskId}`);
        const data = await response.json();
        
        if (data.status === 'SUCCESS') {
          setVideoStatus('¡Completado!');
          setVideoResult(data.videoUrl);
          setIsVideoLoading(false);
          toast.success('¡Video generado!');
          
          // Refresh gallery
          fetchImages();
          return;
        }
        
        if (data.status === 'FAIL') {
          setVideoStatus('Error');
          setIsVideoLoading(false);
          toast.error('Error al generar el video');
          return;
        }
        
        // Still processing
        pollCount++;
        const elapsed = Math.round((pollCount * pollInterval) / 1000);
        setVideoStatus(`Procesando... (${elapsed}s)`);
        
        if (pollCount < maxPolls) {
          setTimeout(poll, pollInterval);
        } else {
          setVideoStatus('Tiempo agotado');
          setIsVideoLoading(false);
          toast.error('El video tardó demasiado. Intenta de nuevo.');
        }
      } catch (error) {
        console.error('Poll error:', error);
        pollCount++;
        if (pollCount < maxPolls) {
          setTimeout(poll, pollInterval);
        } else {
          setIsVideoLoading(false);
          setVideoStatus('Error de conexión');
        }
      }
    };
    
    poll();
  };
  
  const handleVideoImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('El archivo es muy grande (máx 10MB)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoSourceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const downloadVideo = async () => {
    if (!videoResult) return;
    try {
      const response = await fetch(videoResult);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `video_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Video descargado');
    } catch {
      toast.error('Error al descargar video');
    }
  };
  
  // Utility functions
  const toggleFavorite = async (imageId: string, isFavorite: boolean) => {
    try {
      await fetch('/api/images/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, isFavorite })
      });
      
      setGeneratedImages(prev => prev.map(img => 
        img.id === imageId ? { ...img, isFavorite } : img
      ));
      
      if (selectedImage?.id === imageId) {
        setSelectedImage({ ...selectedImage, isFavorite });
      }
      
      toast.success(isFavorite ? '⭐ Añadido a favoritos' : 'Eliminado de favoritos');
    } catch {
      toast.error('Error al actualizar');
    }
  };
  
  const deleteImage = async (id: string) => {
    try {
      await fetch(`/api/images?id=${id}`, { method: 'DELETE' });
      setGeneratedImages(prev => prev.filter(img => img.id !== id));
      if (selectedImage?.id === id) setSelectedImage(null);
      setComparisonImages(prev => prev.filter(img => img.id !== id));
      toast.success('Imagen eliminada');
    } catch {
      toast.error('Error al eliminar');
    }
  };
  
  const downloadImage = async (imageUrl: string, promptText: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${promptText.slice(0, 30).replace(/[^a-z0-9]/gi, '_')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Imagen descargada');
    } catch {
      toast.error('Error al descargar');
    }
  };
  
  const addToComparison = (image: GeneratedImage) => {
    if (comparisonImages.find(img => img.id === image.id)) {
      setComparisonImages(prev => prev.filter(img => img.id !== image.id));
    } else if (comparisonImages.length >= 4) {
      toast.error('Máximo 4 imágenes para comparar');
    } else {
      setComparisonImages(prev => [...prev, image]);
    }
  };
  
  const applyPreset = (preset: typeof QUICK_PRESETS[0]) => {
    if (activePresets.includes(preset.id)) {
      setPrompt(prev => prev.replace(preset.prompt, ''));
      setActivePresets(prev => prev.filter(id => id !== preset.id));
    } else {
      setPrompt(prev => prev + preset.prompt);
      setActivePresets(prev => [...prev, preset.id]);
    }
  };
  
  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };
  
  // Filtered images
  const filteredImages = generatedImages.filter(img => {
    const matchesFilter = galleryFilter === 'all' || (galleryFilter === 'favorites' && img.isFavorite);
    const matchesSearch = !searchQuery || img.prompt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });
  
  // Handle generate
  const handleGenerate = () => {
    if (activeTab === 'text') {
      generateFromText(showBatchOptions);
    } else if (activeTab === 'edit') {
      editImage();
    }
  };
  
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-950">
        {/* Header */}
        <header className="bg-neutral-900/95 backdrop-blur-xl border-b border-lime-400/20 sticky top-0 z-50">
          <div className="max-w-[1400px] mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center shadow-lg">
                  <img src="/logo.png" alt="Somospadel BCN" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-yellow-400 via-lime-400 to-yellow-300 bg-clip-text text-transparent">Somospadel BCN</h1>
                  <p className="text-xs text-neutral-400">Generación profesional de imagenes by Alex Coscolin</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Prompt History */}
                <Popover open={showHistory} onOpenChange={setShowHistory}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="hidden sm:flex gap-2 text-neutral-300 hover:text-lime-400 hover:bg-lime-400/10">
                      <Clock className="w-4 h-4" />
                      Historial
                      {promptHistory.length > 0 && (
                        <Badge variant="secondary" className="ml-1">{promptHistory.length}</Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 max-h-80 overflow-y-auto" align="end">
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm mb-2">Prompts recientes</h4>
                      {promptHistory.length === 0 ? (
                        <p className="text-sm text-slate-500 py-4 text-center">Sin historial</p>
                      ) : (
                        promptHistory.map(item => (
                          <button
                            key={item.id}
                            onClick={() => {
                              setPrompt(item.prompt);
                              if (item.enhancedPrompt) setEnhancedPrompt(item.enhancedPrompt);
                              if (item.negativePrompt) setNegativePrompt(item.negativePrompt);
                              setShowHistory(false);
                            }}
                            className="w-full text-left p-2 rounded-lg hover:bg-slate-100 text-sm border border-transparent hover:border-slate-200 transition-all"
                          >
                            <p className="line-clamp-2">{item.prompt}</p>
                            <p className="text-xs text-slate-400 mt-1">
                              {new Date(item.timestamp).toLocaleString()}
                            </p>
                          </button>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
                
                {/* Comparison */}
                <Button
                  variant={comparisonImages.length > 0 ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setShowComparison(true)}
                  className={comparisonImages.length > 0 ? 'bg-gradient-to-r from-yellow-500 to-lime-500 hover:from-yellow-400 hover:to-lime-400 text-black font-semibold' : 'border-neutral-700 text-neutral-300 hover:border-lime-400 hover:text-lime-400'}
                >
                  <Columns className="w-4 h-4 mr-2" />
                  Comparar
                  {comparisonImages.length > 0 && (
                    <Badge variant="secondary" className="ml-1 bg-white/20">{comparisonImages.length}</Badge>
                  )}
                </Button>
                
                <div className="flex items-center gap-2 bg-neutral-800 rounded-full px-3 py-1.5 border border-lime-400/20">
                  <ImageIcon className="w-4 h-4 text-lime-400" />
                  <span className="font-semibold text-lime-400">{generatedImages.length}</span>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <main className="max-w-[1400px] mx-auto px-4 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Main Content */}
            <div className="lg:col-span-8 space-y-4">
              {/* Quick Presets */}
              <div className="flex flex-wrap items-center gap-2 bg-neutral-900 rounded-xl p-3 border border-neutral-800 shadow-lg">
                <span className="text-sm font-medium text-neutral-400 mr-1">Estilos:</span>
                {QUICK_PRESETS.map(preset => (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      activePresets.includes(preset.id) 
                        ? 'bg-gradient-to-r from-yellow-500 to-lime-500 text-black shadow-lg shadow-lime-500/20' 
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700 hover:border-lime-400/50'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              
              {/* Main Card */}
              <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full bg-neutral-800/50 border-b border-neutral-700 rounded-none p-0 h-auto">
                    {[
                      { value: 'text', icon: Sparkles, label: 'Crear' },
                      { value: 'video', icon: Video, label: 'Video' },
                      { value: 'tools', icon: Wand2, label: 'Herramientas' },
                      { value: 'edit', icon: Edit3, label: 'Editar' },
                    ].map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <TabsTrigger
                          key={tab.value}
                          value={tab.value}
                          className="flex-1 py-3 data-[state=active]:bg-neutral-900 data-[state=active]:border-b-2 data-[state=active]:border-lime-400 data-[state=active]:text-lime-400 data-[state=inactive]:text-neutral-400 data-[state=inactive]:hover:text-neutral-200"
                        >
                          <Icon className="w-4 h-4 mr-2" />
                          {tab.label}
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                  
                  {/* Create Tab */}
                  <TabsContent value="text" className="p-4 m-0">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-neutral-200 font-medium">Describe tu imagen</Label>
                          <div className="flex gap-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={enhancePrompt} disabled={isLoading || !prompt.trim()} className="hover:bg-yellow-500/10">
                                  <Zap className="w-4 h-4 text-yellow-400" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Mejorar con IA</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={getSuggestions} disabled={isLoading || !prompt.trim()} className="hover:bg-lime-500/10">
                                  <Lightbulb className="w-4 h-4 text-lime-400" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Sugerencias</TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                        
                        <Textarea
                          placeholder="Ej: Un paisaje futurista con edificios de cristal reflejando un cielo violeta al atardecer..."
                          value={enhancedPrompt || prompt}
                          onChange={(e) => { setPrompt(e.target.value); setEnhancedPrompt(''); }}
                          className="min-h-[120px] bg-neutral-800 border-neutral-700 focus:border-lime-400 focus:ring-lime-400/20 text-neutral-100 placeholder:text-neutral-500 text-base resize-none"
                        />
                      </div>
                      
                      {/* AI Suggestions */}
                      <AnimatePresence>
                        {showSuggestions && suggestions && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-lime-500/10 border border-lime-500/30 rounded-lg p-4 space-y-3"
                          >
                            <div className="flex items-center justify-between">
                              <h4 className="font-medium text-lime-400">💡 Sugerencias de IA</h4>
                              <Button variant="ghost" size="sm" onClick={() => setShowSuggestions(false)} className="text-neutral-400 hover:text-white">
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            {suggestions.styleSuggestions && (
                              <div>
                                <p className="text-sm font-medium text-neutral-300 mb-2">Estilos sugeridos:</p>
                                <div className="flex flex-wrap gap-1">
                                  {suggestions.styleSuggestions.map((style: string, i: number) => (
                                    <Button key={i} variant="outline" size="sm" className="h-7 text-xs bg-neutral-800 border-neutral-700 text-neutral-300 hover:border-lime-400 hover:text-lime-400" onClick={() => setPrompt(prev => prev + `, ${style}`)}>
                                      {style}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {suggestions.quickVariations && (
                              <div>
                                <p className="text-sm font-medium text-neutral-300 mb-2">Variaciones rápidas:</p>
                                <div className="space-y-1">
                                  {suggestions.quickVariations.slice(0, 3).map((variation: string, i: number) => (
                                    <button
                                      key={i}
                                      onClick={() => setPrompt(variation)}
                                      className="block w-full text-left p-2 text-sm bg-neutral-800 rounded border border-neutral-700 hover:border-lime-400/50 hover:bg-neutral-750 text-neutral-300 transition-colors"
                                    >
                                      {variation}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      
                      {/* Negative Prompt */}
                      <div className="space-y-2">
                        <Label className="text-sm text-neutral-400 flex items-center gap-2">
                          <XCircle className="w-3 h-3" />
                          Negative Prompt (qué evitar)
                        </Label>
                        <Textarea
                          placeholder="borroso, baja calidad, distorsionado, marca de agua, texto..."
                          value={negativePrompt}
                          onChange={(e) => setNegativePrompt(e.target.value)}
                          className="min-h-[60px] bg-neutral-800 border-neutral-700 text-neutral-300 placeholder:text-neutral-500 text-sm resize-none focus:border-red-400 focus:ring-red-400/20"
                        />
                      </div>
                      
                      {/* Batch Options */}
                      <AnimatePresence>
                        {showBatchOptions && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="flex items-center gap-4 p-4 bg-neutral-800 rounded-lg border border-neutral-700"
                          >
                            <Label className="text-sm font-medium text-neutral-300">Generar:</Label>
                            <div className="flex items-center gap-2">
                              {[1, 2, 4, 6, 8].map(n => (
                                <button
                                  key={n}
                                  onClick={() => setBatchCount(n)}
                                  className={`w-9 h-9 rounded-full text-sm font-semibold transition-all ${
                                    batchCount === n 
                                      ? 'bg-gradient-to-r from-yellow-500 to-lime-500 text-black scale-110 shadow-lg shadow-lime-500/30' 
                                      : 'bg-neutral-700 border border-neutral-600 text-neutral-300 hover:border-lime-400 hover:scale-105'
                                  }`}
                                >
                                  {n}
                                </button>
                              ))}
                            </div>
                            <span className="text-sm text-neutral-400">imágenes</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </TabsContent>
                  
                  {/* Video Tab */}
                  <TabsContent value="video" className="p-4 m-0">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left Column - Input */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label className="text-neutral-200 font-medium flex items-center gap-2">
                              <Film className="w-4 h-4 text-lime-400" />
                              Describe tu video
                            </Label>
                            <Textarea
                              placeholder="Ej: Un jugador de pádel ejecutando un remate perfecto en cámara lenta..."
                              value={videoPrompt}
                              onChange={(e) => setVideoPrompt(e.target.value)}
                              className="min-h-[100px] bg-neutral-800 border-neutral-700 focus:border-lime-400 focus:ring-lime-400/20 text-neutral-100 placeholder:text-neutral-500 resize-none"
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-neutral-200 font-medium flex items-center gap-2">
                              <ImageIcon className="w-4 h-4 text-yellow-400" />
                              Imagen de referencia (opcional)
                            </Label>
                            <div 
                              onClick={() => videoFileInputRef.current?.click()}
                              className="border-2 border-dashed border-neutral-700 rounded-xl p-4 text-center cursor-pointer hover:border-lime-400 hover:bg-lime-500/5 transition-all min-h-[120px] flex items-center justify-center"
                            >
                              {videoSourceImage ? (
                                <div className="relative">
                                  <img src={videoSourceImage} alt="Source" className="max-h-24 rounded-lg" />
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setVideoSourceImage(null); }}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                                  >
                                    <X className="w-3 h-3 text-white" />
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <Upload className="w-8 h-8 mx-auto text-neutral-500 mb-1" />
                                  <p className="text-neutral-400 text-sm">Sube una imagen</p>
                                  <p className="text-xs text-neutral-500">El video se basará en esta imagen</p>
                                </div>
                              )}
                            </div>
                            <input ref={videoFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleVideoImageUpload} />
                          </div>
                        </div>
                        
                        {/* Right Column - Settings */}
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label className="text-neutral-300 text-sm">Calidad</Label>
                              <Select value={videoQuality} onValueChange={setVideoQuality}>
                                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-800 border-neutral-700">
                                  {VIDEO_QUALITY_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-neutral-200 focus:bg-neutral-700">
                                      <div>
                                        <span>{opt.label}</span>
                                        <span className="text-neutral-500 text-xs ml-2">{opt.desc}</span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-neutral-300 text-sm">Duración</Label>
                              <Select value={videoDuration.toString()} onValueChange={(v) => setVideoDuration(parseInt(v))}>
                                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-800 border-neutral-700">
                                  {VIDEO_DURATION_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value.toString()} className="text-neutral-200 focus:bg-neutral-700">
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-neutral-300 text-sm">FPS</Label>
                              <Select value={videoFps.toString()} onValueChange={(v) => setVideoFps(parseInt(v))}>
                                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-800 border-neutral-700">
                                  {VIDEO_FPS_OPTIONS.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value.toString()} className="text-neutral-200 focus:bg-neutral-700">
                                      {opt.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-neutral-300 text-sm">Resolución</Label>
                              <Select value={videoSize} onValueChange={setVideoSize}>
                                <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-200">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-neutral-800 border-neutral-700">
                                  {VIDEO_SIZES.map((opt) => (
                                    <SelectItem key={opt.value} value={opt.value} className="text-neutral-200 focus:bg-neutral-700">
                                      <span>{opt.label} <span className="text-neutral-500">{opt.desc}</span></span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => setVideoWithAudio(!videoWithAudio)}
                            className={`w-full p-3 rounded-xl border text-left transition-all flex items-center gap-3 ${
                              videoWithAudio 
                                ? 'border-lime-400 bg-lime-500/10 text-lime-400' 
                                : 'border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-600'
                            }`}
                          >
                            <Volume2 className="w-5 h-5" />
                            <div>
                              <p className="font-medium text-sm">Generar audio con IA</p>
                              <p className="text-xs opacity-70">Añade efectos de sonido automáticamente</p>
                            </div>
                          </button>
                          
                          <Button
                            onClick={generateVideo}
                            disabled={isVideoLoading || (!videoPrompt.trim() && !videoSourceImage)}
                            className="w-full bg-gradient-to-r from-yellow-500 to-lime-500 hover:from-yellow-400 hover:to-lime-400 text-black font-semibold h-12 shadow-lg shadow-lime-500/20"
                          >
                            {isVideoLoading ? (
                              <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                {videoStatus}
                              </>
                            ) : (
                              <>
                                <Video className="w-5 h-5 mr-2" />
                                Generar Video
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                      
                      {/* Video Result */}
                      <AnimatePresence>
                        {videoResult && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-neutral-800 rounded-xl p-4 border border-neutral-700"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-medium text-lime-400 flex items-center gap-2">
                                <Play className="w-4 h-4" />
                                Video generado
                              </h4>
                              <Button onClick={downloadVideo} size="sm" className="bg-gradient-to-r from-yellow-500 to-lime-500 hover:from-yellow-400 hover:to-lime-400 text-black">
                                <Download className="w-4 h-4 mr-2" />
                                Descargar
                              </Button>
                            </div>
                            <video 
                              src={videoResult} 
                              controls 
                              className="w-full rounded-lg"
                              style={{ maxHeight: '400px' }}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </TabsContent>
                  
                  {/* Tools Tab */}
                  <TabsContent value="tools" className="p-4 m-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-2">
                          {TOOL_OPTIONS.map((tool) => {
                            const Icon = tool.icon;
                            return (
                              <button
                                key={tool.id}
                                onClick={() => setActiveTool(tool.id)}
                                className={`p-4 rounded-xl border-2 text-left transition-all ${
                                  activeTool === tool.id 
                                    ? 'border-lime-400 bg-lime-500/10 shadow-lg shadow-lime-500/10' 
                                    : 'border-neutral-700 hover:border-neutral-600 bg-neutral-800'
                                }`}
                              >
                                <Icon className={`w-5 h-5 mb-2 ${activeTool === tool.id ? 'text-lime-400' : 'text-neutral-500'}`} />
                                <p className={`font-medium text-sm ${activeTool === tool.id ? 'text-lime-400' : 'text-neutral-300'}`}>{tool.label}</p>
                                <p className="text-xs text-neutral-500">{tool.desc}</p>
                              </button>
                            );
                          })}
                        </div>
                        
                        {activeTool === 'object-remove' && (
                          <Input
                            placeholder="Ej: persona, coche, árbol..."
                            value={objectToRemove}
                            onChange={(e) => setObjectToRemove(e.target.value)}
                            className="bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500 focus:border-lime-400"
                          />
                        )}
                        
                        {activeTool === 'outpaint' && (
                          <Select value={expandDirection} onValueChange={setExpandDirection}>
                            <SelectTrigger className="bg-neutral-800 border-neutral-700 text-neutral-200 focus:border-lime-400">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-neutral-800 border-neutral-700">
                              <SelectItem value="all">Todas direcciones</SelectItem>
                              <SelectItem value="left">Izquierda</SelectItem>
                              <SelectItem value="right">Derecha</SelectItem>
                              <SelectItem value="top">Arriba</SelectItem>
                              <SelectItem value="bottom">Abajo</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                      
                      <div className="space-y-3">
                        <div 
                          onClick={() => toolFileInputRef.current?.click()}
                          className="border-2 border-dashed border-neutral-700 rounded-xl p-6 text-center cursor-pointer hover:border-lime-400 hover:bg-lime-500/5 transition-all min-h-[200px] flex items-center justify-center"
                        >
                          {toolSourceImage ? (
                            <img src={toolSourceImage} alt="Source" className="max-h-48 rounded-lg shadow-md" />
                          ) : (
                            <div>
                              <Upload className="w-10 h-10 mx-auto text-neutral-500 mb-2" />
                              <p className="text-neutral-300 font-medium">Sube una imagen</p>
                              <p className="text-xs text-neutral-500">PNG, JPG hasta 10MB</p>
                            </div>
                          )}
                        </div>
                        <input ref={toolFileInputRef} type="file" accept="image/*" className="hidden" onChange={handleToolImageUpload} />
                        
                        <Button
                          onClick={runTool}
                          disabled={isLoading || !toolSourceImage}
                          className="w-full bg-gradient-to-r from-yellow-500 to-lime-500 hover:from-yellow-400 hover:to-lime-400 text-black font-semibold h-11 shadow-lg shadow-lime-500/20"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              {loadingMessage}
                            </>
                          ) : (
                            <>
                              <Wand2 className="w-4 h-4 mr-2" />
                              Procesar imagen
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Tool Results */}
                    <AnimatePresence>
                      {toolResult && activeTool === 'image-to-prompt' && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 p-4 bg-neutral-800 rounded-xl space-y-3 border border-neutral-700"
                        >
                          <div className="flex items-center justify-between">
                            <Label className="font-medium text-lime-400">Descripción extraída:</Label>
                            <Button variant="ghost" size="sm" onClick={() => copyToClipboard(toolResult.suggestedPrompt || '')} className="text-neutral-400 hover:text-lime-400">
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-700 text-sm text-neutral-300">
                            {toolResult.suggestedPrompt}
                          </div>
                          <Button onClick={() => { setPrompt(toolResult.suggestedPrompt); setActiveTab('text'); }} className="bg-gradient-to-r from-yellow-500 to-lime-500 hover:from-yellow-400 hover:to-lime-400 text-black font-semibold">
                            Usar esta descripción
                          </Button>
                        </motion.div>
                      )}
                      
                      {toolResult?.image && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4"
                        >
                          <img src={toolResult.image.imageUrl} alt="Resultado" className="max-w-full rounded-xl shadow-md" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* Color Palette */}
                    <AnimatePresence>
                      {extractedPalette && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-4 p-4 bg-neutral-800 rounded-xl border border-neutral-700"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-lime-400">Paleta extraída</h4>
                            <Badge variant="secondary" className="bg-lime-500/20 text-lime-400">{extractedPalette.mood}</Badge>
                          </div>
                          <div className="flex gap-3 mb-3">
                            {extractedPalette.palette.map((color, i) => (
                              <button
                                key={i}
                                onClick={() => copyToClipboard(color)}
                                className="flex flex-col items-center group"
                              >
                                <div 
                                  className="w-12 h-12 rounded-xl border border-neutral-600 shadow-sm group-hover:scale-110 transition-transform cursor-pointer"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-xs text-neutral-400 mt-1">{color}</span>
                              </button>
                            ))}
                          </div>
                          <p className="text-sm text-neutral-400">{extractedPalette.suggestedUse}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </TabsContent>
                  
                  {/* Edit Tab */}
                  <TabsContent value="edit" className="p-4 m-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <Label className="font-medium text-neutral-200">Imagen a editar</Label>
                        <div 
                          onClick={() => editFileInputRef.current?.click()}
                          className="border-2 border-dashed border-neutral-700 rounded-xl p-6 text-center cursor-pointer hover:border-lime-400 hover:bg-lime-500/5 min-h-[200px] flex items-center justify-center"
                        >
                          {sourceImage ? (
                            <img src={sourceImage} alt="A editar" className="max-h-48 rounded-lg" />
                          ) : (
                            <div>
                              <Upload className="w-10 h-10 mx-auto text-neutral-500 mb-2" />
                              <p className="text-neutral-300">Sube una imagen</p>
                            </div>
                          )}
                        </div>
                        <input ref={editFileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => setSourceImage(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }} />
                      </div>
                      
                      <div className="space-y-3">
                        <Label className="font-medium text-neutral-200">Tipo de edición</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {EDIT_TYPES.map((type) => {
                            const Icon = type.icon;
                            return (
                              <button
                                key={type.value}
                                onClick={() => setEditType(type.value)}
                                className={`p-3 rounded-xl text-left transition-all ${
                                  editType === type.value 
                                    ? 'bg-gradient-to-r from-yellow-500 to-lime-500 text-black shadow-lg shadow-lime-500/20' 
                                    : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700 border border-neutral-700'
                                }`}
                              >
                                <Icon className="w-4 h-4 mb-1" />
                                <p className="text-sm font-medium">{type.label}</p>
                                <p className="text-xs opacity-70">{type.desc}</p>
                              </button>
                            );
                          })}
                        </div>
                        
                        <Textarea
                          placeholder="Describe los cambios que deseas..."
                          value={editSettings[editType as keyof typeof editSettings]}
                          onChange={(e) => setEditSettings(prev => ({ ...prev, [editType]: e.target.value }))}
                          className="min-h-[80px] bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500 resize-none focus:border-lime-400"
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                {/* Footer */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-700 bg-neutral-800/50">
                  <div className="flex items-center gap-3">
                    <Select value={size} onValueChange={setSize}>
                      <SelectTrigger className="w-[180px] bg-neutral-800 border-neutral-700 text-neutral-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-neutral-800 border-neutral-700">
                        {IMAGE_SIZES.map((s) => (
                          <SelectItem key={s.value} value={s.value} className="text-neutral-200 focus:bg-neutral-700">
                            <span className="flex items-center gap-2">
                              {s.label} <span className="text-neutral-500">{s.desc}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBatchOptions(!showBatchOptions)}
                      className={showBatchOptions ? 'bg-gradient-to-r from-yellow-500 to-lime-500 text-black border-lime-500' : 'border-neutral-700 text-neutral-300 hover:border-lime-400 hover:text-lime-400'}
                    >
                      <Layers className="w-4 h-4 mr-2" />
                      Lote
                    </Button>
                  </div>
                  
                  <Button
                    onClick={handleGenerate}
                    disabled={isLoading || (activeTab === 'text' && !prompt.trim() && !enhancedPrompt.trim()) || (activeTab === 'edit' && !sourceImage)}
                    className="bg-gradient-to-r from-yellow-500 to-lime-500 hover:from-yellow-400 hover:to-lime-400 text-black px-8 py-2.5 rounded-full font-semibold shadow-lg shadow-lime-500/30"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{loadingMessage || 'Procesando...'}</span>
                      </div>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        {activeTab === 'edit' ? 'Editar imagen' : `Generar${showBatchOptions ? ` ${batchCount}` : ''}`}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Gallery */}
            <div className="lg:col-span-4">
              <div className="bg-neutral-900 rounded-xl border border-neutral-800 shadow-xl sticky top-20">
                <div className="p-3 border-b border-neutral-800">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold flex items-center gap-2 text-neutral-200">
                      <ImageIcon className="w-5 h-5 text-lime-400" />
                      Galería
                    </h2>
                    <Badge className="bg-gradient-to-r from-yellow-500 to-lime-500 text-black">{generatedImages.length}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <Input
                        placeholder="Buscar imágenes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-9 bg-neutral-800 border-neutral-700 text-neutral-200 placeholder:text-neutral-500 focus:border-lime-400"
                      />
                    </div>
                    <Button
                      variant={galleryFilter === 'favorites' ? 'default' : 'outline'}
                      size="icon"
                      onClick={() => setGalleryFilter(galleryFilter === 'favorites' ? 'all' : 'favorites')}
                      className={`h-9 w-9 ${galleryFilter === 'favorites' ? 'bg-gradient-to-r from-yellow-500 to-lime-500 hover:from-yellow-400 hover:to-lime-400 text-black' : 'border-neutral-700 text-neutral-400 hover:border-lime-400 hover:text-lime-400'}`}
                    >
                      <Heart className={`w-4 h-4 ${galleryFilter === 'favorites' ? 'fill-black' : ''}`} />
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="h-[calc(100vh-260px)]">
                  {filteredImages.length > 0 ? (
                    <div className="p-2 grid grid-cols-2 gap-2">
                      {filteredImages.map((image) => (
                        <motion.div
                          key={image.id}
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="relative group aspect-square rounded-xl overflow-hidden cursor-pointer border-2 border-neutral-700 hover:border-lime-400 transition-all"
                          onClick={() => setSelectedImage(image)}
                        >
                          <img src={image.imageUrl} alt={image.prompt} className="w-full h-full object-cover" />
                          
                          {image.isFavorite && (
                            <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full bg-gradient-to-r from-yellow-500 to-lime-500 flex items-center justify-center shadow-md">
                              <Heart className="w-3 h-3 text-black fill-black" />
                            </div>
                          )}
                          
                          {comparisonImages.find(img => img.id === image.id) && (
                            <div className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-lime-500 flex items-center justify-center shadow-md">
                              <Check className="w-3 h-3 text-black" />
                            </div>
                          )}
                          
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-2">
                              <p className="text-white text-xs line-clamp-2">{image.prompt}</p>
                            </div>
                            <div className="absolute top-1.5 right-1.5 flex gap-1">
                              <button
                                onClick={(e) => { e.stopPropagation(); addToComparison(image); }}
                                className="w-7 h-7 bg-neutral-800/90 rounded-full flex items-center justify-center hover:bg-lime-500 hover:text-black shadow border border-neutral-700"
                              >
                                <Columns className="w-3.5 h-3.5 text-neutral-300" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleFavorite(image.id, !image.isFavorite); }}
                                className="w-7 h-7 bg-neutral-800/90 rounded-full flex items-center justify-center hover:bg-lime-500 shadow border border-neutral-700"
                              >
                                <Heart className={`w-3.5 h-3.5 ${image.isFavorite ? 'text-lime-400 fill-lime-400' : 'text-neutral-400'}`} />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); downloadImage(image.imageUrl, image.prompt); }}
                                className="w-7 h-7 bg-neutral-800/90 rounded-full flex items-center justify-center hover:bg-lime-500 hover:text-black shadow border border-neutral-700"
                              >
                                <Download className="w-3.5 h-3.5 text-neutral-300" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); deleteImage(image.id); }}
                                className="w-7 h-7 bg-neutral-800/90 rounded-full flex items-center justify-center hover:bg-red-500 shadow border border-neutral-700"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16">
                      <ImageIcon className="w-16 h-16 text-neutral-700 mb-3" />
                      <p className="text-neutral-400 font-medium">
                        {galleryFilter === 'favorites' ? 'Sin favoritos' : 'Sin imágenes'}
                      </p>
                      <p className="text-sm text-neutral-500">Genera tu primera imagen</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </div>
        </main>
        
        {/* Image Detail Modal */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="max-w-3xl bg-neutral-900 border-neutral-800">
            <DialogHeader>
              <DialogTitle className="text-lime-400">Detalle de Imagen</DialogTitle>
            </DialogHeader>
            {selectedImage && (
              <div className="space-y-4">
                <img src={selectedImage.imageUrl} alt={selectedImage.prompt} className="w-full rounded-xl" />
                <div className="space-y-2">
                  <p className="text-sm text-neutral-300">{selectedImage.prompt}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="bg-gradient-to-r from-yellow-500 to-lime-500 text-black">{selectedImage.type}</Badge>
                    <Badge variant="outline" className="border-neutral-700 text-neutral-400">{selectedImage.size}</Badge>
                    <Badge variant="outline" className="border-neutral-700 text-neutral-400">{new Date(selectedImage.createdAt).toLocaleDateString()}</Badge>
                  </div>
                </div>
                <div className="flex justify-end gap-2 flex-wrap">
                  <Button variant="outline" onClick={() => addToComparison(selectedImage)} className="border-neutral-700 text-neutral-300 hover:border-lime-400 hover:text-lime-400">
                    <Columns className="w-4 h-4 mr-2" />
                    Comparar
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => toggleFavorite(selectedImage.id, !selectedImage.isFavorite)} 
                    className="border-neutral-700 text-neutral-300 hover:border-lime-400 hover:text-lime-400"
                  >
                    <Heart className={`w-4 h-4 mr-2 ${selectedImage.isFavorite ? 'fill-lime-400 text-lime-400' : ''}`} />
                    {selectedImage.isFavorite ? 'Quitar' : 'Favorito'}
                  </Button>
                  <Button onClick={() => copyToClipboard(selectedImage.prompt)} variant="outline" className="border-neutral-700 text-neutral-300 hover:border-lime-400 hover:text-lime-400">
                    <Copy className="w-4 h-4 mr-2" />
                    Copiar
                  </Button>
                  <Button onClick={() => downloadImage(selectedImage.imageUrl, selectedImage.prompt)} className="bg-gradient-to-r from-yellow-500 to-lime-500 hover:from-yellow-400 hover:to-lime-400 text-black font-semibold">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Comparison Modal */}
        <Dialog open={showComparison} onOpenChange={setShowComparison}>
          <DialogContent className="max-w-5xl bg-neutral-900 border-neutral-800">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-lime-400">
                <Columns className="w-5 h-5" />
                Comparar Imágenes
              </DialogTitle>
            </DialogHeader>
            {comparisonImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {comparisonImages.map((image, i) => (
                  <div key={image.id} className="relative group">
                    <img src={image.imageUrl} alt="" className="w-full rounded-xl shadow-md" />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 w-7 h-7 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500 hover:bg-red-600"
                      onClick={() => setComparisonImages(prev => prev.filter(img => img.id !== image.id))}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-neutral-400 line-clamp-2">{image.prompt}</p>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" className="h-7 text-xs border-neutral-700 text-neutral-300 hover:border-lime-400 hover:text-lime-400" onClick={() => downloadImage(image.imageUrl, image.prompt)}>
                          <Download className="w-3 h-3 mr-1" />
                          Descargar
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Columns className="w-12 h-12 mx-auto mb-3 text-neutral-700" />
                <p className="text-neutral-400">Selecciona imágenes de la galería para comparar</p>
                <p className="text-xs text-neutral-500 mt-1">Haz clic en el icono de columnas en cada imagen</p>
              </div>
            )}
            {comparisonImages.length > 0 && (
              <DialogFooter>
                <Button variant="outline" onClick={() => setComparisonImages([])} className="border-neutral-700 text-neutral-300 hover:border-lime-400 hover:text-lime-400">
                  Limpiar todo
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
        
        {/* Onboarding Dialog */}
        <Dialog open={showOnboarding} onOpenChange={setShowOnboarding}>
          <DialogContent className="max-w-md bg-neutral-900 border-neutral-800">
            <DialogHeader>
              <DialogTitle className="text-xl text-lime-400">🎾 Bienvenido a Somospadel BCN</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-neutral-300">Crea imágenes y videos increíbles con IA:</p>
              <div className="space-y-3">
                {[
                  { icon: Sparkles, text: 'Genera imágenes desde descripciones de texto' },
                  { icon: Video, text: 'Crea videos animados con IA' },
                  { icon: Wand2, text: 'Edita y transforma tus imágenes' },
                  { icon: Zap, text: 'Mejora tus prompts automáticamente' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-neutral-800 rounded-lg border border-neutral-700">
                    <div className="w-8 h-8 rounded-lg bg-lime-500/20 flex items-center justify-center">
                      <item.icon className="w-4 h-4 text-lime-400" />
                    </div>
                    <span className="text-sm text-neutral-300">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowOnboarding(false)} className="w-full bg-gradient-to-r from-yellow-500 to-lime-500 hover:from-yellow-400 hover:to-lime-400 text-black font-semibold">
                ¡Empezar a crear!
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
