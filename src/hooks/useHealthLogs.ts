import { useAuth0 } from '@auth0/auth0-react'
import { useEffect, useState } from 'react'
import { logService, HealthLog } from '../services/logService'

export function useHealthLogs() {
  const { user, isAuthenticated, isLoading } = useAuth0()
  const [logs, setLogs] = useState<HealthLog[]>([])
  const [isLoadingLogs, setIsLoadingLogs] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch all logs for the user
  const fetchLogs = async () => {
    if (!isAuthenticated || !user?.sub) return

    try {
      setIsLoadingLogs(true)
      setError(null)
      const data = await logService.getUserLogs(user.sub)
      setLogs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs')
    } finally {
      setIsLoadingLogs(false)
    }
  }

  // Auto-fetch logs when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user?.sub && !isLoading) {
      fetchLogs()
    }
  }, [isAuthenticated, user?.sub, isLoading])

  // Create a new log
  const createLog = async (logData: Omit<HealthLog, 'user_id'>) => {
    if (!user?.sub) throw new Error('User not authenticated')

    try {
      const newLog = await logService.createLog({
        ...logData,
        user_id: user.sub,
      })
      setLogs([newLog, ...logs])
      return newLog
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create log')
      throw err
    }
  }

  // Update a log
  const updateLog = async (logId: string, updates: Partial<HealthLog>) => {
    try {
      const updated = await logService.updateLog(logId, updates)
      setLogs(logs.map(log => (log.id === logId ? updated : log)))
      return updated
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update log')
      throw err
    }
  }

  // Delete a log
  const deleteLog = async (logId: string) => {
    try {
      await logService.deleteLog(logId)
      setLogs(logs.filter(log => log.id !== logId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete log')
      throw err
    }
  }

  // Get logs filtered by body parts
  const getLogsByBodyParts = async (bodyParts: string[]) => {
    if (!user?.sub) throw new Error('User not authenticated')

    try {
      return await logService.getLogsByBodyParts(user.sub, bodyParts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to filter logs')
      throw err
    }
  }

  return {
    logs,
    isLoading: isLoading || isLoadingLogs,
    isAuthenticated,
    user,
    error,
    fetchLogs,
    createLog,
    updateLog,
    deleteLog,
    getLogsByBodyParts,
  }
}
