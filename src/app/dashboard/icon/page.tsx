import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Palette, Upload } from "lucide-react"

export default function IconPage() {
  return (
    <div className="p-8 space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <div className="p-2 w-fit rounded-md bg-pink-700/10">
          <Palette className="w-8 h-8 text-pink-700" />
        </div>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Icon & Illustration</h2>
          <p className="text-muted-foreground">
            Create unique icons and illustrations with AI.
          </p>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Prompt</Label>
            <Textarea 
              placeholder="A minimalist 3D icon of a rocket ship, claymorphism style, pastel colors..."
              className="h-32 resize-none"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Reference Image (Optional)</Label>
            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:bg-muted/50 transition cursor-pointer">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Drag & drop or click to upload</p>
            </div>
          </div>

          <Button className="w-full bg-pink-600 hover:bg-pink-700">
            Generate Icon (5 Credits)
          </Button>
        </div>
        
        <div className="rounded-lg border border-dashed p-8 flex items-center justify-center bg-muted/50 min-h-[400px]">
          <div className="text-center space-y-2">
            <p className="text-muted-foreground text-sm">Generated icons will appear here</p>
          </div>
        </div>
      </div>
    </div>
  )
}
