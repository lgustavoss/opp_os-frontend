import { forwardRef, useId, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/**
 * Campo de senha com botão para mostrar/ocultar (ícone de olho).
 */
const PasswordInput = forwardRef(
  (
    {
      label,
      error,
      helperText,
      successText,
      validating = false,
      required = false,
      className = '',
      id: idProp,
      disabled,
      value,
      ...props
    },
    ref
  ) => {
    const reactId = useId()
    const inputId = idProp || `password-${reactId}`
    const [visible, setVisible] = useState(false)

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-secondary-700 mb-2"
          >
            {label}
            {required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            disabled={disabled}
            value={value ?? ''}
            aria-invalid={error ? 'true' : undefined}
            className={`
              input-base w-full pr-11
              ${
                error
                  ? '!border-danger-500 focus:!ring-danger-500 focus:!border-danger-500'
                  : validating
                    ? ''
                    : successText
                      ? '!border-success-500 focus:!ring-success-500 focus:!border-success-500'
                      : ''
              }
              ${className}
            `}
            {...props}
          />
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            className={`
              absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md
              text-secondary-500 hover:text-secondary-800 hover:bg-secondary-100
              transition-colors
              ${disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : ''}
            `}
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={visible}
          >
            {visible ? (
              <EyeOff className="w-5 h-5" aria-hidden />
            ) : (
              <Eye className="w-5 h-5" aria-hidden />
            )}
          </button>
        </div>
        {error && <p className="mt-1 text-sm text-danger-600">{error}</p>}
        {validating && !error && (
          <p className="mt-1 text-xs text-secondary-500" role="status" aria-live="polite">
            Verificando regras da senha…
          </p>
        )}
        {!error && !validating && successText && (
          <p className="mt-1 text-sm text-success-600">{successText}</p>
        )}
        {helperText && !error && !validating && !successText && (
          <p className="mt-1 text-sm text-secondary-500 leading-relaxed">{helperText}</p>
        )}
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'

export default PasswordInput
