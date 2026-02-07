import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { appointmentService } from '../services/appointmentService'
import type { AppointmentEntry, Specialty } from '../types'
import { PageContainer } from '../components/PageContainer'
import { LoadingSpinner } from '../components/LoadingSpinner'

const SPECIALTY_LABELS: Record<Specialty, string> = {
  'general practitioner': 'General Practitioner',
  cardiologist: 'Cardiologist',
  neurologist: 'Neurologist',
  orthopedist: 'Orthopedist',
  dermatologist: 'Dermatologist',
  other: 'Other',
}

export function AppointmentsPage() {
  const { user } = useAuth0()
  const userId = user?.sub ?? ''
  const [appointments, setAppointments] = useState<AppointmentEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [newQuestion, setNewQuestion] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!userId) return
    appointmentService
      .fetchAppointments(userId)
      .then(setAppointments)
      .finally(() => setLoading(false))
  }, [userId])

  const futureAppointments = appointments.filter(
    (a) => new Date(a.appointment_date) >= new Date()
  ).sort((a, b) => new Date(a.appointment_date).getTime() - new Date(b.appointment_date).getTime())

  const addQuestion = async (appointmentId: string) => {
    const q = newQuestion[appointmentId]?.trim()
    if (!q || !userId) return
    const apt = appointments.find((a) => a.id === appointmentId)
    if (!apt) return
    const updated = [...(apt.questions_to_ask ?? []), q]
    try {
      const updatedApt = await appointmentService.updateAppointmentEntry(appointmentId, {
        questions_to_ask: updated,
      })
      setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? updatedApt : a)))
      setNewQuestion((prev) => ({ ...prev, [appointmentId]: '' }))
    } catch {
      // ignore
    }
  }

  const removeQuestion = async (appointmentId: string, index: number) => {
    const apt = appointments.find((a) => a.id === appointmentId)
    if (!apt?.questions_to_ask) return
    const updated = apt.questions_to_ask.filter((_, i) => i !== index)
    try {
      const updatedApt = await appointmentService.updateAppointmentEntry(appointmentId, {
        questions_to_ask: updated,
      })
      setAppointments((prev) => prev.map((a) => (a.id === appointmentId ? updatedApt : a)))
    } catch {
      // ignore
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <PageContainer>
      <h1 className="text-2xl font-bold text-white mb-6 font-display">Appointments</h1>
      <p className="text-white/70 mb-6">
        View your upcoming appointments and add questions to ask your doctor.
      </p>

      {futureAppointments.length === 0 ? (
        <div className="glass-card p-8 text-center text-white/70">
          No upcoming appointments. Add appointments in the My Health Book → Appointments section.
        </div>
      ) : (
        <div className="space-y-4">
          {futureAppointments.map((apt) => (
            <div
              key={apt.id}
              className="glass-card overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setExpandedId((id) => (id === apt.id ? null : apt.id))}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
              >
                <div>
                  <p className="font-semibold text-white/90">
                    {new Date(apt.appointment_date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                  <p className="text-white/70 text-sm mt-0.5">
                    {new Date(apt.appointment_date).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' • '}
                    {apt.doctor_name} ({SPECIALTY_LABELS[apt.specialty]})
                  </p>
                </div>
                <span className="text-white/50 text-xl">{expandedId === apt.id ? '−' : '+'}</span>
              </button>

              {expandedId === apt.id && (
                <div className="px-6 pb-6 pt-0 border-t border-white/10 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <div>
                      <p className="text-xs font-medium text-white/50 uppercase tracking-wide">What it&apos;s for</p>
                      <p className="text-white/90 mt-1">{apt.reason_for_visit || '—'}</p>
                    </div>
                    {apt.location && (
                      <div>
                        <p className="text-xs font-medium text-white/50 uppercase tracking-wide">Location</p>
                        <p className="text-white/90 mt-1">{apt.location}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-white/80 mb-2">Questions to ask your doctor</p>
                    <ul className="space-y-2 mb-3">
                      {(apt.questions_to_ask ?? []).map((q, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between gap-2 py-2 px-3 bg-white/5 rounded-lg text-white/90 border border-white/10"
                        >
                          <span>{q}</span>
                          <button
                            type="button"
                            onClick={() => removeQuestion(apt.id, i)}
                            className="text-red-400 hover:text-red-300 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                      {(!apt.questions_to_ask || apt.questions_to_ask.length === 0) && (
                        <li className="text-white/50 text-sm py-2">No questions saved yet.</li>
                      )}
                    </ul>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newQuestion[apt.id] ?? ''}
                        onChange={(e) => setNewQuestion((prev) => ({ ...prev, [apt.id]: e.target.value }))}
                        onKeyDown={(e) => e.key === 'Enter' && addQuestion(apt.id)}
                        placeholder="Add a question to ask…"
                        className="glass-input flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => addQuestion(apt.id)}
                        className="px-4 py-2 bg-accent hover:bg-accent/90 text-white font-medium rounded-lg transition-colors"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PageContainer>
  )
}
