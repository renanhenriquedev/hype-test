# 🎬 Video Processing Frontend

Interface React moderna para upload, conversão e gerenciamento de vídeos.

## 🚀 Tecnologias

- **React** 19.2 - Biblioteca UI
- **Vite** 7.2 - Build tool e dev server
- **TypeScript** 5.9 - Tipagem estática
- **Firebase** 12.8 - Autenticação (Auth SDK)

## 📋 Funcionalidades

- ✅ Login/Cadastro com email e senha
- ✅ Upload de vídeos
- ✅ Listagem de vídeos do usuário
- ✅ Solicitação de conversão
- ✅ Monitoramento de status (UPLOADED → PROCESSING → DONE)
- ✅ Download de vídeos convertidos

## 🏗️ Estrutura

```
src/
├── components/
│   ├── UploadVideo.tsx    # Interface de upload
│   └── VideoStatus.tsx    # Exibição de status e ações
├── pages/
│   ├── Login.tsx          # Autenticação (login/cadastro)
│   └── Dashboard.tsx      # Tela principal
├── services/
│   └── api.ts             # Cliente HTTP para backend
├── firebase/
│   └── firebase.ts        # Configuração Firebase
├── App.tsx                # Gerenciamento de estado auth
└── main.tsx               # Entry point
```

## 🔧 Desenvolvimento

```bash
# Instalar dependências
npm install

# Executar em modo dev
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview

# Lint
npm run lint
```

## ⚙️ Variáveis de Ambiente

Crie um arquivo `.env` na raiz do frontend:

```env
VITE_API_URL=http://localhost:4001
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

**Nota:** Todas as variáveis devem começar com `VITE_` para serem acessíveis no cliente.

## 🎨 Componentes

### Login.tsx
- Tabs para alternar entre login e cadastro
- Validação de email e senha (mínimo 6 caracteres)
- Mensagens de erro traduzidas
- Usa `signInWithEmailAndPassword` e `createUserWithEmailAndPassword`

### Dashboard.tsx
- Estado de autenticação com `onAuthStateChanged`
- Renderiza UploadVideo e VideoStatus
- Gerencia token JWT para requisições

### UploadVideo.tsx
- Input de arquivo com validação
- Feedback visual de upload
- Chama `POST /videos` com FormData

### VideoStatus.tsx
- Listagem de vídeos do usuário
- Botões de ação baseados no status:
  - UPLOADED: botão "Convert"
  - PROCESSING: badge "Processing..."
  - DONE: botão "Download"
- Polling a cada 3 segundos

### api.ts
- Cliente HTTP com Axios
- Adiciona token JWT automaticamente
- Base URL configurável via env

## 🔒 Autenticação

O frontend usa Firebase Auth Client SDK:

1. Usuário faz login/cadastro
2. Firebase retorna um ID Token (JWT)
3. Token é armazenado localmente (localStorage)
4. Todas as requisições incluem: `Authorization: Bearer <token>`
5. Backend valida o token via Firebase Admin SDK

## 📦 Build

```bash
npm run build
```

Gera:
- `dist/` - Arquivos estáticos otimizados
- Pronto para deploy em qualquer hosting estático

## 🐳 Docker

```dockerfile
# Build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ARG VITE_FIREBASE_API_KEY
ARG VITE_FIREBASE_AUTH_DOMAIN
ARG VITE_FIREBASE_PROJECT_ID
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🌐 Nginx Configuration

O arquivo `nginx.conf` configura:
- Serving de arquivos estáticos
- Proxy reverso para API (`/api` → backend)
- SPA routing (todas as rotas → index.html)
- Compressão gzip

---

**Desenvolvido com React + Vite + TypeScript**
