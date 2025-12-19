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
import { Video } from "lucide-react"

export default function VideoPage() {
  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="p-2 w-fit rounded-md bg-orange-700/10">
          <Video className="w-8 h-8 text-orange-700" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ad Video Generator</h2>
          <p className="text-muted-foreground">
            Produce engaging ad videos in multiple aspect ratios.
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Video Script / Prompt</Label>
            <Textarea 
              placeholder="A cinematic drone shot of a futuristic city at night, neon lights, cyberpunk style..."
              className="h-32 resize-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Aspect Ratio</Label>
              <Select defaultValue="9:16">
                <SelectTrigger>
                  <SelectValue placeholder="Select ratio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="9:16">9:16 (TikTok/Reels)</SelectItem>
                  <SelectItem value="16:9">16:9 (YouTube)</SelectItem>
                  <SelectItem value="1:1">1:1 (Instagram)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Model</Label>
              <Select defaultValue="fast">
                <SelectTrigger>
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fast">Fast (50 Credits)</SelectItem>
                  <SelectItem value="quality">High Quality (100 Credits)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button className="w-full bg-orange-600 hover:bg-orange-700">
            Generate Video
          </Button>
        </div>
        
        <div className="rounded-lg border border-dashed p-8 flex items-center justify-center bg-muted/50 min-h-[400px]">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground text-sm">Generated video will appear here</p>
          </div>
        </div>
      </div>
    </div>
  )
}
