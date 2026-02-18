# Guia de Configuração e Teste

## ✅ Dependências Instaladas

As dependências do projeto foram instaladas com sucesso.

## 🔧 Configuração da API

O frontend está configurado para se comunicar com o backend Django que está rodando em:
- **URL do Backend**: `http://localhost:8000`
- **URL da API**: `http://localhost:8000/api`

### Configurações Aplicadas

1. **Proxy do Vite**: Configurado para redirecionar requisições `/api` para `http://localhost:8000`
2. **Axios**: Configurado com `withCredentials: true` para enviar cookies de sessão
3. **Variáveis de Ambiente**: Arquivo `.env` criado com a URL da API

## 🚀 Como Executar

### 1. Iniciar o Frontend

```bash
npm run dev
```

O frontend estará disponível em: `http://localhost:3000`

### 2. Verificar Conexão com Backend

O backend deve estar rodando em `http://localhost:8000`. 

**Importante**: Certifique-se de que:
- O backend Django está rodando e acessível
- O backend está configurado para aceitar requisições do frontend (CORS ou mesma origem via proxy)
- As rotas da API estão corretas conforme documentado em `API.md`

## 🔐 Autenticação

A aplicação utiliza autenticação por sessão (cookies) do Django REST Framework:

1. **Login**: Faça login através da tela de login (`/login`)
2. **Cookies**: Os cookies de sessão serão armazenados automaticamente
3. **Rotas Protegidas**: Todas as rotas, exceto `/login`, requerem autenticação

## 🧪 Teste Rápido

1. Inicie o frontend: `npm run dev`
2. Acesse: `http://localhost:3000`
3. Você será redirecionado para `/login`
4. Faça login com suas credenciais do Django
5. Após o login, você será redirecionado para o Dashboard

## ⚠️ Possíveis Problemas

### CORS Errors

Se você encontrar erros de CORS, verifique se o backend Django está configurado para aceitar requisições do frontend. Durante o desenvolvimento, o proxy do Vite deve resolver isso, mas se estiver usando a URL direta da API, pode ser necessário configurar CORS no Django.

### Cookies não sendo enviados

Verifique se:
- O axios está configurado com `withCredentials: true` (✅ já configurado)
- O backend está configurado para aceitar cookies de `localhost:3000`

### Erro 403 Forbidden

Isso geralmente significa que você não está autenticado. Faça login primeiro.

## 📝 Próximos Passos

1. ✅ Dependências instaladas
2. ✅ Configuração da API concluída
3. ✅ Proxy configurado
4. 🚀 Pronto para desenvolvimento!

Execute `npm run dev` e comece a desenvolver!

