export interface ColorPreset {
  id: string
  name: string
  bgType: 'solid' | 'gradient'
  bgColor: string
  gradientStart: string
  gradientEnd: string
  titleColor: string
  subtitleColor: string
  category: 'solid' | 'light-gradient' | 'dark-gradient' | 'featured'
}

// --- 1. Solid Colors (35 sets) ---
const solidPresets: ColorPreset[] = [
  // iOS System Colors (12)
  { id: 's-ios-blue', name: 'iOS Blue', bgType: 'solid', bgColor: '#007AFF', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'solid' },
  { id: 's-ios-green', name: 'iOS Green', bgType: 'solid', bgColor: '#34C759', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'solid' },
  { id: 's-ios-indigo', name: 'iOS Indigo', bgType: 'solid', bgColor: '#5856D6', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'solid' },
  { id: 's-ios-orange', name: 'iOS Orange', bgType: 'solid', bgColor: '#FF9500', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'solid' },
  { id: 's-ios-pink', name: 'iOS Pink', bgType: 'solid', bgColor: '#FF2D55', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'solid' },
  { id: 's-ios-purple', name: 'iOS Purple', bgType: 'solid', bgColor: '#AF52DE', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'solid' },
  { id: 's-ios-red', name: 'iOS Red', bgType: 'solid', bgColor: '#FF3B30', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'solid' },
  { id: 's-ios-teal', name: 'iOS Teal', bgType: 'solid', bgColor: '#5AC8FA', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'solid' },
  { id: 's-ios-yellow', name: 'iOS Yellow', bgType: 'solid', bgColor: '#FFCC00', gradientStart: '', gradientEnd: '', titleColor: '#000000', subtitleColor: 'rgba(0,0,0,0.7)', category: 'solid' },
  { id: 's-ios-gray', name: 'iOS Gray', bgType: 'solid', bgColor: '#8E8E93', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'solid' },
  { id: 's-ios-black', name: 'iOS Black', bgType: 'solid', bgColor: '#000000', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: '#8E8E93', category: 'solid' },
  { id: 's-ios-white', name: 'iOS White', bgType: 'solid', bgColor: '#FFFFFF', gradientStart: '', gradientEnd: '', titleColor: '#000000', subtitleColor: '#8E8E93', category: 'solid' },

  // Morandi / Pastel (12)
  { id: 's-morandi-blue', name: 'Haze Blue', bgType: 'solid', bgColor: '#B0C4DE', gradientStart: '', gradientEnd: '', titleColor: '#2c3e50', subtitleColor: '#34495e', category: 'solid' },
  { id: 's-morandi-green', name: 'Sage Green', bgType: 'solid', bgColor: '#9CAF88', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'solid' },
  { id: 's-morandi-pink', name: 'Dusty Pink', bgType: 'solid', bgColor: '#D8B4B4', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'solid' },
  { id: 's-morandi-beige', name: 'Warm Beige', bgType: 'solid', bgColor: '#E6DCC3', gradientStart: '', gradientEnd: '', titleColor: '#5D4037', subtitleColor: '#795548', category: 'solid' },
  { id: 's-pastel-lilac', name: 'Lilac', bgType: 'solid', bgColor: '#C8A2C8', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'solid' },
  { id: 's-pastel-mint', name: 'Mint Cream', bgType: 'solid', bgColor: '#F5FFFA', gradientStart: '', gradientEnd: '', titleColor: '#2F4F4F', subtitleColor: '#708090', category: 'solid' },
  { id: 's-pastel-peach', name: 'Peach Puff', bgType: 'solid', bgColor: '#FFDAB9', gradientStart: '', gradientEnd: '', titleColor: '#8B4513', subtitleColor: '#A0522D', category: 'solid' },
  { id: 's-pastel-sky', name: 'Sky Blue', bgType: 'solid', bgColor: '#87CEEB', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'solid' },
  { id: 's-clay', name: 'Clay', bgType: 'solid', bgColor: '#bcaaa4', gradientStart: '', gradientEnd: '', titleColor: '#3e2723', subtitleColor: '#5d4037', category: 'solid' },
  { id: 's-olive', name: 'Olive', bgType: 'solid', bgColor: '#808000', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'solid' },
  { id: 's-slate', name: 'Slate', bgType: 'solid', bgColor: '#708090', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'solid' },
  { id: 's-mauve', name: 'Mauve', bgType: 'solid', bgColor: '#E0B0FF', gradientStart: '', gradientEnd: '', titleColor: '#4a148c', subtitleColor: '#6a1b9a', category: 'solid' },

  // Vivid / Brand Colors (11)
  { id: 's-brand-spotify', name: 'Spotify Green', bgType: 'solid', bgColor: '#1DB954', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'solid' },
  { id: 's-brand-netflix', name: 'Netflix Red', bgType: 'solid', bgColor: '#E50914', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'solid' },
  { id: 's-brand-facebook', name: 'Facebook Blue', bgType: 'solid', bgColor: '#1877F2', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'solid' },
  { id: 's-brand-twitter', name: 'Twitter Blue', bgType: 'solid', bgColor: '#1DA1F2', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'solid' },
  { id: 's-brand-snapchat', name: 'Snap Yellow', bgType: 'solid', bgColor: '#FFFC00', gradientStart: '', gradientEnd: '', titleColor: '#000000', subtitleColor: 'rgba(0,0,0,0.7)', category: 'solid' },
  { id: 's-brand-twitch', name: 'Twitch Purple', bgType: 'solid', bgColor: '#9146FF', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'solid' },
  { id: 's-vivid-orange', name: 'Safety Orange', bgType: 'solid', bgColor: '#FF5722', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'solid' },
  { id: 's-vivid-pink', name: 'Hot Pink', bgType: 'solid', bgColor: '#FF69B4', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'solid' },
  { id: 's-vivid-cyan', name: 'Cyan', bgType: 'solid', bgColor: '#00BCD4', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'solid' },
  { id: 's-vivid-lime', name: 'Lime', bgType: 'solid', bgColor: '#CDDC39', gradientStart: '', gradientEnd: '', titleColor: '#33691E', subtitleColor: '#558B2F', category: 'solid' },
  { id: 's-vivid-amber', name: 'Amber', bgType: 'solid', bgColor: '#FFC107', gradientStart: '', gradientEnd: '', titleColor: '#3E2723', subtitleColor: '#5D4037', category: 'solid' },
]

