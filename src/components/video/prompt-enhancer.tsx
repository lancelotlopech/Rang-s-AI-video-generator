"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Loader2, Sparkles, RefreshCw, Check, X, Wand2, Image as ImageIcon, ChevronRight, Film, Palette, Camera, Clapperboard, Lightbulb, Edit2, Eye, EyeOff, Mic, Music, Volume2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { EnhancedPromptResult, PromptTag, PromptQuestion, AudioSettings } from "@/lib/prompt-system"
import { SCENE_TYPE_LABELS } from "@/lib/prompt-system"

// Style template that can be saved and reused for "generate similar" feature
export interface VideoStyleTemplate {
  // Scene classification
  sceneType?: string
  // Visual style tags
  tags: PromptTag[]
  // Audio settings
  audioSettings?: AudioSettings
  // The enhanced prompt
  finalPrompt: string
  // Negative prompt
  negativePrompt?: string
  // User selections for questions
  selections?: Record<string, string>
  // Original user prompt (for reference)
  originalPrompt?: string
}

interface PromptEnhancerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userPrompt: string
  referenceImages?: string[]
  targetModel?: string
  // Changed: now returns both prompt and full style template
  onApplyPrompt: (enhancedPrompt: string, styleTemplate?: VideoStyleTemplate) => void
}

// Category configuration with icons and colors - Professional cinematography categories
const categoryConfig: Record<string, { icon: React.ReactNode; bgColor: string; textColor: string; borderColor: string; group: string }> = {
  // 镜头设置组
  "景别": { icon: <Film className="w-3 h-3" />, bgColor: "bg-blue-500/10", textColor: "text-blue-400", borderColor: "border-blue-500/30", group: "镜头设置" },
  "机位": { icon: <Camera className="w-3 h-3" />, bgColor: "bg-blue-500/10", textColor: "text-blue-400", borderColor: "border-blue-500/30", group: "镜头设置" },
  "焦距": { icon: <Camera className="w-3 h-3" />, bgColor: "bg-blue-500/10", textColor: "text-blue-400", borderColor: "border-blue-500/30", group: "镜头设置" },
  "器材": { icon: <Film className="w-3 h-3" />, bgColor: "bg-blue-500/10", textColor: "text-blue-400", borderColor: "border-blue-500/30", group: "镜头设置" },
  
  // 运动控制组
  "运镜": { icon: <Clapperboard className="w-3 h-3" />, bgColor: "bg-orange-500/10", textColor: "text-orange-400", borderColor: "border-orange-500/30", group: "运动控制" },
  "抖动": { icon: <Clapperboard className="w-3 h-3" />, bgColor: "bg-orange-500/10", textColor: "text-orange-400", borderColor: "border-orange-500/30", group: "运动控制" },
  "动态": { icon: <Clapperboard className="w-3 h-3" />, bgColor: "bg-orange-500/10", textColor: "text-orange-400", borderColor: "border-orange-500/30", group: "运动控制" },
  
  // 光影设计组
  "光线": { icon: <Lightbulb className="w-3 h-3" />, bgColor: "bg-yellow-500/10", textColor: "text-yellow-400", borderColor: "border-yellow-500/30", group: "光影设计" },
  "调色": { icon: <Palette className="w-3 h-3" />, bgColor: "bg-yellow-500/10", textColor: "text-yellow-400", borderColor: "border-yellow-500/30", group: "光影设计" },
  
  // 技术参数组
  "参数": { icon: <Camera className="w-3 h-3" />, bgColor: "bg-green-500/10", textColor: "text-green-400", borderColor: "border-green-500/30", group: "技术参数" },
  "景深": { icon: <Camera className="w-3 h-3" />, bgColor: "bg-green-500/10", textColor: "text-green-400", borderColor: "border-green-500/30", group: "技术参数" },
  
  // 后期效果组
  "特效": { icon: <Sparkles className="w-3 h-3" />, bgColor: "bg-purple-500/10", textColor: "text-purple-400", borderColor: "border-purple-500/30", group: "后期效果" },
  
  // 兼容旧版分类
  "场景": { icon: <Film className="w-3 h-3" />, bgColor: "bg-blue-500/10", textColor: "text-blue-400", borderColor: "border-blue-500/30", group: "镜头设置" },
  "环境": { icon: <Film className="w-3 h-3" />, bgColor: "bg-blue-500/10", textColor: "text-blue-400", borderColor: "border-blue-500/30", group: "镜头设置" },
  "风格": { icon: <Palette className="w-3 h-3" />, bgColor: "bg-purple-500/10", textColor: "text-purple-400", borderColor: "border-purple-500/30", group: "光影设计" },
  "色调": { icon: <Palette className="w-3 h-3" />, bgColor: "bg-purple-500/10", textColor: "text-purple-400", borderColor: "border-purple-500/30", group: "光影设计" },
  "镜头": { icon: <Camera className="w-3 h-3" />, bgColor: "bg-green-500/10", textColor: "text-green-400", borderColor: "border-green-500/30", group: "镜头设置" },
  "节奏": { icon: <Clapperboard className="w-3 h-3" />, bgColor: "bg-pink-500/10", textColor: "text-pink-400", borderColor: "border-pink-500/30", group: "运动控制" },
}

