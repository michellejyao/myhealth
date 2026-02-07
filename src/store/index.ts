import { create } from 'zustand'
import type { BodyRegionId } from '../types'

interface LogsState {
  /** For 3D viewer: which region was selected (opens New Log flow). */
  selectedBodyRegion: BodyRegionId | null
  setSelectedBodyRegion: (region: BodyRegionId | null) => void
}

export const useAppStore = create<LogsState>((set) => ({
  selectedBodyRegion: null,
  setSelectedBodyRegion: (region) => set({ selectedBodyRegion: region }),
}))
