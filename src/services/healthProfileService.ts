import { supabase } from '../lib/supabase'
import type { HealthProfile, UnitSystem } from '../types'

export interface HealthProfilePayload {
  user_id: string
  allergies?: string[]
  height?: number
  weight?: number
  height_unit?: UnitSystem
  weight_unit?: UnitSystem
  blood_type?: string
  date_of_birth?: string
  medications?: string[]
  emergency_contact_name?: string
  emergency_contact_phone?: string
  primary_physician?: string
  chronic_conditions?: string[]
  lifestyle_sleep_hours?: number
  lifestyle_activity_level?: string
  lifestyle_diet_type?: string
}

// Unit conversion helpers
export const convertHeight = (value: number, fromUnit: UnitSystem, toUnit: UnitSystem): number => {
  if (fromUnit === toUnit) return value
  if (fromUnit === 'metric' && toUnit === 'imperial') {
    // cm to inches
    return value / 2.54
  }
  // inches to cm
  return value * 2.54
}

export const convertWeight = (value: number, fromUnit: UnitSystem, toUnit: UnitSystem): number => {
  if (fromUnit === toUnit) return value
  if (fromUnit === 'metric' && toUnit === 'imperial') {
    // kg to lbs
    return value * 2.20462
  }
  // lbs to kg
  return value / 2.20462
}

export const formatHeight = (cm: number, unit: UnitSystem): string => {
  if (unit === 'imperial') {
    const inches = convertHeight(cm, 'metric', 'imperial')
    const feet = Math.floor(inches / 12)
    const remainingInches = Math.round(inches % 12)
    return `${feet}'${remainingInches}"`
  }
  return `${Math.round(cm)} cm`
}

export const formatWeight = (kg: number, unit: UnitSystem): string => {
  if (unit === 'imperial') {
    const lbs = convertWeight(kg, 'metric', 'imperial')
    return `${Math.round(lbs)} lbs`
  }
  return `${Math.round(kg)} kg`
}

export const healthProfileService = {
  async getProfile(userId: string): Promise<HealthProfile | null> {
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

  async upsertProfile(profile: HealthProfilePayload): Promise<HealthProfile> {
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