// Group configuration
const groupConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  "镜头设置": { icon: <Camera className="w-4 h-4" />, color: "text-blue-400" },
  "运动控制": { icon: <Clapperboard className="w-4 h-4" />, color: "text-orange-400" },
  "光影设计": { icon: <Lightbulb className="w-4 h-4" />, color: "text-yellow-400" },
  "技术参数": { icon: <Camera className="w-4 h-4" />, color: "text-green-400" },
  "后期效果": { icon: <Sparkles className="w-4 h-4" />, color: "text-purple-400" },
  "其他": { icon: <Film className="w-4 h-4" />, color: "text-zinc-400" },
}

// Editable tag component
function EditableTag({ 
  tag, 
  isSelected, 
  onToggle, 
  onEdit 
}: { 
  tag: PromptTag
  isSelected: boolean
  onToggle: () => void
  onEdit: (newValue: string) => void
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(tag.value)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const config = categoryConfig[tag.category] || { 
    icon: <Sparkles className="w-3 h-3" />, 
    bgColor: "bg-gray-500/10", 
    textColor: "text-gray-400", 
    borderColor: "border-gray-500/30" 
  }

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (editValue.trim() && editValue !== tag.value) {
      onEdit(editValue.trim())
    } else {
      setEditValue(tag.value)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur()
    } else if (e.key === 'Escape') {
      setEditValue(tag.value)
      setIsEditing(false)
    }
  }

  return (
    <div
      className={cn(
        "group relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border cursor-pointer transition-all duration-200",
        isSelected 
          ? `${config.bgColor} ${config.borderColor} ${config.textColor}` 
          : "bg-zinc-800/50 border-zinc-700/50 text-zinc-500 hover:border-zinc-600",
        !isSelected && "opacity-60"
      )}
      onClick={onToggle}
      onDoubleClick={handleDoubleClick}
    >
      {/* Selection indicator */}
      <div className={cn(
        "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center transition-all",
        isSelected ? "bg-green-500 scale-100" : "bg-zinc-600 scale-0 group-hover:scale-100"
      )}>
        {isSelected ? <Check className="w-2.5 h-2.5 text-white" /> : <Eye className="w-2.5 h-2.5 text-white" />}
      </div>

      {/* Icon */}
      <span className={cn(isSelected ? config.textColor : "text-zinc-500")}>
        {config.icon}
      </span>

      {/* Category label */}
      <span className="text-[10px] font-medium uppercase tracking-wider opacity-70">
        {tag.category}
      </span>

      {/* Value - editable */}
      {isEditing ? (
        <Input
          ref={inputRef}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="h-5 w-24 px-1 py-0 text-xs bg-zinc-900 border-zinc-600"
        />
      ) : (
        <span className="text-sm font-medium">{tag.value}</span>
      )}

      {/* Edit hint */}
      {!isEditing && isSelected && (
        <Edit2 className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
      )}
    </div>
  )
}

// Question card with optional selection
function QuestionCard({ 
  question, 
  selectedOption, 
  onSelect 
}: { 
  question: PromptQuestion
  selectedOption?: string
  onSelect: (option: string | undefined) => void 
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-zinc-300">{question.question}</span>
        {selectedOption && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-6 px-2 text-xs text-zinc-500 hover:text-zinc-300"
            onClick={() => onSelect(undefined)}
          >
            清除
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {question.options.map((option, index) => (
          <Button
            key={index}
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-3 text-sm border transition-all",
              selectedOption === option 
                ? "bg-purple-500/20 border-purple-500/50 text-purple-300" 
                : "bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
            )}
            onClick={() => onSelect(option)}
          >
            {selectedOption === option && <Check className="w-3 h-3 mr-1" />}
            {option}
          </Button>
        ))}
      </div>
    </div>
  )
}

