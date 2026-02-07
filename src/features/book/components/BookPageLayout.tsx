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
        bg-[#f5f0e8]
        text-[#2c2419]
        p-4
        rounded-sm
        shadow-inner
        border border-[#e0d9cc]
        font-serif
        ${className}
      `}
      style={{
        boxShadow: 'inset 0 0 24px rgba(0,0,0,0.04)',
      }}
    >
      <header className="border-b border-[#d4cfc4] pb-2 mb-3">
        <h2 className="text-base font-semibold text-[#3d3629] tracking-tight">
          {title}
        </h2>
      </header>
      <div className="space-y-3">{children}</div>
    </div>
  )
}
