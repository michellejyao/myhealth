import { ReactNode } from 'react'

interface BookSectionProps {
  title?: string
  children: ReactNode
  className?: string
}

export function BookSection({ title, children, className = '' }: BookSectionProps) {
  return (
    <section className={`book-section ${className}`}>
      {title && (
        <h3 className="text-sm font-semibold text-[#4a4238] uppercase tracking-wider mb-2">
          {title}
        </h3>
      )}
      {children}
    </section>
  )
}