// Group tags by professional cinematography categories
function groupTagsByType(tags: PromptTag[]) {
  const groups: Record<string, { tags: PromptTag[]; indices: number[] }> = {
    "镜头设置": { tags: [], indices: [] },
    "运动控制": { tags: [], indices: [] },
    "光影设计": { tags: [], indices: [] },
    "技术参数": { tags: [], indices: [] },
    "后期效果": { tags: [], indices: [] },
    "其他": { tags: [], indices: [] }
  }
  
  tags.forEach((tag, index) => {
    // 镜头设置组
    if (["景别", "机位", "焦距", "器材", "场景", "环境"].includes(tag.category)) {
      groups["镜头设置"].tags.push(tag)
      groups["镜头设置"].indices.push(index)
    }
    // 运动控制组
    else if (["运镜", "抖动", "动态", "节奏"].includes(tag.category)) {
      groups["运动控制"].tags.push(tag)
      groups["运动控制"].indices.push(index)
    }
    // 光影设计组
    else if (["光线", "调色", "风格", "色调", "氛围"].includes(tag.category)) {
      groups["光影设计"].tags.push(tag)
      groups["光影设计"].indices.push(index)
    }
    // 技术参数组
    else if (["参数", "景深", "镜头"].includes(tag.category)) {
      groups["技术参数"].tags.push(tag)
      groups["技术参数"].indices.push(index)
    }
    // 后期效果组
    else if (["特效"].includes(tag.category)) {
      groups["后期效果"].tags.push(tag)
      groups["后期效果"].indices.push(index)
    }
    // 其他
    else {
      groups["其他"].tags.push(tag)
      groups["其他"].indices.push(index)
    }
  })
  
  return groups
}

