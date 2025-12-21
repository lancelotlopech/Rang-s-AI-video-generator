"use client"

import { useState, useEffect, useRef, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Video, Loader2, Download, Play, AlertCircle, Clock, CheckCircle2, XCircle, Trash2, Image as ImageIcon, Terminal, ChevronDown, ChevronUp } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

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
  // Form State
  const [prompt, setPrompt] = useState("")
  const [aspectRatio, setAspectRatio] = useState("9:16")
  const [duration, setDuration] = useState("5")
  const [selectedModel, setSelectedModel] = useState("")
  const [customModel, setCustomModel] = useState("")
  // const [imageUrls, setImageUrls] = useState("") // Deprecated
  const [uploadedImages, setUploadedImages] = useState<string[]>([]) // Base64 Data URLs
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDebug, setShowDebug] = useState(false) // New: Debug mode
  const [expandedErrors, setExpandedErrors] = useState<Record<string, boolean>>({})

  // Tasks State
  const [tasks, setTasks] = useState<VideoTask[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load Models from Env
  const videoModels = useMemo(() => {
    try {
      const envModels = process.env.NEXT_PUBLIC_VIDEO_MODELS
      if (!envModels) return []
      return JSON.parse(envModels) as { id: string; name: string }[]
    } catch (e) {
      console.error("Failed to parse video models", e)
      return []
    }
  }, [])

  // Set default model
  useEffect(() => {
    if (videoModels.length > 0 && !selectedModel) {
      setSelectedModel(videoModels[0].id)
    } else if (!selectedModel) {
      setSelectedModel("veo3-fast") // Fallback default
    }
  }, [videoModels, selectedModel])

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
      localStorage.setItem('foxio_video_tasks', JSON.stringify(tasks))
    }
  }, [tasks, isLoaded])

  // Use ref to track tasks without triggering re-renders of the effect
  const tasksRef = useRef(tasks)
  useEffect(() => {
    tasksRef.current = tasks
  }, [tasks])

  // Helper to check if task is active
  const isTaskActive = (status: string) => {
    const completedStatuses = ['completed', 'video_generation_completed', 'video_upsampling_completed', 'succeeded', 'success']
    const failedStatuses = ['failed', 'error', 'video_generation_failed', 'video_upsampling_failed']
    return !completedStatuses.includes(status.toLowerCase()) && !failedStatuses.includes(status.toLowerCase())
  }

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
          // console.log(`Polling task: ${task.taskId}`)
          const res = await fetch(`/api/generate/video?taskId=${task.taskId}`)
          const data = await res.json()

          // Update task with latest data
          setTasks(prev => prev.map(t => {
            if (t.id !== task.id) return t

            const newStatus = data.status || t.status
            const isCompleted = ['completed', 'video_generation_completed', 'video_upsampling_completed', 'succeeded', 'success'].includes(newStatus.toLowerCase())
            const isFailed = ['failed', 'error', 'video_generation_failed', 'video_upsampling_failed'].includes(newStatus.toLowerCase())

            let videoUrl = t.videoUrl
            if (data.video_url) videoUrl = data.video_url
            else if (data.data && data.data[0]?.url) videoUrl = data.data[0].url

            // Handle error object safely
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

            return {
              ...t,
              status: newStatus,
              videoUrl: videoUrl,
              error: errorMsg,
              progress: isCompleted ? 100 : t.progress,
              finishedAt: (isCompleted || isFailed) ? Date.now() : t.finishedAt,
              lastResponse: data // Save raw response for debug
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
  }, []) 

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

    setIsSubmitting(true)

    // Use uploaded images
    const images = uploadedImages

    // Create optimistic task
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
          images: images 
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.details || data.error || "Failed to submit task")
      }

      // Update task with result
      setTasks(prev => prev.map(t => {
        if (t.id !== newTask.id) return t

        // Yunwu returns { id: "...", status: "pending" }
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

      toast.info("Task submitted, processing in background...")
      setPrompt("")
      setUploadedImages([])

    } catch (err: any) {
      console.error(err)
      const errMsg = typeof err === 'object' ? (err.message || JSON.stringify(err)) : String(err)
      
      setTasks(prev => prev.map(t => 
        t.id === newTask.id ? { ...t, status: 'failed', error: errMsg, finishedAt: Date.now() } : t
      ))
      toast.error("Failed to submit task")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  const getDuration = (task: VideoTask) => {
    const end = task.finishedAt || Date.now()
    const seconds = Math.floor((end - task.createdAt) / 1000)
    return `${seconds}s`
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 w-fit rounded-md bg-orange-700/10">
            <Video className="w-8 h-8 text-orange-700" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Ad Video Generator</h2>
            <p className="text-muted-foreground">
              Produce engaging ad videos with Veo models.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox 
            id="debug-mode" 
            checked={showDebug} 
            onCheckedChange={(checked) => setShowDebug(checked === true)} 
          />
          <Label htmlFor="debug-mode" className="text-xs text-muted-foreground cursor-pointer">Debug Mode</Label>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column: Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-lg border bg-card text-card-foreground shadow-sm space-y-6">
            <div className="space-y-2">
              <Label>Video Script / Prompt</Label>
              <Textarea 
                placeholder="A cinematic drone shot of a futuristic city at night..."
                className="h-32 resize-none"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Reference Images (Optional)</Label>
              
              {/* Image Upload Area */}
              <div className="grid grid-cols-3 gap-2">
                {uploadedImages.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-md overflow-hidden border group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt={`Ref ${index}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                
                <div className="aspect-square rounded-md border-2 border-dashed flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp" 
                    multiple
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || [])
                      files.forEach(file => {
                        // Validate size (5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error(`Image ${file.name} is too large (max 5MB)`)
                          return
                        }
                        // Validate type
                        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
                          toast.error(`Image ${file.name} format not supported (JPG/PNG/WEBP only)`)
                          return
                        }

                        const reader = new FileReader()
                        reader.onload = (e) => {
                          if (e.target?.result) {
                            setUploadedImages(prev => [...prev, e.target!.result as string])
                          }
                        }
                        reader.readAsDataURL(file)
                      })
                      // Reset input
                      e.target.value = ''
                    }}
                  />
                  <ImageIcon className="w-6 h-6 mb-1" />
                  <span className="text-[10px]">Upload</span>
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground space-y-1">
                <p>• Supported formats: JPG, PNG, WEBP</p>
                <p>• Max size: 5MB per image</p>
                <p>• Recommended: Use images with the same aspect ratio as the video</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Aspect Ratio</Label>
                  <Select value={aspectRatio} onValueChange={setAspectRatio}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ratio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="9:16">9:16 (TikTok)</SelectItem>
                      <SelectItem value="16:9">16:9 (YouTube)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Seconds</SelectItem>
                      <SelectItem value="10">10 Seconds</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Model</Label>
                <Select value={selectedModel} onValueChange={setSelectedModel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select model" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoModels.map(model => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">Custom...</SelectItem>
                  </SelectContent>
                </Select>
                {selectedModel === 'custom' && (
                  <input 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-2"
                    placeholder="Enter model ID"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                  />
                )}
              </div>
            </div>

            <Button 
              className="w-full bg-orange-600 hover:bg-orange-700"
              onClick={handleGenerate}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Generate Video"
              )}
            </Button>
          </div>
        </div>
        
        {/* Right Column: History List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-medium">Generation History</h3>
          
          {tasks.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
              No videos generated yet. Start by creating one!
            </div>
          ) : (
            <div className="space-y-4">
              {tasks.map(task => {
                const isActive = isTaskActive(task.status)
                const isCompleted = !isActive && !['failed', 'error', 'video_generation_failed'].includes(task.status.toLowerCase())
                const isFailed = !isActive && !isCompleted

                return (
                  <div key={task.id} className="flex flex-col gap-4 p-4 rounded-lg border bg-card shadow-sm relative overflow-hidden">
                    {/* Status Indicator Line */}
                    <div className={cn(
                      "absolute left-0 top-0 bottom-0 w-1",
                      isCompleted ? "bg-green-500" :
                      isFailed ? "bg-red-500" :
                      "bg-orange-500 animate-pulse"
                    )} />

                    <div className="flex flex-col sm:flex-row gap-4">
                      {/* Video Preview or Placeholder */}
                      <div className="w-full sm:w-48 h-48 bg-black rounded-md flex-shrink-0 overflow-hidden flex items-center justify-center relative group">
                        {isCompleted && task.videoUrl ? (
                          <video 
                            src={task.videoUrl} 
                            controls 
                            className="w-full h-full object-contain"
                          />
                        ) : isFailed ? (
                          <XCircle className="w-8 h-8 text-red-400" />
                        ) : (
                          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                        )}
                        
                        {/* Reference Images Indicator */}
                        {task.images && task.images.length > 0 && (
                          <div className="absolute top-1 right-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded flex items-center gap-1">
                            <ImageIcon className="w-3 h-3" />
                            {task.images.length}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex justify-between items-start">
                          <p className="font-medium truncate pr-8">{task.prompt}</p>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(task.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span className="px-2 py-0.5 rounded-full bg-secondary">
                            {task.model}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-secondary">
                            {task.aspectRatio}
                          </span>
                          {task.duration && (
                            <span className="px-2 py-0.5 rounded-full bg-secondary">
                              {task.duration}s
                            </span>
                          )}
                          <span className="flex items-center gap-1 ml-auto sm:ml-0">
                            <Clock className="w-3 h-3" />
                            {getDuration(task)}
                          </span>
                        </div>

                        {/* Status & Progress */}
                        <div className="space-y-1 pt-2">
                          <div className="flex justify-between text-xs">
                            <span className={cn(
                              "font-medium uppercase text-[10px] tracking-wider",
                              isCompleted ? "text-green-600" :
                              isFailed ? "text-red-600" :
                              "text-orange-600"
                            )}>
                              {task.status}
                            </span>
                            <span>{Math.round(task.progress)}%</span>
                          </div>
                          <Progress value={task.progress} className="h-1.5" />
                          {task.error && (
                            <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-md">
                              <div className="flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                                <span className="text-xs text-red-700 font-medium leading-5">
                                  {getFriendlyErrorMessage(task.error)}
                                </span>
                              </div>
                              
                              {/* Error Details Collapsible */}
                              <Collapsible 
                                open={expandedErrors[task.id]} 
                                onOpenChange={(open) => setExpandedErrors(prev => ({ ...prev, [task.id]: open }))}
                                className="mt-2"
                              >
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-5 px-0 text-[10px] text-muted-foreground hover:text-foreground">
                                    {expandedErrors[task.id] ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                                    {expandedErrors[task.id] ? "Hide Details" : "Show Error Details"}
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent>
                                  <div className="p-2 bg-white rounded text-[10px] font-mono text-red-700 overflow-x-auto mt-1 border border-red-100">
                                    <pre>{JSON.stringify(task.lastResponse, null, 2)}</pre>
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            </div>
                          )}
                        </div>
                        
                        {/* Actions */}
                        {isCompleted && task.videoUrl && (
                          <div className="pt-1">
                            <Button variant="link" size="sm" className="h-auto p-0 text-orange-600" asChild>
                              <a href={task.videoUrl} download target="_blank" rel="noopener noreferrer">
                                <Download className="w-3 h-3 mr-1" />
                                Download
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Debug Info */}
                    {showDebug && task.lastResponse && (
                      <div className="mt-2 p-2 bg-muted/50 rounded text-[10px] font-mono overflow-x-auto border border-dashed">
                        <div className="flex items-center gap-2 mb-1 text-muted-foreground">
                          <Terminal className="w-3 h-3" />
                          <span>Raw API Response</span>
                        </div>
                        <pre>{JSON.stringify(task.lastResponse, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
