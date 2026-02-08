import React, { useEffect, useState } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { PageContainer } from '../components/PageContainer'
import { TagInput } from '../components/TagInput'
import { healthProfileService, convertHeight, convertWeight } from '../services/healthProfileService'
import type { UnitSystem, BloodType } from '../types'

const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']
const ACTIVITY_LEVELS = ['Sedentary', 'Light', 'Moderate', 'Active', 'Very Active']

export function HealthProfilePage() {
  const { user } = useAuth0()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Personal info
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [bloodType, setBloodType] = useState<BloodType | ''>('')

  // Allergies & Conditions
  const [allergies, setAllergies] = useState<string[]>([])
  const [chronicConditions, setChronicConditions] = useState<string[]>([])

  // Medications
  const [medications, setMedications] = useState<string[]>([])

  // Height & Weight
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [heightUnit, setHeightUnit] = useState<UnitSystem>('metric')
  const [weightUnit, setWeightUnit] = useState<UnitSystem>('metric')

  // Lifestyle
  const [sleepHours, setSleepHours] = useState('')
  const [activityLevel, setActivityLevel] = useState('')
  const [dietType, setDietType] = useState('')

  // Emergency Contact & Healthcare Provider
  const [emergencyContactName, setEmergencyContactName] = useState('')
  const [emergencyContactPhone, setEmergencyContactPhone] = useState('')
  const [primaryPhysician, setPrimaryPhysician] = useState('')

  useEffect(() => {
    if (user?.sub) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    if (!user?.sub) return
    
    try {
      setLoading(true)
      setError('')
      const profile = await healthProfileService.getProfile(user.sub)
      
      if (profile) {
        setDateOfBirth(profile.date_of_birth || '')
        setBloodType((profile.blood_type as BloodType) || '')
        setAllergies(profile.allergies || [])
        setChronicConditions(profile.chronic_conditions || [])
        setMedications(profile.medications || [])
        setHeight(profile.height?.toString() || '')
        setWeight(profile.weight?.toString() || '')
        setHeightUnit(profile.height_unit || 'metric')
        setWeightUnit(profile.weight_unit || 'metric')
        setSleepHours(profile.lifestyle_sleep_hours?.toString() || '')
        setActivityLevel(profile.lifestyle_activity_level || '')
        setDietType(profile.lifestyle_diet_type || '')
        setEmergencyContactName(profile.emergency_contact_name || '')
        setEmergencyContactPhone(profile.emergency_contact_phone || '')
        setPrimaryPhysician(profile.primary_physician || '')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.sub) return

    try {
      setSaving(true)
      setError('')
      setSuccessMessage('')

      const payload = {
        user_id: user.sub,
        date_of_birth: dateOfBirth || undefined,
        blood_type: bloodType || undefined,
        allergies: allergies.length > 0 ? allergies : undefined,
        chronic_conditions: chronicConditions.length > 0 ? chronicConditions : undefined,
        medications: medications.length > 0 ? medications : undefined,
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        height_unit: heightUnit,
        weight_unit: weightUnit,
        lifestyle_sleep_hours: sleepHours ? parseFloat(sleepHours) : undefined,
        lifestyle_activity_level: activityLevel || undefined,
        lifestyle_diet_type: dietType || undefined,
        emergency_contact_name: emergencyContactName || undefined,
        emergency_contact_phone: emergencyContactPhone || undefined,
        primary_physician: primaryPhysician || undefined,
      }

      await healthProfileService.upsertProfile(payload)
      setSuccessMessage('Health profile saved successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  const getConvertedHeight = () => {
    if (!height) return ''
    const num = parseFloat(height)
    if (isNaN(num)) return ''
    
    if (heightUnit === 'metric') {
      const inches = convertHeight(num, 'metric', 'imperial')
      const feet = Math.floor(inches / 12)
      const remainingInches = Math.round(inches % 12)
      return `≈ ${feet}'${remainingInches}"`
    } else {
      const totalInches = parseFloat(height)
      const cm = convertHeight(totalInches, 'imperial', 'metric')
      return `≈ ${Math.round(cm)} cm`
    }
  }

  const getConvertedWeight = () => {
    if (!weight) return ''
    const num = parseFloat(weight)
    if (isNaN(num)) return ''
    
    if (weightUnit === 'metric') {
      const lbs = convertWeight(num, 'metric', 'imperial')
      return `≈ ${Math.round(lbs)} lbs`
    } else {
      const kg = convertWeight(num, 'imperial', 'metric')
      return `≈ ${Math.round(kg)} kg`
    }
  }

  if (loading) {
    return (
      <PageContainer className="max-w-4xl">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Health Profile</h1>
        <div className="text-slate-500 dark:text-white/60 text-center py-8">Loading profile...</div>
      </PageContainer>
    )
  }

  return (
    <PageContainer className="max-w-4xl">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Health Profile</h1>
      <div className="space-y-6 mt-4">
        <p className="text-slate-600 dark:text-white/70 text-sm">
          Manage your baseline health information. All fields are optional and kept private.
        </p>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-300 px-4 py-3 rounded-lg text-sm">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          {/* Personal Information */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Personal Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full rounded border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">
                  Blood Type
                </label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value as BloodType)}
                  className="w-full rounded border border-slate-200 dark:border-white/20 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Select blood type</option>
                  {BLOOD_TYPES.map((type) => (
                    <option key={type} value={type} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{type}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Height & Weight */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Height & Weight</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Height */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-2">
                  Height
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setHeightUnit('metric')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        heightUnit === 'metric'
                          ? 'bg-brand text-white'
                          : 'bg-white dark:bg-white/10 text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      cm
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeightUnit('imperial')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        heightUnit === 'imperial'
                          ? 'bg-brand text-white'
                          : 'bg-white dark:bg-white/10 text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      inches
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder={heightUnit === 'metric' ? 'e.g. 170' : 'e.g. 67'}
                    className="w-full rounded border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-white/40 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  {getConvertedHeight() && (
                    <p className="text-xs text-slate-500 dark:text-white/50">{getConvertedHeight()}</p>
                  )}
                </div>
              </div>

              {/* Weight */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-2">
                  Weight
                </label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWeightUnit('metric')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        weightUnit === 'metric'
                          ? 'bg-brand text-white'
                          : 'bg-white dark:bg-white/10 text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      onClick={() => setWeightUnit('imperial')}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        weightUnit === 'imperial'
                          ? 'bg-brand text-white'
                          : 'bg-white dark:bg-white/10 text-slate-500 dark:text-white/60 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      lbs
                    </button>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    placeholder={weightUnit === 'metric' ? 'e.g. 70' : 'e.g. 154'}
                    className="w-full rounded border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-white/40 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                  {getConvertedWeight() && (
                    <p className="text-xs text-slate-500 dark:text-white/50">{getConvertedWeight()}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Allergies & Chronic Conditions */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Allergies & Conditions</h2>
            
            <TagInput
              label="Allergies"
              value={allergies}
              onChange={setAllergies}
              placeholder="e.g. Peanuts, Penicillin"
              hint="Add any known allergies to food, medications, or other substances"
            />

            <TagInput
              label="Chronic Conditions"
              value={chronicConditions}
              onChange={setChronicConditions}
              placeholder="e.g. Hypertension, Diabetes"
              hint="Add any ongoing health conditions or diagnoses"
            />
          </div>

          {/* Current Medications */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Current Medications</h2>
            
            <TagInput
              label="Medications"
              value={medications}
              onChange={setMedications}
              placeholder="e.g. Lisinopril 10mg"
              hint="Add medications you're currently taking (include dosage if known)"
            />
          </div>

          {/* Lifestyle */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Lifestyle</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">
                  Average Sleep (hours/night)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(e.target.value)}
                  placeholder="e.g. 7.5"
                  className="w-full rounded border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-white/40 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">
                  Activity Level
                </label>
                <select
                  value={activityLevel}
                  onChange={(e) => setActivityLevel(e.target.value)}
                  className="w-full rounded border border-slate-200 dark:border-white/20 bg-white dark:bg-slate-800 px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="" className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">Select level</option>
                  {ACTIVITY_LEVELS.map((level) => (
                    <option key={level} value={level} className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white">{level}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">
                  Diet Type
                </label>
                <input
                  type="text"
                  value={dietType}
                  onChange={(e) => setDietType(e.target.value)}
                  placeholder="e.g. Vegetarian, Keto"
                  className="w-full rounded border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-white/40 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact & Healthcare Provider */}
          <div className="glass-card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Emergency Contact & Healthcare Provider</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">
                  Emergency Contact Name
                </label>
                <input
                  type="text"
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="Full name"
                  className="w-full rounded border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-white/40 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="Phone number"
                  className="w-full rounded border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-white/40 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-1">
                Primary Care Physician
              </label>
              <input
                type="text"
                value={primaryPhysician}
                onChange={(e) => setPrimaryPhysician(e.target.value)}
                placeholder="Doctor's name"
                className="w-full rounded border border-slate-200 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-white/40 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-lg bg-brand hover:bg-brand/80 text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Saving...' : 'Save Health Profile'}
            </button>
          </div>
        </form>
      </div>
    </PageContainer>
  )
}