// --- 2. Light Gradients (35 sets) ---
const lightGradientPresets: ColorPreset[] = [
  // Blue/Cyan Series (8)
  { id: 'lg-sky', name: 'Clear Sky', bgType: 'gradient', bgColor: '#E0F7FA', gradientStart: '#E0F7FA', gradientEnd: '#80DEEA', titleColor: '#006064', subtitleColor: '#00838F', category: 'light-gradient' },
  { id: 'lg-ocean', name: 'Soft Ocean', bgType: 'gradient', bgColor: '#E1F5FE', gradientStart: '#E1F5FE', gradientEnd: '#81D4FA', titleColor: '#01579B', subtitleColor: '#0277BD', category: 'light-gradient' },
  { id: 'lg-aqua', name: 'Aqua Splash', bgType: 'gradient', bgColor: '#E0F2F1', gradientStart: '#E0F2F1', gradientEnd: '#4DB6AC', titleColor: '#004D40', subtitleColor: '#00695C', category: 'light-gradient' },
  { id: 'lg-ice', name: 'Iceberg', bgType: 'gradient', bgColor: '#F5F5F5', gradientStart: '#F5F5F5', gradientEnd: '#CFD8DC', titleColor: '#37474F', subtitleColor: '#546E7A', category: 'light-gradient' },
  { id: 'lg-blue-purple', name: 'Dreamy Blue', bgType: 'gradient', bgColor: '#E3F2FD', gradientStart: '#E3F2FD', gradientEnd: '#D1C4E9', titleColor: '#311B92', subtitleColor: '#4527A0', category: 'light-gradient' },
  { id: 'lg-cyan-lime', name: 'Fresh Water', bgType: 'gradient', bgColor: '#E0F7FA', gradientStart: '#E0F7FA', gradientEnd: '#F0F4C3', titleColor: '#33691E', subtitleColor: '#558B2F', category: 'light-gradient' },
  { id: 'lg-winter', name: 'Winter Morning', bgType: 'gradient', bgColor: '#E8EAF6', gradientStart: '#E8EAF6', gradientEnd: '#C5CAE9', titleColor: '#1A237E', subtitleColor: '#283593', category: 'light-gradient' },
  { id: 'lg-cloud', name: 'Cloudy Day', bgType: 'gradient', bgColor: '#FAFAFA', gradientStart: '#FAFAFA', gradientEnd: '#B0BEC5', titleColor: '#263238', subtitleColor: '#455A64', category: 'light-gradient' },

  // Pink/Purple/Red Series (9)
  { id: 'lg-rose', name: 'Rose Petal', bgType: 'gradient', bgColor: '#FCE4EC', gradientStart: '#FCE4EC', gradientEnd: '#F48FB1', titleColor: '#880E4F', subtitleColor: '#AD1457', category: 'light-gradient' },
  { id: 'lg-lavender', name: 'Soft Lavender', bgType: 'gradient', bgColor: '#F3E5F5', gradientStart: '#F3E5F5', gradientEnd: '#CE93D8', titleColor: '#4A148C', subtitleColor: '#6A1B9A', category: 'light-gradient' },
  { id: 'lg-peach', name: 'Peach Fuzz', bgType: 'gradient', bgColor: '#FFF3E0', gradientStart: '#FFF3E0', gradientEnd: '#FFCC80', titleColor: '#E65100', subtitleColor: '#EF6C00', category: 'light-gradient' },
  { id: 'lg-coral', name: 'Light Coral', bgType: 'gradient', bgColor: '#FFEBEE', gradientStart: '#FFEBEE', gradientEnd: '#EF9A9A', titleColor: '#B71C1C', subtitleColor: '#C62828', category: 'light-gradient' },
  { id: 'lg-flamingo', name: 'Flamingo', bgType: 'gradient', bgColor: '#F8BBD0', gradientStart: '#F8BBD0', gradientEnd: '#F48FB1', titleColor: '#880E4F', subtitleColor: '#C2185B', category: 'light-gradient' },
  { id: 'lg-candy', name: 'Cotton Candy', bgType: 'gradient', bgColor: '#F3E5F5', gradientStart: '#F3E5F5', gradientEnd: '#F8BBD0', titleColor: '#880E4F', subtitleColor: '#AD1457', category: 'light-gradient' },
  { id: 'lg-sunset', name: 'Pale Sunset', bgType: 'gradient', bgColor: '#FFF8E1', gradientStart: '#FFF8E1', gradientEnd: '#FFCCBC', titleColor: '#BF360C', subtitleColor: '#D84315', category: 'light-gradient' },
  { id: 'lg-blush', name: 'Blush', bgType: 'gradient', bgColor: '#FFEBEE', gradientStart: '#FFEBEE', gradientEnd: '#FFCDD2', titleColor: '#B71C1C', subtitleColor: '#E53935', category: 'light-gradient' },
  { id: 'lg-lilac', name: 'Lilac Breeze', bgType: 'gradient', bgColor: '#EDE7F6', gradientStart: '#EDE7F6', gradientEnd: '#D1C4E9', titleColor: '#311B92', subtitleColor: '#512DA8', category: 'light-gradient' },

  // Green/Yellow/Orange Series (9)
  { id: 'lg-mint', name: 'Minty Fresh', bgType: 'gradient', bgColor: '#E0F2F1', gradientStart: '#E0F2F1', gradientEnd: '#A5D6A7', titleColor: '#1B5E20', subtitleColor: '#2E7D32', category: 'light-gradient' },
  { id: 'lg-lemon', name: 'Lemonade', bgType: 'gradient', bgColor: '#FFFDE7', gradientStart: '#FFFDE7', gradientEnd: '#FFF59D', titleColor: '#F57F17', subtitleColor: '#F9A825', category: 'light-gradient' },
  { id: 'lg-lime', name: 'Key Lime', bgType: 'gradient', bgColor: '#F9FBE7', gradientStart: '#F9FBE7', gradientEnd: '#DCE775', titleColor: '#33691E', subtitleColor: '#558B2F', category: 'light-gradient' },
  { id: 'lg-honey', name: 'Honey Dew', bgType: 'gradient', bgColor: '#FFF8E1', gradientStart: '#FFF8E1', gradientEnd: '#FFE082', titleColor: '#FF6F00', subtitleColor: '#FF8F00', category: 'light-gradient' },
  { id: 'lg-tea', name: 'Green Tea', bgType: 'gradient', bgColor: '#F1F8E9', gradientStart: '#F1F8E9', gradientEnd: '#C5E1A5', titleColor: '#33691E', subtitleColor: '#558B2F', category: 'light-gradient' },
  { id: 'lg-sand', name: 'Sand Dune', bgType: 'gradient', bgColor: '#FFF3E0', gradientStart: '#FFF3E0', gradientEnd: '#FFE0B2', titleColor: '#E65100', subtitleColor: '#F57C00', category: 'light-gradient' },
  { id: 'lg-spring', name: 'Spring', bgType: 'gradient', bgColor: '#F1F8E9', gradientStart: '#F1F8E9', gradientEnd: '#DCEDC8', titleColor: '#33691E', subtitleColor: '#689F38', category: 'light-gradient' },
  { id: 'lg-cream', name: 'Cream Soda', bgType: 'gradient', bgColor: '#FFFDE7', gradientStart: '#FFFDE7', gradientEnd: '#FFECB3', titleColor: '#FF6F00', subtitleColor: '#FFA000', category: 'light-gradient' },
  { id: 'lg-wheat', name: 'Wheat Field', bgType: 'gradient', bgColor: '#FFF3E0', gradientStart: '#FFF3E0', gradientEnd: '#FFCC80', titleColor: '#E65100', subtitleColor: '#EF6C00', category: 'light-gradient' },

  // Mixed/Trendy (9)
  { id: 'lg-unicorn', name: 'Unicorn', bgType: 'gradient', bgColor: '#F3E5F5', gradientStart: '#F3E5F5', gradientEnd: '#E1F5FE', titleColor: '#4A148C', subtitleColor: '#01579B', category: 'light-gradient' },
  { id: 'lg-holographic', name: 'Holographic', bgType: 'gradient', bgColor: '#E0F7FA', gradientStart: '#E0F7FA', gradientEnd: '#F8BBD0', titleColor: '#880E4F', subtitleColor: '#006064', category: 'light-gradient' },
  { id: 'lg-rainbow', name: 'Pastel Rainbow', bgType: 'gradient', bgColor: '#FFEBEE', gradientStart: '#FFEBEE', gradientEnd: '#E1F5FE', titleColor: '#311B92', subtitleColor: '#B71C1C', category: 'light-gradient' },
  { id: 'lg-dawn', name: 'Dawn', bgType: 'gradient', bgColor: '#FFF3E0', gradientStart: '#FFF3E0', gradientEnd: '#F3E5F5', titleColor: '#4A148C', subtitleColor: '#E65100', category: 'light-gradient' },
  { id: 'lg-dusk', name: 'Dusk', bgType: 'gradient', bgColor: '#E1F5FE', gradientStart: '#E1F5FE', gradientEnd: '#FFF3E0', titleColor: '#E65100', subtitleColor: '#01579B', category: 'light-gradient' },
  { id: 'lg-pearl', name: 'Pearl', bgType: 'gradient', bgColor: '#FAFAFA', gradientStart: '#FAFAFA', gradientEnd: '#F5F5F5', titleColor: '#212121', subtitleColor: '#757575', category: 'light-gradient' },
  { id: 'lg-linen', name: 'Linen', bgType: 'gradient', bgColor: '#FAFFA4', gradientStart: '#FAFFA4', gradientEnd: '#E6EE9C', titleColor: '#827717', subtitleColor: '#9E9D24', category: 'light-gradient' },
  { id: 'lg-mist', name: 'Morning Mist', bgType: 'gradient', bgColor: '#ECEFF1', gradientStart: '#ECEFF1', gradientEnd: '#CFD8DC', titleColor: '#263238', subtitleColor: '#546E7A', category: 'light-gradient' },
  { id: 'lg-shell', name: 'Sea Shell', bgType: 'gradient', bgColor: '#FFF8E1', gradientStart: '#FFF8E1', gradientEnd: '#FFECB3', titleColor: '#FF6F00', subtitleColor: '#FF8F00', category: 'light-gradient' },
  
  // Holiday Light (Moved from Holiday)
  { id: 'hol-ny-champagne', name: 'Champagne', bgType: 'gradient', bgColor: '#E6DADA', gradientStart: '#E6DADA', gradientEnd: '#274046', titleColor: '#2C3E50', subtitleColor: '#34495E', category: 'light-gradient' },
  { id: 'hol-winter-snow', name: 'Winter Snow', bgType: 'gradient', bgColor: '#E6DADA', gradientStart: '#E6DADA', gradientEnd: '#274046', titleColor: '#2C3E50', subtitleColor: '#34495E', category: 'light-gradient' },
]

