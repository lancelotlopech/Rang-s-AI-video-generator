import { create } from 'zustand'
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware'
import { temporal } from 'zundo'
import { get, set, del } from 'idb-keyval'
import { FrameType } from '@/components/studio/phone-frame'
import { ColorPreset } from '@/lib/presets'

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

export interface Page {
  id: string
  title: string
  subtitle: string
  titleColor: string
  subtitleColor: string
  titleSize: number
  subtitleSize: number
  textYOffset: number
  
  bgType: 'solid' | 'gradient'
  bgColor: string
  gradientStart: string
  gradientEnd: string
  smartColor: string
  
  screenshot: string | null
  imagePos: { x: number; y: number }
  imageScale: number
}

export interface StudioState {
  // Global Settings (Applied to all pages or frame)
  fontFamily: string
  frameType: FrameType
  cornerRadius: number

  // Pages Management
  pages: Page[]
  activePageId: string

  // Drafts
  drafts: Draft[]

  // Saved Presets
  savedPresets: ColorPreset[]
  
  // Global Actions
  setFontFamily: (font: string) => void
  setFrameType: (type: FrameType) => void
  setCornerRadius: (radius: number) => void
  
  // Page Actions
  addPage: () => void
  removePage: (id: string) => void
  setActivePage: (id: string) => void
  updatePage: (id: string, data: Partial<Page>) => void
  updateActivePage: (data: Partial<Page>) => void
  
  // Sync Actions
  syncTextStylesToAll: () => void
  syncBackgroundStylesToAll: () => void
  syncImageStylesToAll: () => void
  
  // Draft Actions
  saveDraft: (name: string) => void
  loadDraft: (id: string) => void
  deleteDraft: (id: string) => void

  // Preset Actions
  savePreset: (preset: ColorPreset) => void
  deletePreset: (id: string) => void
}

export interface Draft {
  id: string
  name: string
  createdAt: number
  data: {
    fontFamily: string
    frameType: FrameType
    cornerRadius: number
    pages: Page[]
    activePageId: string
  }
}

const createDefaultPage = (): Page => ({
  id: crypto.randomUUID(),
  title: "Finance App",
  subtitle: "Track your expenses easily\nand save more money",
  titleColor: "#ffffff",
  subtitleColor: "rgba(255,255,255,0.8)",
  titleSize: 120,
  subtitleSize: 60,
  textYOffset: 240,
  
  bgType: 'gradient',
  bgColor: "#1e3a8a",
  gradientStart: "#1e3a8a",
  gradientEnd: "#172554",
  smartColor: "#3b82f6",
  
  screenshot: null,
  imagePos: { x: 0, y: 0 },
  imageScale: 0.85,
})

