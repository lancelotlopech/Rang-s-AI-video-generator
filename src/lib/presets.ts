export interface ColorPreset {
  id: string
  name: string
  bgType: 'solid' | 'gradient'
  bgColor: string
  gradientStart: string
  gradientEnd: string
  titleColor: string
  subtitleColor: string
}

// Helper to generate gradients
const createGradient = (name: string, start: string, end: string, text: string = '#ffffff'): ColorPreset => ({
  id: name.toLowerCase().replace(/\s+/g, '-'),
  name,
  bgType: 'gradient',
  bgColor: start,
  gradientStart: start,
  gradientEnd: end,
  titleColor: text,
  subtitleColor: text === '#ffffff' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)'
})

const createSolid = (name: string, color: string, text: string = '#ffffff'): ColorPreset => ({
  id: name.toLowerCase().replace(/\s+/g, '-'),
  name,
  bgType: 'solid',
  bgColor: color,
  gradientStart: color,
  gradientEnd: color,
  titleColor: text,
  subtitleColor: text === '#ffffff' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)'
})

export const presets: ColorPreset[] = [
  // Modern Gradients
  createGradient('Midnight Blue', '#1e3a8a', '#172554'),
  createGradient('Royal Purple', '#581c87', '#3b0764'),
  createGradient('Sunset Vibes', '#f97316', '#db2777'),
  createGradient('Ocean Breeze', '#06b6d4', '#3b82f6'),
  createGradient('Forest Rain', '#059669', '#047857'),
  createGradient('Cherry Blossom', '#fbcfe8', '#f472b6', '#831843'),
  createGradient('Lemon Twist', '#fef08a', '#facc15', '#854d0e'),
  createGradient('Dark Knight', '#18181b', '#09090b'),
  createGradient('Slate Clean', '#f8fafc', '#e2e8f0', '#0f172a'),
  createGradient('Insta Glow', '#833ab4', '#fd1d1d'),
  
  // Tech & Corporate
  createGradient('Tech Blue', '#2563eb', '#1d4ed8'),
  createGradient('Deep Space', '#0f172a', '#1e293b'),
  createGradient('Corporate Grey', '#374151', '#111827'),
  createGradient('Startup Green', '#10b981', '#059669'),
  createGradient('Trust Blue', '#0ea5e9', '#0284c7'),
  
  // Vibrant
  createGradient('Electric Violet', '#7c3aed', '#6d28d9'),
  createGradient('Hot Pink', '#ec4899', '#be185d'),
  createGradient('Bright Orange', '#f97316', '#ea580c'),
  createGradient('Neon Green', '#84cc16', '#65a30d'),
  createGradient('Cyber Punk', '#f472b6', '#6366f1'),

  // Pastels
  createSolid('Pastel Pink', '#fce7f3', '#831843'),
  createSolid('Pastel Blue', '#e0f2fe', '#0c4a6e'),
  createSolid('Pastel Green', '#dcfce7', '#14532d'),
  createSolid('Pastel Purple', '#f3e8ff', '#581c87'),
  createSolid('Creamy', '#fffbeb', '#78350f'),

  // Solids
  createSolid('Pure Black', '#000000'),
  createSolid('Pure White', '#ffffff', '#000000'),
  createSolid('Classic Blue', '#1d4ed8'),
  createSolid('Emerald', '#059669'),
  createSolid('Ruby', '#b91c1c'),
  
  // More Gradients
  createGradient('Northern Lights', '#4ade80', '#3b82f6'),
  createGradient('Candy Cotton', '#f9a8d4', '#a5b4fc'),
  createGradient('Golden Hour', '#fbbf24', '#d97706'),
  createGradient('Silver Lining', '#94a3b8', '#475569'),
  createGradient('Bronze Age', '#78350f', '#451a03'),
  createGradient('Berry Smoothie', '#c026d3', '#7e22ce'),
  createGradient('Tropical Teal', '#2dd4bf', '#0d9488'),
  createGradient('Indigo Night', '#4338ca', '#312e81'),
  createGradient('Rose Gold', '#fda4af', '#e11d48'),
  createGradient('Mint Fresh', '#6ee7b7', '#34d399', '#064e3b'),
  
  // Special
  createGradient('Spotify Green', '#1db954', '#191414'),
  createGradient('Netflix Red', '#e50914', '#000000'),
  createGradient('Twitter Blue', '#1da1f2', '#14171a'),
  createGradient('Discord Blurple', '#5865f2', '#404eed'),
  createGradient('Slack Multi', '#4a154b', '#611f69'),
]

// Smart Color Logic
export function generateSmartPreset(baseColor: string): ColorPreset {
  // Simple hex to RGB
  const hex = baseColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  
  // Calculate brightness (YIQ)
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000
  const isDark = yiq < 128
  
  const textColor = isDark ? '#ffffff' : '#000000'
  const subColor = isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)'
  
  // Generate a gradient variant (lighter/darker)
  // This is a very basic simulation of lightening/darkening
  // For a real app we might use a library like 'tinycolor2'
  // Here we just shift RGB values slightly
  
  const shift = isDark ? 40 : -40
  const r2 = Math.max(0, Math.min(255, r + shift))
  const g2 = Math.max(0, Math.min(255, g + shift))
  const b2 = Math.max(0, Math.min(255, b + shift))
  
  const toHex = (n: number) => {
    const h = Math.round(n).toString(16)
    return h.length === 1 ? '0' + h : h
  }
  
  const endColor = `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`

  return {
    id: 'smart-generated',
    name: 'Smart Match',
    bgType: 'gradient',
    bgColor: baseColor,
    gradientStart: baseColor,
    gradientEnd: endColor,
    titleColor: textColor,
    subtitleColor: subColor
  }
}