// --- 3. Dark Gradients (35 sets) ---
const darkGradientPresets: ColorPreset[] = [
  // Deep Blue/Purple (9)
  { id: 'dg-midnight', name: 'Midnight', bgType: 'gradient', bgColor: '#0f172a', gradientStart: '#1e293b', gradientEnd: '#020617', titleColor: '#ffffff', subtitleColor: '#94a3b8', category: 'dark-gradient' },
  { id: 'dg-ocean', name: 'Deep Ocean', bgType: 'gradient', bgColor: '#1e3a8a', gradientStart: '#1e3a8a', gradientEnd: '#172554', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.8)', category: 'dark-gradient' },
  { id: 'dg-purple', name: 'Purple Haze', bgType: 'gradient', bgColor: '#581c87', gradientStart: '#581c87', gradientEnd: '#3b0764', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.8)', category: 'dark-gradient' },
  { id: 'dg-royal', name: 'Royal', bgType: 'gradient', bgColor: '#172554', gradientStart: '#1e3a8a', gradientEnd: '#020617', titleColor: '#60a5fa', subtitleColor: '#3b82f6', category: 'dark-gradient' },
  { id: 'dg-galaxy', name: 'Galaxy', bgType: 'gradient', bgColor: '#312e81', gradientStart: '#312e81', gradientEnd: '#1e1b4b', titleColor: '#c7d2fe', subtitleColor: '#a5b4fc', category: 'dark-gradient' },
  { id: 'dg-indigo', name: 'Indigo Night', bgType: 'gradient', bgColor: '#3730a3', gradientStart: '#3730a3', gradientEnd: '#312e81', titleColor: '#e0e7ff', subtitleColor: '#c7d2fe', category: 'dark-gradient' },
  { id: 'dg-abyss', name: 'Abyss', bgType: 'gradient', bgColor: '#020617', gradientStart: '#0f172a', gradientEnd: '#020617', titleColor: '#38bdf8', subtitleColor: '#0ea5e9', category: 'dark-gradient' },
  { id: 'dg-nebula', name: 'Nebula', bgType: 'gradient', bgColor: '#4c1d95', gradientStart: '#4c1d95', gradientEnd: '#2e1065', titleColor: '#d8b4fe', subtitleColor: '#c084fc', category: 'dark-gradient' },
  { id: 'dg-cosmic', name: 'Cosmic', bgType: 'gradient', bgColor: '#1e1b4b', gradientStart: '#1e1b4b', gradientEnd: '#000000', titleColor: '#a78bfa', subtitleColor: '#8b5cf6', category: 'dark-gradient' },

  // Cyberpunk/Neon (9)
  { id: 'dg-cyber', name: 'Cyberpunk', bgType: 'gradient', bgColor: '#0f172a', gradientStart: '#2e1065', gradientEnd: '#0f172a', titleColor: '#22d3ee', subtitleColor: '#67e8f9', category: 'dark-gradient' },
  { id: 'dg-matrix', name: 'Matrix', bgType: 'gradient', bgColor: '#020617', gradientStart: '#052e16', gradientEnd: '#020617', titleColor: '#4ade80', subtitleColor: '#22c55e', category: 'dark-gradient' },
  { id: 'dg-laser', name: 'Laser', bgType: 'gradient', bgColor: '#0f172a', gradientStart: '#1e1b4b', gradientEnd: '#000000', titleColor: '#f472b6', subtitleColor: '#ec4899', category: 'dark-gradient' },
  { id: 'dg-neon-blue', name: 'Neon Blue', bgType: 'gradient', bgColor: '#000000', gradientStart: '#000000', gradientEnd: '#1e3a8a', titleColor: '#00ffff', subtitleColor: '#00ced1', category: 'dark-gradient' },
  { id: 'dg-neon-pink', name: 'Neon Pink', bgType: 'gradient', bgColor: '#2e1065', gradientStart: '#4c1d95', gradientEnd: '#000000', titleColor: '#ff00ff', subtitleColor: '#ff69b4', category: 'dark-gradient' },
  { id: 'dg-toxic', name: 'Toxic', bgType: 'gradient', bgColor: '#1a2e05', gradientStart: '#365314', gradientEnd: '#000000', titleColor: '#bef264', subtitleColor: '#a3e635', category: 'dark-gradient' },
  { id: 'dg-synthwave', name: 'Synthwave', bgType: 'gradient', bgColor: '#2e1065', gradientStart: '#4c1d95', gradientEnd: '#be185d', titleColor: '#f472b6', subtitleColor: '#fbcfe8', category: 'dark-gradient' },
  { id: 'dg-arcade', name: 'Arcade', bgType: 'gradient', bgColor: '#18181b', gradientStart: '#27272a', gradientEnd: '#7f1d1d', titleColor: '#f87171', subtitleColor: '#fca5a5', category: 'dark-gradient' },
  { id: 'dg-glitch', name: 'Glitch', bgType: 'gradient', bgColor: '#000000', gradientStart: '#18181b', gradientEnd: '#000000', titleColor: '#22d3ee', subtitleColor: '#f472b6', category: 'dark-gradient' },

  // Dark Red/Orange/Gold (9)
  { id: 'dg-sunset', name: 'Dark Sunset', bgType: 'gradient', bgColor: '#c2410c', gradientStart: '#f97316', gradientEnd: '#9a3412', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'dark-gradient' },
  { id: 'dg-magma', name: 'Magma', bgType: 'gradient', bgColor: '#431407', gradientStart: '#7c2d12', gradientEnd: '#000000', titleColor: '#fdba74', subtitleColor: '#fb923c', category: 'dark-gradient' },
  { id: 'dg-crimson', name: 'Crimson', bgType: 'gradient', bgColor: '#450a0a', gradientStart: '#7f1d1d', gradientEnd: '#000000', titleColor: '#fca5a5', subtitleColor: '#f87171', category: 'dark-gradient' },
  { id: 'dg-vampire', name: 'Vampire', bgType: 'gradient', bgColor: '#450a0a', gradientStart: '#991b1b', gradientEnd: '#000000', titleColor: '#ffffff', subtitleColor: '#fca5a5', category: 'dark-gradient' },
  { id: 'dg-gold', name: 'Obsidian Gold', bgType: 'gradient', bgColor: '#1c1917', gradientStart: '#292524', gradientEnd: '#0c0a09', titleColor: '#fcd34d', subtitleColor: '#fbbf24', category: 'dark-gradient' },
  { id: 'dg-bronze', name: 'Bronze', bgType: 'gradient', bgColor: '#271c19', gradientStart: '#442c2e', gradientEnd: '#271c19', titleColor: '#d6d3d1', subtitleColor: '#a8a29e', category: 'dark-gradient' },
  { id: 'dg-rust', name: 'Rust', bgType: 'gradient', bgColor: '#431407', gradientStart: '#7c2d12', gradientEnd: '#431407', titleColor: '#fdba74', subtitleColor: '#fed7aa', category: 'dark-gradient' },
  { id: 'dg-ember', name: 'Ember', bgType: 'gradient', bgColor: '#7f1d1d', gradientStart: '#b91c1c', gradientEnd: '#7f1d1d', titleColor: '#fecaca', subtitleColor: '#fee2e2', category: 'dark-gradient' },
  { id: 'dg-chocolate', name: 'Dark Choco', bgType: 'gradient', bgColor: '#3e2723', gradientStart: '#4e342e', gradientEnd: '#3e2723', titleColor: '#d7ccc8', subtitleColor: '#bcaaa4', category: 'dark-gradient' },

  // Neutral/Grey/Black (8)
  { id: 'dg-titanium', name: 'Titanium', bgType: 'gradient', bgColor: '#374151', gradientStart: '#4b5563', gradientEnd: '#1f2937', titleColor: '#f3f4f6', subtitleColor: '#9ca3af', category: 'dark-gradient' },
  { id: 'dg-stealth', name: 'Stealth', bgType: 'gradient', bgColor: '#18181b', gradientStart: '#27272a', gradientEnd: '#09090b', titleColor: '#e4e4e7', subtitleColor: '#71717a', category: 'dark-gradient' },
  { id: 'dg-carbon', name: 'Carbon', bgType: 'gradient', bgColor: '#171717', gradientStart: '#262626', gradientEnd: '#0a0a0a', titleColor: '#ffffff', subtitleColor: '#525252', category: 'dark-gradient' },
  { id: 'dg-slate', name: 'Dark Slate', bgType: 'gradient', bgColor: '#0f172a', gradientStart: '#1e293b', gradientEnd: '#0f172a', titleColor: '#cbd5e1', subtitleColor: '#94a3b8', category: 'dark-gradient' },
  { id: 'dg-ash', name: 'Ash', bgType: 'gradient', bgColor: '#27272a', gradientStart: '#3f3f46', gradientEnd: '#27272a', titleColor: '#e4e4e7', subtitleColor: '#a1a1aa', category: 'dark-gradient' },
  { id: 'dg-charcoal', name: 'Charcoal', bgType: 'gradient', bgColor: '#18181b', gradientStart: '#27272a', gradientEnd: '#18181b', titleColor: '#d4d4d8', subtitleColor: '#a1a1aa', category: 'dark-gradient' },
  { id: 'dg-ink', name: 'Ink', bgType: 'gradient', bgColor: '#020617', gradientStart: '#0f172a', gradientEnd: '#020617', titleColor: '#e2e8f0', subtitleColor: '#94a3b8', category: 'dark-gradient' },
  { id: 'dg-void', name: 'Void', bgType: 'gradient', bgColor: '#000000', gradientStart: '#0a0a0a', gradientEnd: '#000000', titleColor: '#ffffff', subtitleColor: '#525252', category: 'dark-gradient' },
  
  // Holiday Dark (Moved from Holiday)
  { id: 'hol-xmas-red', name: 'Xmas Red', bgType: 'gradient', bgColor: '#D31027', gradientStart: '#D31027', gradientEnd: '#EA384D', titleColor: '#FFD700', subtitleColor: '#FFF8DC', category: 'dark-gradient' },
  { id: 'hol-xmas-green', name: 'Xmas Green', bgType: 'gradient', bgColor: '#134E5E', gradientStart: '#134E5E', gradientEnd: '#71B280', titleColor: '#ffffff', subtitleColor: '#F0F8FF', category: 'dark-gradient' },
  { id: 'hol-xmas-gold', name: 'Xmas Gold', bgType: 'gradient', bgColor: '#CAC531', gradientStart: '#CAC531', gradientEnd: '#F3F9A7', titleColor: '#5D4037', subtitleColor: '#795548', category: 'dark-gradient' },
  { id: 'hol-ny-black-gold', name: 'NY Black Gold', bgType: 'gradient', bgColor: '#141E30', gradientStart: '#141E30', gradientEnd: '#243B55', titleColor: '#FDC830', subtitleColor: '#F37335', category: 'dark-gradient' },
]

