import { useState, useRef } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { logService, HealthLog } from '../services/logService'
import { healthProfileService, formatHeight, formatWeight } from '../services/healthProfileService'
import type { HealthProfile } from '../types'
import { LoadingSpinner } from './LoadingSpinner'
import { BODY_REGION_LABELS } from '../types'

export function AppointmentSummary() {
  const { user } = useAuth0()
  const userId = user?.sub ?? ''
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [summaryData, setSummaryData] = useState<{
    logs: HealthLog[]
    profile: HealthProfile | null
  } | null>(null)
  const summaryRef = useRef<HTMLDivElement>(null)

  const generateSummary = async () => {
    if (!startDate || !endDate || !userId) return
    
    setLoading(true)
    try {
      const [logs, profile] = await Promise.all([
        logService.fetchLogsInDateRange(userId, startDate, endDate),
        healthProfileService.getProfile(userId),
      ])
      
      setSummaryData({ logs, profile })
    } catch (error) {
      console.error('Failed to generate preparation:', error)
      alert('Failed to generate preparation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const exportToPDF = async () => {
    if (!summaryRef.current) return

    try {
      const canvas = await html2canvas(summaryRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const imgWidth = canvas.width
      const imgHeight = canvas.height
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight)
      const imgX = (pdfWidth - imgWidth * ratio) / 2
      const imgY = 10

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio)
      pdf.save(`appointment-preparation-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error('Failed to export PDF:', error)
      alert('Failed to export PDF. Please try again.')
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const groupLogsByBodyRegion = (logs: HealthLog[]) => {
    const grouped = new Map<string, HealthLog[]>()
    logs.forEach((log) => {
      const region = log.body_region || 'Other'
      if (!grouped.has(region)) {
        grouped.set(region, [])
      }
      grouped.get(region)?.push(log)
    })
    return grouped
  }

  return (
    <div className="glass-card p-6">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
        Generate Appointment Preparation
      </h2>
      <p className="text-slate-600 dark:text-white/70 mb-6">
        Select a date range to create a preparation document of your symptoms and health information to share with your doctor.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="startDate" className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-2">
            Start Date
          </label>
          <input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="glass-input w-full"
          />
        </div>
        <div>
          <label htmlFor="endDate" className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-2">
            End Date
          </label>
          <input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="glass-input w-full"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={generateSummary}
          disabled={!startDate || !endDate || loading}
          className="px-6 py-2 bg-accent hover:bg-accent/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate Preparation'}
        </button>
        {summaryData && (
          <button
            onClick={exportToPDF}
            className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg transition-colors"
          >
            Export as PDF
          </button>
        )}
      </div>

      {loading && (
        <div className="mt-8 flex justify-center">
          <LoadingSpinner />
        </div>
      )}

      {summaryData && !loading && (
        <div className="mt-8">
          <div
            ref={summaryRef}
            className="bg-white p-8 rounded-lg border border-slate-200"
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Appointment Preparation</h1>
            <p className="text-slate-600 mb-6">
              {formatDate(startDate)} to {formatDate(endDate)}
            </p>

            {/* General Health Information */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">
                General Health Information
              </h2>
              {summaryData.profile ? (
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  {summaryData.profile.date_of_birth && (
                    <div>
                      <span className="font-medium text-slate-700">Date of Birth:</span>
                      <span className="ml-2 text-slate-600">
                        {formatDate(summaryData.profile.date_of_birth)}
                      </span>
                    </div>
                  )}
                  {summaryData.profile.blood_type && (
                    <div>
                      <span className="font-medium text-slate-700">Blood Type:</span>
                      <span className="ml-2 text-slate-600">{summaryData.profile.blood_type}</span>
                    </div>
                  )}
                  {summaryData.profile.height && (
                    <div>
                      <span className="font-medium text-slate-700">Height:</span>
                      <span className="ml-2 text-slate-600">
                        {formatHeight(summaryData.profile.height, summaryData.profile.height_unit || 'metric')}
                      </span>
                    </div>
                  )}
                  {summaryData.profile.weight && (
                    <div>
                      <span className="font-medium text-slate-700">Weight:</span>
                      <span className="ml-2 text-slate-600">
                        {formatWeight(summaryData.profile.weight, summaryData.profile.weight_unit || 'metric')}
                      </span>
                    </div>
                  )}
                  {summaryData.profile.allergies && summaryData.profile.allergies.length > 0 && (
                    <div className="col-span-2">
                      <span className="font-medium text-slate-700">Allergies:</span>
                      <span className="ml-2 text-slate-600">{summaryData.profile.allergies.join(', ')}</span>
                    </div>
                  )}
                  {summaryData.profile.medications && summaryData.profile.medications.length > 0 && (
                    <div className="col-span-2">
                      <span className="font-medium text-slate-700">Current Medications:</span>
                      <span className="ml-2 text-slate-600">{summaryData.profile.medications.join(', ')}</span>
                    </div>
                  )}
                  {summaryData.profile.chronic_conditions && summaryData.profile.chronic_conditions.length > 0 && (
                    <div className="col-span-2">
                      <span className="font-medium text-slate-700">Chronic Conditions:</span>
                      <span className="ml-2 text-slate-600">{summaryData.profile.chronic_conditions.join(', ')}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-slate-600 text-sm">No health profile information available.</p>
              )}
            </div>

            {/* Symptoms Summary */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">
                Symptoms During This Period
              </h2>
              {summaryData.logs.length > 0 ? (
                <div className="space-y-6">
                  {Array.from(groupLogsByBodyRegion(summaryData.logs)).map(([region, logs]) => (
                    <div key={region} className="border-l-4 border-accent/30 pl-4">
                      <h3 className="font-semibold text-slate-800 mb-3">
                        {BODY_REGION_LABELS[region as keyof typeof BODY_REGION_LABELS] || region}
                      </h3>
                      <div className="space-y-3">
                        {logs.map((log) => (
                          <div key={log.id} className="text-sm">
                            <div className="flex items-start justify-between mb-1">
                              <span className="font-medium text-slate-700">{formatDate(log.date)}</span>
                              {log.severity !== undefined && (
                                <span className="text-slate-600">Severity: {log.severity}/10</span>
                              )}
                            </div>
                            {log.pain_type && (
                              <p className="text-slate-600 mb-1">Type: {log.pain_type}</p>
                            )}
                            {log.symptom_tags && log.symptom_tags.length > 0 && (
                              <p className="text-slate-600 mb-1">
                                Tags: {log.symptom_tags.join(', ')}
                              </p>
                            )}
                            {log.description && (
                              <p className="text-slate-700 mt-2">{log.description}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-600 text-sm">No symptoms logged during this period.</p>
              )}
            </div>

            {/* Summary Statistics */}
            {summaryData.logs.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-800 mb-4 pb-2 border-b border-slate-200">
                  Summary Statistics
                </h2>
                <div className="grid grid-cols-3 gap-6 text-center text-sm">
                  <div>
                    <div className="text-2xl font-bold text-accent">{summaryData.logs.length}</div>
                    <div className="text-slate-600 mt-1">Total Entries</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-accent">
                      {groupLogsByBodyRegion(summaryData.logs).size}
                    </div>
                    <div className="text-slate-600 mt-1">Body Regions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-accent">
                      {(
                        summaryData.logs
                          .filter((l) => l.severity !== undefined)
                          .reduce((sum, l) => sum + (l.severity || 0), 0) /
                        summaryData.logs.filter((l) => l.severity !== undefined).length || 0
                      ).toFixed(1)}
                    </div>
                    <div className="text-slate-600 mt-1">Avg Severity</div>
                  </div>
                </div>
              </div>
            )}

            <p className="mt-8 text-xs text-slate-500 text-center">
              Generated on {new Date().toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
