"use client"

import { cn } from "@/lib/utils"
import { Smartphone } from "lucide-react"

export type FrameType = 'iphone-17' | 'iphone-17-pro' | 'iphone-se' | 'minimal'

interface PhoneFrameProps {
  type: FrameType
  src: string | null
  className?: string
  customRadius?: number
}

// Helper to generate Squircle Path
const getSquirclePath = (w: number, h: number, r: number) => {
  // Apple's squircle is smoother than standard rounded rect
  // Control point offset ratio approx 1.2 for G2 continuity
  return `
    M 0,${r}
    C 0,${r/2} ${r/2},0 ${r},0
    L ${w-r},0
    C ${w-r/2},0 ${w},${r/2} ${w},${r}
    L ${w},${h-r}
    C ${w},${h-r/2} ${w-r/2},${h} ${w-r},${h}
    L ${r},${h}
    C ${r/2},${h} 0,${h-r/2} 0,${h-r}
    Z
  `
}

export function PhoneFrame({ type, src, className, customRadius }: PhoneFrameProps) {
  // iPhone 17 & 17 Pro (Shared Geometry)
  if (type === 'iphone-17' || type === 'iphone-17-pro') {
    const width = 1180
    const height = 2556
    const border = 16
    // Use custom radius if provided, otherwise default to 66
    const screenRadius = customRadius ?? 66 
    const frameRadius = screenRadius + border 
    
    // Dynamic Island Data
    const islandW = 378
    const islandH = 111
    const islandR = 55.5
    const islandTop = 33
    const islandX = (width - islandW) / 2

    // Home Indicator Data
    const homeW = 402
    const homeH = 15
    const homeR = 7.5
    const homeBottom = 105
    const homeX = (width - homeW) / 2
    const homeY = height - homeBottom - homeH

    const framePath = getSquirclePath(width, height, frameRadius)
    const screenPath = getSquirclePath(width - border*2, height - border*2, screenRadius)

    // Frame Style Differences
    const isPro = type === 'iphone-17-pro'
    const frameGradientId = isPro ? "frame-gradient-pro" : "frame-gradient-std"

    return (
      <div className={cn("relative drop-shadow-2xl", className)} style={{ width, height }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          <defs>
            <clipPath id={`screen-mask-${type}`}>
              <path d={screenPath} transform={`translate(${border}, ${border})`} />
            </clipPath>
            
            {/* Pro: Dark Titanium */}
            <linearGradient id="frame-gradient-pro" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#555" />
              <stop offset="50%" stopColor="#333" />
              <stop offset="100%" stopColor="#222" />
            </linearGradient>

            {/* Standard: Matte Aluminum (Lighter) */}
            <linearGradient id="frame-gradient-std" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="50%" stopColor="#94a3b8" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>
          </defs>

          {/* Frame Body */}
          <path d={framePath} fill={`url(#${frameGradientId})`} stroke={isPro ? "#1a1a1a" : "#475569"} strokeWidth="2" />
          
          {/* Screen Area (White Default) */}
          <path d={screenPath} transform={`translate(${border}, ${border})`} fill="white" />

          {/* Screen Image */}
          {src ? (
            <image 
              href={src} 
              width={width - border*2} 
              height={height - border*2} 
              x={border} 
              y={border} 
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#screen-mask-${type})`}
            />
          ) : (
            <g transform={`translate(${width/2}, ${height/2})`}>
               <circle r="60" fill="#f1f5f9" />
               <path 
                 d="M -20,-30 L 20,-30 L 20,30 L -20,30 Z" 
                 fill="none" 
                 stroke="#94a3b8" 
                 strokeWidth="4" 
                 transform="scale(1.5)"
               />
               <rect x="-15" y="-25" width="30" height="50" rx="4" stroke="#94a3b8" strokeWidth="3" fill="none" />
               <circle cx="0" cy="15" r="3" fill="#94a3b8" />
            </g>
          )}

          {/* Dynamic Island */}
          <rect 
            x={islandX} 
            y={islandTop + border} 
            width={islandW} 
            height={islandH} 
            rx={islandR} 
            fill="black" 
          />
          
          {/* Home Indicator */}
          <rect 
            x={homeX} 
            y={homeY} 
            width={homeW} 
            height={homeH} 
            rx={homeR} 
            fill={src ? "white" : "#e2e8f0"} 
            opacity={src ? 0.8 : 1}
          />

          {/* Inner Bezel Shadow */}
          <path 
            d={screenPath} 
            transform={`translate(${border}, ${border})`} 
            fill="none" 
            stroke="rgba(0,0,0,0.1)" 
            strokeWidth="2" 
          />
        </svg>
      </div>
    )
  }

  // iPhone SE 3 (Corrected Ratio)
  if (type === 'iphone-se') {
    // Physical Ratio: ~2.05:1 (138.4mm / 67.3mm)
    // Screen Ratio: 16:9
    const width = 1000
    const height = 2060
    const frameRadius = 120 // User requested
    const framePath = getSquirclePath(width, height, frameRadius)
    
    // Screen Dimensions (16:9)
    const screenW = 880
    const screenH = 1564 // 880 * (16/9)
    const screenX = 60
    const screenY = 248 // Centered vertically in the remaining space

    return (
      <div className={cn("relative drop-shadow-2xl", className)} style={{ width, height }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
          <defs>
            <clipPath id="screen-mask-se">
               <rect x={screenX} y={screenY} width={screenW} height={screenH} />
            </clipPath>
            <linearGradient id="frame-gradient-se" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#222" />
              <stop offset="100%" stopColor="#000" />
            </linearGradient>
          </defs>

          {/* Body */}
          <path d={framePath} fill="url(#frame-gradient-se)" stroke="#333" strokeWidth="2" />
          
          {/* Screen Background */}
          <rect x={screenX} y={screenY} width={screenW} height={screenH} fill="#000" />

          {/* Screen Image */}
          {src ? (
            <image 
              href={src} 
              width={screenW} 
              height={screenH} 
              x={screenX} 
              y={screenY} 
              preserveAspectRatio="xMidYMid slice"
              clipPath="url(#screen-mask-se)"
            />
          ) : (
            <g transform={`translate(${width/2}, ${height/2})`}>
               <rect x={-screenW/2} y={-screenH/2} width={screenW} height={screenH} fill="#f8fafc" />
               <circle r="60" fill="#e2e8f0" />
               <rect x="-15" y="-25" width="30" height="50" rx="4" stroke="#94a3b8" strokeWidth="3" fill="none" />
               <circle cx="0" cy="15" r="3" fill="#94a3b8" />
            </g>
          )}

          {/* Earpiece / Camera Area */}
          <rect x={width/2 - 60} y={100} width={120} height={12} rx="6" fill="#333" />
          <circle cx={width/2 - 90} cy={106} r="6" fill="#222" />

          {/* Home Button */}
          <circle cx={width/2} cy={height - 124} r="60" fill="#111" stroke="#333" strokeWidth="2" />
          <circle cx={width/2} cy={height - 124} r="56" fill="none" stroke="#222" strokeWidth="2" />
        </svg>
      </div>
    )
  }

  // Minimal
  if (type === 'minimal') {
    const width = 1180
    const height = 2556
    const radius = customRadius ?? 66
    const path = getSquirclePath(width, height, radius)

    return (
      <div className={cn("relative drop-shadow-2xl", className)} style={{ width, height }}>
         <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
            <defs>
              <clipPath id="screen-mask-min">
                 <path d={path} />
              </clipPath>
            </defs>
            <path d={path} fill="white" />
            {src ? (
              <image 
                href={src} 
                width={width} 
                height={height} 
                preserveAspectRatio="xMidYMid slice"
                clipPath="url(#screen-mask-min)"
              />
            ) : (
              <g transform={`translate(${width/2}, ${height/2})`}>
                 <circle r="60" fill="#f1f5f9" />
                 <rect x="-15" y="-25" width="30" height="50" rx="4" stroke="#94a3b8" strokeWidth="3" fill="none" />
                 <circle cx="0" cy="15" r="3" fill="#94a3b8" />
              </g>
            )}
         </svg>
      </div>
    )
  }
  
  return null
}
