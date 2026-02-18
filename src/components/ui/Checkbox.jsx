import { forwardRef } from 'react'
import { Check } from 'lucide-react'

const Checkbox = forwardRef(
  (
    {
      label,
      checked,
      onChange,
      disabled = false,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <label
        className={`
          flex items-center gap-3 cursor-pointer
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          ${className}
        `}
      >
        <div className="relative flex items-center justify-center">
          <input
            type="checkbox"
            ref={ref}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            className="sr-only"
            {...props}
          />
          <div
            className={`
              w-5 h-5 rounded-lg border-2 transition-all duration-200
              flex items-center justify-center
              ${
                checked
                  ? 'bg-primary-600 border-primary-600'
                  : 'bg-white border-secondary-300'
              }
              ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
              ${!disabled && !checked ? 'hover:border-primary-400' : ''}
            `}
          >
            {checked && (
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            )}
          </div>
        </div>
        {label && (
          <span className="text-sm font-medium text-secondary-700 select-none">
            {label}
          </span>
        )}
      </label>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export default Checkbox