export function PromptEnhancer({
  open,
  onOpenChange,
  userPrompt,
  referenceImages,
  targetModel,
  onApplyPrompt
}: PromptEnhancerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EnhancedPromptResult | null>(null)
  const [selections, setSelections] = useState<Record<string, string | undefined>>({})
  const [selectedTags, setSelectedTags] = useState<Set<number>>(new Set())
  const [editedTags, setEditedTags] = useState<Record<number, string>>({})
  const [finalPrompt, setFinalPrompt] = useState<string>("")

  // Fetch enhanced prompt from API
  const fetchEnhancement = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)
    setSelections({})
    setSelectedTags(new Set())
    setEditedTags({})
    
    try {
      const response = await fetch("/api/enhance-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userPrompt,
          referenceImages,
          targetModel
        })
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to enhance prompt")
      }
      
      const data: EnhancedPromptResult = await response.json()
      setResult(data)
      setFinalPrompt(data.finalPrompt)
      // Select all tags by default
      setSelectedTags(new Set(data.tags.map((_, i) => i)))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Build final prompt from selected tags and selections
  const buildFinalPrompt = () => {
    if (!result) return ""
    
    // Start with base prompt elements
    const parts: string[] = []
    
    // Add selected tags
    result.tags.forEach((tag, index) => {
      if (selectedTags.has(index)) {
        const value = editedTags[index] || tag.value
        parts.push(value)
      }
    })
    
    // Add user selections
    Object.values(selections).forEach(value => {
      if (value) parts.push(value)
    })
    
    // Combine into cinematic prompt
    if (parts.length > 0) {
      return `Cinematic shot: ${parts.join(", ")}. ${userPrompt}`
    }
    
    return result.finalPrompt
  }

  // Update final prompt when selections change
  useEffect(() => {
    if (result) {
      setFinalPrompt(buildFinalPrompt())
    }
  }, [selectedTags, editedTags, selections, result])

  // Toggle tag selection
  const toggleTag = (index: number) => {
    setSelectedTags(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  // Edit tag value
  const editTag = (index: number, newValue: string) => {
    setEditedTags(prev => ({
      ...prev,
      [index]: newValue
    }))
  }

  // Handle option selection
  const handleSelectOption = (questionId: string, option: string | undefined) => {
    setSelections(prev => ({
      ...prev,
      [questionId]: option
    }))
  }

  // Build style template from current state
  const buildStyleTemplate = (): VideoStyleTemplate | undefined => {
    if (!result) return undefined
    
    // Get selected tags with any edits applied
    const selectedTagsArray = result.tags
      .map((tag, index) => ({
        ...tag,
        value: editedTags[index] || tag.value
      }))
      .filter((_, index) => selectedTags.has(index))
    
    // Build selections object (only non-undefined values)
    const cleanSelections: Record<string, string> = {}
    Object.entries(selections).forEach(([key, value]) => {
      if (value) cleanSelections[key] = value
    })
    
    return {
      sceneType: result.sceneType,
      tags: selectedTagsArray,
      audioSettings: result.audioSettings,
      finalPrompt: finalPrompt,
      negativePrompt: result.negativePrompt,
      selections: Object.keys(cleanSelections).length > 0 ? cleanSelections : undefined,
      originalPrompt: userPrompt
    }
  }

  // Apply the enhanced prompt
  const handleApply = () => {
    const styleTemplate = buildStyleTemplate()
    onApplyPrompt(finalPrompt, styleTemplate)
    onOpenChange(false)
  }

  // Auto-fetch when dialog opens
  useEffect(() => {
    if (open && !result && !isLoading && !error) {
      fetchEnhancement()
    }
  }, [open])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setResult(null)
      setError(null)
      setSelections({})
      setSelectedTags(new Set())
      setEditedTags({})
      setFinalPrompt("")
    }
  }, [open])

  const tagGroups = result ? groupTagsByType(result.tags) : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 bg-zinc-900 border-zinc-800 text-white overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-zinc-800 bg-gradient-to-r from-purple-900/20 to-blue-900/20">
          <DialogTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
              <Clapperboard className="w-5 h-5" />
            </div>
            AI Prompt 优化助手
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            专业影视级 Prompt 生成 · 点击标签选择/取消 · 双击编辑
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          <div className="space-y-6">
            {/* Original prompt display */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
                <Edit2 className="w-4 h-4" />
                原始创意
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50 text-sm text-zinc-300">
                {userPrompt}
              </div>
              {referenceImages && referenceImages.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <ImageIcon className="w-3 h-3" />
                  已上传 {referenceImages.length} 张参考图片
                </div>
              )}
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-zinc-400">
                <div className="relative">
                  <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
                  <Loader2 className="w-12 h-12 animate-spin text-purple-400 relative" />
                </div>
                <p className="text-sm font-medium mt-6">AI 正在分析你的创意...</p>
                <p className="text-xs text-zinc-500 mt-1">生成专业影视级 Prompt</p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <Alert className="bg-red-500/10 border-red-500/30 text-red-400">
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button variant="outline" size="sm" onClick={fetchEnhancement} className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                    <RefreshCw className="w-3 h-3 mr-1" />
                    重试
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Result display */}
            {result && !isLoading && tagGroups && (
              <>
                {/* Scene type badge */}
                {result.sceneType && SCENE_TYPE_LABELS[result.sceneType] && (
                  <div className="flex items-center gap-3">
                    <Badge className="px-3 py-1.5 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-purple-500/30 text-purple-300">
                      <span className="mr-2">{SCENE_TYPE_LABELS[result.sceneType].icon}</span>
                      {SCENE_TYPE_LABELS[result.sceneType].label}
                    </Badge>
                    <span className="text-xs text-zinc-500">{SCENE_TYPE_LABELS[result.sceneType].description}</span>
                  </div>
                )}

                {/* Image analysis (if available) */}
                {result.imageAnalysis && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
                      <ImageIcon className="w-4 h-4" />
                      图片分析
                    </div>
                    <div className="p-4 bg-blue-500/10 rounded-lg border border-blue-500/20 text-sm space-y-1">
                      <div className="text-zinc-300"><span className="text-blue-400 font-medium">检测到：</span>{result.imageAnalysis.detected.join("、")}</div>
                      <div className="text-zinc-300"><span className="text-blue-400 font-medium">色调：</span>{result.imageAnalysis.colorTone}</div>
                      <div className="text-zinc-300"><span className="text-blue-400 font-medium">风格：</span>{result.imageAnalysis.style}</div>
                    </div>
                  </div>
                )}

                {/* Audio settings (if voice detected) */}
                {result.audioSettings && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-pink-400">
                      <Volume2 className="w-4 h-4" />
                      音频设置
                      {result.audioSettings.hasVoiceover && (
                        <Badge className="ml-2 px-2 py-0.5 bg-pink-500/20 border-pink-500/30 text-pink-300 text-xs">
                          <Mic className="w-3 h-3 mr-1" />
                          检测到人声
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Voiceover settings */}
                      {result.audioSettings.hasVoiceover && result.audioSettings.voiceover && (
                        <div className="p-4 bg-pink-500/10 rounded-lg border border-pink-500/20 space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-pink-300">
                            <Mic className="w-4 h-4" />
                            旁白/口播
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="text-zinc-400">语气：<span className="text-zinc-300">{result.audioSettings.voiceover.tone}</span></div>
                            <div className="text-zinc-400">音色：<span className="text-zinc-300">{result.audioSettings.voiceover.voice}</span></div>
                            <div className="text-zinc-400">语速：<span className="text-zinc-300">{result.audioSettings.voiceover.speed}</span></div>
                            <div className="text-zinc-400">情感：<span className="text-zinc-300">{result.audioSettings.voiceover.emotion}</span></div>
                          </div>
                        </div>
                      )}
                      
                      {/* Background music settings */}
                      {result.audioSettings.backgroundMusic && (
                        <div className="p-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20 space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-indigo-300">
                            <Music className="w-4 h-4" />
                            背景音乐
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="text-zinc-400">风格：<span className="text-zinc-300">{result.audioSettings.backgroundMusic.style}</span></div>
                            <div className="text-zinc-400">节奏：<span className="text-zinc-300">{result.audioSettings.backgroundMusic.tempo}</span></div>
                            <div className="text-zinc-400">情绪：<span className="text-zinc-300">{result.audioSettings.backgroundMusic.mood}</span></div>
                            <div className="text-zinc-400">音量：<span className="text-zinc-300">{result.audioSettings.backgroundMusic.volume}</span></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tag groups - Professional cinematography categories */}
                {Object.entries(tagGroups).map(([groupName, group]) => {
                  if (group.tags.length === 0) return null
                  const config = groupConfig[groupName] || groupConfig["其他"]
                  return (
                    <div key={groupName} className="space-y-3">
                      <div className={cn("flex items-center gap-2 text-sm font-medium", config.color)}>
                        {config.icon}
                        {groupName}
                        <span className="text-xs text-zinc-500">({group.tags.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {group.indices.map((originalIndex, i) => {
                          const tag = result.tags[originalIndex]
                          return (
                            <EditableTag
                              key={originalIndex}
                              tag={{ ...tag, value: editedTags[originalIndex] || tag.value }}
                              isSelected={selectedTags.has(originalIndex)}
                              onToggle={() => toggleTag(originalIndex)}
                              onEdit={(value) => editTag(originalIndex, value)}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )
                })}

                {/* Negative prompt display */}
                {result.negativePrompt && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-red-400">
                      <X className="w-4 h-4" />
                      负面提示 (Negative Prompt)
                    </div>
                    <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20 text-sm text-red-300/80 font-mono">
                      {result.negativePrompt}
                    </div>
                  </div>
                )}

                {/* Questions for user - Optional */}
                {result.questions && result.questions.length > 0 && (
                  <div className="space-y-4 p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium text-yellow-400">
                        <Lightbulb className="w-4 h-4" />
                        可选优化
                      </div>
                      <span className="text-xs text-zinc-500">选择后更精准，不选也可以</span>
                    </div>
                    <div className="space-y-4">
                      {result.questions.map((question) => (
                        <QuestionCard
                          key={question.id}
                          question={question}
                          selectedOption={selections[question.id]}
                          onSelect={(option) => handleSelectOption(question.id, option)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Final prompt preview */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-green-400">
                    <Check className="w-4 h-4" />
                    最终 Prompt
                  </div>
                  <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20 text-sm font-mono text-green-300 leading-relaxed">
                    {finalPrompt}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-zinc-800 bg-zinc-900/80">
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-zinc-400 hover:text-white hover:bg-zinc-800">
              <X className="w-4 h-4 mr-2" />
              取消
            </Button>
            <div className="flex items-center gap-3">
              {result && (
                <Button 
                  variant="outline" 
                  onClick={fetchEnhancement} 
                  disabled={isLoading}
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                >
                  <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
                  重新生成
                </Button>
              )}
              <Button 
                onClick={handleApply} 
                disabled={!result || isLoading}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-medium px-6"
              >
                使用此 Prompt
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
