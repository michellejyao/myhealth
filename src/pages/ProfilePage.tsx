import { useAuth0 } from '@auth0/auth0-react'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { PageContainer } from '../components/PageContainer'

/**
 * PR-09: Health profile. Shows Auth0 user information.
 */
export function ProfilePage() {
  const { user, isLoading } = useAuth0()

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <div>Not authenticated</div>
  }

  return (
    <PageContainer className="max-w-4xl">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-6 font-display">Profile</h1>

      <div className="grid grid-cols-1 gap-6">
        {/* User Info Card */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white/90 mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-white/60">Name</label>
              <p className="text-slate-800 dark:text-white/90">{user.name || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-500 dark:text-white/60">Email</label>
              <p className="text-slate-800 dark:text-white/90">{user.email || 'Not provided'}</p>
            </div>
            {user.phone_number && (
              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-white/60">Phone</label>
                <p className="text-slate-800 dark:text-white/90">{user.phone_number}</p>
              </div>
            )}
            {user.locale && (
              <div>
                <label className="text-sm font-medium text-slate-500 dark:text-white/60">Locale</label>
                <p className="text-slate-800 dark:text-white/90">{user.locale}</p>
              </div>
            )}
          </div>
        </div>

        {/* Picture Card (if available) */}
        {user.picture && (
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-slate-800 dark:text-white/90 mb-4">Profile Picture</h2>
            <img
              src={user.picture}
              alt={user.name}
              className="w-24 h-24 rounded-full border-2 border-slate-200 dark:border-white/20"
            />
          </div>
        )}

        {/* Auth Info */}
        <div className="glass-card p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white/90 mb-4">Auth Details</h2>
          <div className="space-y-3 text-sm text-slate-600 dark:text-white/70">
            <p>
              <span className="font-medium text-slate-700 dark:text-white/80">User ID:</span>{' '}
              <code className="bg-slate-100 dark:bg-white/10 px-2 py-1 rounded text-xs text-slate-700 dark:text-white/80 border border-slate-200 dark:border-white/10">{user.sub}</code>
            </p>
            {user.email_verified !== undefined && (
              <p>
                <span className="font-medium text-slate-700 dark:text-white/80">Email Verified:</span>{' '}
                {user.email_verified ? (
                  <span className="text-brand">Yes</span>
                ) : (
                  <span className="text-brand">No</span>
                )}
              </p>
            )}
            {user.updated_at && (
              <p>
                <span className="font-medium text-slate-700 dark:text-white/80">Last Updated:</span>{' '}
                {new Date(user.updated_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
