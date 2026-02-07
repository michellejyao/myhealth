import { useState, useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import {
  BookPageLayout,
  BookSection,
  BookFormField,
  BookSaveButton,
} from '../components'
import { SPECIALTIES, type Specialty } from '../../../types'
import { appointmentService } from '../../../services/appointmentService'
import type { AppointmentEntry } from '../../../types'

const inputClass =
  'w-full rounded border border-black/20 bg-white px-3 py-2 text-black text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent'

export function DoctorAppointmentPage() {
  const { user } = useAuth0()
  const userId = user?.sub ?? ''
  const [appointments, setAppointments] = useState<AppointmentEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [appointmentDate, setAppointmentDate] = useState(() =>
    new Date().toISOString().slice(0, 16)
  )
  const [doctorName, setDoctorName] = useState('')
  const [specialty, setSpecialty] = useState<Specialty>('general practitioner')
  const [reasonForVisit, setReasonForVisit] = useState('')
  const [location, setLocation] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [doctorNotes, setDoctorNotes] = useState('')
  const [followUpRequired, setFollowUpRequired] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return
    appointmentService
      .fetchAppointments(userId)
      .then(setAppointments)
      .catch(() => setError('Failed to load appointments'))
      .finally(() => setLoading(false))
  }, [userId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!doctorName.trim()) return
    setSaving(true)
    try {
      const created = await appointmentService.createAppointmentEntry(userId, {
        appointment_date: new Date(appointmentDate).toISOString(),
        doctor_name: doctorName.trim(),
        specialty,
        reason_for_visit: reasonForVisit.trim() || undefined,
        location: location.trim() || undefined,
        diagnosis: diagnosis.trim() || undefined,
        doctor_notes: doctorNotes.trim() || undefined,
        follow_up_required: followUpRequired,
      })
      setAppointments((prev) => [created, ...prev])
      setDoctorName('')
      setReasonForVisit('')
      setLocation('')
      setDiagnosis('')
      setDoctorNotes('')
      setFollowUpRequired(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  return (
    <BookPageLayout title="Doctor appointments">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2 rounded bg-brand/20 text-accent text-sm">
            {error}
          </div>
        )}

        <BookSection title="Log visit">
          <BookFormField label="Date &amp; time" htmlFor="appointment_date" required>
            <input
              id="appointment_date"
              type="datetime-local"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className={inputClass}
            />
          </BookFormField>
          <BookFormField label="Doctor name" htmlFor="doctor_name" required>
            <input
              id="doctor_name"
              type="text"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              placeholder="Dr. Name"
              className={inputClass}
            />
          </BookFormField>
          <BookFormField label="Specialty" htmlFor="specialty">
            <select
              id="specialty"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value as Specialty)}
              className={inputClass}
            >
              {SPECIALTIES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </BookFormField>
          <BookFormField label="Reason for visit">
            <input
              type="text"
              value={reasonForVisit}
              onChange={(e) => setReasonForVisit(e.target.value)}
              placeholder="e.g. Annual checkup"
              className={inputClass}
            />
          </BookFormField>
          <BookFormField label="Location">
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Main Street Clinic, Room 101"
              className={inputClass}
            />
          </BookFormField>
          <BookFormField label="Diagnosis" hint="Optional">
            <input
              type="text"
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="If provided"
              className={inputClass}
            />
          </BookFormField>
          <BookFormField label="Doctor notes">
            <textarea
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              rows={2}
              placeholder="Notes from the visit"
              className={inputClass + ' resize-none'}
            />
          </BookFormField>
          <BookFormField label="Follow-up required">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={followUpRequired}
                onChange={(e) => setFollowUpRequired(e.target.checked)}
                className="rounded border-black/20 text-accent focus:ring-accent"
              />
              <span className="text-sm text-black">Yes</span>
            </label>
          </BookFormField>
          <BookFormField label="Attachments" hint="Reports, scans, prescriptions — upload UI can be added.">
            <p className="text-xs text-black/70">Attachments can be linked to this appointment in the Attachments page.</p>
          </BookFormField>
          <BookSaveButton type="submit" label="Save appointment" saving={saving} />
        </BookSection>

        <BookSection title="Recent visits">
          {loading ? (
            <p className="text-sm text-black/70">Loading…</p>
          ) : appointments.length === 0 ? (
            <p className="text-sm text-black/70">No appointments recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {appointments.slice(0, 10).map((entry) => (
              <li
                key={entry.id}
                className="p-2 rounded border border-black/10 bg-white/80 text-sm text-black"
              >
                <span className="font-medium">
                  {new Date(entry.appointment_date).toLocaleDateString()}
                </span>
                {' — '}
                {entry.doctor_name} ({entry.specialty})
                {entry.reason_for_visit && ` — ${entry.reason_for_visit}`}
                {entry.location && ` @ ${entry.location}`}
                {entry.follow_up_required && (
                  <span className="ml-1 text-accent">Follow-up</span>
                )}
              </li>
              ))}
            </ul>
          )}
        </BookSection>
      </form>
    </BookPageLayout>
  )
}
