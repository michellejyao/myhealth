import React, { useState } from 'react'

interface TagInputProps {
  value: string[]
  onChange: (newValue: string[]) => void
  placeholder?: string
  label: string
  hint?: string
}

export function TagInput({ value, onChange, placeholder = 'Add item...', label, hint }: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const handleAdd = () => {
    const trimmed = inputValue.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
      setInputValue('')
    }
  }

  const handleRemove = (itemToRemove: string) => {
    onChange(value.filter(item => item !== itemToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-white/80 mb-2">
        {label}
      </label>
      
      {/* Tag chips display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {value.map((item) => (
            <div
              key={item}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand/20 border border-brand/40 text-slate-900 dark:text-white text-sm"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => handleRemove(item)}
                className="hover:text-red-500 dark:hover:text-red-400 transition-colors"
                aria-label={`Remove ${item}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input field and add button */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="flex-1 rounded border border-slate-300 dark:border-white/20 bg-white dark:bg-white/10 px-3 py-2 text-slate-900 dark:text-white text-sm placeholder-slate-400 dark:placeholder-white/40 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={!inputValue.trim()}
          className="px-4 py-2 rounded bg-brand hover:bg-brand/80 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
      </div>

      {hint && (
        <p className="text-xs text-white/50 mt-1">{hint}</p>
      )}
    </div>
  )
}
