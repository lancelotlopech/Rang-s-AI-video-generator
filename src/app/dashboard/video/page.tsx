"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Video, Loader2, Download, Play, AlertCircle, Clock, CheckCircle2, XCircle, Trash2, Image as ImageIcon, Terminal, ChevronDown, ChevronUp, UploadCloud, Sparkles, LayoutGrid, List as ListIcon, RefreshCw, Maximize2, Info, Eye, AlertTriangle, Coins } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { useLanguage } from "@/components/language-provider"
import { translations } from "@/lib/i18n"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface VideoTask {
  id: string // Local UUID
  taskId?: string // Cloud Task ID
  prompt: string
  model: string
  aspectRatio: string
  duration?: string
  images?: string[]
  status: string // Raw status from Yunwu API
  videoUrl?: string
  error?: string
  createdAt: number
  finishedAt?: number
  progress: number // Fake progress 0-90
  lastResponse?: any // Debug info
}

const getFriendlyErrorMessage = (error?: string) => {
  if (!error) return "Unknown error"
  
  // 1. Known Error Codes
  if (error.includes("get_channel_failed")) return "Service busy: Upstream channels are saturated. Please try switching models (e.g. Luma/Runway) or try again later."
  if (error.includes("INVALID_ARGUMENT")) return "Request rejected. Likely due to content safety policy or invalid parameters."
  if (error.includes("NSFW") || error.includes("safety")) return "Content blocked by safety filters."
  if (error.includes("AUDIO_FILTERED")) return "Audio content filtered by safety policy."
  if (error.includes("quota") || error.includes("credit")) return "Daily quota exceeded or insufficient credits."
  
  // 2. Generic Error Code Formatting (e.g. PUBLIC_ERROR_SOMETHING -> Public error something)
  if (/^[A-Z0-9_]+$/.test(error)) {
    const formatted = error.replace(/_/g, ' ').toLowerCase()
    return `Generation failed: ${formatted.charAt(0).toUpperCase() + formatted.slice(1)}`
  }

  // 3. Fallback: Truncate long error messages
  if (error.length > 100) {
    return `Generation failed: ${error.slice(0, 100)}...`
  }

  return error
}

