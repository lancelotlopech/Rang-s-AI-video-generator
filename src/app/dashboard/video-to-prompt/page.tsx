"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  Video, 
  Loader2, 
  Upload, 
  Link as LinkIcon, 
  Sparkles, 
  Copy, 
  Check, 
  Eye,
  Camera,
  Music,
  FileText,
  Coins,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Bug,
  XCircle,
  Clock,
  Users,
  MapPin,
  Clapperboard,
  BookOpen,
  Target,
  Heart,
  Gauge,
  History,
  Trash2,
  RefreshCw,
  User,
  Shirt,
  Sun,
  Cloud,
  TreePine
} from "lucide-react"
import { toast } from "sonner"
import { VideoAnalysisResult, TokenUsage, TimelineSegment, VideoCharacter } from "@/lib/video-analysis-prompt"
import { useRouter } from "next/navigation"

interface DebugInfo {
  videoUrl?: string
  model?: string
  requestSent?: boolean
  rawResponse?: string
  parseError?: string
  tokenUsage?: TokenUsage
}

interface ApiResponse {
  result?: VideoAnalysisResult
  tokenUsage?: TokenUsage
  debug?: DebugInfo
  rawResponse?: string
  error?: string
  details?: string
}

interface HistoryItem {
  id: string
  created_at: string
  prompt: string // video URL
  model: string
  status: string
  meta: {
    result?: VideoAnalysisResult
    tokenUsage?: TokenUsage
    videoSize?: string
  }
}