export const useStudioStore = create<StudioState>()(
  temporal(
    persist(
      (set, get) => {
        const initialPage = createDefaultPage()
        
        return {
        // Initial State
        fontFamily: "Inter",
        frameType: 'iphone-17-pro',
        cornerRadius: 140,
        
        pages: [initialPage],
        activePageId: initialPage.id,
        
        drafts: [],
        savedPresets: [],

        // Global Setters
        setFontFamily: (fontFamily) => set({ fontFamily }),
        setFrameType: (frameType) => set({ frameType }),
        setCornerRadius: (cornerRadius) => set({ cornerRadius }),

        // Page Actions
        addPage: () => {
          const newPage = createDefaultPage()
          // Inherit styles from active page if possible
          const state = get()
          const activePage = state.pages.find(p => p.id === state.activePageId)
          if (activePage) {
            newPage.bgType = activePage.bgType
            newPage.bgColor = activePage.bgColor
            newPage.gradientStart = activePage.gradientStart
            newPage.gradientEnd = activePage.gradientEnd
            newPage.titleColor = activePage.titleColor
            newPage.subtitleColor = activePage.subtitleColor
            newPage.titleSize = activePage.titleSize
            newPage.subtitleSize = activePage.subtitleSize
            newPage.textYOffset = activePage.textYOffset
          }
          
          set((state) => ({
            pages: [...state.pages, newPage],
            activePageId: newPage.id
          }))
        },

        removePage: (id) => {
          set((state) => {
            if (state.pages.length <= 1) return state // Don't delete last page
            const newPages = state.pages.filter(p => p.id !== id)
            // If we deleted the active page, switch to the first one
            const newActiveId = state.activePageId === id ? newPages[0].id : state.activePageId
            return {
              pages: newPages,
              activePageId: newActiveId
            }
          })
        },

        setActivePage: (id) => set({ activePageId: id }),

        updatePage: (id, data) => {
          set((state) => ({
            pages: state.pages.map(p => p.id === id ? { ...p, ...data } : p)
          }))
        },

        updateActivePage: (data) => {
          set((state) => ({
            pages: state.pages.map(p => p.id === state.activePageId ? { ...p, ...data } : p)
          }))
        },

        // Sync Actions
        syncTextStylesToAll: () => {
          const state = get()
          const activePage = state.pages.find(p => p.id === state.activePageId)
          if (!activePage) return
          
          set({
            pages: state.pages.map(p => ({
              ...p,
              titleColor: activePage.titleColor,
              subtitleColor: activePage.subtitleColor,
              titleSize: activePage.titleSize,
              subtitleSize: activePage.subtitleSize,
              textYOffset: activePage.textYOffset
            }))
          })
        },

        syncBackgroundStylesToAll: () => {
          const state = get()
          const activePage = state.pages.find(p => p.id === state.activePageId)
          if (!activePage) return
          
          set({
            pages: state.pages.map(p => ({
              ...p,
              bgType: activePage.bgType,
              bgColor: activePage.bgColor,
              gradientStart: activePage.gradientStart,
              gradientEnd: activePage.gradientEnd,
              smartColor: activePage.smartColor
            }))
          })
        },

        syncImageStylesToAll: () => {
          const state = get()
          const activePage = state.pages.find(p => p.id === state.activePageId)
          if (!activePage) return
          
          set({
            pages: state.pages.map(p => ({
              ...p,
              imagePos: { ...activePage.imagePos },
              imageScale: activePage.imageScale
            }))
          })
        },

        // Draft Actions
        saveDraft: (name) => {
          const state = get()
          const draft: Draft = {
            id: crypto.randomUUID(),
            name,
            createdAt: Date.now(),
            data: {
              fontFamily: state.fontFamily,
              frameType: state.frameType,
              cornerRadius: state.cornerRadius,
              pages: state.pages,
              activePageId: state.activePageId
            }
          }
          set((state) => ({ drafts: [draft, ...state.drafts] }))
        },

        loadDraft: (id) => {
          const draft = get().drafts.find(d => d.id === id)
          if (draft) {
            set({
              fontFamily: draft.data.fontFamily,
              frameType: draft.data.frameType,
              cornerRadius: draft.data.cornerRadius,
              pages: draft.data.pages,
              activePageId: draft.data.activePageId
            })
          }
        },

        deleteDraft: (id) => {
          set((state) => ({ drafts: state.drafts.filter(d => d.id !== id) }))
        },

        // Preset Actions
        savePreset: (preset) => {
          set((state) => ({ savedPresets: [preset, ...state.savedPresets] }))
        },

          deletePreset: (id) => {
            set((state) => ({ savedPresets: state.savedPresets.filter(p => p.id !== id) }))
          }
        }
      },
      {
        name: 'studio-storage-v2', // Changed version to avoid conflict with old data
        storage: createJSONStorage(() => storage),
        partialize: (state) => ({
          ...state,
        })
      }
    ),
    {
      limit: 50, // Limit history to 50 steps
      partialize: (state) => {
        // Exclude drafts and savedPresets from undo history
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { drafts, savedPresets, ...rest } = state
        return rest
      }
    }
  )
)
