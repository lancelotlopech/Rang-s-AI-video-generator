"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Download, Upload, Trash2, Type, Palette, Image as ImageIcon, 
  Smartphone, ZoomIn, ZoomOut, Wand2, Check, Square, 
  Save, FolderOpen, Clock, X 
} from "lucide-react"
import { toPng } from "html-to-image"
import { toast } from "sonner"
import { PhoneFrame, type FrameType } from "@/components/studio/phone-frame"
import { presets, generateSmartPreset, type ColorPreset } from "@/lib/presets"
import { fontOptions } from "@/lib/fonts"
import { cn } from "@/lib/utils"
import { useStudioStore } from "@/store/studio-store"

export default function StudioPage() {
  // Store
  const store = useStudioStore()
  
  // Local State (UI only)
  const [zoom, setZoom] = useState(0.25)
  const previewRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [draftName, setDraftName] = useState("")
  const [isDraftSheetOpen, setIsDraftSheetOpen] = useState(false)

  // Dynamic Font Loading
  useEffect(() => {
    const font = fontOptions.find(f => f.value === store.fontFamily)
    if (font?.google) {
      const link = document.createElement('link')
      link.href = `https://fonts.googleapis.com/css2?family=${font.value.replace(/\s+/g, '+')}:wght@400;700&display=swap`
      link.rel = 'stylesheet'
      document.head.appendChild(link)
      return () => {
        document.head.removeChild(link)
      }
    }
  }, [store.fontFamily])

  // Handlers
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          store.setScreenshot(e.target.result as string)
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
      link.download = 'app-store-screenshot.png'
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
    store.setBgType(preset.bgType)
    store.setBgColor(preset.bgColor)
    store.setGradientStart(preset.gradientStart)
    store.setGradientEnd(preset.gradientEnd)
    store.setTitleColor(preset.titleColor)
    store.setSubtitleColor(preset.subtitleColor)
    toast.success(`Applied preset: ${preset.name}`)
  }

  const handleSmartMatch = () => {
    const preset = generateSmartPreset(store.smartColor)
    applyPreset(preset)
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
                  {/* Save New Draft */}
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

                  {/* Drafts List */}
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
                    value={store.title} 
                    onChange={(e) => store.setTitle(e.target.value)} 
                    className="min-h-[80px] resize-y"
                    placeholder="Enter title..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Textarea 
                    value={store.subtitle} 
                    onChange={(e) => store.setSubtitle(e.target.value)} 
                    className="min-h-[80px] resize-y"
                    placeholder="Enter subtitle..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>Font Family</Label>
                  <Select value={store.fontFamily} onValueChange={store.setFontFamily}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent>
                      {fontOptions.map((font) => (
                        <SelectItem key={font.name} value={font.value}>
                          <span style={{ fontFamily: font.value }}>{font.name}</span>
                        </SelectItem>
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
                        value={store.titleSize} 
                        onChange={(e) => store.setTitleSize(Number(e.target.value))}
                        className="w-20 h-8 text-right"
                      />
                    </div>
                    <Slider 
                      value={[store.titleSize]} 
                      min={40} 
                      max={300} 
                      step={1} 
                      onValueChange={(val) => store.setTitleSize(val[0])} 
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label>Subtitle Size</Label>
                      <Input 
                        type="number" 
                        value={store.subtitleSize} 
                        onChange={(e) => store.setSubtitleSize(Number(e.target.value))}
                        className="w-20 h-8 text-right"
                      />
                    </div>
                    <Slider 
                      value={[store.subtitleSize]} 
                      min={20} 
                      max={150} 
                      step={1} 
                      onValueChange={(val) => store.setSubtitleSize(val[0])} 
                    />
                  </div>
                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <Label>Text Position (Y)</Label>
                      <Input 
                        type="number" 
                        value={store.textYOffset} 
                        onChange={(e) => store.setTextYOffset(Number(e.target.value))}
                        className="w-20 h-8 text-right"
                      />
                    </div>
                    <Slider 
                      value={[store.textYOffset]} 
                      min={0} 
                      max={1000} 
                      step={10} 
                      onValueChange={(val) => store.setTextYOffset(val[0])} 
                    />
                  </div>
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
                      value={store.smartColor} 
                      onChange={(e) => store.setSmartColor(e.target.value)} 
                      className="w-10 h-10 p-1 cursor-pointer"
                    />
                    <Input 
                      value={store.smartColor} 
                      onChange={(e) => store.setSmartColor(e.target.value)} 
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
                  <Label>Color Presets</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {presets.map((preset) => (
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
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                          <div className="w-2 h-2 rounded-full" style={{ background: preset.titleColor }} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <Label>Manual Override</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button 
                      variant={store.bgType === 'solid' ? 'default' : 'outline'}
                      onClick={() => store.setBgType('solid')}
                      className="h-8 text-xs"
                    >
                      Solid
                    </Button>
                    <Button 
                      variant={store.bgType === 'gradient' ? 'default' : 'outline'}
                      onClick={() => store.setBgType('gradient')}
                      className="h-8 text-xs"
                    >
                      Gradient
                    </Button>
                  </div>

                  {store.bgType === 'solid' ? (
                    <div className="space-y-2">
                      <Label className="text-xs">Background Color</Label>
                      <div className="flex gap-2">
                        <Input 
                          type="color" 
                          value={store.bgColor} 
                          onChange={(e) => store.setBgColor(e.target.value)} 
                          className="w-8 h-8 p-1 cursor-pointer"
                        />
                        <Input 
                          value={store.bgColor} 
                          onChange={(e) => store.setBgColor(e.target.value)} 
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
                            value={store.gradientStart} 
                            onChange={(e) => store.setGradientStart(e.target.value)} 
                            className="w-8 h-8 p-1 cursor-pointer"
                          />
                          <Input 
                            value={store.gradientStart} 
                            onChange={(e) => store.setGradientStart(e.target.value)} 
                            className="flex-1 h-8"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">End Color</Label>
                        <div className="flex gap-2">
                          <Input 
                            type="color" 
                            value={store.gradientEnd} 
                            onChange={(e) => store.setGradientEnd(e.target.value)} 
                            className="w-8 h-8 p-1 cursor-pointer"
                          />
                          <Input 
                            value={store.gradientEnd} 
                            onChange={(e) => store.setGradientEnd(e.target.value)} 
                            className="flex-1 h-8"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 pt-4 border-t">
                  <Label>Title Color</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      value={store.titleColor} 
                      onChange={(e) => store.setTitleColor(e.target.value)} 
                      className="w-8 h-8 p-1 cursor-pointer"
                    />
                    <Input 
                      value={store.titleColor} 
                      onChange={(e) => store.setTitleColor(e.target.value)} 
                      className="flex-1 h-8"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Subtitle Color</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      value={store.subtitleColor} 
                      onChange={(e) => store.setSubtitleColor(e.target.value)} 
                      className="w-8 h-8 p-1 cursor-pointer"
                    />
                    <Input 
                      value={store.subtitleColor} 
                      onChange={(e) => store.setSubtitleColor(e.target.value)} 
                      className="flex-1 h-8"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Image Controls */}
              <TabsContent value="image" className="space-y-6 m-0">
                <div className="space-y-4">
                  <Label>Device Frame</Label>
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
                      <span className="text-xs font-mono">{Math.round(store.imageScale * 100)}%</span>
                    </div>
                    <Slider 
                      value={[store.imageScale]} 
                      min={0.5} 
                      max={1.2} 
                      step={0.01} 
                      onValueChange={(val) => store.setImageScale(val[0])} 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs text-muted-foreground">Horizontal (X)</Label>
                      <span className="text-xs font-mono">{store.imagePos.x}px</span>
                    </div>
                    <Slider 
                      value={[store.imagePos.x]} 
                      min={-500} 
                      max={500} 
                      step={10} 
                      onValueChange={(val) => store.setImagePos({ ...store.imagePos, x: val[0] })} 
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs text-muted-foreground">Vertical (Y)</Label>
                      <span className="text-xs font-mono">{store.imagePos.y}px</span>
                    </div>
                    <Slider 
                      value={[store.imagePos.y]} 
                      min={-500} 
                      max={500} 
                      step={10} 
                      onValueChange={(val) => store.setImagePos({ ...store.imagePos, y: val[0] })} 
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <Label>App Screenshot</Label>
                  
                  {store.screenshot ? (
                    <div className="relative aspect-[9/19.5] w-full bg-muted rounded-lg overflow-hidden border">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={store.screenshot} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute top-2 right-2">
                        <Button 
                          variant="destructive" 
                          size="icon" 
                          onClick={() => store.setScreenshot(null)}
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
      <div className="flex-1 bg-muted/30 p-8 flex flex-col items-center justify-center overflow-hidden relative">
        {/* Zoom Controls */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-background/80 backdrop-blur p-2 rounded-lg border shadow-sm">
           <ZoomOut className="w-4 h-4 text-muted-foreground" />
           <Slider 
              value={[zoom]} 
              min={0.1} 
              max={1.0} 
              step={0.05} 
              onValueChange={(val) => setZoom(val[0])}
              className="w-32"
           />
           <ZoomIn className="w-4 h-4 text-muted-foreground" />
           <span className="text-xs font-mono w-12 text-right">{Math.round(zoom * 100)}%</span>
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
           <p className="text-9xl font-bold text-muted-foreground/5 -rotate-12 select-none">PREVIEW</p>
        </div>

        {/* Canvas Container - Scaled to fit */}
        <div className="relative h-full w-full flex items-center justify-center overflow-auto">
          <div 
            className="origin-center shadow-2xl transition-transform duration-200 shrink-0"
            style={{
              width: 1290,
              height: 2796,
              transform: `scale(${zoom})`
            }}
          >
            {/* The Actual Canvas to Export */}
            <div 
              ref={previewRef}
              className="w-full h-full flex flex-col items-center px-16 relative overflow-hidden"
              style={{ 
                background: store.bgType === 'solid' ? store.bgColor : `linear-gradient(180deg, ${store.gradientStart} 0%, ${store.gradientEnd} 100%)`,
                fontFamily: store.fontFamily
              }}
            >
              {/* Text Area (Floating Layer) */}
              <div 
                className="absolute top-0 left-0 w-full flex flex-col items-center z-20 pointer-events-none transition-transform duration-200"
                style={{ transform: `translateY(${store.textYOffset}px)` }}
              >
                <div className="text-center space-y-8 max-w-[1100px]">
                  <h1 
                    className="font-bold leading-tight tracking-tight"
                    style={{ 
                      color: store.titleColor, 
                      fontSize: `${store.titleSize}px`,
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {store.title}
                  </h1>
                  <h2 
                    className="font-medium opacity-90"
                    style={{ 
                      color: store.subtitleColor, 
                      fontSize: `${store.subtitleSize}px`,
                      whiteSpace: 'pre-wrap'
                    }}
                  >
                    {store.subtitle}
                  </h2>
                </div>
              </div>

              {/* Screenshot Area (Base Layer) */}
              <div 
                className="mt-auto w-full flex justify-center relative z-0 transition-transform duration-200"
                style={{
                  transform: `translate(${store.imagePos.x}px, ${store.imagePos.y}px) scale(${store.imageScale})`,
                  transformOrigin: 'bottom center'
                }}
              >
                 <PhoneFrame 
                   type={store.frameType} 
                   src={store.screenshot} 
                   customRadius={store.cornerRadius}
                 />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