export default function VideoToPromptPage() {
  const router = useRouter()
  const [videoUrl, setVideoUrl] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<VideoAnalysisResult | null>(null)
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [rawResponse, setRawResponse] = useState<string | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // History state
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(true)

  // Load history on mount
  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setIsLoadingHistory(true)
    try {
      const res = await fetch("/api/video-to-prompt?limit=50")
      if (res.ok) {
        const data = await res.json()
        setHistory(data.history || [])
      }
    } catch (err) {
      console.error("Failed to load history:", err)
    } finally {
      setIsLoadingHistory(false)
    }
  }

  const handleDeleteHistory = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm("确定要删除这条记录吗？")) return
    
    try {
      const res = await fetch(`/api/video-to-prompt?id=${id}`, { method: "DELETE" })
      if (res.ok) {
        setHistory(prev => prev.filter(item => item.id !== id))
        if (selectedHistoryId === id) {
          setSelectedHistoryId(null)
          setResult(null)
        }
        toast.success("已删除")
      } else {
        toast.error("删除失败")
      }
    } catch (err) {
      toast.error("删除失败")
    }
  }

  const handleSelectHistory = (item: HistoryItem) => {
    setSelectedHistoryId(item.id)
    setVideoUrl(item.prompt)
    if (item.meta?.result) {
      setResult(item.meta.result)
      setTokenUsage(item.meta.tokenUsage || null)
    }
  }

  const handleUpload = async (file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      toast.error("视频文件过大（最大 100MB）")
      return
    }
    if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)) {
      toast.error("不支持的视频格式（仅支持 MP4/WebM/MOV）")
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
        setVideoUrl(directUrl)
        toast.success("视频上传成功")
      } else {
        throw new Error("Upload failed")
      }
    } catch (e) {
      console.error("Upload error", e)
      toast.error("上传失败，请尝试使用视频 URL")
    } finally {
      setIsUploading(false)
    }
  }

  const handleAnalyze = async () => {
    if (!videoUrl.trim()) {
      toast.error("请输入视频 URL 或上传视频")
      return
    }

    setIsAnalyzing(true)
    setResult(null)
    setTokenUsage(null)
    setError(null)
    setDebugInfo(null)
    setRawResponse(null)
    setSelectedHistoryId(null)

    try {
      const res = await fetch("/api/video-to-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl: videoUrl.trim() }),
      })

      const data: ApiResponse = await res.json()

      // Always save debug info
      if (data.debug) setDebugInfo(data.debug)
      if (data.rawResponse) setRawResponse(data.rawResponse)
      if (data.tokenUsage) setTokenUsage(data.tokenUsage)

      if (!res.ok) {
        const errorMsg = data.details || data.error || "分析失败"
        setError(errorMsg)
        toast.error(errorMsg)
        return
      }

      if (data.result) {
        setResult(data.result)
        toast.success("视频分析完成！")
        // Reload history to include new record
        loadHistory()
      } else {
        setError("AI 返回了空结果")
        toast.error("AI 返回了空结果")
      }
    } catch (err: any) {
      console.error(err)
      const errorMsg = err.message || "分析失败，请重试"
      setError(errorMsg)
      toast.error(errorMsg)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleCopyPrompt = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    toast.success(`${type} 已复制到剪贴板`)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleUseForGeneration = () => {
    if (result?.generatedPrompt) {
      sessionStorage.setItem('video_prompt_from_analysis', result.generatedPrompt)
      router.push('/dashboard/video')
      toast.info("已跳转到视频生成页面")
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Timeline segment component
  const TimelineItem = ({ segment, index }: { segment: TimelineSegment; index: number }) => (
    <div className="relative pl-8 pb-6 last:pb-0">
      {/* Timeline line */}
      <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-purple-200" />
      {/* Timeline dot */}
      <div className="absolute left-1.5 top-1 w-4 h-4 rounded-full bg-purple-500 border-2 border-white shadow" />
      
      <div className="bg-white rounded-lg border p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="font-mono text-xs">
            {segment.time}
          </Badge>
          <span className="font-medium text-sm">{segment.scene}</span>
        </div>
        
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-purple-600 font-medium">📹 画面：</span>
            <span className="text-muted-foreground">{segment.visualNarrative}</span>
          </div>
          <div>
            <span className="text-blue-600 font-medium">🔊 声音：</span>
            <span className="text-muted-foreground">{segment.audioNarrative}</span>
          </div>
          <div>
            <span className="text-green-600 font-medium">🎬 镜头：</span>
            <span className="text-muted-foreground">{segment.cinematography}</span>
          </div>
          <div>
            <span className="text-orange-600 font-medium">💫 情绪：</span>
            <span className="text-muted-foreground">{segment.emotionalBeat}</span>
          </div>
        </div>
      </div>
    </div>
  )

  // Character card component
  const CharacterCard = ({ character, index }: { character: VideoCharacter; index: number }) => (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="w-4 h-4 text-blue-600" />
          {character.role} - {character.gender}, {character.estimatedAge}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {/* Physique */}
        {character.physique && (
          <div>
            <Label className="text-xs text-muted-foreground">体型</Label>
            <p>{character.physique.height} / {character.physique.build} / {character.physique.posture}</p>
          </div>
        )}
        
        {/* Face */}
        {character.face && (
          <div>
            <Label className="text-xs text-muted-foreground">面部</Label>
            <p>{character.face.shape}脸, {character.face.skinTone}肤色, {character.face.expression}</p>
            {character.face.distinctiveFeatures?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {character.face.distinctiveFeatures.map((f, i) => (
                  <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Hair */}
        {character.hair && (
          <div className="bg-white rounded p-2 border">
            <Label className="text-xs text-purple-600 font-medium">💇 头发</Label>
            <p className="mt-1">
              <span className="font-medium">{character.hair.color}</span> / 
              {character.hair.length} / 
              {character.hair.style} / 
              {character.hair.texture}
            </p>
          </div>
        )}
        
        {/* Clothing */}
        {character.clothing && (
          <div className="bg-white rounded p-2 border">
            <Label className="text-xs text-green-600 font-medium flex items-center gap-1">
              <Shirt className="w-3 h-3" /> 服装
            </Label>
            <div className="mt-1 space-y-1">
              <p><span className="text-muted-foreground">上装:</span> {character.clothing.top}</p>
              <p><span className="text-muted-foreground">下装:</span> {character.clothing.bottom}</p>
              <p><span className="text-muted-foreground">鞋子:</span> {character.clothing.footwear}</p>
              {character.clothing.accessories?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {character.clothing.accessories.map((a, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{a}</Badge>
                  ))}
                </div>
              )}
              <p><span className="text-muted-foreground">风格:</span> {character.clothing.style}</p>
              {character.clothing.dominantColors?.length > 0 && (
                <div className="flex gap-1">
                  {character.clothing.dominantColors.map((c, i) => (
                    <span key={i} className="px-2 py-0.5 bg-gray-100 rounded text-xs">{c}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Behavior */}
        {character.behavior && (
          <div>
            <Label className="text-xs text-muted-foreground">行为</Label>
            <p>{character.behavior.movements?.join(', ')}</p>
            <p className="text-muted-foreground">情绪: {character.behavior.emotionalState}</p>
          </div>
        )}
        
        <div className="text-xs text-muted-foreground">
          出镜: {character.screenTime} | 重要性: {character.prominence}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto bg-background">
      {/* Header */}
      <div className="border-b bg-card p-6 shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-md bg-purple-600/10 text-purple-600">
              <Video className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold">Video to Prompt</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            上传视频或输入视频 URL，AI 像导演一样"读懂"视频，详细分析人物、场景、动作并生成专业 Prompt
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Upload className="w-4 h-4" />
              上传视频
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload Area */}
            <div 
              className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-muted/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/webm,video/quicktime"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file)
                  e.target.value = ''
                }}
              />
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  <span className="text-sm text-muted-foreground">上传中...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm font-medium">点击或拖拽视频到这里</span>
                  <span className="text-xs text-muted-foreground">支持 MP4, WebM, MOV (最大 15MB)</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">或</span>
              <Separator className="flex-1" />
            </div>

            {/* URL Input */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="输入视频 URL（支持公开可访问的视频链接）"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button 
                onClick={handleAnalyze}
                disabled={isAnalyzing || !videoUrl.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    AI 分析
                  </>
                )}
              </Button>
            </div>

            {/* Video Preview */}
            {videoUrl && (
              <div className="rounded-lg overflow-hidden bg-black aspect-video max-h-[300px]">
                <video 
                  src={videoUrl} 
                  controls 
                  className="w-full h-full object-contain"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Analysis Progress */}
        {isAnalyzing && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-purple-500" />
                <div className="text-center">
                  <p className="font-medium">正在深度分析视频...</p>
                  <p className="text-sm text-muted-foreground">
                    AI 正在逐秒理解视频内容、识别人物特征、分析场景细节
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error Display */}
        {error && !isAnalyzing && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>分析失败</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Debug Panel */}
        {(debugInfo || rawResponse) && (
          <Collapsible open={showDebug} onOpenChange={setShowDebug}>
            <Card className="border-yellow-200 bg-yellow-50/50">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-yellow-100/50 transition-colors">
                  <CardTitle className="text-base flex items-center justify-between text-yellow-700">
                    <div className="flex items-center gap-2">
                      <Bug className="w-4 h-4" />
                      调试信息
                    </div>
                    {showDebug ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4 text-sm">
                  {debugInfo && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs text-muted-foreground">模型</Label>
                          <p className="font-mono text-xs bg-white p-1 rounded border">{debugInfo.model || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">请求已发送</Label>
                          <p className="font-mono text-xs bg-white p-1 rounded border">{debugInfo.requestSent ? '是' : '否'}</p>
                        </div>
                      </div>
                      {debugInfo.parseError && (
                        <div>
                          <Label className="text-xs text-red-600">解析错误</Label>
                          <p className="font-mono text-xs bg-red-50 p-2 rounded border border-red-200 text-red-700">
                            {debugInfo.parseError}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {rawResponse && (
                    <div>
                      <Label className="text-xs text-muted-foreground mb-1 block">AI 原始响应</Label>
                      <pre className="font-mono text-xs bg-white p-3 rounded border overflow-x-auto max-h-[400px] overflow-y-auto whitespace-pre-wrap">
                        {rawResponse}
                      </pre>
                    </div>
                  )}

                  {tokenUsage && (
                    <div className="flex gap-4 text-xs">
                      <span>输入: {tokenUsage.promptTokens.toLocaleString()}</span>
                      <span>输出: {tokenUsage.completionTokens.toLocaleString()}</span>
                      <span className="font-bold">总计: {tokenUsage.totalTokens.toLocaleString()}</span>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            {/* Token Usage */}
            {tokenUsage && (
              <Alert className="bg-blue-50 border-blue-200">
                <Coins className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <span className="font-medium">Token 使用统计：</span>
                  {' '}输入 {tokenUsage.promptTokens.toLocaleString()} + 
                  输出 {tokenUsage.completionTokens.toLocaleString()} = 
                  总计 <strong>{tokenUsage.totalTokens.toLocaleString()}</strong> tokens
                </AlertDescription>
              </Alert>
            )}

            {/* Overview Section */}
            {result.overview && (
              <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-purple-700">
                    <Eye className="w-4 h-4" />
                    视频概述
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* One Liner */}
                  <div className="bg-white rounded-lg p-4 border border-purple-100">
                    <p className="text-lg font-medium text-center">
                      "{result.overview.oneLiner}"
                    </p>
                  </div>

                  {/* Quick Info Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-lg p-3 border text-center">
                      <Clapperboard className="w-4 h-4 mx-auto mb-1 text-purple-500" />
                      <p className="text-xs text-muted-foreground">类型</p>
                      <p className="text-sm font-medium">{result.overview.videoType}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border text-center">
                      <Target className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                      <p className="text-xs text-muted-foreground">目标受众</p>
                      <p className="text-sm font-medium">{result.overview.targetAudience}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border text-center">
                      <Heart className="w-4 h-4 mx-auto mb-1 text-red-500" />
                      <p className="text-xs text-muted-foreground">情绪氛围</p>
                      <p className="text-sm font-medium">{result.overview.mood}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border text-center">
                      <Clock className="w-4 h-4 mx-auto mb-1 text-green-500" />
                      <p className="text-xs text-muted-foreground">时长</p>
                      <p className="text-sm font-medium">{result.duration}</p>
                    </div>
                  </div>

                  {/* Purpose */}
                  <div className="bg-white rounded-lg p-3 border">
                    <p className="text-xs text-muted-foreground mb-1">视频目的</p>
                    <p className="text-sm">{result.overview.purpose}</p>
                  </div>

                  {/* Pacing */}
                  {result.overview.pacing && (
                    <div className="bg-white rounded-lg p-3 border">
                      <div className="flex items-center gap-2 mb-2">
                        <Gauge className="w-4 h-4 text-orange-500" />
                        <p className="text-sm font-medium">节奏分析</p>
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p><span className="font-medium text-foreground">整体：</span>{result.overview.pacing.overall}</p>
                        <p><span className="font-medium text-foreground">变化：</span>{result.overview.pacing.rhythm}</p>
                        <p><span className="font-medium text-foreground">速度：</span>{result.overview.pacing.tempo}</p>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {result.tags && result.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {result.tags.map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-sm">
                          <span className="mr-1">{tag.icon}</span>
                          {tag.category}: {tag.value}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Characters Section - NEW! */}
            {result.scene?.characters && result.scene.characters.length > 0 && (
              <Card className="border-blue-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-blue-700">
                    <Users className="w-4 h-4" />
                    人物详细分析
                    <Badge variant="secondary" className="ml-2">{result.scene.characters.length} 人</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {result.scene.characters.map((char, index) => (
                      <CharacterCard key={index} character={char} index={index} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Scene Setting - NEW! */}
            {result.scene?.setting && (
              <Card className="border-green-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-green-700">
                    <MapPin className="w-4 h-4" />
                    场景详细分析
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Location */}
                  {result.scene.setting.location && (
                    <div className="bg-white rounded-lg p-3 border">
                      <Label className="text-xs text-green-600 font-medium">📍 地点</Label>
                      <div className="mt-1 grid md:grid-cols-2 gap-2 text-sm">
                        <p><span className="text-muted-foreground">类型:</span> {result.scene.setting.location.type}</p>
                        <p><span className="text-muted-foreground">区域:</span> {result.scene.setting.location.region}</p>
                        <p className="md:col-span-2"><span className="text-muted-foreground">具体:</span> {result.scene.setting.location.specific}</p>
                        {result.scene.setting.location.country && (
                          <p className="md:col-span-2"><span className="text-muted-foreground">风格:</span> {result.scene.setting.location.country}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Weather */}
                  {result.scene.setting.weather && (
                    <div className="bg-white rounded-lg p-3 border">
                      <Label className="text-xs text-blue-600 font-medium flex items-center gap-1">
                        <Sun className="w-3 h-3" /> 天气/光线
                      </Label>
                      <div className="mt-1 grid md:grid-cols-2 gap-2 text-sm">
                        <p><span className="text-muted-foreground">天气:</span> {result.scene.setting.weather.condition}</p>
                        <p><span className="text-muted-foreground">天空:</span> {result.scene.setting.weather.sky}</p>
                        <p><span className="text-muted-foreground">光线:</span> {result.scene.setting.weather.naturalLight}</p>
                        <p><span className="text-muted-foreground">温度感:</span> {result.scene.setting.weather.temperature}</p>
                        {result.scene.setting.weather.wind && (
                          <p><span className="text-muted-foreground">风:</span> {result.scene.setting.weather.wind}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Environment */}
                  {result.scene.setting.environment && (
                    <div className="bg-white rounded-lg p-3 border">
                      <Label className="text-xs text-purple-600 font-medium flex items-center gap-1">
                        <TreePine className="w-3 h-3" /> 环境元素
                      </Label>
                      <div className="mt-2 space-y-2 text-sm">
                        <p><span className="text-muted-foreground">地面:</span> {result.scene.setting.environment.ground}</p>
                        {result.scene.setting.environment.vegetation?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-muted-foreground">植被:</span>
                            {result.scene.setting.environment.vegetation.map((v, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{v}</Badge>
                            ))}
                          </div>
                        )}
                        {result.scene.setting.environment.architecture?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-muted-foreground">建筑:</span>
                            {result.scene.setting.environment.architecture.map((a, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{a}</Badge>
                            ))}
                          </div>
                        )}
                        {result.scene.setting.environment.objects?.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-muted-foreground">物品:</span>
                            {result.scene.setting.environment.objects.map((o, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{o}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Atmosphere */}
                  {result.scene.setting.atmosphere && (
                    <div className="bg-white rounded-lg p-3 border">
                      <Label className="text-xs text-orange-600 font-medium">🌟 氛围</Label>
                      <div className="mt-1 grid md:grid-cols-2 gap-2 text-sm">
                        <p><span className="text-muted-foreground">时间:</span> {result.scene.setting.atmosphere.timeOfDay}</p>
                        <p><span className="text-muted-foreground">季节:</span> {result.scene.setting.atmosphere.season}</p>
                        <p><span className="text-muted-foreground">人群:</span> {result.scene.setting.atmosphere.crowdLevel}</p>
                        <p><span className="text-muted-foreground">噪音:</span> {result.scene.setting.atmosphere.noiseLevel}</p>
                        <p className="md:col-span-2"><span className="text-muted-foreground">氛围:</span> {result.scene.setting.atmosphere.mood}</p>
                        <p className="md:col-span-2"><span className="text-muted-foreground">光线:</span> {result.scene.setting.atmosphere.lighting}</p>
                      </div>
                    </div>
                  )}

                  {/* Key Elements */}
                  {result.scene.setting.keyElements?.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <span className="text-sm text-muted-foreground">关键元素:</span>
                      {result.scene.setting.keyElements.map((el, i) => (
                        <Badge key={i} variant="secondary">{el}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            {result.timeline && result.timeline.length > 0 && (
              <Card className="border-purple-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-purple-700">
                    <Clock className="w-4 h-4" />
                    逐秒时间线分析
                    <Badge variant="secondary" className="ml-2">{result.timeline.length} 个片段</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px] pr-4">
                    <div className="space-y-0">
                      {result.timeline.map((segment, index) => (
                        <TimelineItem key={index} segment={segment} index={index} />
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Narrative Structure */}
            {result.narrative && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    叙事结构
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Story Arc */}
                  {result.narrative.storyArc && (
                    <div className="grid md:grid-cols-4 gap-3">
                      <div className="bg-blue-50 rounded-lg p-3 border border-blue-100">
                        <p className="text-xs text-blue-600 font-medium mb-1">铺垫 Setup</p>
                        <p className="text-sm">{result.narrative.storyArc.setup}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3 border border-green-100">
                        <p className="text-xs text-green-600 font-medium mb-1">发展 Development</p>
                        <p className="text-sm">{result.narrative.storyArc.development}</p>
                      </div>
                      <div className="bg-orange-50 rounded-lg p-3 border border-orange-100">
                        <p className="text-xs text-orange-600 font-medium mb-1">高潮 Climax</p>
                        <p className="text-sm">{result.narrative.storyArc.climax}</p>
                      </div>
                      <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
                        <p className="text-xs text-purple-600 font-medium mb-1">结尾 Resolution</p>
                        <p className="text-sm">{result.narrative.storyArc.resolution}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">视觉叙事</Label>
                      <p className="text-sm mt-1">{result.narrative.visualStorytelling}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">情感曲线</Label>
                      <p className="text-sm mt-1">{result.narrative.emotionalJourney}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Technical Details */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Visual */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Camera className="w-4 h-4" />
                    视觉技术
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">景别</Label>
                    <p>{result.visual?.shotTypes?.join(', ') || '未识别'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">运镜</Label>
                    <p>{result.visual?.cameraMovements?.join(', ') || '未识别'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">光线</Label>
                    <p>{result.visual?.lighting}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">调色</Label>
                    <p>{result.visual?.colorGrade}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">构图</Label>
                    <p>{result.visual?.composition}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Audio */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Music className="w-4 h-4" />
                    音频分析
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <Label className="text-xs text-muted-foreground">人声</Label>
                    <p>
                      {result.audio?.hasVoiceover 
                        ? `${result.audio.voiceType || '有'} - ${result.audio.voiceTone || ''}` 
                        : '无人声'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">背景音乐</Label>
                    <p>
                      {result.audio?.hasMusic 
                        ? `${result.audio.musicStyle || '有'} - ${result.audio.musicMood || ''}` 
                        : '无背景音乐'}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <Label className="text-xs text-muted-foreground">主体</Label>
                    <p>{result.content?.mainSubject}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">环境</Label>
                    <p>{result.content?.environment}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">动作</Label>
                    <p>{result.content?.actions?.join(', ') || '无'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Generated Prompts - Multiple! */}
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 text-purple-700">
                  <FileText className="w-4 h-4" />
                  生成的 Prompt
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Main Prompt */}
                <div>
                  <Label className="text-sm font-medium mb-2 block">🎬 综合 Prompt</Label>
                  <div className="bg-white rounded-lg p-4 border">
                    <p className="text-sm leading-relaxed font-mono">
                      {result.generatedPrompt}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleCopyPrompt(result.generatedPrompt, '综合 Prompt')}
                    className="mt-2"
                  >
                    {copied === '综合 Prompt' ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                    复制
                  </Button>
                </div>

                {/* Character Prompt */}
                {result.characterPrompt && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">👤 人物 Prompt</Label>
                    <div className="bg-white rounded-lg p-4 border">
                      <p className="text-sm leading-relaxed font-mono">
                        {result.characterPrompt}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCopyPrompt(result.characterPrompt, '人物 Prompt')}
                      className="mt-2"
                    >
                      {copied === '人物 Prompt' ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                      复制
                    </Button>
                  </div>
                )}

                {/* Scene Prompt */}
                {result.scenePrompt && (
                  <div>
                    <Label className="text-sm font-medium mb-2 block">🏞️ 场景 Prompt</Label>
                    <div className="bg-white rounded-lg p-4 border">
                      <p className="text-sm leading-relaxed font-mono">
                        {result.scenePrompt}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCopyPrompt(result.scenePrompt, '场景 Prompt')}
                      className="mt-2"
                    >
                      {copied === '场景 Prompt' ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                      复制
                    </Button>
                  </div>
                )}

                {result.negativePrompt && (
                  <div>
                    <Label className="text-xs text-muted-foreground mb-1 block">Negative Prompt</Label>
                    <p className="text-xs text-muted-foreground bg-white rounded p-2 border">
                      {result.negativePrompt}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button 
                    onClick={handleUseForGeneration}
                    className="flex-1 bg-purple-600 hover:bg-purple-700"
                  >
                    <ArrowRight className="w-4 h-4 mr-2" />
                    用于生成视频
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* History Section - At Bottom */}
        <Collapsible open={showHistory} onOpenChange={setShowHistory}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <CardTitle className="text-base flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4" />
                    分析历史
                    <Badge variant="secondary" className="ml-2">{history.length}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={(e) => {
                        e.stopPropagation()
                        loadHistory()
                      }}
                      disabled={isLoadingHistory}
                    >
                      <RefreshCw className={`w-4 h-4 ${isLoadingHistory ? 'animate-spin' : ''}`} />
                    </Button>
                    {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                {isLoadingHistory ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    暂无分析记录
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {history.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectHistory(item)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                          selectedHistoryId === item.id ? 'bg-purple-50 border-purple-200' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-1">
                              {formatDate(item.created_at)}
                            </p>
                            <p className="text-sm font-medium line-clamp-2">
                              {item.meta?.result?.overview?.oneLiner || '视频分析'}
                            </p>
                            {item.meta?.tokenUsage && (
                              <div className="flex items-center gap-1 mt-2">
                                <Coins className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs text-muted-foreground">
                                  {item.meta.tokenUsage.totalTokens.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
                            onClick={(e) => handleDeleteHistory(item.id, e)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  )
}
