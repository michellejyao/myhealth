import { supabase } from '../lib/supabase'

export interface SupabaseHealthProfile {
  user_id: string
  allergies?: string[]
  height?: number
  weight?: number
  family_history?: string[]
  lifestyle_sleep_hours?: number
  lifestyle_activity_level?: string
  lifestyle_diet_type?: string
  created_at?: string
  updated_at?: string
}

export const healthProfileService = {
  async getProfile(userId: string): Promise<SupabaseHealthProfile | null> {
    const { data, error } = await supabase
      .from('health_profile')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch profile: ${error.message}`)
    }
    return data
  },

  async upsertProfile(profile: SupabaseHealthProfile): Promise<SupabaseHealthProfile> {
    const { data, error } = await supabase
      .from('health_profile')
      .upsert(
        {
          ...profile,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single()

    if (error) throw new Error(`Failed to save profile: ${error.message}`)
    return data
  },
}