// --- 4. Featured (Formerly Trendy) ---
const featuredPresets: ColorPreset[] = [
  // US Trendy (Pink/Purple/Blue)
  { id: 'tr-unicorn-dream', name: 'Unicorn Dream', bgType: 'gradient', bgColor: '#f3e7e9', gradientStart: '#f3e7e9', gradientEnd: '#e3eeff', titleColor: '#6a11cb', subtitleColor: '#2575fc', category: 'featured' },
  { id: 'tr-cotton-candy', name: 'Cotton Candy', bgType: 'gradient', bgColor: '#ff9a9e', gradientStart: '#ff9a9e', gradientEnd: '#fecfef', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'featured' },
  { id: 'tr-miami-vice', name: 'Miami Vice', bgType: 'gradient', bgColor: '#00d2ff', gradientStart: '#00d2ff', gradientEnd: '#3a7bd5', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'featured' },
  { id: 'tr-cali-sunset', name: 'Cali Sunset', bgType: 'gradient', bgColor: '#fc4a1a', gradientStart: '#fc4a1a', gradientEnd: '#f7b733', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'featured' },
  { id: 'tr-instagram', name: 'Insta Vibe', bgType: 'gradient', bgColor: '#833ab4', gradientStart: '#833ab4', gradientEnd: '#fd1d1d', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'featured' },
  { id: 'tr-hyper-purple', name: 'Hyper Purple', bgType: 'gradient', bgColor: '#654ea3', gradientStart: '#654ea3', gradientEnd: '#eaafc8', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'featured' },
  { id: 'tr-electric-violet', name: 'Electric Violet', bgType: 'gradient', bgColor: '#4776E6', gradientStart: '#4776E6', gradientEnd: '#8E54E9', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'featured' },
  { id: 'tr-neon-life', name: 'Neon Life', bgType: 'gradient', bgColor: '#B24592', gradientStart: '#B24592', gradientEnd: '#F15F79', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'featured' },
  
  // Holographic / Iridescent (New)
  { id: 'tr-holo-1', name: 'Holo Silver', bgType: 'gradient', bgColor: '#E0EAFC', gradientStart: '#E0EAFC', gradientEnd: '#CFDEF3', titleColor: '#2c3e50', subtitleColor: '#34495e', category: 'featured' },
  { id: 'tr-holo-2', name: 'Iridescent', bgType: 'gradient', bgColor: '#a8edea', gradientStart: '#a8edea', gradientEnd: '#fed6e3', titleColor: '#2c3e50', subtitleColor: '#34495e', category: 'featured' },
  { id: 'tr-holo-3', name: 'Pearl Luster', bgType: 'gradient', bgColor: '#fff1eb', gradientStart: '#fff1eb', gradientEnd: '#ace0f9', titleColor: '#2c3e50', subtitleColor: '#34495e', category: 'featured' },
  { id: 'tr-holo-4', name: 'Prism', bgType: 'gradient', bgColor: '#e0c3fc', gradientStart: '#e0c3fc', gradientEnd: '#8ec5fc', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'featured' },
  
  // Aurora / Mesh (New)
  { id: 'tr-aurora-1', name: 'Northern Lights', bgType: 'gradient', bgColor: '#43e97b', gradientStart: '#43e97b', gradientEnd: '#38f9d7', titleColor: '#000000', subtitleColor: 'rgba(0,0,0,0.7)', category: 'featured' },
  { id: 'tr-aurora-2', name: 'Polar Night', bgType: 'gradient', bgColor: '#00c6ff', gradientStart: '#00c6ff', gradientEnd: '#0072ff', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'featured' },
  { id: 'tr-aurora-3', name: 'Borealis', bgType: 'gradient', bgColor: '#00f260', gradientStart: '#00f260', gradientEnd: '#0575e6', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'featured' },
  { id: 'tr-aurora-4', name: 'Solar Flare', bgType: 'gradient', bgColor: '#f093fb', gradientStart: '#f093fb', gradientEnd: '#f5576c', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'featured' },

  // Acid / Cyber (New)
  { id: 'tr-acid-1', name: 'Acid Green', bgType: 'gradient', bgColor: '#DCE35B', gradientStart: '#DCE35B', gradientEnd: '#45B649', titleColor: '#000000', subtitleColor: 'rgba(0,0,0,0.7)', category: 'featured' },
  { id: 'tr-acid-2', name: 'Toxic Lime', bgType: 'gradient', bgColor: '#c2e59c', gradientStart: '#c2e59c', gradientEnd: '#64b3f4', titleColor: '#000000', subtitleColor: 'rgba(0,0,0,0.7)', category: 'featured' },
  { id: 'tr-acid-3', name: 'Cyber Yellow', bgType: 'gradient', bgColor: '#CAC531', gradientStart: '#CAC531', gradientEnd: '#F3F9A7', titleColor: '#000000', subtitleColor: 'rgba(0,0,0,0.7)', category: 'featured' },
  { id: 'tr-acid-4', name: 'Radioactive', bgType: 'gradient', bgColor: '#11998e', gradientStart: '#11998e', gradientEnd: '#38ef7d', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'featured' },

  // Glassmorphism / Soft (New)
  { id: 'tr-glass-1', name: 'Frosted Glass', bgType: 'gradient', bgColor: '#e6e9f0', gradientStart: '#e6e9f0', gradientEnd: '#eef1f5', titleColor: '#2c3e50', subtitleColor: '#34495e', category: 'featured' },
  { id: 'tr-glass-2', name: 'Soft Mesh', bgType: 'gradient', bgColor: '#fdfbfb', gradientStart: '#fdfbfb', gradientEnd: '#ebedee', titleColor: '#2c3e50', subtitleColor: '#34495e', category: 'featured' },
  { id: 'tr-glass-3', name: 'Blurry Blue', bgType: 'gradient', bgColor: '#a1c4fd', gradientStart: '#a1c4fd', gradientEnd: '#c2e9fb', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'featured' },
  { id: 'tr-glass-4', name: 'Misty Rose', bgType: 'gradient', bgColor: '#ff9a9e', gradientStart: '#ff9a9e', gradientEnd: '#fecfef', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'featured' },

  // More Trendy (New)
  { id: 'tr-more-1', name: 'Deep Space', bgType: 'gradient', bgColor: '#000000', gradientStart: '#434343', gradientEnd: '#000000', titleColor: '#ffffff', subtitleColor: '#999999', category: 'featured' },
  { id: 'tr-more-2', name: 'Night Sky', bgType: 'gradient', bgColor: '#141E30', gradientStart: '#141E30', gradientEnd: '#243B55', titleColor: '#ffffff', subtitleColor: '#999999', category: 'featured' },
  { id: 'tr-more-3', name: 'Purple Love', bgType: 'gradient', bgColor: '#cc2b5e', gradientStart: '#cc2b5e', gradientEnd: '#753a88', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'featured' },
  { id: 'tr-more-4', name: 'Piggy Pink', bgType: 'gradient', bgColor: '#ee9ca7', gradientStart: '#ee9ca7', gradientEnd: '#ffdde1', titleColor: '#2c3e50', subtitleColor: '#34495e', category: 'featured' },
  { id: 'tr-more-5', name: 'Cool Blues', bgType: 'gradient', bgColor: '#2193b0', gradientStart: '#2193b0', gradientEnd: '#6dd5ed', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'featured' },
  { id: 'tr-more-6', name: 'Mega Tron', bgType: 'gradient', bgColor: '#C33764', gradientStart: '#C33764', gradientEnd: '#1D2671', titleColor: '#ffffff', subtitleColor: 'rgba(255,255,255,0.9)', category: 'featured' },
]

