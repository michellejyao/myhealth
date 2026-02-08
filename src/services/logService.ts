import { supabase } from '../lib/supabase'
import type { BodyRegionId, PainType } from '../types'

export interface HealthLog {
  id?: string
  user_id: string
  title: string
  description?: string
  body_parts?: string[]
  body_region?: BodyRegionId | string
  pain_type?: PainType | string
  symptom_tags?: string[]
  severity?: number
  date: string
  created_at?: string
  updated_at?: string
}

/** Body region log payload for create/update. */
export interface BodyRegionLogPayload {
  body_region: string
  datetime: string
  pain_score: number
  pain_type: string
  symptom_tags: string[]
  notes?: string
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

  /** Create body region log entry (book page). */
  async createLogEntry(userId: string, payload: BodyRegionLogPayload) {
    if (!userId) throw new Error('user_id is required')
    const row = {
      user_id: userId,
      title: payload.body_region,
      description: payload.notes ?? null,
      body_parts: payload.symptom_tags?.length ? payload.symptom_tags : [],
      body_region: payload.body_region,
      pain_type: payload.pain_type,
      symptom_tags: payload.symptom_tags ?? [],
      severity: payload.pain_score,
      date: payload.datetime,
    }
    const { data, error } = await supabase
      .from('health_logs')
      .insert([row])
      .select()
    if (error) throw new Error(`Failed to create log: ${error.message}`)
    return data[0]
  },

  /** Update body region log entry. */
  async updateLogEntry(logId: string, payload: Partial<BodyRegionLogPayload>) {
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (payload.body_region != null) updates.body_region = payload.body_region
    if (payload.datetime != null) updates.date = payload.datetime
    if (payload.pain_score != null) updates.severity = payload.pain_score
    if (payload.pain_type != null) updates.pain_type = payload.pain_type
    if (payload.symptom_tags != null) updates.symptom_tags = payload.symptom_tags
    if (payload.notes != null) updates.description = payload.notes
    const { data, error } = await supabase
      .from('health_logs')
      .update(updates)
      .eq('id', logId)
      .select()
    if (error) throw new Error(`Failed to update log: ${error.message}`)
    return data[0]
  },

  /** Delete log entry. */
  async deleteLogEntry(logId: string) {
    const { error } = await supabase.from('health_logs').delete().eq('id', logId)
    if (error) throw new Error(`Failed to delete log: ${error.message}`)
  },

  /** Fetch logs for user (timeline/book). */
  async fetchLogs(userId: string) {
    if (!userId) throw new Error('userId is required')
    const { data, error } = await supabase
      .from('health_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    if (error) throw new Error(`Failed to fetch logs: ${error.message}`)
    return data ?? []
  },

  /** Fetch logs within a date range for summary generation. */
  async fetchLogsInDateRange(userId: string, startDate: string, endDate: string) {
    if (!userId) throw new Error('userId is required')
    // Make end date inclusive by adding time to the end of day
    const endDateInclusive = endDate + 'T23:59:59.999Z'
    const { data, error } = await supabase
      .from('health_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate)
      .lte('date', endDateInclusive)
      .order('date', { ascending: false })
    if (error) throw new Error(`Failed to fetch logs: ${error.message}`)
    return data ?? []
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

  /** Fetch logs for a specific body region. */
  async getLogsByBodyRegion(userId: string, bodyRegion: string) {
    if (!userId) throw new Error('userId is required')
    const { data, error } = await supabase
      .from('health_logs')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
    if (error) throw new Error(`Failed to fetch logs: ${error.message}`)
    const logs = data ?? []
    return logs.filter(
      (log) =>
        log.body_region === bodyRegion ||
        log.title === bodyRegion ||
        (Array.isArray(log.body_parts) && log.body_parts.includes(bodyRegion)) ||
        String(log.title || '').toLowerCase() === bodyRegion.replace(/_/g, ' ')
    )
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
