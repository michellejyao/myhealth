import { supabase } from '../lib/supabase'
import type { AppointmentEntry, Specialty } from '../types'

export interface AppointmentPayload {
  appointment_date: string
  doctor_name: string
  specialty: Specialty
  reason_for_visit?: string
  diagnosis?: string
  doctor_notes?: string
  follow_up_required: boolean
}

export const appointmentService = {
  async createAppointmentEntry(userId: string, payload: AppointmentPayload): Promise<AppointmentEntry> {
    if (!userId) throw new Error('user_id is required')
    const row = {
      user_id: userId,
      appointment_date: payload.appointment_date,
      doctor_name: payload.doctor_name,
      specialty: payload.specialty,
      reason_for_visit: payload.reason_for_visit ?? null,
      diagnosis: payload.diagnosis ?? null,
      doctor_notes: payload.doctor_notes ?? null,
      follow_up_required: payload.follow_up_required ?? false,
    }
    const { data, error } = await supabase.from('appointments').insert([row]).select()
    if (error) throw new Error(`Failed to create appointment: ${error.message}`)
    return data[0]
  },

  async fetchAppointments(userId: string): Promise<AppointmentEntry[]> {
    if (!userId) throw new Error('userId is required')
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .eq('user_id', userId)
      .order('appointment_date', { ascending: false })
    if (error) throw new Error(`Failed to fetch appointments: ${error.message}`)
    return data ?? []
  },

  async updateAppointmentEntry(id: string, payload: Partial<AppointmentPayload>): Promise<AppointmentEntry> {
    const { data, error } = await supabase
      .from('appointments')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
    if (error) throw new Error(`Failed to update appointment: ${error.message}`)
    return data[0]
  },

  async deleteAppointmentEntry(id: string): Promise<void> {
    const { error } = await supabase.from('appointments').delete().eq('id', id)
    if (error) throw new Error(`Failed to delete appointment: ${error.message}`)
  },
}
