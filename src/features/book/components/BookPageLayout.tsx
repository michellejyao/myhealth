import { ReactNode } from 'react'

interface BookPageLayoutProps {
  title: string
  children: ReactNode
  className?: string
}

/**
 * Reusable book page wrapper: paper-like margins, section headers, medical journal look.
 */
export function BookPageLayout({ title, children, className = '' }: BookPageLayoutProps) {
  return (
    <div
      className={`
        book-page-layout
        min-h-full
        bg-white
        text-black
        p-4
        rounded-sm
        shadow-inner
        border border-black/10
        font-serif
        ${className}
      `}
      style={{
        boxShadow: 'inset 0 0 24px rgba(0,0,0,0.04)',
      }}
    >
      <header className="border-b border-black/10 pb-2 mb-3">
        <h2 className="text-base font-semibold text-black tracking-tight">
          {title}
        </h2>
      </header>
      <div className="space-y-3">{children}</div>
    </div>
  )
}
