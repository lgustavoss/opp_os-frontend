import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Loading from '../../components/ui/Loading'
import Modal from '../../components/ui/Modal'
import Badge from '../../components/ui/Badge'
import { clienteService } from '../../services/clienteService'
import { formatCNPJCPF, formatCEP, formatTelefone, formatDate } from '../../utils/formatters'
import { useNavigate } from 'react-router-dom'

const ClienteDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    loadCliente()
  }, [id])

  const loadCliente = async () => {
    try {
      setLoading(true)
      const data = await clienteService.get(id)
      setCliente(data)
    } catch (error) {
      console.error('Erro ao carregar cliente:', error)
      navigate('/clientes')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const response = await clienteService.delete(id)
      // Agora retorna 200 OK com JSON: {"mensagem": "Cliente marcado como inativo com sucesso"}
      if (response?.mensagem) {
        // Cliente foi marcado como inativo com sucesso
        navigate('/clientes')
      }
    } catch (error) {
      alert('Erro ao deletar cliente. Verifique se não há ordens de serviço associadas.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return <Loading fullScreen />
  }

  if (!cliente) {
    return null
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/clientes">
            <button className="p-2 rounded-lg hover:bg-secondary-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-secondary-600" />
            </button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-secondary-900">
              {cliente.razao_social}
            </h1>
            <p className="text-secondary-600 mt-1">Detalhes do cliente</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/clientes/${id}/editar`}>
            <Button variant="secondary" className="flex items-center gap-2">
              <Edit className="w-4 h-4" />
              Editar
            </Button>
          </Link>
          <Button
            variant="danger"
            onClick={() => setDeleteModal(true)}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Excluir
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">
            Informações Básicas
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-secondary-500">
                CNPJ/CPF
              </dt>
              <dd className="mt-1 text-sm text-secondary-900">
                {formatCNPJCPF(cliente.cnpj_cpf)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-secondary-500">
                Tipo de Documento
              </dt>
              <dd className="mt-1 text-sm text-secondary-900">
                {cliente.tipo_documento}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-secondary-500">
                Razão Social
              </dt>
              <dd className="mt-1 text-sm text-secondary-900">
                {cliente.razao_social}
              </dd>
            </div>
            {cliente.nome_fantasia && (
              <div>
                <dt className="text-sm font-medium text-secondary-500">
                  Nome Fantasia
                </dt>
                <dd className="mt-1 text-sm text-secondary-900">
                  {cliente.nome_fantasia}
                </dd>
              </div>
            )}
            {cliente.telefone && (
              <div>
                <dt className="text-sm font-medium text-secondary-500">
                  Telefone
                </dt>
                <dd className="mt-1 text-sm text-secondary-900">
                  {formatTelefone(cliente.telefone)}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-secondary-500">
                Status
              </dt>
              <dd className="mt-1">
                <Badge variant={cliente.ativo ? 'success' : 'danger'}>
                  {cliente.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">
            Endereço
          </h2>
          <dl className="space-y-3">
            {cliente.endereco && (
              <div>
                <dt className="text-sm font-medium text-secondary-500">
                  Endereço
                </dt>
                <dd className="mt-1 text-sm text-secondary-900">
                  {cliente.endereco}
                </dd>
              </div>
            )}
            {cliente.cep && (
              <div>
                <dt className="text-sm font-medium text-secondary-500">CEP</dt>
                <dd className="mt-1 text-sm text-secondary-900">
                  {formatCEP(cliente.cep)}
                </dd>
              </div>
            )}
            {cliente.cidade && (
              <div>
                <dt className="text-sm font-medium text-secondary-500">
                  Cidade
                </dt>
                <dd className="mt-1 text-sm text-secondary-900">
                  {cliente.cidade}
                </dd>
              </div>
            )}
            {cliente.estado && (
              <div>
                <dt className="text-sm font-medium text-secondary-500">
                  Estado
                </dt>
                <dd className="mt-1 text-sm text-secondary-900">
                  {cliente.estado}
                </dd>
              </div>
            )}
          </dl>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold text-secondary-900 mb-4">
            Informações do Sistema
          </h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-secondary-500">
                Data de Cadastro
              </dt>
              <dd className="mt-1 text-sm text-secondary-900">
                {formatDate(cliente.data_cadastro)}
              </dd>
            </div>
            {cliente.usuario_cadastro_nome && (
              <div>
                <dt className="text-sm font-medium text-secondary-500">
                  Cadastrado por
                </dt>
                <dd className="mt-1 text-sm text-secondary-900">
                  {cliente.usuario_cadastro_nome}
                </dd>
              </div>
            )}
            {cliente.data_ultima_alteracao && (
              <div>
                <dt className="text-sm font-medium text-secondary-500">
                  Última Alteração
                </dt>
                <dd className="mt-1 text-sm text-secondary-900">
                  {formatDate(cliente.data_ultima_alteracao)}
                </dd>
              </div>
            )}
          </dl>
        </Card>
      </div>

      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Confirmar Exclusão"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setDeleteModal(false)}
              disabled={deleting}
            >
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={deleting}>
              Excluir
            </Button>
          </>
        }
      >
        <p className="text-secondary-700">
          Tem certeza que deseja marcar o cliente{' '}
          <strong>{cliente.razao_social}</strong> como inativo?
        </p>
        <p className="text-sm text-secondary-500 mt-2">
          O cliente será marcado como inativo e não aparecerá mais na listagem padrão.
        </p>
      </Modal>
    </div>
  )
}

export default ClienteDetail

