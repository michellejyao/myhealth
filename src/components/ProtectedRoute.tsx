import { withAuthenticationRequired } from '@auth0/auth0-react'
import { LoadingSpinner } from './LoadingSpinner'

interface ProtectedRouteProps {
  component: React.ComponentType<any>
}

export function ProtectedRoute({ component: Component }: ProtectedRouteProps) {
  const ComponentWithAuth = withAuthenticationRequired(Component, {
    onRedirecting: () => <LoadingSpinner />,
  })

  return <ComponentWithAuth />
}