export default function VideoPage() {
  const { language } = useLanguage()
  const t = translations[language].video
  const router = useRouter()
  const supabase = createClient()

  // State
  const [prompt, setPrompt] = useState("")
  const [aspectRatio, setAspectRatio] = useState("9:16") // Default to portrait
  const [duration, setDuration] = useState("10") // Default 10s
  const [resolution, setResolution] = useState("1080p") // Default 1080p
  const [selectedModel, setSelectedModel] = useState("sora-2") // Default Sora 2
  const [customModel, setCustomModel] = useState("")
  const [uploadedImages, setUploadedImages] = useState<string[]>([]) // Image URLs
  const [isUploading, setIsUploading] = useState(false)
  const [enhancePrompt, setEnhancePrompt] = useState(true)
  const [enableUpsample, setEnableUpsample] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const [credits, setCredits] = useState<number | null>(null)
  
  const [previewTask, setPreviewTask] = useState<VideoTask | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null) // For ref image preview
  const [showRulesDialog, setShowRulesDialog] = useState(false)
  const promptInputRef = useRef<HTMLTextAreaElement>(null)

  // Tasks State
  const [tasks, setTasks] = useState<VideoTask[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load Models from Env
  const videoModels = useMemo(() => {
    try {
      const envModels = process.env.NEXT_PUBLIC_VIDEO_MODELS
      if (!envModels) return []
      return JSON.parse(envModels) as { id: string; name: string; credits?: number }[]
    } catch (e) {
      console.error("Failed to parse video models", e)
      return []
    }
  }, [])

  // Get current model cost
  const currentCost = useMemo(() => {
    const model = videoModels.find(m => m.id === selectedModel)
    return model?.credits || 0
  }, [selectedModel, videoModels])

  // Auth & Credits Check
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Fetch credits
      const { data: profile } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single()
      
      if (profile) {
        setCredits(profile.credits)
      }
    }
    checkUser()
  }, [supabase, router])

  // Load tasks from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('foxio_video_tasks')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          // Sanitize data
          const sanitized = parsed.map((t: any) => ({
            ...t,
            error: typeof t.error === 'object' ? JSON.stringify(t.error) : t.error,
            status: typeof t.status === 'string' ? t.status : 'unknown'
          }))
          setTasks(sanitized)
        }
      } catch (e) {
        console.error("Failed to load tasks", e)
      }
    }
    setIsLoaded(true)
  }, [])

  // Save tasks to LocalStorage
  useEffect(() => {
    if (isLoaded) {
      try {
        const tasksToSave = tasks.map(task => {
          const cleanImages = task.images?.filter(img => img.length < 1000)
          return {
            ...task,
            images: cleanImages && cleanImages.length > 0 ? cleanImages : undefined
          }
        })
        localStorage.setItem('foxio_video_tasks', JSON.stringify(tasksToSave))
      } catch (e) {
        console.error("Failed to save tasks to localStorage", e)
      }
    }
  }, [tasks, isLoaded])

  // Use ref to track tasks without triggering re-renders of the effect
  const tasksRef = useRef(tasks)
  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  // Helper to check if task is active
  const isTaskActive = (status: string) => {
    const completedStatuses = ['completed', 'video_generation_completed', 'video_upsampling_completed', 'succeeded', 'success', 'expired']
    const failedStatuses = ['failed', 'error', 'video_generation_failed', 'video_upsampling_failed']
    return !completedStatuses.includes(status.toLowerCase()) && !failedStatuses.includes(status.toLowerCase())
  }

  // Check for expired tasks
  useEffect(() => {
    const checkExpiration = () => {
      const now = Date.now()
      const ONE_DAY = 24 * 60 * 60 * 1000
      
      setTasks(prev => prev.map(task => {
        if (task.status === 'expired') return task
        
        // If task is completed and older than 24h, mark as expired
        if (task.finishedAt && (now - task.finishedAt > ONE_DAY)) {
          return { ...task, status: 'expired', videoUrl: undefined }
        }
        return task
      }))
    }
    
    checkExpiration()
    const interval = setInterval(checkExpiration, 60 * 1000) // Check every minute
    return () => clearInterval(interval)
  }, [])

  // Polling Logic
  useEffect(() => {
    // 1. Progress Update Interval (Every 1s)
    const progressInterval = setInterval(() => {
      const currentTasks = tasksRef.current
      const processingTasks = currentTasks.filter(t => t.taskId && isTaskActive(t.status))
      
      if (processingTasks.length === 0) return

      setTasks(prev => {
        return prev.map(task => {
          if (!isTaskActive(task.status)) return task
          // Increment fake progress up to 90%
          if (task.progress < 90) {
            return { ...task, progress: Math.min(90, task.progress + (Math.random() * 2)) }
          }
          return task
        })
      })
    }, 1000)

    // 2. API Check Interval (Every 3s)
    const apiInterval = setInterval(async () => {
      const currentTasks = tasksRef.current
      const activeTasks = currentTasks.filter(t => t.taskId && isTaskActive(t.status))
      
      if (activeTasks.length === 0) return

      for (const task of activeTasks) {
        try {
          const res = await fetch(`/api/generate/video?taskId=${task.taskId}`)
          const data = await res.json()

          setTasks(prev => prev.map(t => {
            if (t.id !== task.id) return t

            const newStatus = data.status || t.status
            const isCompleted = ['completed', 'video_generation_completed', 'video_upsampling_completed', 'succeeded', 'success'].includes(newStatus.toLowerCase())
            const isFailed = ['failed', 'error', 'video_generation_failed', 'video_upsampling_failed'].includes(newStatus.toLowerCase())

            let videoUrl = t.videoUrl
            if (data.video_url) videoUrl = data.video_url
            else if (data.data && data.data[0]?.url) videoUrl = data.data[0].url

            let errorMsg = t.error
            if (isFailed) {
              if (typeof data.error === 'string') {
                errorMsg = data.error
              } else if (typeof data.error === 'object' && data.error !== null) {
                errorMsg = data.error.message || JSON.stringify(data.error)
              } else {
                errorMsg = "Task failed"
              }
            }

            // If task just completed or failed, refresh credits to show updated balance (refund or confirm)
            if ((isCompleted || isFailed) && t.status !== newStatus) {
              // Refresh credits
              supabase.auth.getUser().then(({ data: { user } }) => {
                if (user) {
                  supabase.from('profiles').select('credits').eq('id', user.id).single().then(({ data }) => {
                    if (data) setCredits(data.credits)
                  })
                }
              })
            }

            return {
              ...t,
              status: newStatus,
              videoUrl: videoUrl,
              error: errorMsg,
              progress: isCompleted ? 100 : t.progress,
              finishedAt: (isCompleted || isFailed) ? Date.now() : t.finishedAt,
              lastResponse: data
            }
          }))

          if (data.status && ['completed', 'video_generation_completed'].includes(data.status.toLowerCase())) {
             toast.success(`Video generated!`)
          }

        } catch (e) {
          console.error("Poll error", e)
        }
      }
    }, 3000)

    return () => {
      clearInterval(progressInterval)
      clearInterval(apiInterval)
    }
  }, [supabase]) 

  const handleUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`Image ${file.name} is too large (max 5MB)`)
      return
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error(`Image ${file.name} format not supported (JPG/PNG/WEBP only)`)
      return
    }

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: formData
      })
      
      const data = await res.json()
      
      if (data.status === 'success' && data.data.url) {
        const directUrl = data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/')
        setUploadedImages(prev => [...prev, directUrl])
        toast.success("Image uploaded successfully")
      } else {
        throw new Error("Upload failed")
      }
    } catch (e) {
      console.error("Upload error", e)
      toast.error("Failed to upload image. Please try using a URL instead.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("Please enter a prompt")
      return
    }

    const finalModel = selectedModel === 'custom' ? customModel : selectedModel
    if (!finalModel) {
      toast.error("Please select or enter a model ID")
      return
    }

    // Check credits
    if (credits !== null && credits < currentCost) {
      toast.error(`Insufficient credits. You need ${currentCost} credits but have ${credits}.`)
      return
    }

    setIsSubmitting(true)

    let images = [...uploadedImages]

    // Logic check for Sora
    if (finalModel.includes('sora') && images.length > 1) {
      toast.warning("Sora only supports 1 reference image. Using the first one.")
      images = [images[0]]
    }

    const newTask: VideoTask = {
      id: crypto.randomUUID(),
      prompt,
      model: finalModel,
      aspectRatio,
      duration,
      images: images.length > 0 ? images : undefined,
      status: 'pending',
      createdAt: Date.now(),
      progress: 0
    }

    setTasks(prev => [newTask, ...prev])

    try {
      const res = await fetch("/api/generate/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt, 
          aspectRatio, 
          duration,
          model: finalModel,
          images: images,
          enhance_prompt: enhancePrompt,
          enable_upsample: enableUpsample,
          resolution: resolution
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.details || data.error || "Failed to submit task")
      }

      // Refresh credits after successful submission (pre-deducted)
      const { data: profile } = await supabase.from('profiles').select('credits').eq('id', (await supabase.auth.getUser()).data.user?.id).single()
      if (profile) setCredits(profile.credits)

      setTasks(prev => prev.map(t => {
        if (t.id !== newTask.id) return t
        if (data.id) {
          return { 
            ...t, 
            status: data.status || 'processing', 
            taskId: data.id,
            lastResponse: data
          }
        } else {
          return { 
            ...t, 
            status: 'failed', 
            error: "Invalid response (no ID)", 
            finishedAt: Date.now(),
            lastResponse: data
          }
        }
      }))

      toast.info(t.messages.task_submitted)

    } catch (err: any) {
      console.error(err)
      const errMsg = typeof err === 'object' ? (err.message || JSON.stringify(err)) : String(err)
      
      setTasks(prev => prev.map(t => 
        t.id === newTask.id ? { ...t, status: 'failed', error: errMsg, finishedAt: Date.now() } : t
      ))
      toast.error(errMsg || "Failed to submit task")
    } finally {
      setIsSubmitting(false)
    }
  }

  const captureLastFrame = async (videoUrl: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const video = document.createElement('video')
      video.crossOrigin = "anonymous"
      video.src = videoUrl
      video.currentTime = 1000 
      
      video.onloadedmetadata = () => {
        video.currentTime = video.duration - 0.1
      }

      video.onseeked = async () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(video, 0, 0)
          
          canvas.toBlob(async (blob) => {
            if (!blob) {
              resolve(null)
              return
            }
            const formData = new FormData()
            formData.append('file', blob, 'frame.jpg')
            const res = await fetch('https://tmpfiles.org/api/v1/upload', {
              method: 'POST',
              body: formData
            })
            const data = await res.json()
            if (data.status === 'success' && data.data.url) {
              resolve(data.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/'))
            } else {
              resolve(null)
            }
          }, 'image/jpeg')
        } catch (e) {
          console.error("Canvas error", e)
          resolve(null)
        }
      }

      video.onerror = () => resolve(null)
    })
  }

  const handleExtend = async (task: VideoTask) => {
    if (!task.videoUrl) return
    
    setPreviewTask(null) // Close dialog
    toast.info("Extracting last frame...")
    const frameUrl = await captureLastFrame(task.videoUrl)
    
    if (frameUrl) {
      setUploadedImages([frameUrl])
      setPrompt(task.prompt + " (Continued)")
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' })
      
      setTimeout(() => {
        promptInputRef.current?.focus()
        toast.success("Ready to extend! Please update the prompt and click Generate.")
      }, 500)
    } else {
      toast.error(t.messages.extract_failed)
    }
  }

  const handleDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    if (previewTask?.id === id) setPreviewTask(null)
  }

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto bg-background">
      {/* Top Panel: Creation Area */}
      <div className="border-b bg-card p-6 space-y-6 shadow-sm z-10 relative">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-md bg-orange-600/10 text-orange-600">
              <Video className="w-5 h-5" />
            </div>
            <h2 className="font-bold tracking-tight text-lg">{t.title}</h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Credits Display */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full border">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">{credits !== null ? credits : '...'}</span>
              <span className="text-xs text-muted-foreground">credits</span>
            </div>
          </div>
        </div>

        {/* Disclaimer Banner */}
        <div className="max-w-5xl mx-auto w-full px-1">
          <Alert className="bg-blue-50/50 border-blue-200 text-blue-800 py-2">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-xs flex items-center justify-between w-full">
              <span>
                <strong>Note:</strong> History is saved locally on this device only. Video links expire in <strong>24 hours</strong>. Please download your creations immediately.
              </span>
            </AlertDescription>
          </Alert>
        </div>

        <div className="max-w-5xl mx-auto w-full space-y-6">
          {/* Prompt Input */}
          <div className="relative">
            <Textarea 
              ref={promptInputRef}
              placeholder={t.form.script_placeholder}
              className="h-32 resize-none bg-muted/50 focus:bg-background transition-colors text-base p-4 border-2 focus:border-orange-500/50"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
              {prompt.length} chars
            </div>
          </div>

          {/* Controls Row */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.form.model}</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {videoModels.map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center justify-between w-full gap-2">
                        <span>{model.name}</span>
                        <Badge variant="secondary" className="text-[10px] h-4 px-1">{model.credits} credits</Badge>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.form.aspect_ratio}</Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select ratio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                  <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.form.duration}</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5s</SelectItem>
                  <SelectItem value="10">10s</SelectItem>
                  <SelectItem value="15">15s</SelectItem>
                  <SelectItem value="25">25s</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Resolution</Label>
              <Select value={resolution} onValueChange={setResolution}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select resolution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="720p">720p (Standard)</SelectItem>
                  <SelectItem value="1080p">1080p (High Def)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Image Upload Trigger */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t.form.ref_images_label}</Label>
                <span className="text-[10px] text-muted-foreground/70">Temp storage only</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {uploadedImages.map((img, index) => (
                    <div key={index} className="relative w-10 h-10 rounded overflow-hidden border group bg-muted cursor-pointer" onClick={() => setPreviewImage(img)}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt={`Ref ${index}`} className="w-full h-full object-cover" />
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setUploadedImages(prev => prev.filter((_, i) => i !== index))
                        }}
                        className="absolute top-0 right-0 bg-black/50 p-0.5 rounded-bl opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XCircle className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  <div className="w-10 h-10 rounded border-2 border-dashed flex items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer relative group">
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <input 
                          type="file" 
                          accept="image/jpeg,image/png,image/webp" 
                          multiple
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || [])
                            files.forEach(file => handleUpload(file))
                            e.target.value = ''
                          }}
                        />
                        <UploadCloud className="w-4 h-4 group-hover:text-orange-500" />
                      </>
                    )}
                  </div>
                </div>

                {/* Info Trigger */}
                <div 
                  className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors bg-muted/50 px-2 py-1.5 rounded-md border hover:bg-muted"
                  onClick={() => setShowRulesDialog(true)}
                  title="Click to view rules"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Veo: max 3, Sora: max 1</span>
                </div>
              </div>
            </div>

            <div className="flex-1" />

            <Button 
              className="bg-orange-600 hover:bg-orange-700 h-10 px-8 text-base shadow-lg shadow-orange-900/20 font-semibold"
              onClick={handleGenerate}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  Generate Video
                  <span className="ml-2 text-xs opacity-80 bg-black/20 px-1.5 py-0.5 rounded">
                    -{currentCost}
                  </span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom Panel: Gallery Area (Flex Row) */}
      <div className="p-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <LayoutGrid className="w-5 h-5" />
            My Creations
          </h3>
          <span className="text-sm text-muted-foreground">{tasks.length} videos</span>
        </div>

        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted-foreground border-2 border-dashed rounded-xl bg-card/50">
            <Video className="w-16 h-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">No videos yet</p>
            <p className="text-sm opacity-70">Create your first masterpiece above</p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-4 pb-20">
            {tasks.map(task => {
              const isActive = isTaskActive(task.status)
              const isExpired = task.status === 'expired'
              const isCompleted = !isActive && !isExpired && !['failed', 'error', 'video_generation_failed'].includes(task.status.toLowerCase())
              const isFailed = !isActive && !isCompleted && !isExpired

              return (
                <Card 
                  key={task.id} 
                  className="relative h-72 rounded-lg overflow-hidden group cursor-pointer border-0 shadow-sm hover:shadow-xl transition-all bg-black flex-grow-0 flex-shrink-0"
                  style={{ aspectRatio: task.aspectRatio.replace(':', '/') }}
                  onClick={() => setPreviewTask(task)}
                >
                  {isCompleted && task.videoUrl ? (
                    <video 
                      src={task.videoUrl} 
                      className="w-full h-full object-cover"
                      muted
                      onMouseOver={e => e.currentTarget.play()}
                      onMouseOut={e => {
                        e.currentTarget.pause()
                        e.currentTarget.currentTime = 0
                      }}
                      poster={task.images?.[0]}
                    />
                  ) : isExpired ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted text-muted-foreground p-4 text-center">
                      <Clock className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-xs font-medium">Link Expired</span>
                    </div>
                  ) : isFailed ? (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <XCircle className="w-8 h-8 text-red-400" />
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted/50 p-6 text-center">
                      <Loader2 className="w-8 h-8 text-orange-500 animate-spin mb-4" />
                      <Progress value={task.progress} className="h-2 w-full mb-2" />
                      <span className="text-xs font-medium text-foreground mb-1">Generating Video...</span>
                      <span className="text-[10px] text-muted-foreground">
                        This may take 10-20 minutes.<br/>You can leave this page.
                      </span>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 items-start">
                    <Badge variant={isCompleted ? "default" : isFailed || isExpired ? "destructive" : "secondary"} className="shadow-sm backdrop-blur-md bg-opacity-80 text-[10px] h-5 px-1.5">
                      {task.status}
                    </Badge>
                    {isCompleted && (
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-[9px] h-4 px-1">
                        Exp in 24h
                      </Badge>
                    )}
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Clock className="w-3 h-3" />
                    {task.duration}s
                  </div>

                  {/* Hover Overlay Info */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                    <p className="text-white text-xs line-clamp-3 font-medium leading-relaxed mb-6">
                      {task.prompt}
                    </p>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Video Preview Dialog */}
      <Dialog open={!!previewTask} onOpenChange={(open) => !open && setPreviewTask(null)}>
        <DialogContent className="max-w-5xl p-0 overflow-hidden bg-card border-none shadow-2xl">
          {previewTask && (
            <div className="flex flex-col md:flex-row h-[80vh] md:h-[600px]">
              {/* Left: Video Player */}
              <div className="flex-1 bg-black flex items-center justify-center relative">
                {previewTask.videoUrl ? (
                  <video 
                    src={previewTask.videoUrl} 
                    controls 
                    autoPlay 
                    className="max-w-full max-h-full"
                  />
                ) : (
                  <div className="text-white/50 flex flex-col items-center">
                    <Video className="w-12 h-12 mb-2 opacity-50" />
                    <span>Video not available</span>
                  </div>
                )}
              </div>

              {/* Right: Details */}
              <div className="w-full md:w-[350px] bg-card p-6 flex flex-col border-l">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">Video Details</DialogTitle>
                  <DialogDescription className="text-xs">
                    Created on {new Date(previewTask.createdAt).toLocaleString()}
                  </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 py-4 -mx-2 px-2">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase">Prompt</Label>
                      <p className="text-sm leading-relaxed bg-muted/50 p-3 rounded-md border">
                        {previewTask.prompt}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground uppercase">Model</Label>
                        <div className="text-sm font-medium">{previewTask.model}</div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground uppercase">Duration</Label>
                        <div className="text-sm font-medium">{previewTask.duration}s</div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground uppercase">Ratio</Label>
                        <div className="text-sm font-medium">{previewTask.aspectRatio}</div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs font-medium text-muted-foreground uppercase">Status</Label>
                        <Badge variant="outline">{previewTask.status}</Badge>
                      </div>
                    </div>

                    {previewTask.images && previewTask.images.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-muted-foreground uppercase">Reference Images</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {previewTask.images.map((img, i) => (
                            <div key={i} className="aspect-square rounded overflow-hidden border cursor-pointer hover:opacity-80" onClick={() => setPreviewImage(img)}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={img} alt="" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {previewTask.error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription className="text-xs">
                          {getFriendlyErrorMessage(previewTask.error)}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </ScrollArea>

                <div className="pt-4 border-t space-y-2">
                  {previewTask.videoUrl && previewTask.status !== 'expired' && (
                    <div className="space-y-2">
                      <Alert className="bg-yellow-50 border-yellow-200 py-2">
                        <AlertTriangle className="h-3 w-3 text-yellow-600" />
                        <AlertDescription className="text-[10px] text-yellow-800">
                          Link expires in 24h. Download now to save permanently.
                        </AlertDescription>
                      </Alert>
                      <div className="grid grid-cols-2 gap-2">
                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white" asChild>
                          <a href={previewTask.videoUrl} download target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </a>
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => handleExtend(previewTask)}>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          Extend
                        </Button>
                      </div>
                    </div>
                  )}
                  <Button 
                    variant="ghost" 
                    className="w-full text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(previewTask.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Record
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-none shadow-none">
          <div className="relative flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewImage || ''} alt="Preview" className="max-w-full max-h-[80vh] rounded-lg shadow-2xl" />
          </div>
        </DialogContent>
      </Dialog>

      {/* Rules Dialog */}
      <Dialog open={showRulesDialog} onOpenChange={setShowRulesDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Info className="w-5 h-5 text-orange-500" />
              Reference Image Rules
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Image Limits</h4>
              <ul className="text-sm text-muted-foreground list-disc pl-4 space-y-1">
                <li><strong>Google Veo:</strong> Supports up to <strong>3</strong> reference images.</li>
                <li><strong>Sora:</strong> Supports only <strong>1</strong> reference image.</li>
              </ul>
            </div>
            
            <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-800">Important Warning for Sora</AlertTitle>
              <AlertDescription className="text-red-700 text-xs mt-1">
                Sora currently <strong>does not support direct human portraits</strong> as reference images. Uploading portraits will cause the generation to fail. Please use detailed text descriptions for characters instead.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowRulesDialog(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
