import { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  fullWidth?: boolean
  className?: string
}

export function PageContainer({ children, fullWidth = false, className = '' }: PageContainerProps) {
  return (
    <div className={fullWidth ? `w-full ${className}` : `max-w-6xl mx-auto px-6 py-8 ${className}`}>
      {children}
    </div>
  )
}
