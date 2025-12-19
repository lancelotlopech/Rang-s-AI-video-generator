import { create } from 'zustand'
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware'
import { get, set, del } from 'idb-keyval'
import { FrameType } from '@/components/studio/phone-frame'

// Custom Storage Engine using IndexedDB
const storage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name)
  },
}

export interface StudioState {
  // Text
  title: string
  subtitle: string
  titleColor: string
  subtitleColor: string
  titleSize: number
  subtitleSize: number
  textYOffset: number
  fontFamily: string

  // Background
  bgType: 'solid' | 'gradient'
  bgColor: string
  gradientStart: string
  gradientEnd: string
  smartColor: string

  // Image & Frame
  screenshot: string | null
  frameType: FrameType
  imagePos: { x: number; y: number }
  imageScale: number
  cornerRadius: number

  // Drafts
  drafts: Draft[]
  
  // Actions
  setTitle: (title: string) => void
  setSubtitle: (subtitle: string) => void
  setTitleColor: (color: string) => void
  setSubtitleColor: (color: string) => void
  setTitleSize: (size: number) => void
  setSubtitleSize: (size: number) => void
  setTextYOffset: (offset: number) => void
  setFontFamily: (font: string) => void
  
  setBgType: (type: 'solid' | 'gradient') => void
  setBgColor: (color: string) => void
  setGradientStart: (color: string) => void
  setGradientEnd: (color: string) => void
  setSmartColor: (color: string) => void
  
  setScreenshot: (src: string | null) => void
  setFrameType: (type: FrameType) => void
  setImagePos: (pos: { x: number; y: number }) => void
  setImageScale: (scale: number) => void
  setCornerRadius: (radius: number) => void
  
  saveDraft: (name: string) => void
  loadDraft: (id: string) => void
  deleteDraft: (id: string) => void
}

export interface Draft {
  id: string
  name: string
  createdAt: number
  data: Omit<StudioState, 'drafts' | 'saveDraft' | 'loadDraft' | 'deleteDraft' | 'setTitle' | 'setSubtitle' | 'setTitleColor' | 'setSubtitleColor' | 'setTitleSize' | 'setSubtitleSize' | 'setTextYOffset' | 'setFontFamily' | 'setBgType' | 'setBgColor' | 'setGradientStart' | 'setGradientEnd' | 'setSmartColor' | 'setScreenshot' | 'setFrameType' | 'setImagePos' | 'setImageScale' | 'setCornerRadius'>
}

export const useStudioStore = create<StudioState>()(
  persist(
    (set, get) => ({
      // Initial State
      title: "Finance App",
      subtitle: "Track your expenses easily\nand save more money",
      titleColor: "#ffffff",
      subtitleColor: "rgba(255,255,255,0.8)",
      titleSize: 120,
      subtitleSize: 60,
      textYOffset: 240,
      fontFamily: "Inter",
      
      bgType: 'gradient',
      bgColor: "#1e3a8a",
      gradientStart: "#1e3a8a",
      gradientEnd: "#172554",
      smartColor: "#3b82f6",
      
      screenshot: null,
      frameType: 'iphone-17-pro',
      imagePos: { x: 0, y: 0 },
      imageScale: 0.85,
      cornerRadius: 140,
      
      drafts: [],

      // Setters
      setTitle: (title) => set({ title }),
      setSubtitle: (subtitle) => set({ subtitle }),
      setTitleColor: (titleColor) => set({ titleColor }),
      setSubtitleColor: (subtitleColor) => set({ subtitleColor }),
      setTitleSize: (titleSize) => set({ titleSize }),
      setSubtitleSize: (subtitleSize) => set({ subtitleSize }),
      setTextYOffset: (textYOffset) => set({ textYOffset }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      
      setBgType: (bgType) => set({ bgType }),
      setBgColor: (bgColor) => set({ bgColor }),
      setGradientStart: (gradientStart) => set({ gradientStart }),
      setGradientEnd: (gradientEnd) => set({ gradientEnd }),
      setSmartColor: (smartColor) => set({ smartColor }),
      
      setScreenshot: (screenshot) => set({ screenshot }),
      setFrameType: (frameType) => set({ frameType }),
      setImagePos: (imagePos) => set({ imagePos }),
      setImageScale: (imageScale) => set({ imageScale }),
      setCornerRadius: (cornerRadius) => set({ cornerRadius }),

      // Draft Actions
      saveDraft: (name) => {
        const state = get()
        const draft: Draft = {
          id: crypto.randomUUID(),
          name,
          createdAt: Date.now(),
          data: {
            title: state.title,
            subtitle: state.subtitle,
            titleColor: state.titleColor,
            subtitleColor: state.subtitleColor,
            titleSize: state.titleSize,
            subtitleSize: state.subtitleSize,
            textYOffset: state.textYOffset,
            fontFamily: state.fontFamily,
            bgType: state.bgType,
            bgColor: state.bgColor,
            gradientStart: state.gradientStart,
            gradientEnd: state.gradientEnd,
            smartColor: state.smartColor,
            screenshot: state.screenshot,
            frameType: state.frameType,
            imagePos: state.imagePos,
            imageScale: state.imageScale,
            cornerRadius: state.cornerRadius,
          }
        }
        set((state) => ({ drafts: [draft, ...state.drafts] }))
      },

      loadDraft: (id) => {
        const draft = get().drafts.find(d => d.id === id)
        if (draft) {
          set({ ...draft.data })
        }
      },

      deleteDraft: (id) => {
        set((state) => ({ drafts: state.drafts.filter(d => d.id !== id) }))
      }
    }),
    {
      name: 'studio-storage',
      storage: createJSONStorage(() => storage),
      partialize: (state) => ({
        ...state,
        // We persist everything including drafts and current state
      })
    }
  )
)
