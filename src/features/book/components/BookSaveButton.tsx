interface BookSaveButtonProps {
  label?: string
  saving?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
  type?: 'button' | 'submit'
  onClick?: () => void
  disabled?: boolean
  className?: string
}

const variantStyles = {
  primary: 'bg-accent text-white hover:bg-accent/90 border-accent',
  secondary: 'bg-white/80 text-black hover:bg-white border-black/20',
  danger: 'bg-red-600 text-white hover:bg-red-700 border-red-700',
}

export function BookSaveButton({
  label = 'Save',
  saving = false,
  variant = 'primary',
  type = 'submit',
  onClick,
  disabled = false,
  className = '',
}: BookSaveButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || saving}
      className={`
        px-4 py-2 rounded border font-medium text-sm
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {saving ? 'Saving…' : label}
    </button>
  )
}
