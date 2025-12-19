"use client"

import { useState, useEffect } from "react"
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
import { Smartphone, Download, Loader2, Upload, CheckCircle2, ArrowRight, Image as ImageIcon } from "lucide-react"
import { toast } from "sonner"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useLanguage } from "@/components/language-provider"

interface ImageModel {
  id: string
  name: string
  credits: number
}

// 目标尺寸配置
const EXPORT_SIZES = [
  { name: "iPhone 6.7\"", width: 1290, height: 2796, type: "phone" },
  { name: "iPhone 6.5\"", width: 1242, height: 2688, type: "phone" },
  { name: "iPhone 6.1\"", width: 1170, height: 2532, type: "phone" },
  { name: "iPhone 5.5\"", width: 1242, height: 2208, type: "phone" },
  { name: "iPad 12.9\"", width: 2048, height: 2732, type: "pad" },
  { name: "iPad 11\"", width: 1668, height: 2388, type: "pad" },
  { name: "iPad mini 8.3\"", width: 1488, height: 2266, type: "pad" }
]

export default function ScreenshotPage() {
  const { t } = useLanguage()
  const [prompt, setPrompt] = useState("")
  // 生成的主图 (默认为 1290x2796)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  
  // 生成步骤状态: idle -> generating -> upscaling -> done
  const [generationStep, setGenerationStep] = useState<'idle' | 'generating' | 'upscaling' | 'done'>('idle')
  
  const [isLoading, setIsLoading] = useState(false)
  const [models, setModels] = useState<ImageModel[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string>("")

  // Resizer 状态
  const [sourceImage, setSourceImage] = useState<string | null>(null)
  const [selectedSizes, setSelectedSizes] = useState<string[]>(EXPORT_SIZES.filter(s => s.type === "phone").map(s => s.name))
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedImages, setProcessedImages] = useState<{name: string, url: string}[]>([])

  useEffect(() => {
    // Load models
    try {
      const modelsConfig = process.env.NEXT_PUBLIC_IMAGE_MODELS
      if (modelsConfig) {
        const parsedModels = JSON.parse(modelsConfig) as ImageModel[]
        setModels(parsedModels)
        if (parsedModels.length > 0) {
          setSelectedModelId(parsedModels[0].id)
        }
      }
    } catch (e) {
      console.error("Failed to parse image models config", e)
    }
  }, [])

  const selectedModel = models.find((m) => m.id === selectedModelId)

  const onSubmit = async () => {
    if (!prompt) {
      toast.error(t("screenshot.messages.prompt_required"))
      return
    }

    try {
      setIsLoading(true)
      setGenerationStep('generating')
      setGeneratedImage(null)

      // 1. 生成初始图 (1024x1792)
      const response = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model: selectedModelId }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        
        // 优化错误提示
        if (response.status === 429 || errorText.includes("load") || errorText.includes("busy")) {
           throw new Error(t("screenshot.messages.server_busy"))
        }
        
        throw new Error(errorText || t("screenshot.messages.error_generic"))
      }

      const data = await response.json()
      const rawImageUrl = data.url
      
      // 立即展示原图
      setGeneratedImage(rawImageUrl)
      setSourceImage(rawImageUrl)
      
      // 2. 自动 Upscale 到 iPhone 6.7" (1290x2796)
      setGenerationStep('upscaling')
      toast.info(t("screenshot.messages.generate_success"))
      
      const upscaleResponse = await fetch("/api/process/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageUrl: rawImageUrl,
          width: 1290,
          height: 2796,
          fit: "cover"
        })
      })

      if (upscaleResponse.ok) {
        const upscaleData = await upscaleResponse.json()
        setGeneratedImage(upscaleData.url)
        setSourceImage(upscaleData.url)
        toast.success(t("screenshot.messages.enhance_success"))
      } else {
        // 降级：如果 upscale 失败，保留原图
        toast.warning(t("screenshot.messages.enhance_failed"))
      }

    } catch (error: any) {
      console.error(error)
      toast.error(error.message || t("screenshot.messages.error_generic"))
    } finally {
      setIsLoading(false)
      setGenerationStep('idle')
    }
  }

  const handleBatchProcess = async () => {
    if (!sourceImage) return
    
    try {
      setIsProcessing(true)
      setProcessedImages([])
      const results = []

      for (const sizeName of selectedSizes) {
        const sizeConfig = EXPORT_SIZES.find(s => s.name === sizeName)
        if (!sizeConfig) continue

        // iPad 使用 contain 模式 (模糊背景)，手机使用 cover 模式 (裁切)
        const fitMode = sizeConfig.type === "pad" ? "contain" : "cover"

        const response = await fetch("/api/process/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrl: sourceImage,
            width: sizeConfig.width,
            height: sizeConfig.height,
            format: "jpg",
            fit: fitMode
          })
        })

        if (response.ok) {
          const data = await response.json()
          results.push({ name: sizeName, url: data.url })
          setProcessedImages(prev => [...prev, { name: sizeName, url: data.url }])
        }
      }
      
      toast.success(t("screenshot.messages.batch_success").replace("{count}", results.length.toString()))
    } catch (error) {
      console.error(error)
      toast.error(t("screenshot.messages.error_generic"))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setSourceImage(e.target.result as string)
          setProcessedImages([]) // 清空旧的结果
          toast.success(t("screenshot.messages.upload_success"))
        }
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <div className="p-8 space-y-12 max-w-6xl mx-auto pb-32">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-violet-500/10">
          <Smartphone className="w-8 h-8 text-violet-600" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("screenshot.title")}</h2>
          <p className="text-muted-foreground">
            {t("screenshot.subtitle")}
          </p>
        </div>
      </div>

      {/* Generator Section */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("screenshot.generator.title")}</CardTitle>
              <CardDescription>{t("screenshot.generator.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("screenshot.generator.prompt_label")}</Label>
                <Textarea 
                  placeholder={t("screenshot.generator.prompt_placeholder")}
                  className="h-32 resize-none"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {models.length > 0 && (
                <div className="space-y-2">
                  <Label>{t("screenshot.generator.model_label")}</Label>
                  <Select value={selectedModelId} onValueChange={setSelectedModelId} disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("screenshot.generator.select_model")} />
                    </SelectTrigger>
                    <SelectContent>
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name} ({model.credits} Credits)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button 
                className="w-full bg-violet-600 hover:bg-violet-700 h-12 text-lg transition-all"
                onClick={onSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    {generationStep === 'generating' && t("screenshot.generator.btn_generating")}
                    {generationStep === 'upscaling' && t("screenshot.generator.btn_upscaling")}
                  </>
                ) : (
                  t("screenshot.generator.btn_generate")
                )}
              </Button>
              
              {/* Status Hint */}
              {isLoading && (
                 <p className="text-center text-xs text-muted-foreground animate-pulse">
                    {generationStep === 'generating' ? t("screenshot.generator.status_generating") : t("screenshot.generator.status_upscaling")}
                 </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Result Preview */}
        <div className="flex justify-center">
          <div className="relative rounded-[3rem] border-8 border-gray-900 bg-gray-900 shadow-2xl overflow-hidden w-[300px] h-[600px]">
            {generatedImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={generatedImage} 
                alt="Generated Screenshot" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex flex-col items-center justify-center text-gray-500 p-6 text-center space-y-4">
                <Smartphone className="w-16 h-16 opacity-20" />
                <p className="text-sm">{t("screenshot.result.empty_state")}</p>
              </div>
            )}
            
            {/* Download Button overlay */}
            {generatedImage && (
              <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                 <Button 
                    variant="secondary" 
                    className="shadow-lg backdrop-blur-md bg-white/90 hover:bg-white"
                    onClick={() => {
                        const link = document.createElement('a');
                        link.href = generatedImage;
                        link.download = 'iphone-screenshot-1290x2796.jpg';
                        link.click();
                    }}
                  >
                   <Download className="mr-2 h-4 w-4" />
                   {t("screenshot.result.download_btn")}
                 </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Separator className="my-8" />

      {/* Resizer Tool Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
           <div className="p-2 rounded-lg bg-blue-500/10">
              <ImageIcon className="w-6 h-6 text-blue-600" />
           </div>
           <div>
             <h3 className="text-2xl font-bold">{t("screenshot.resizer.title")}</h3>
             <p className="text-muted-foreground">{t("screenshot.resizer.description")}</p>
           </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Source */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>{t("screenshot.resizer.source_title")}</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="aspect-[9/19.5] w-full bg-muted rounded-lg relative overflow-hidden group border-2 border-dashed border-muted-foreground/20 flex items-center justify-center">
                  {sourceImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={sourceImage} alt="Source" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <div className="relative">
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                              onChange={handleFileUpload}
                            />
                            <Button variant="secondary">
                              <Upload className="mr-2 h-4 w-4" /> {t("common.replace")}
                            </Button>
                         </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-4 p-4">
                       <p className="text-sm text-muted-foreground">{t("screenshot.resizer.no_image")}</p>
                       <div className="relative">
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                              onChange={handleFileUpload}
                            />
                            <Button variant="outline">
                              <Upload className="mr-2 h-4 w-4" /> {t("screenshot.resizer.upload_btn")}
                            </Button>
                         </div>
                    </div>
                  )}
               </div>
            </CardContent>
          </Card>

          {/* Right: Controls & Preview */}
          <Card className="lg:col-span-2">
            <CardHeader>
               <div className="flex items-center justify-between">
                 <CardTitle>{t("screenshot.resizer.target_sizes")}</CardTitle>
                 <Button 
                    onClick={handleBatchProcess} 
                    disabled={!sourceImage || isProcessing || selectedSizes.length === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t("screenshot.resizer.btn_processing")}
                      </>
                    ) : (
                      <>
                        {t("screenshot.resizer.btn_generate_all")} <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                 </Button>
               </div>
            </CardHeader>
            <CardContent className="space-y-8">
               {/* Checkboxes */}
               <div className="grid sm:grid-cols-2 gap-8">
                  <div>
                    <Label className="mb-4 block text-xs font-bold uppercase text-muted-foreground">{t("screenshot.resizer.iphone")}</Label>
                    <div className="space-y-3">
                      {EXPORT_SIZES.filter(s => s.type === "phone").map(size => (
                        <div key={size.name} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`resizer-${size.name}`}
                            checked={selectedSizes.includes(size.name)}
                            onCheckedChange={(checked: boolean | "indeterminate") => {
                                if (checked === true) setSelectedSizes([...selectedSizes, size.name])
                                else setSelectedSizes(selectedSizes.filter(s => s !== size.name))
                            }}
                          />
                          <label htmlFor={`resizer-${size.name}`} className="text-sm font-medium">
                            {size.name} <span className="text-muted-foreground text-xs ml-1">({size.width}x{size.height})</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="mb-4 block text-xs font-bold uppercase text-muted-foreground">{t("screenshot.resizer.ipad")}</Label>
                    <div className="space-y-3">
                      {EXPORT_SIZES.filter(s => s.type === "pad").map(size => (
                        <div key={size.name} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`resizer-${size.name}`}
                            checked={selectedSizes.includes(size.name)}
                            onCheckedChange={(checked: boolean | "indeterminate") => {
                                if (checked === true) setSelectedSizes([...selectedSizes, size.name])
                                else setSelectedSizes(selectedSizes.filter(s => s !== size.name))
                            }}
                          />
                          <label htmlFor={`resizer-${size.name}`} className="text-sm font-medium">
                            {size.name} <span className="text-muted-foreground text-xs ml-1">({size.width}x{size.height})</span>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
               </div>

               <Separator />

               {/* Preview Grid */}
               <div>
                  <div className="flex items-center justify-between mb-4">
                     <Label>{t("screenshot.resizer.previews")} ({processedImages.length})</Label>
                     {processedImages.length > 0 && (
                       <Button variant="ghost" size="sm" className="text-xs">{t("screenshot.resizer.download_zip")}</Button>
                     )}
                  </div>
                  
                  {processedImages.length === 0 ? (
                    <div className="h-40 border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground text-sm">
                       {t("screenshot.resizer.empty_previews")}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                       {processedImages.map((img) => (
                         <div key={img.name} className="group relative aspect-[9/19.5] bg-muted rounded-md overflow-hidden border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-white">
                               <p className="text-xs font-bold mb-2 text-center">{img.name}</p>
                               <Button 
                                  size="sm" 
                                  variant="secondary" 
                                  className="h-7 text-xs w-full"
                                  onClick={() => {
                                     const link = document.createElement('a');
                                     link.href = img.url;
                                     link.download = `${img.name.replace(/"/g, '')}.jpg`;
                                     link.click();
                                  }}
                                >
                                 <Download className="mr-1 h-3 w-3" /> {t("common.download")}
                               </Button>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
