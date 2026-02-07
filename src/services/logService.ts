import { supabase } from '../lib/supabase'

export interface HealthLog {
  id?: string
  user_id: string
  title: string
  description?: string
  body_parts?: string[]
  severity?: number
  date: string
  created_at?: string
  updated_at?: string
}

export const logService = {
  // Create a new log
  async createLog(log: HealthLog) {
    if (!log.user_id) {
      throw new Error('user_id is required')
    }

    const { data, error } = await supabase
      .from('health_logs')
      .insert([log])
      .select()

    if (error) {
      console.error('Supabase error:', error)
      throw new Error(`Failed to create log: ${error.message}`)
    }
    return data[0]
  },

  // Get all logs for a user
  async getUserLogs(userId: string) {
    if (!userId) {
      throw new Error('userId is required')
    }

    const { data, error } = await supabase
      .from('health_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      throw new Error(`Failed to fetch logs: ${error.message}`)
    }
    return data
  },

  // Get a single log by ID
  async getLogById(logId: string) {
    const { data, error } = await supabase
      .from('health_logs')
      .select('*')
      .eq('id', logId)
      .single()

    if (error) {
      console.error('Supabase error:', error)
      throw new Error(`Failed to fetch log: ${error.message}`)
    }
    return data
  },

  // Update a log
  async updateLog(logId: string, updates: Partial<HealthLog>) {
    const { data, error } = await supabase
      .from('health_logs')
      .update(updates)
      .eq('id', logId)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      throw new Error(`Failed to update log: ${error.message}`)
    }
    return data[0]
  },

  // Delete a log
  async deleteLog(logId: string) {
    const { error } = await supabase
      .from('health_logs')
      .delete()
      .eq('id', logId)

    if (error) {
      console.error('Supabase error:', error)
      throw new Error(`Failed to delete log: ${error.message}`)
    }
  },

  // Get logs filtered by body parts
  async getLogsByBodyParts(userId: string, bodyParts: string[]) {
    if (!userId) {
      throw new Error('userId is required')
    }

    const { data, error } = await supabase
      .from('health_logs')
      .select('*')
      .eq('user_id', userId)
      .overlaps('body_parts', bodyParts)
      .order('date', { ascending: false })

    if (error) {
      console.error('Supabase error:', error)
      throw new Error(`Failed to filter logs: ${error.message}`)
    }
    return data
  },
}
