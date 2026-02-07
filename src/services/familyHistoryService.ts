import { supabase } from '../lib/supabase'
import type { FamilyHistoryEntry, FamilyRelationship, ConfidenceLevel } from '../types'

export interface FamilyHistoryPayload {
  condition_name: string
  relationship: FamilyRelationship
  age_of_onset?: number
  notes?: string
  confidence_level: ConfidenceLevel
}

export const familyHistoryService = {
  async createFamilyHistoryEntry(userId: string, payload: FamilyHistoryPayload): Promise<FamilyHistoryEntry> {
    if (!userId) throw new Error('user_id is required')
    const row = {
      user_id: userId,
      condition_name: payload.condition_name,
      relationship: payload.relationship,
      age_of_onset: payload.age_of_onset ?? null,
      notes: payload.notes ?? null,
      confidence_level: payload.confidence_level,
    }
    const { data, error } = await supabase.from('family_history').insert([row]).select()
    if (error) throw new Error(`Failed to create family history: ${error.message}`)
    return data[0]
  },

  async fetchFamilyHistory(userId: string): Promise<FamilyHistoryEntry[]> {
    if (!userId) throw new Error('userId is required')
    const { data, error } = await supabase
      .from('family_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(`Failed to fetch family history: ${error.message}`)
    return data ?? []
  },

  async updateFamilyHistoryEntry(id: string, payload: Partial<FamilyHistoryPayload>): Promise<FamilyHistoryEntry> {
    const { data, error } = await supabase
      .from('family_history')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
    if (error) throw new Error(`Failed to update family history: ${error.message}`)
    return data[0]
  },

  async deleteFamilyHistoryEntry(id: string): Promise<void> {
    const { error } = await supabase.from('family_history').delete().eq('id', id)
    if (error) throw new Error(`Failed to delete family history: ${error.message}`)
  },
}
