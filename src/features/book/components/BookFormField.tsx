import { ReactNode } from 'react'

interface BookFormFieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  hint?: string
  children: ReactNode
  className?: string
}

export function BookFormField({
  label,
  htmlFor,
  required,
  hint,
  children,
  className = '',
}: BookFormFieldProps) {
  return (
    <div className={`book-form-field ${className}`}>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-medium text-black mb-1"
      >
        {label}
        {required && <span className="text-accent ml-0.5">*</span>}
      </label>
      {children}
      {hint && (
        <p className="mt-1 text-xs text-black/70">{hint}</p>
      )}
    </div>
  )
}
