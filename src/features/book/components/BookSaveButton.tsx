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
  primary: 'bg-[#5c4a3a] text-[#f5f0e8] hover:bg-[#4a3c2f] border-[#4a3c2f]',
  secondary: 'bg-[#e8e2d8] text-[#3d3629] hover:bg-[#ddd6c8] border-[#d4cfc4]',
  danger: 'bg-[#8b3a3a] text-white hover:bg-[#732e2e] border-[#732e2e]',
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
