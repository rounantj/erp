# Deploy Frontend - Clerk Configuration

## Variáveis de Ambiente

No ambiente de produção, você precisa configurar:

```env
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_live_...
```

**Onde configurar:**

### Opção 1: Arquivo .env de produção
Crie um arquivo `.env.production` na raiz do projeto `erp/`:

```env
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY_HERE
```

### Opção 2: Variáveis de ambiente do servidor/plataforma
Configure na plataforma onde o frontend está hospedado (Heroku, Vercel, etc):

```
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY_HERE
```

### Opção 3: Build com variável de ambiente
Se estiver fazendo build manual:

```bash
REACT_APP_CLERK_PUBLISHABLE_KEY=pk_live_... npm run build
```

## Verificação

Após configurar, verifique se a variável está sendo lida corretamente:

1. A aplicação deve funcionar normalmente
2. O componente `<SignIn />` deve carregar corretamente
3. Não deve aparecer erros no console relacionados ao Clerk

## Importante

- Use `pk_live_...` para produção (não `pk_test_...`)
- A variável deve começar com `REACT_APP_` para ser lida pelo Create React App
- Após alterar variáveis de ambiente, é necessário fazer rebuild da aplicação