// --- 5. Vibrant Solids (New Additions) ---
const vibrantSolidPresets: ColorPreset[] = [
  { id: 'vs-electric-blue', name: 'Electric Blue', bgType: 'solid', bgColor: '#2980b9', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: '#ecf0f1', category: 'solid' },
  { id: 'vs-emerald', name: 'Emerald', bgType: 'solid', bgColor: '#2ecc71', gradientStart: '', gradientEnd: '', titleColor: '#2c3e50', subtitleColor: '#34495e', category: 'solid' },
  { id: 'vs-sunflower', name: 'Sunflower', bgType: 'solid', bgColor: '#f1c40f', gradientStart: '', gradientEnd: '', titleColor: '#2c3e50', subtitleColor: '#34495e', category: 'solid' },
  { id: 'vs-carrot', name: 'Carrot', bgType: 'solid', bgColor: '#e67e22', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: '#ecf0f1', category: 'solid' },
  { id: 'vs-alizarin', name: 'Alizarin', bgType: 'solid', bgColor: '#e74c3c', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: '#ecf0f1', category: 'solid' },
  { id: 'vs-amethyst', name: 'Amethyst', bgType: 'solid', bgColor: '#9b59b6', gradientStart: '', gradientEnd: '', titleColor: '#ffffff', subtitleColor: '#ecf0f1', category: 'solid' },
  { id: 'vs-midnight', name: 'Midnight', bgType: 'solid', bgColor: '#2c3e50', gradientStart: '', gradientEnd: '', titleColor: '#ecf0f1', subtitleColor: '#bdc3c7', category: 'solid' },
  { id: 'vs-concrete', name: 'Concrete', bgType: 'solid', bgColor: '#95a5a6', gradientStart: '', gradientEnd: '', titleColor: '#2c3e50', subtitleColor: '#34495e', category: 'solid' },
]

export const presets: ColorPreset[] = [
  ...featuredPresets,
  ...solidPresets,
  ...lightGradientPresets,
  ...darkGradientPresets,
  ...vibrantSolidPresets
]

export function generateSmartPreset(baseColor: string): ColorPreset {
  return {
    id: `smart-${Date.now()}`,
    name: 'Smart Match',
    bgType: 'gradient',
    bgColor: baseColor,
    gradientStart: baseColor,
    gradientEnd: adjustColor(baseColor, -20),
    titleColor: getContrastColor(baseColor),
    subtitleColor: getContrastColor(baseColor) === '#ffffff' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)',
    category: 'solid' // Default category
  }
}

function adjustColor(color: string, amount: number) {
  return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

function getContrastColor(hexcolor: string) {
  if (!/^#([0-9A-F]{3}){1,2}$/i.test(hexcolor)) return '#ffffff';
  const r = parseInt(hexcolor.substr(1,2),16);
  const g = parseInt(hexcolor.substr(3,2),16);
  const b = parseInt(hexcolor.substr(5,2),16);
  const yiq = ((r*299)+(g*587)+(b*114))/1000;
  return (yiq >= 128) ? '#000000' : '#ffffff';
}
