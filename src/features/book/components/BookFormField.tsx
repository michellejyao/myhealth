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
        className="block text-sm font-medium text-[#3d3629] mb-1"
      >
        {label}
        {required && <span className="text-amber-700 ml-0.5">*</span>}
      </label>
      {children}
      {hint && (
        <p className="mt-1 text-xs text-[#6b6358]">{hint}</p>
      )}
    </div>
  )
}
