"use client"

import { forwardRef } from "react"
import { PhoneFrame, type FrameType } from "@/components/studio/phone-frame"
import { type Page } from "@/store/studio-store"
import { cn } from "@/lib/utils"

interface CanvasPreviewProps {
  page: Page
  fontFamily: string
  frameType: FrameType
  cornerRadius: number
  scale?: number
  className?: string
  id?: string // For export identification
}

export const CanvasPreview = forwardRef<HTMLDivElement, CanvasPreviewProps>(({
  page,
  fontFamily,
  frameType,
  cornerRadius,
  scale = 1,
  className,
  id
}, ref) => {
  // Base dimensions
  const BASE_WIDTH = 1290
  const BASE_HEIGHT = 2796

  return (
    <div 
      className={cn("relative overflow-hidden bg-white", className)}
      style={{ 
        width: BASE_WIDTH * scale, 
        height: BASE_HEIGHT * scale 
      }}
    >
      <div 
        ref={ref}
        id={id}
        className="origin-top-left w-full h-full flex flex-col items-center px-16 relative overflow-hidden"
        style={{ 
          width: BASE_WIDTH,
          height: BASE_HEIGHT,
          transform: `scale(${scale})`,
          background: page.bgType === 'solid' ? page.bgColor : `linear-gradient(180deg, ${page.gradientStart} 0%, ${page.gradientEnd} 100%)`,
          fontFamily: fontFamily
        }}
      >
        {/* Text Area */}
        <div 
          className="absolute top-0 left-0 w-full flex flex-col items-center z-20 pointer-events-none transition-transform duration-200"
          style={{ transform: `translateY(${page.textYOffset}px)` }}
        >
          <div className="text-center space-y-8 max-w-[1100px]">
            <h1 
              className="font-bold leading-tight tracking-tight"
              style={{ 
                color: page.titleColor, 
                fontSize: `${page.titleSize}px`,
                whiteSpace: 'pre-wrap'
              }}
            >
              {page.title}
            </h1>
            <h2 
              className="font-medium opacity-90"
              style={{ 
                color: page.subtitleColor, 
                fontSize: `${page.subtitleSize}px`,
                whiteSpace: 'pre-wrap'
              }}
            >
              {page.subtitle}
            </h2>
          </div>
        </div>

        {/* Screenshot Area */}
        <div 
          className="mt-auto w-full flex justify-center relative z-0 transition-transform duration-200"
          style={{
            transform: `translate(${page.imagePos.x}px, ${page.imagePos.y}px) scale(${page.imageScale})`,
            transformOrigin: 'bottom center'
          }}
        >
           <PhoneFrame 
             type={frameType} 
             src={page.screenshot} 
             customRadius={cornerRadius}
           />
        </div>
      </div>
    </div>
  )
})

CanvasPreview.displayName = "CanvasPreview"
