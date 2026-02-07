import { create } from 'zustand'
import type { BodyRegionId } from '../types'

export type BookPageType = 'body_region' | 'family_history' | 'appointments' | 'timeline' | 'ai_insights' | 'attachments'

interface OpenBookTo {
  type: 'body_region'
  region: BodyRegionId
}

interface LogsState {
  selectedBodyRegion: BodyRegionId | null
  setSelectedBodyRegion: (region: BodyRegionId | null) => void
  /** When set, book opens and shows this page (e.g. body region log). */
  openBookTo: OpenBookTo | null
  setOpenBookTo: (v: OpenBookTo | null) => void
}

export const useAppStore = create<LogsState>((set) => ({
  selectedBodyRegion: null,
  setSelectedBodyRegion: (region) => set({ selectedBodyRegion: region }),
  openBookTo: null,
  setOpenBookTo: (v) => set({ openBookTo: v }),
}))
