import { useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { BookPageLayout } from '../components/BookPageLayout';
import { BookSection } from '../components/BookSection';
import { healthProfileService, formatHeight, formatWeight } from '../../../services/healthProfileService';
import type { HealthProfile } from '../../../types';

interface BookHealthProfilePageProps {
  userId?: string;
}

export function HealthProfilePage({ userId: propUserId }: BookHealthProfilePageProps) {
  const { user } = useAuth0();
  const userId = propUserId ?? user?.sub ?? '';
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    healthProfileService.getProfile(userId)
      .then(setProfile)
      .catch((err) => setError(err.message || 'Failed to fetch profile.'))
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <BookPageLayout title="Health Profile">
      <BookSection>
        {loading ? (
          <p className="text-sm text-black/70">Loading…</p>
        ) : error ? (
          <div className="text-sm text-red-600">
            <strong>Error:</strong> {error}
          </div>
        ) : !profile ? (
          <p className="text-sm text-black/70">No health profile found.</p>
        ) : (
          <div className="space-y-3">
            {profile.date_of_birth && (
              <div>
                <span className="font-semibold">Date of Birth:</span> {profile.date_of_birth}
              </div>
            )}
            {profile.blood_type && (
              <div>
                <span className="font-semibold">Blood Type:</span> {profile.blood_type}
              </div>
            )}
            {profile.height && (
              <div>
                <span className="font-semibold">Height:</span> {formatHeight(profile.height, profile.height_unit || 'metric')}
              </div>
            )}
            {profile.weight && (
              <div>
                <span className="font-semibold">Weight:</span> {formatWeight(profile.weight, profile.weight_unit || 'metric')}
              </div>
            )}
            {profile.allergies && profile.allergies.length > 0 && (
              <div>
                <span className="font-semibold">Allergies:</span> {profile.allergies.join(', ')}
              </div>
            )}
            {profile.chronic_conditions && profile.chronic_conditions.length > 0 && (
              <div>
                <span className="font-semibold">Chronic Conditions:</span> {profile.chronic_conditions.join(', ')}
              </div>
            )}
            {profile.medications && profile.medications.length > 0 && (
              <div>
                <span className="font-semibold">Medications:</span> {profile.medications.join(', ')}
              </div>
            )}
            {profile.lifestyle_sleep_hours && (
              <div>
                <span className="font-semibold">Avg. Sleep:</span> {profile.lifestyle_sleep_hours} hrs/night
              </div>
            )}
            {profile.lifestyle_activity_level && (
              <div>
                <span className="font-semibold">Activity Level:</span> {profile.lifestyle_activity_level}
              </div>
            )}
            {profile.lifestyle_diet_type && (
              <div>
                <span className="font-semibold">Diet Type:</span> {profile.lifestyle_diet_type}
              </div>
            )}
            {(profile.emergency_contact_name || profile.emergency_contact_phone) && (
              <div>
                <span className="font-semibold">Emergency Contact:</span> {profile.emergency_contact_name || ''} {profile.emergency_contact_phone ? `(${profile.emergency_contact_phone})` : ''}
              </div>
            )}
            {profile.primary_physician && (
              <div>
                <span className="font-semibold">Primary Physician:</span> {profile.primary_physician}
              </div>
            )}
          </div>
        )}
      </BookSection>
    </BookPageLayout>
  );
}
