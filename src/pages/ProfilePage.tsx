import { useAuth0 } from '@auth0/auth0-react'
import { LoadingSpinner } from '../components/LoadingSpinner'

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
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-800 mb-6">Profile</h1>

      <div className="grid grid-cols-1 gap-6">
        {/* User Info Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Account Information</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Name</label>
              <p className="text-slate-600">{user.name || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">Email</label>
              <p className="text-slate-600">{user.email || 'Not provided'}</p>
            </div>
            {user.phone_number && (
              <div>
                <label className="text-sm font-medium text-slate-700">Phone</label>
                <p className="text-slate-600">{user.phone_number}</p>
              </div>
            )}
            {user.locale && (
              <div>
                <label className="text-sm font-medium text-slate-700">Locale</label>
                <p className="text-slate-600">{user.locale}</p>
              </div>
            )}
          </div>
        </div>

        {/* Picture Card (if available) */}
        {user.picture && (
          <div className="bg-white rounded-lg border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Profile Picture</h2>
            <img
              src={user.picture}
              alt={user.name}
              className="w-24 h-24 rounded-full border border-slate-300"
            />
          </div>
        )}

        {/* Auth Info */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Auth Details</h2>
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-medium">User ID:</span> <code className="bg-slate-100 px-2 py-1 rounded text-xs">{user.sub}</code>
            </p>
            {user.email_verified !== undefined && (
              <p>
                <span className="font-medium">Email Verified:</span>{' '}
                {user.email_verified ? (
                  <span className="text-green-600">Yes</span>
                ) : (
                  <span className="text-orange-600">No</span>
                )}
              </p>
            )}
            {user.updated_at && (
              <p>
                <span className="font-medium">Last Updated:</span>{' '}
                {new Date(user.updated_at).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
