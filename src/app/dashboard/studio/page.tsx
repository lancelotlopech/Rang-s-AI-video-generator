"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Download, Upload, Trash2, Type, Palette, Image as ImageIcon, 
  Smartphone, Wand2, Square, 
  Save, FolderOpen, Clock, X, Plus, Maximize2, Copy,
  ChevronDown, ChevronUp, Dices, Undo2, Redo2
} from "lucide-react"
import { toPng } from "html-to-image"
import { toast } from "sonner"
import { presets, generateSmartPreset, type ColorPreset } from "@/lib/presets"
import { fontOptions } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { useStudioStore } from "@/store/studio-store"
import { CanvasPreview } from "@/components/studio/canvas-preview"

export default function StudioPage() {
  // Store
  const store = useStudioStore()
  const { undo, redo } = useStudioStore.temporal.getState()
  const activePage = store.pages.find(p => p.id === store.activePageId) || store.pages[0]
  
  // Subscribe to temporal state changes for UI updates
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  useEffect(() => {
    const unsub = useStudioStore.temporal.subscribe((state) => {
      setCanUndo(state.pastStates.length > 0)
      setCanRedo(state.futureStates.length > 0)
    })
    return unsub
  }, [])

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault()
        if (e.shiftKey) {
          if (useStudioStore.temporal.getState().futureStates.length > 0) {
            redo()
            toast.success("Redo")
          }
        } else {
          if (useStudioStore.temporal.getState().pastStates.length > 0) {
            undo()
            toast.success("Undo")
          }
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])
  
  // Local State
  const previewContainerRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const fullscreenContainerRef = useRef<HTMLDivElement>(null)
  
  const [scale, setScale] = useState(0.25)
  const [fullscreenScale, setFullscreenScale] = useState(0.3)
  const [isExporting, setIsExporting] = useState(false)
  const [draftName, setDraftName] = useState("")
  const [isDraftSheetOpen, setIsDraftSheetOpen] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isPresetsOpen, setIsPresetsOpen] = useState(true)
  const [activePresetCategory, setActivePresetCategory] = useState<'solid' | 'light-gradient' | 'dark-gradient' | 'featured' | 'custom'>('featured')

  // Auto-Fit Scale for Main Preview
  useEffect(() => {
    const updateScale = () => {
      if (!previewContainerRef.current) return
      const { width, height } = previewContainerRef.current.getBoundingClientRect()
      // Target: 1290 x 2796
      // Padding: 40px
      const availableW = width - 40
      const availableH = height - 40
      const scaleW = availableW / 1290
      const scaleH = availableH / 2796
      // Fit to screen, but max 0.8
      setScale(Math.min(scaleW, scaleH, 0.8)) 
    }
    
    window.addEventListener('resize', updateScale)
    // Initial delay to allow layout to settle
    const timer = setTimeout(updateScale, 100)
    return () => {
      window.removeEventListener('resize', updateScale)
      clearTimeout(timer)
    }
  }, [store.pages.length])

  // Auto-Fit Scale for Fullscreen
  useEffect(() => {
    if (isFullscreen && fullscreenContainerRef.current) {
      const updateFullscreenScale = () => {
        if (!fullscreenContainerRef.current) return
        const { width, height } = fullscreenContainerRef.current.getBoundingClientRect()
        // Padding: 40px
        const s = Math.min((width - 40) / 1290, (height - 40) / 2796)
        setFullscreenScale(s)
      }
      
      // Initial calc
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(updateFullscreenScale)
      
      window.addEventListener('resize', updateFullscreenScale)
      return () => window.removeEventListener('resize', updateFullscreenScale)
    }
  }, [isFullscreen])

  // Preload All Fonts for Preview
  useEffect(() => {
    // Group fonts to avoid URL length limits (approx 10 fonts per request)
    const googleFonts = fontOptions.filter(f => f.google)
    const chunks = []
    const chunkSize = 10
    
    for (let i = 0; i < googleFonts.length; i += chunkSize) {
      chunks.push(googleFonts.slice(i, i + chunkSize))
    }

    const links: HTMLLinkElement[] = []

    chunks.forEach(chunk => {
      const families = chunk.map(f => `${f.value.replace(/\s+/g, '+')}:wght@400;700`).join('&family=')
      const link = document.createElement('link')
      link.href = `https://fonts.googleapis.com/css2?family=${families}&display=swap`
      link.rel = 'stylesheet'
      document.head.appendChild(link)
      links.push(link)
    })

    return () => {
      links.forEach(link => document.head.removeChild(link))
    }
  }, [])

  // Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          store.updateActivePage({ screenshot: e.target.result as string })
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleExport = async () => {
    if (!previewRef.current) return
    
    try {
      setIsExporting(true)
      const dataUrl = await toPng(previewRef.current, {
        quality: 1.0,
        pixelRatio: 1,
        width: 1290,
        height: 2796,
        canvasWidth: 1290,
        canvasHeight: 2796,
      })
      
      const link = document.createElement('a')
      link.download = `app-store-screenshot-${activePage.id.slice(0, 4)}.png`
      link.href = dataUrl
      link.click()
      
      toast.success("Screenshot exported successfully!")
    } catch (err) {
      console.error(err)
      toast.error("Failed to export image")
    } finally {
      setIsExporting(false)
    }
  }

  const applyPreset = (preset: ColorPreset) => {
    store.updateActivePage({
      bgType: preset.bgType,
      bgColor: preset.bgColor,
      gradientStart: preset.gradientStart,
      gradientEnd: preset.gradientEnd,
      titleColor: preset.titleColor,
      subtitleColor: preset.subtitleColor
    })
    toast.success(`Applied preset: ${preset.name}`)
  }

  const handleSmartMatch = () => {
    const preset = generateSmartPreset(activePage.smartColor)
    applyPreset(preset)
  }

  const handleRandomize = () => {
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')
    const preset = generateSmartPreset(randomColor)
    applyPreset(preset)
    toast.success("Random style generated!")
  }

  const handleSaveDraft = () => {
    if (!draftName.trim()) {
      toast.error("Please enter a draft name")
      return
    }
    store.saveDraft(draftName)
    setDraftName("")
    toast.success("Draft saved successfully")
  }

  const handleLoadDraft = (id: string) => {
    store.loadDraft(id)
    setIsDraftSheetOpen(false)
    toast.success("Draft loaded")
  }

  const handleSavePreset = () => {
    const preset: ColorPreset = {
      id: `custom-${Date.now()}`,
      name: 'Custom Preset',
      bgType: activePage.bgType,
      bgColor: activePage.bgColor,
      gradientStart: activePage.gradientStart,
      gradientEnd: activePage.gradientEnd,
      titleColor: activePage.titleColor,
      subtitleColor: activePage.subtitleColor,
      category: 'solid' // Not used for custom presets display logic
    }
    store.savePreset(preset)
    toast.success("Preset saved to 'Custom' tab")
    setActivePresetCategory('custom')
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden">
      {/* Left: Controls */}
      <div className="w-full lg:w-[400px] border-r bg-background flex flex-col">
        <div className="p-6 pb-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Smartphone className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-xl font-bold">App Store Studio</h1>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center bg-muted rounded-md p-1 mr-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={() => { undo(); toast.success("Undo") }}
                  disabled={!canUndo}
                  title="Undo (Cmd+Z)"
                >
                  <Undo2 className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={() => { redo(); toast.success("Redo") }}
                  disabled={!canRedo}
                  title="Redo (Cmd+Shift+Z)"
                >
                  <Redo2 className="w-4 h-4" />
                </Button>
              </div>
            
              {/* Drafts Dialog */}
              <Dialog open={isDraftSheetOpen} onOpenChange={setIsDraftSheetOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <FolderOpen className="w-4 h-4" />
                    Drafts
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Design Drafts</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-6">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Draft Name (e.g. Blue Theme V1)" 
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                      />
                      <Button onClick={handleSaveDraft}>
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                    </div>

                    <ScrollArea className="h-[400px]">
                      <div className="space-y-2 pr-4">
                        {store.drafts.length === 0 && (
                          <div className="text-center text-muted-foreground py-8">
                            No drafts saved yet.
                          </div>
                        )}
                        {store.drafts.map((draft) => (
                          <div key={draft.id} className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                            <div className="flex flex-col gap-1">
                              <span className="font-medium">{draft.name}</span>
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {new Date(draft.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="secondary" onClick={() => handleLoadDraft(draft.id)}>
                                Load
                              </Button>
                              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => store.deleteDraft(draft.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <Tabs defaultValue="text" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6">
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="text"><Type className="w-4 h-4 mr-2" /> Text</TabsTrigger>
              <TabsTrigger value="style"><Palette className="w-4 h-4 mr-2" /> Style</TabsTrigger>
              <TabsTrigger value="image"><ImageIcon className="w-4 h-4 mr-2" /> Image</TabsTrigger>
            </TabsList>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Text Controls */}
              <TabsContent value="text" className="space-y-6 m-0">
                <div className="space-y-2">
                  <Label>Main Title</Label>
                  <Textarea 
                    value={activePage.title} 
                    onChange={(e) => store.updateActivePage({ title: e.target.value })} 
                    className="min-h-[80px] resize-y"
                    placeholder="Enter title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Textarea 
                    value={activePage.subtitle} 
                    onChange={(e) => store.updateActivePage({ subtitle: e.target.value })} 
                    className="min-h-[80px] resize-y"
                    placeholder="Enter subtitle..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Font Family (Global)</Label>
                  <Select value={store.fontFamily} onValueChange={store.setFontFamily}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {['Sans Serif', 'Serif', 'Display', 'Handwriting', 'Monospace'].map((category) => (
                        <SelectGroup key={category}>
                          <SelectLabel className="text-xs font-bold text-muted-foreground mt-2 sticky top-0 bg-popover z-10">
                            {category}
                          </SelectLabel>
                          {fontOptions
                            .filter(f => f.category === category)
                            .map((font) => (
                              <SelectItem key={font.name} value={font.value} className="py-2">
                                <span style={{ fontFamily: font.value, fontSize: '16px' }}>
                                  {font.name}
                                </span>
                              </SelectItem>
                            ))}
                        </SelectGroup>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Title Size</Label>
                      <Input 
                        type="number" 
                        value={activePage.titleSize} 
                        onChange={(e) => store.updateActivePage({ titleSize: Number(e.target.value) })}
                        className="w-20 h-8 text-right"
                      />
                    </div>
                    <Slider 
                      value={[activePage.titleSize]} 
                      min={40} 
                      max={300} 
                      step={1} 
                      onValueChange={(val) => store.updateActivePage({ titleSize: val[0] })} 
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Subtitle Size</Label>
                      <Input 
                        type="number" 
                        value={activePage.subtitleSize} 
                        onChange={(e) => store.updateActivePage({ subtitleSize: Number(e.target.value) })}
                        className="w-20 h-8 text-right"
                      />
                    </div>
                    <Slider 
                      value={[activePage.subtitleSize]} 
                      min={20} 
                      max={150} 
                      step={1} 
                      onValueChange={(val) => store.updateActivePage({ subtitleSize: val[0] })} 
                    />
                  </div>
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <Label>Text Position (Y)</Label>
                      <Input 
                        type="number" 
                        value={activePage.textYOffset} 
                        onChange={(e) => store.updateActivePage({ textYOffset: Number(e.target.value) })}
                        className="w-20 h-8 text-right"
                      />
                    </div>
                    <Slider 
                      value={[activePage.textYOffset]} 
                      min={0} 
                      max={1000} 
                      step={10} 
                      onValueChange={(val) => store.updateActivePage({ textYOffset: val[0] })} 
                    />
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <Label>Title Color</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      value={activePage.titleColor} 
                      onChange={(e) => store.updateActivePage({ titleColor: e.target.value })} 
                      className="w-8 h-8 p-1 cursor-pointer"
                    />
                    <Input 
                      value={activePage.titleColor} 
                      onChange={(e) => store.updateActivePage({ titleColor: e.target.value })} 
                      className="flex-1 h-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Subtitle Color</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      value={activePage.subtitleColor} 
                      onChange={(e) => store.updateActivePage({ subtitleColor: e.target.value })} 
                      className="w-8 h-8 p-1 cursor-pointer"
                    />
                    <Input 
                      value={activePage.subtitleColor} 
                      onChange={(e) => store.updateActivePage({ subtitleColor: e.target.value })} 
                      className="flex-1 h-8"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => { 
                      store.syncTextStylesToAll()
                      toast.success("Text styles synced to all pages") 
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Sync Text Style to All Pages
                  </Button>
                </div>
              </TabsContent>

              {/* Style Controls */}
              <TabsContent value="style" className="space-y-6 m-0">
                {/* Smart Match */}
                <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Wand2 className="w-4 h-4 text-purple-500" />
                    <Label className="font-semibold">Smart Match</Label>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      value={activePage.smartColor} 
                      onChange={(e) => store.updateActivePage({ smartColor: e.target.value })} 
                      className="w-10 h-10 p-1 cursor-pointer"
                    />
                    <Input 
                      value={activePage.smartColor} 
                      onChange={(e) => store.updateActivePage({ smartColor: e.target.value })} 
                      className="flex-1 font-mono"
                      placeholder="#000000"
                    />
                    <Button onClick={handleSmartMatch} size="sm" className="bg-purple-600 hover:bg-purple-700">
                      Generate
                    </Button>
                  </div>
                </div>

                {/* Presets */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Color Presets</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0" 
                      onClick={() => setIsPresetsOpen(!isPresetsOpen)}
                    >
                      {isPresetsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>
                  
                  {isPresetsOpen && (
                    <div className="space-y-3">
                      {/* Category Tabs */}
                      <div className="flex flex-wrap gap-1 p-1 bg-muted rounded-lg">
                        <button
                          className={cn(
                            "flex-1 min-w-[50px] text-xs py-1.5 rounded-md transition-all font-medium",
                            activePresetCategory === 'featured' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                          )}
                          onClick={() => setActivePresetCategory('featured')}
                        >
                          Featured
                        </button>
                        <button
                          className={cn(
                            "flex-1 min-w-[50px] text-xs py-1.5 rounded-md transition-all font-medium",
                            activePresetCategory === 'solid' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                          )}
                          onClick={() => setActivePresetCategory('solid')}
                        >
                          Solid
                        </button>
                        <button
                          className={cn(
                            "flex-1 min-w-[50px] text-xs py-1.5 rounded-md transition-all font-medium",
                            activePresetCategory === 'light-gradient' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                          )}
                          onClick={() => setActivePresetCategory('light-gradient')}
                        >
                          Light
                        </button>
                        <button
                          className={cn(
                            "flex-1 min-w-[50px] text-xs py-1.5 rounded-md transition-all font-medium",
                            activePresetCategory === 'dark-gradient' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                          )}
                          onClick={() => setActivePresetCategory('dark-gradient')}
                        >
                          Dark
                        </button>
                        <button
                          className={cn(
                            "flex-1 min-w-[50px] text-xs py-1.5 rounded-md transition-all font-medium",
                            activePresetCategory === 'custom' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                          )}
                          onClick={() => setActivePresetCategory('custom')}
                        >
                          Custom
                        </button>
                      </div>

                      <ScrollArea className="h-[240px] pr-3">
                        {activePresetCategory === 'custom' && (
                          <div className="mb-2 px-1">
                            <p className="text-xs text-muted-foreground">
                              Customize colors below and click "Save Preset" to add here.
                            </p>
                          </div>
                        )}
                        <div className="grid grid-cols-4 gap-2 pb-2">
                          {/* Random Button - Visible except in Custom */}
                          {activePresetCategory !== 'custom' && (
                            <button
                              onClick={handleRandomize}
                              className="group relative aspect-square rounded-md overflow-hidden border shadow-sm hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-ring bg-muted flex items-center justify-center"
                              title="Randomize"
                            >
                              <Dices className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                            </button>
                          )}

                          {/* Presets List */}
                          {activePresetCategory === 'custom' ? (
                            <>
                              {store.savedPresets.length === 0 && (
                                <div className="col-span-4 text-center py-8 text-xs text-muted-foreground border-2 border-dashed rounded-lg">
                                  No saved presets yet
                                </div>
                              )}
                              {store.savedPresets.map((preset) => (
                                <div key={preset.id} className="relative group">
                                  <button
                                    onClick={() => applyPreset(preset)}
                                    className="w-full aspect-square rounded-md overflow-hidden border shadow-sm hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-ring relative"
                                    title={preset.name}
                                  >
                                    <div 
                                      className="absolute inset-0"
                                      style={{ 
                                        background: preset.bgType === 'solid' 
                                          ? preset.bgColor 
                                          : `linear-gradient(135deg, ${preset.gradientStart}, ${preset.gradientEnd})`
                                      }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <span 
                                        className="text-sm font-bold" 
                                        style={{ color: preset.titleColor }}
                                      >
                                        Aa
                                      </span>
                                    </div>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      store.deletePreset(preset.id)
                                    }}
                                    className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                            </>
                          ) : (
                            presets
                              .filter(p => p.category === activePresetCategory)
                              .map((preset) => (
                              <button
                                key={preset.id}
                                onClick={() => applyPreset(preset)}
                                className="group relative aspect-square rounded-md overflow-hidden border shadow-sm hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-ring"
                                title={preset.name}
                              >
                                <div 
                                  className="absolute inset-0"
                                  style={{ 
                                    background: preset.bgType === 'solid' 
                                      ? preset.bgColor 
                                      : `linear-gradient(135deg, ${preset.gradientStart}, ${preset.gradientEnd})`
                                  }}
                                />
                                {/* Preview Text Contrast */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <span 
                                    className="text-sm font-bold" 
                                    style={{ color: preset.titleColor }}
                                  >
                                    Aa
                                  </span>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <Label>Manual Override</Label>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      onClick={handleSavePreset}
                    >
                      <Save className="w-3 h-3" />
                      Save Preset
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant={activePage.bgType === 'solid' ? 'default' : 'outline'}
                      onClick={() => store.updateActivePage({ bgType: 'solid' })}
                      className="h-8 text-xs"
                    >
                      Solid
                    </Button>
                    <Button 
                      variant={activePage.bgType === 'gradient' ? 'default' : 'outline'}
                      onClick={() => store.updateActivePage({ bgType: 'gradient' })}
                      className="h-8 text-xs"
                    >
                      Gradient
                    </Button>
                  </div>

                  {activePage.bgType === 'solid' ? (
                    <div className="space-y-2">
                      <Label className="text-xs">Background Color</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="color" 
                          value={activePage.bgColor} 
                          onChange={(e) => store.updateActivePage({ bgColor: e.target.value })} 
                          className="w-8 h-8 p-1 cursor-pointer"
                        />
                        <Input 
                          value={activePage.bgColor} 
                          onChange={(e) => store.updateActivePage({ bgColor: e.target.value })} 
                          className="flex-1 h-8"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="space-y-2">
                        <Label className="text-xs">Start Color</Label>
                        <div className="flex gap-2">
                          <Input 
                            type="color" 
                            value={activePage.gradientStart} 
                            onChange={(e) => store.updateActivePage({ gradientStart: e.target.value })} 
                            className="w-8 h-8 p-1 cursor-pointer"
                          />
                          <Input 
                            value={activePage.gradientStart} 
                            onChange={(e) => store.updateActivePage({ gradientStart: e.target.value })} 
                            className="flex-1 h-8"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">End Color</Label>
                        <div className="flex gap-2">
                          <Input 
                            type="color" 
                            value={activePage.gradientEnd} 
                            onChange={(e) => store.updateActivePage({ gradientEnd: e.target.value })} 
                            className="w-8 h-8 p-1 cursor-pointer"
                          />
                          <Input 
                            value={activePage.gradientEnd} 
                            onChange={(e) => store.updateActivePage({ gradientEnd: e.target.value })} 
                            className="flex-1 h-8"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => { 
                      store.syncBackgroundStylesToAll()
                      toast.success("Background styles synced to all pages") 
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Sync Background to All Pages
                  </Button>
                </div>
              </TabsContent>

              {/* Image Controls */}
              <TabsContent value="image" className="space-y-6 m-0">
                <div className="space-y-4">
                  <Label>Device Frame (Global)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={store.frameType === 'iphone-17-pro' ? 'default' : 'outline'}
                      className="flex flex-col h-20 gap-2"
                      onClick={() => store.setFrameType('iphone-17-pro')}
                    >
                      <Smartphone className="w-6 h-6" />
                      <span className="text-xs">iPhone 17 Pro</span>
                    </Button>
                    <Button
                      variant={store.frameType === 'iphone-17' ? 'default' : 'outline'}
                      className="flex flex-col h-20 gap-2"
                      onClick={() => store.setFrameType('iphone-17')}
                    >
                      <Smartphone className="w-6 h-6" />
                      <span className="text-xs">iPhone 17</span>
                    </Button>
                    <Button
                      variant={store.frameType === 'iphone-se' ? 'default' : 'outline'}
                      className="flex flex-col h-20 gap-2"
                      onClick={() => store.setFrameType('iphone-se')}
                    >
                      <div className="w-6 h-10 border-2 rounded-lg flex flex-col items-center justify-between py-1">
                         <div className="w-3 h-0.5 bg-current rounded-full" />
                         <div className="w-1 h-1 bg-current rounded-full" />
                      </div>
                      <span className="text-xs">iPhone SE</span>
                    </Button>
                    <Button
                      variant={store.frameType === 'minimal' ? 'default' : 'outline'}
                      className="flex flex-col h-20 gap-2"
                      onClick={() => store.setFrameType('minimal')}
                    >
                      <Square className="w-6 h-6" />
                      <span className="text-xs">Minimal</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <Label>Image Position & Scale</Label>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs text-muted-foreground">Scale</Label>
                      <Input 
                        type="number" 
                        value={activePage.imageScale} 
                        onChange={(e) => store.updateActivePage({ imageScale: Number(e.target.value) })}
                        step={0.01}
                        min={0.1}
                        max={2}
                        className="w-20 h-8 text-right"
                      />
                    </div>
                    <Slider 
                      value={[activePage.imageScale]} 
                      min={0.5} 
                      max={1.2} 
                      step={0.01} 
                      onValueChange={(val) => store.updateActivePage({ imageScale: val[0] })} 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs text-muted-foreground">Horizontal (X)</Label>
                      <Input 
                        type="number" 
                        value={activePage.imagePos.x} 
                        onChange={(e) => store.updateActivePage({ imagePos: { ...activePage.imagePos, x: Number(e.target.value) } })}
                        className="w-20 h-8 text-right"
                      />
                    </div>
                    <Slider 
                      value={[activePage.imagePos.x]} 
                      min={-500} 
                      max={500} 
                      step={10} 
                      onValueChange={(val) => store.updateActivePage({ imagePos: { ...activePage.imagePos, x: val[0] } })} 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs text-muted-foreground">Vertical (Y)</Label>
                      <Input 
                        type="number" 
                        value={activePage.imagePos.y} 
                        onChange={(e) => store.updateActivePage({ imagePos: { ...activePage.imagePos, y: Number(e.target.value) } })}
                        className="w-20 h-8 text-right"
                      />
                    </div>
                    <Slider 
                      value={[activePage.imagePos.y]} 
                      min={-500} 
                      max={500} 
                      step={10} 
                      onValueChange={(val) => store.updateActivePage({ imagePos: { ...activePage.imagePos, y: val[0] } })} 
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <Label>App Screenshot</Label>
                  
                  {activePage.screenshot ? (
                    <div className="relative aspect-[9/19.5] w-full bg-muted rounded-lg overflow-hidden border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={activePage.screenshot} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2">
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          onClick={() => store.updateActivePage({ screenshot: null })}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4 hover:bg-muted/50 transition-colors cursor-pointer relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileUpload}
                      />
                      <div className="flex justify-center">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">Click to upload screenshot</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full" 
                    onClick={() => { 
                      store.syncImageStylesToAll()
                      toast.success("Image layout synced to all pages") 
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Sync Image Layout to All Pages
                  </Button>
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>

        <div className="p-6 border-t bg-background">
          <Button className="w-full h-12 text-lg" onClick={handleExport} disabled={isExporting}>
            <Download className="mr-2 h-5 w-5" />
            {isExporting ? "Exporting..." : "Export Image"}
          </Button>
        </div>
      </div>

      {/* Right: Preview */}
      <div className="flex-1 bg-muted/30 flex flex-col overflow-hidden relative">
        {/* Top Bar: Zoom & Fullscreen */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-background/80 backdrop-blur p-2 rounded-lg border shadow-sm">
           <span className="text-xs font-mono text-muted-foreground px-2">
             {Math.round(scale * 100)}% (Auto)
           </span>
           <div className="h-4 w-px bg-border mx-1" />
           <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsFullscreen(true)}>
             <Maximize2 className="w-4 h-4" />
           </Button>
        </div>

        {/* Main Preview Area */}
        <div 
          ref={previewContainerRef}
          className="flex-1 flex items-center justify-center overflow-hidden relative p-10"
        >
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <p className="text-9xl font-bold text-muted-foreground/5 -rotate-12 select-none">PREVIEW</p>
          </div>

          <div 
            className="origin-center shadow-2xl transition-transform duration-200 shrink-0"
            style={{
              width: 1290 * scale,
              height: 2796 * scale
            }}
          >
            <CanvasPreview 
              ref={previewRef}
              page={activePage}
              fontFamily={store.fontFamily}
              frameType={store.frameType}
              cornerRadius={store.cornerRadius}
              scale={scale}
            />
          </div>
        </div>

        {/* Bottom: Pages Thumbnails */}
        <div className="h-40 border-t bg-background p-4 flex gap-4 overflow-x-auto shrink-0 items-center">
          {store.pages.map((page, index) => (
            <div 
              key={page.id}
              onClick={() => store.setActivePage(page.id)}
              className={cn(
                "aspect-[9/19.5] h-full border-2 rounded-md cursor-pointer relative overflow-hidden group transition-all hover:scale-105", 
                page.id === store.activePageId ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-muted-foreground/50"
              )}
            >
              {/* Live Mini Preview */}
              <CanvasPreview 
                page={page}
                fontFamily={store.fontFamily}
                frameType={store.frameType}
                cornerRadius={store.cornerRadius}
                scale={0.045} // Approx scale for thumbnail
                className="pointer-events-none"
              />
              
              {/* Page Number Badge */}
              <div className="absolute bottom-1 right-1 bg-black/50 text-white text-[10px] px-1.5 rounded-full backdrop-blur z-10">
                {index + 1}
              </div>

              {/* Delete Button (Hover) */}
              {store.pages.length > 1 && (
                <div 
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  onClick={(e) => {
                    e.stopPropagation()
                    store.removePage(page.id)
                  }}
                >
                  <div className="bg-destructive text-destructive-foreground p-1 rounded-md hover:bg-destructive/90">
                    <X className="w-3 h-3" />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add Page Button */}
          <Button 
            variant="outline" 
            className="h-full aspect-[9/19.5] flex flex-col gap-2 border-dashed"
            onClick={store.addPage}
          >
            <Plus className="w-6 h-6" />
            <span className="text-xs">Add Page</span>
          </Button>
        </div>
      </div>

      {/* Fullscreen Preview Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-[95vw] h-[95vh] p-0 border-none bg-transparent shadow-none flex items-center justify-center">
           <div 
              ref={fullscreenContainerRef}
              className="relative shadow-2xl overflow-hidden rounded-xl flex items-center justify-center"
              style={{
                width: '100%',
                height: '100%'
              }}
           >
              {/* Fullscreen Canvas */}
              <div style={{ width: 1290 * fullscreenScale, height: 2796 * fullscreenScale }}>
                <CanvasPreview 
                  page={activePage}
                  fontFamily={store.fontFamily}
                  frameType={store.frameType}
                  cornerRadius={store.cornerRadius}
                  scale={fullscreenScale}
                />
              </div>
              
              {/* Close Button */}
              <Button 
                variant="secondary" 
                size="icon" 
                className="absolute top-4 right-4 rounded-full z-50"
                onClick={() => setIsFullscreen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
           </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
