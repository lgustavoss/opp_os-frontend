import { useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import { clienteService } from '../../services/clienteService'

const DEBOUNCE_MS = 350
const PAGE_SIZE = 25

export default function ClienteSelect({
  label,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder = 'Digite para buscar cliente...',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [options, setOptions] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState(null)
  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const debounceRef = useRef(null)

  const selectedValue = value === '' || value === undefined ? null : String(value)

  const fetchClientes = useCallback(async (term) => {
    if (!term || term.trim().length < 2) {
      setOptions([])
      return
    }
    setLoading(true)
    try {
      const data = await clienteService.list({
        razao_social: term.trim(),
        page_size: PAGE_SIZE,
      })
      setOptions(data.results || [])
    } catch (err) {
      console.error('Erro ao buscar clientes:', err)
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!isOpen) return
    debounceRef.current = setTimeout(() => {
      fetchClientes(searchTerm)
    }, DEBOUNCE_MS)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [searchTerm, isOpen, fetchClientes])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  useEffect(() => {
    if (!selectedValue) {
      setSelectedLabel(null)
      return
    }
    if (selectedLabel) return
    let cancelled = false
    clienteService
      .get(Number(selectedValue))
      .then((cliente) => {
        if (!cancelled) setSelectedLabel(cliente.razao_social || `Cliente #${selectedValue}`)
      })
      .catch(() => {
        if (!cancelled) setSelectedLabel(`Cliente #${selectedValue}`)
      })
    return () => { cancelled = true }
  }, [selectedValue])

  const handleSelect = (cliente) => {
    if (onChange) {
      const syntheticEvent = { target: { value: String(cliente.id) } }
      onChange(syntheticEvent)
    }
    setSelectedLabel(cliente.razao_social)
    setSearchTerm('')
    setOptions([])
    setIsOpen(false)
  }

  const handleClear = (e) => {
    e.stopPropagation()
    if (onChange) onChange({ target: { value: '' } })
    setSelectedLabel(null)
    setSearchTerm('')
    setOptions([])
    setIsOpen(false)
  }

  const handleOpen = () => {
    if (disabled) return
    setIsOpen(true)
    setSearchTerm('')
    if (!selectedValue) setTimeout(() => inputRef.current?.focus(), 50)
  }

  const displayText = selectedLabel || (selectedValue ? `Cliente #${selectedValue}` : null)

  return (
    <div className={`w-full ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={handleOpen}
          disabled={disabled}
          className={`
            input-base text-left flex items-center justify-between min-h-[42px]
            ${error ? 'border-danger-500 focus:ring-danger-500' : ''}
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
            ${isOpen ? 'ring-2 ring-primary-500 border-primary-500' : ''}
          `}
        >
          {selectedValue ? (
            <span className="text-secondary-900 truncate flex-1 text-left">
              {displayText}
            </span>
          ) : (
            <span className="text-secondary-400 flex-1 text-left flex items-center gap-2">
              <Search className="w-4 h-4 shrink-0" />
              {placeholder}
            </span>
          )}
          <span className="flex items-center gap-1 shrink-0 ml-2">
            {selectedValue && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded hover:bg-secondary-100 text-secondary-500 hover:text-secondary-700"
                aria-label="Limpar cliente"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <ChevronDown
              className={`w-5 h-5 text-secondary-500 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-secondary-300 rounded-lg shadow-medium overflow-hidden">
            <div className="p-2 border-b border-secondary-200 bg-secondary-50">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por razão social..."
                className="input-base py-2 text-sm w-full"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="max-h-60 overflow-auto py-1">
              {loading ? (
                <div className="px-4 py-6 text-center text-sm text-secondary-500">
                  Buscando...
                </div>
              ) : searchTerm.trim().length < 2 ? (
                <div className="px-4 py-6 text-center text-sm text-secondary-500">
                  Digite ao menos 2 caracteres para buscar
                </div>
              ) : options.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-secondary-500">
                  Nenhum cliente encontrado
                </div>
              ) : (
                options.map((cliente) => (
                  <button
                    key={cliente.id}
                    type="button"
                    onClick={() => handleSelect(cliente)}
                    className={`
                      w-full text-left px-4 py-3 text-sm transition-colors duration-150
                      ${String(cliente.id) === selectedValue
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-secondary-700 hover:bg-secondary-50'}
                    `}
                  >
                    {cliente.razao_social}
                    {cliente.nome_fantasia && (
                      <span className="text-secondary-500 block text-xs mt-0.5 truncate">
                        {cliente.nome_fantasia}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-danger-600">{error}</p>
      )}
    </div>
  )
}
