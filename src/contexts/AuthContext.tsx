import { createContext, ReactNode } from 'react'
import { Auth0Provider } from '@auth0/auth0-react'

interface AuthContextType {
  // Add auth context types as needed
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const domain = import.meta.env.VITE_AUTH0_DOMAIN
  const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
  const redirectUri = import.meta.env.VITE_AUTH0_CALLBACK_URL

  if (!domain || !clientId || !redirectUri) {
    throw new Error('Missing Auth0 environment variables')
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: redirectUri,
        audience: `https://${domain}/api/v2/`,
        scope: 'openid profile email',
      }}
    >
      {children}
    </Auth0Provider>
  )
}
