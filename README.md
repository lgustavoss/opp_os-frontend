# Sistema OS - Frontend

Aplicação frontend desenvolvida com React + Vite + Tailwind CSS para gerenciamento de orçamentos, clientes e configurações da empresa.

## 🚀 Tecnologias

- **React 18** - Biblioteca JavaScript para construção de interfaces
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utilitário
- **React Router** - Roteamento
- **Axios** - Cliente HTTP
- **Lucide React** - Ícones
- **react-image-crop** - Recorte de imagens (logomarca)

## 📋 Pré-requisitos

- Node.js 18+
- npm ou yarn

## 🛠️ Instalação

1. Clone o repositório:

```bash
git clone https://github.com/lgustavoss/opp_os-frontend.git
cd opp_os-frontend
```

2. Instale as dependências:

```bash
npm install
```

## 🏃 Executando

### Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

### Build para Produção

```bash
npm run build
```

### Preview do Build

```bash
npm run preview
```

## 📁 Estrutura do Projeto

```
src/
├── components/           # Componentes reutilizáveis
│   ├── ui/              # Componentes de UI (Button, Input, Card, Modal, etc.)
│   ├── layout/          # Layout (Header, Sidebar, Layout)
│   └── common/          # Componentes comuns (ProtectedRoute, ImageCropModal)
├── pages/               # Páginas da aplicação
│   ├── clientes/        # Listagem, formulário e detalhes de clientes
│   ├── orcamentos/      # Listagem, formulário e detalhes de orçamentos
│   ├── Dashboard.jsx    # Tela inicial
│   ├── Configuracoes.jsx# Configurações da empresa
│   └── Login.jsx        # Autenticação
├── services/            # Serviços de API
├── contexts/            # Contextos React (AuthContext)
├── routes/              # Configuração de rotas
├── utils/               # Funções utilitárias e formatters
├── config/              # Configurações (API, tema)
└── App.jsx              # Componente principal
```

## 📝 Funcionalidades

- ✅ Autenticação (Login/Logout) por sessão
- ✅ Dashboard com estatísticas e orçamentos recentes
- ✅ CRUD de Clientes (com soft delete)
- ✅ Consulta de CNPJ na ReceitaWS
- ✅ CRUD de Orçamentos
- ✅ Itens de orçamento (peças e serviços)
- ✅ Desconto e acréscimo (valor ou percentual)
- ✅ Soft delete de orçamentos (aba Ativos/Excluídos)
- ✅ Geração de PDF de orçamento
- ✅ Configurações da Empresa (logomarca, dados, textos padrão)
- ✅ Upload e recorte de logomarca com dimensões da API
- ✅ Filtros e paginação
- ✅ Layout responsivo (mobile-first)

## 🔌 Integração com Backend

A aplicação se comunica com o backend Django REST Framework. Em desenvolvimento, o Vite usa proxy para `/api` e `/media`, redirecionando para `http://localhost:8000`.

Para configurar a URL da API em produção, crie um arquivo `.env` na raiz:

```env
VITE_API_BASE_URL=https://sua-api.com/api
```

## 🔐 Autenticação

- A tela de login é pública
- Demais rotas requerem autenticação
- Autenticação por sessão (cookies) com CSRF token

## 📦 Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Cria build de produção |
| `npm run preview` | Preview do build de produção |
| `npm run lint` | Executa o linter ESLint |

## 📄 Licença

Este projeto é privado e de uso interno.
