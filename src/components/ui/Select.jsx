import { forwardRef, useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

const Select = forwardRef(
  (
    {
      label,
      error,
      helperText,
      required = false,
      options = [],
      value,
      onChange,
      disabled = false,
      placeholder = 'Selecione uma opção',
      className = '',
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const selectRef = useRef(null)
    const containerRef = useRef(null)

    useEffect(() => {
      const handleClickOutside = (event) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(event.target)
        ) {
          setIsOpen(false)
        }
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isOpen])

    const selectedOption = options.find((opt) => opt.value === value)

    const handleSelect = (optionValue) => {
      if (onChange) {
        // Simula o evento do select nativo para compatibilidade
        const syntheticEvent = {
          target: { value: optionValue },
          currentTarget: { value: optionValue },
        }
        onChange(syntheticEvent)
      }
      setIsOpen(false)
    }

    return (
      <div className="w-full" ref={containerRef}>
        {label && (
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            {label}
            {required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <button
            type="button"
            ref={ref || selectRef}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`
              input-base
              text-left
              flex items-center justify-between
              ${error ? 'border-danger-500 focus:ring-danger-500' : ''}
              ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              ${isOpen ? 'ring-2 ring-primary-500 border-transparent' : ''}
              ${className}
            `}
            {...props}
          >
            <span className={selectedOption ? 'text-secondary-900' : 'text-secondary-400'}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown
              className={`w-5 h-5 text-secondary-500 transition-transform duration-200 ${
                isOpen ? 'transform rotate-180' : ''
              }`}
            />
          </button>

          {isOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-secondary-300 rounded-lg shadow-medium max-h-60 overflow-auto">
              {options.length === 0 ? (
                <div className="px-4 py-3 text-sm text-secondary-500 text-center rounded-lg">
                  Nenhuma opção disponível
                </div>
              ) : (
                <div className="py-1">
                  {options.map((option, index) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option.value)}
                      className={`
                        w-full text-left px-4 py-3 text-sm
                        transition-colors duration-150
                        ${
                          index === 0 ? 'rounded-t-lg' : ''
                        }
                        ${
                          index === options.length - 1 ? 'rounded-b-lg' : ''
                        }
                        ${
                          value === option.value
                            ? 'bg-primary-50 text-primary-700 font-medium'
                            : 'text-secondary-700 hover:bg-secondary-50'
                        }
                      `}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-danger-600">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-secondary-500">{helperText}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Select

