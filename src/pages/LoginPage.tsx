import { useAuth0 } from '@auth0/auth0-react'
import { LoadingSpinner } from '../components/LoadingSpinner'

export function LoginPage() {
  const { loginWithRedirect, isLoading } = useAuth0()

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-indigo-800">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">MyHealth</h1>
        <p className="text-indigo-100 mb-8 text-lg">Track your health symptoms with ease</p>
        <button
          onClick={() => loginWithRedirect()}
          className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors"
        >
          Sign In with Auth0
        </button>
      </div>
    </div>
  )
}
