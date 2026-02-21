import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Users, TrendingUp, Clock } from 'lucide-react'
import Card from '../components/ui/Card'
import Loading from '../components/ui/Loading'
import { dashboardService } from '../services/dashboardService'
import { useAuth } from '../contexts/AuthContext'
import Badge from '../components/ui/Badge'
import { formatCurrency, formatDate } from '../utils/formatters'

const Dashboard = () => {
  const { empresaAtual } = useAuth()
  const [stats, setStats] = useState({
    totalOrcamentos: 0,
    orcamentosRascunho: 0,
    orcamentosEnviados: 0,
    totalClientes: 0,
  })
  const [recentOrcamentos, setRecentOrcamentos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [empresaAtual?.id])

  const loadData = async () => {
    try {
      const data = await dashboardService.getResumo()

      setStats({
        totalOrcamentos: data.total_orcamentos ?? 0,
        orcamentosRascunho: data.rascunhos ?? 0,
        orcamentosEnviados: data.enviados ?? 0,
        totalClientes: data.total_clientes ?? 0,
      })

      setRecentOrcamentos(data.orcamentos_recentes ?? [])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusMap = {
      rascunho: { variant: 'secondary', label: 'Rascunho' },
      enviado: { variant: 'primary', label: 'Enviado' },
      aprovado: { variant: 'success', label: 'Aprovado' },
      rejeitado: { variant: 'danger', label: 'Rejeitado' },
      vencido: { variant: 'warning', label: 'Vencido' },
      cancelado: { variant: 'danger', label: 'Cancelado' },
    }
    const statusInfo = statusMap[status] || { variant: 'secondary', label: status }
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
  }

  if (loading) {
    return <Loading fullScreen />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-secondary-900">Dashboard</h1>
        <p className="text-secondary-600 mt-1">
          Visão geral do sistema
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Total de Orçamentos</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">
                {stats.totalOrcamentos}
              </p>
            </div>
            <div className="p-3 bg-primary-100 rounded-lg">
              <FileText className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Rascunhos</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">
                {stats.orcamentosRascunho}
              </p>
            </div>
            <div className="p-3 bg-warning-100 rounded-lg">
              <Clock className="w-6 h-6 text-warning-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Enviados</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">
                {stats.orcamentosEnviados}
              </p>
            </div>
            <div className="p-3 bg-success-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-success-600" />
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-600">Total Clientes</p>
              <p className="text-2xl font-bold text-secondary-900 mt-1">
                {stats.totalClientes}
              </p>
            </div>
            <div className="p-3 bg-secondary-100 rounded-lg">
              <Users className="w-6 h-6 text-secondary-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Orçamentos */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-secondary-900">
            Orçamentos Recentes
          </h2>
          <Link
            to="/orcamentos"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Ver todos
          </Link>
        </div>

        {recentOrcamentos.length === 0 ? (
          <p className="text-secondary-500 text-center py-8">
            Nenhum orçamento encontrado
          </p>
        ) : (
          <div className="space-y-4">
            {recentOrcamentos.map((orcamento) => (
              <Link
                key={orcamento.id}
                to={`/orcamentos/${orcamento.id}`}
                className="block p-4 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-secondary-900">
                        {orcamento.numero}
                      </h3>
                      {getStatusBadge(orcamento.status)}
                    </div>
                    <p className="text-sm text-secondary-600">
                      {orcamento.cliente_nome ?? '-'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-secondary-900">
                      {formatCurrency(orcamento.valor_total)}
                    </p>
                    <p className="text-xs text-secondary-500">
                      {formatDate(orcamento.data_criacao)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}

export default Dashboard

