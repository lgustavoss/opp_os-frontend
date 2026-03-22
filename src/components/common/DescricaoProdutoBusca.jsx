import { useState, useEffect, useRef } from 'react'
import { Loader2, Package, PackagePlus } from 'lucide-react'
import { produtoService } from '../../services/produtoService'

const DEBOUNCE_MS = 320

/**
 * Descrição do item quando o tipo é Produto: busca cadastro após 3+ caracteres
 * e oferece cadastro rápido se não houver correspondência.
 */
export default function DescricaoProdutoBusca({
  value,
  onChange,
  produtoCodigo,
  onVincularProduto,
  podeCadastrarProduto,
  onCadastrarComTexto,
  id,
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])
  const containerRef = useRef(null)
  const debounceRef = useRef(null)
  const requestIdRef = useRef(0)

  const trimmed = (value || '').trim()
  const podeBuscar = trimmed.length >= 3

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
      debounceRef.current = null
    }

    if (!podeBuscar) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    setResults([])
    const myId = ++requestIdRef.current

    debounceRef.current = setTimeout(async () => {
      try {
        const data = await produtoService.list({
          search: trimmed,
          page_size: 25,
          page: 1,
        })
        if (requestIdRef.current === myId) {
          setResults(data.results || [])
        }
      } catch {
        if (requestIdRef.current === myId) {
          setResults([])
        }
      } finally {
        if (requestIdRef.current === myId) {
          setLoading(false)
        }
      }
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
        debounceRef.current = null
      }
    }
  }, [trimmed, podeBuscar])

  useEffect(() => {
    const onDoc = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const mostrarPainel = open && podeBuscar

  return (
    <div ref={containerRef} className="relative min-w-0">
      <input
        id={id}
        type="text"
        autoComplete="off"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setOpen(true)}
        className="input-base w-full text-sm"
        placeholder="Digite para buscar no cadastro (mín. 3 letras)…"
        aria-autocomplete="list"
        aria-expanded={mostrarPainel}
        aria-controls={mostrarPainel ? `${id}-sugestoes` : undefined}
      />

      {produtoCodigo ? (
        <div className="mt-2 space-y-1">
          <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary-50 px-2.5 py-1 text-xs font-medium text-primary-900 ring-1 ring-primary-100/80">
            <Package className="h-3.5 w-3.5 shrink-0 text-primary-600" aria-hidden />
            Item ligado ao catálogo · código {produtoCodigo}
          </span>
          <p className="text-xs text-secondary-500">
            Descrição e valor unitário desta linha são só deste orçamento; o cadastro de produtos não muda.
          </p>
        </div>
      ) : (
        <p className="mt-1 text-xs text-secondary-400">
          {trimmed.length > 0 && trimmed.length < 3
            ? `Faltam ${3 - trimmed.length} caractere(s) para buscar.`
            : 'Busca no cadastro ao atingir 3 caracteres.'}
        </p>
      )}

      {mostrarPainel && (
        <div
          id={`${id}-sugestoes`}
          role="listbox"
          className="absolute left-0 right-0 top-full z-[70] mt-1 max-h-[min(22rem,70vh)] overflow-hidden rounded-xl border border-secondary-200 bg-white py-1 shadow-lg flex flex-col"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2 px-3 py-4 text-sm text-secondary-500">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Buscando…
            </div>
          ) : (
            <>
              {results.length > 0 ? (
                <>
                  <p className="border-b border-secondary-100 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-secondary-400">
                    Resultados no cadastro
                  </p>
                  <ul className="min-h-0 max-h-[12.5rem] flex-1 overflow-auto py-0.5">
                    {results.map((p) => (
                      <li key={p.codigo} role="option">
                        <button
                          type="button"
                          className="flex w-full flex-col items-start gap-0.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-primary-50"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            onVincularProduto(p)
                            setOpen(false)
                          }}
                        >
                          <span className="font-medium text-secondary-900">{p.descricao}</span>
                          <span className="text-xs tabular-nums text-secondary-500">Cód. {p.codigo}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div className="px-3 py-2">
                  <p className="text-sm text-secondary-600">Nenhum produto encontrado para “{trimmed}”.</p>
                </div>
              )}

              {podeCadastrarProduto && (
                <div className="border-t border-secondary-100 bg-secondary-50/60 px-3 py-2.5">
                  <p className="mb-2 text-[11px] font-medium text-secondary-500">
                    {results.length > 0
                      ? 'Nenhum destes é o produto certo?'
                      : 'Quer incluir um produto novo?'}
                  </p>
                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-primary-200 bg-white px-3 py-2 text-xs font-semibold text-primary-800 shadow-sm transition-colors hover:bg-primary-50"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onCadastrarComTexto(trimmed)
                      setOpen(false)
                    }}
                  >
                    <PackagePlus className="h-4 w-4 shrink-0" aria-hidden />
                    Cadastrar “{trimmed.length > 28 ? `${trimmed.slice(0, 28)}…` : trimmed}”
                  </button>
                </div>
              )}

              {!podeCadastrarProduto && results.length === 0 && (
                <p className="border-t border-secondary-100 px-3 py-2 text-xs text-secondary-500">
                  Cadastre produtos em <strong>Produtos</strong> no menu ou peça permissão ao administrador.
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
