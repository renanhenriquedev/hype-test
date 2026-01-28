# 🎥 Video Processing Platform

Sistema completo de processamento de vídeos com autenticação Firebase, conversão automática usando FFmpeg, e interface React moderna.

[![Tests](https://img.shields.io/badge/tests-37%20passing-brightgreen)]()
[![Coverage](https://img.shields.io/badge/coverage-95.75%25-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)]()
[![NestJS](https://img.shields.io/badge/NestJS-11.0-red)]()
[![React](https://img.shields.io/badge/React-19.2-blue)]()

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Arquitetura](#-arquitetura)
- [Decisões Técnicas](#-decisões-técnicas)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Pré-requisitos](#-pré-requisitos)
- [Instalação](#-instalação)
- [Configuração](#-configuração)
- [Executando o Projeto](#-executando-o-projeto)
- [Testes](#-testes)
- [API Documentation](#-api-documentation)
- [Cobertura de Testes](#-cobertura-de-testes)

---

## 🎯 Visão Geral

Aplicação full-stack para upload, processamento e gerenciamento de vídeos com as seguintes funcionalidades:

### Backend (NestJS)
- ✅ Upload de vídeos para Firebase Storage
- ✅ Conversão automática de vídeos para MP4 720p usando FFmpeg
- ✅ Autenticação via Firebase Auth (validação de JWT tokens)
- ✅ Gerenciamento de status de conversão
- ✅ Download de vídeos processados via URLs assinadas
- ✅ API RESTful documentada

### Frontend (React + Vite)
- ✅ Interface moderna e responsiva
- ✅ Autenticação com Email/Senha (login e cadastro)
- ✅ Upload de vídeos com feedback em tempo real
- ✅ Dashboard com listagem de vídeos
- ✅ Monitoramento de status de conversão
- ✅ Download de vídeos processados

---

## 🏗️ Arquitetura

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│                 │      │                  │      │                 │
│  React Frontend │─────▶│  NestJS Backend  │─────▶│ Firebase Admin  │
│   (Port 5173)   │      │   (Port 4001)    │      │  (Auth/Storage) │
│                 │      │                  │      │                 │
└─────────────────┘      └──────────────────┘      └─────────────────┘
         │                        │
         │                        │
         │                        ▼
         │               ┌─────────────────┐
         │               │                 │
         └──────────────▶│ Firebase Client │
                         │  (Auth + SDK)   │
                         │                 │
                         └─────────────────┘

Backend Internal Flow:
Upload → Storage → Firestore (UPLOADED) → Conversion Service → FFmpeg → DONE
```

### Fluxo de Conversão de Vídeo

```
1. Cliente faz upload do vídeo
   ↓
2. Backend salva no Firebase Storage (input/)
   ↓
3. Documento criado no Firestore (status: UPLOADED)
   ↓
4. Cliente solicita conversão
   ↓
5. Status muda para PROCESSING
   ↓
6. ConversionService baixa o vídeo
   ↓
7. FFmpeg processa (scale + encode)
   ↓
8. Upload do resultado (output/)
   ↓
9. Status muda para DONE
   ↓
10. Cliente pode baixar via URL assinada
```

---

## 🧠 Decisões Técnicas

### Backend

#### 1. **NestJS Framework**
**Por quê?**
- Arquitetura modular e escalável
- Dependency Injection nativo
- TypeScript first-class support
- Decorators para routing e validação
- Excelente para testes unitários e e2e
- Comunidade ativa e bem documentado

#### 2. **Firebase Admin SDK**
**Por quê?**
- Integração nativa com Firebase Auth para validação de tokens
- Firebase Storage para armazenamento escalável de vídeos
- Firestore para tracking de status em tempo real
- Signed URLs para download seguro
- Gerenciamento de permissões por usuário

#### 3. **Arquitetura em Camadas**
```
Controllers (HTTP) → Services (Business Logic) → Firebase (Data/Storage)
```
**Benefícios:**
- Separação de responsabilidades
- Fácil manutenção e testes
- Reutilização de código
- Mockable para testes

#### 4. **Conversão Assíncrona**
```typescript
// ConversionService.start() não bloqueia a resposta HTTP
start(videoId: string) {
  void this.convert(videoId).catch(() => {});
}
```
**Por quê?**
- Upload retorna imediatamente
- Conversão roda em background
- Não trava a API
- Cliente pode checar status via polling

#### 5. **FFmpeg com Preset Ultrafast**
```typescript
'-preset', 'ultrafast'
'-crf', '28'
'scale=1280:720'
```
**Por quê?**
- Velocidade > qualidade para MVP
- CRF 28 = equilíbrio tamanho/qualidade
- 720p = padrão web moderno
- Faststart = streaming otimizado

#### 6. **Guards para Autenticação**
```typescript
@UseGuards(FirebaseAuthGuard)
```
**Por quê?**
- Centraliza validação de token
- Reutilizável em todos os endpoints
- Popula req.user automaticamente
- Fácil de testar e mockar

### Frontend

#### 1. **React 19 + Vite**
**Por quê?**
- Build extremamente rápido (Vite)
- React 19 = últimas features
- HMR instantâneo para desenvolvimento
- TypeScript out-of-the-box

#### 2. **Firebase Client SDK**
**Por quê?**
- Autenticação gerenciada
- Google Sign-In integrado
- Token refresh automático
- UI components prontos

#### 3. **Arquitetura de Componentes**
```
App
├── Login (auth)
└── Dashboard
    ├── UploadVideo (input)
    └── VideoStatus (output)
```
**Benefícios:**
- Separação clara de responsabilidades
- Componentes reutilizáveis
- Estado isolado
- Fácil manutenção

#### 4. **Polling para Status**
```typescript
useEffect(() => {
  const interval = setInterval(checkStatus, 3000);
  return () => clearInterval(interval);
}, []);
```
**Por quê?**
- Simples de implementar
- Sem necessidade de WebSockets
- Suficiente para MVP
- Pode ser substituído por Firestore realtime depois

---

## Tecnologias Utilizadas

### Backend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| NestJS | 11.0 | Framework web |
| TypeScript | 5.9 | Linguagem |
| Firebase Admin | 13.6 | Auth + Storage |
| FFmpeg | Latest | Conversão de vídeo |
| Jest | 30.0 | Testing framework |
| Multer | 2.0 | Upload de arquivos |

### Frontend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| React | 19.2 | UI Library |
| Vite | 7.2 | Build tool |
| TypeScript | 5.9 | Linguagem |
| Firebase | 12.8 | Auth client |

### DevOps
| Tecnologia | Propósito |
|------------|-----------|
| Docker | Containerização |
| Docker Compose | Orquestração local |
| GitHub Actions | CI/CD |

---

## 📁 Estrutura do Projeto

```
hype-test/
├── backend/                      # Backend NestJS
│   ├── src/
│   │   ├── auth/                 # Módulo de autenticação
│   │   │   ├── auth.controller.ts       # Endpoint /me
│   │   │   ├── auth.controller.spec.ts
│   │   │   ├── user.decorator.ts        # @User() decorator
│   │   │   └── firebase-auth/
│   │   │       ├── firebase-auth.guard.ts    # JWT validation
│   │   │       └── firebase-auth.guard.spec.ts
│   │   ├── firebase/             # Firebase Admin integration
│   │   │   ├── firebase.service.ts      # Storage + Firestore
│   │   │   └── firebase.service.spec.ts
│   │   ├── videos/               # Core video processing
│   │   │   ├── videos.controller.ts     # REST endpoints
│   │   │   ├── videos.service.ts        # Business logic
│   │   │   ├── conversion.service.ts    # FFmpeg processing
│   │   │   └── *.spec.ts                # Unit tests
│   │   ├── app.module.ts         # Root module
│   │   └── main.ts               # Bootstrap
│   ├── test/
│   │   └── app.e2e-spec.ts       # E2E tests
│   ├── __mocks__/
│   │   └── firebase-admin.js     # Jest mock
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                     # Frontend React
│   ├── src/
│   │   ├── components/
│   │   │   ├── UploadVideo.tsx   # Upload UI
│   │   │   └── VideoStatus.tsx   # Status display
│   │   ├── pages/
│   │   │   ├── Login.tsx         # Auth page
│   │   │   └── Dashboard.tsx     # Main app
│   │   ├── services/
│   │   │   └── api.ts            # Backend API client
│   │   ├── firebase/
│   │   │   └── firebase.ts       # Firebase config
│   │   ├── App.tsx               # Root component
│   │   └── main.tsx              # Entry point
│   ├── Dockerfile
│   ├── nginx.conf                # Production server
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml            # Local development
├── .env.example                  # Environment template
└── README.md                     # Este arquivo
```

---

## ✅ Pré-requisitos

### Obrigatório
- **Node.js** 20.x ou superior
- **npm** ou **yarn**
- **Firebase Project** configurado
- **FFmpeg** instalado no sistema

### Opcional
- **Docker** e **Docker Compose** (para containerização)
- **Git** (para controle de versão)

### Instalação do FFmpeg

#### macOS
```bash
brew install ffmpeg
```

#### Ubuntu/Debian
```bash
sudo apt update
sudo apt install ffmpeg
```

#### Windows
```bash
# Via Chocolatey
choco install ffmpeg

# Ou baixe de: https://ffmpeg.org/download.html
```

Verifique a instalação:
```bash
ffmpeg -version
```

---

## 📦 Instalação

### 1. Clone o repositório
```bash
git clone <repository-url>
cd hype-test
```

### 2. Instale as dependências

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd ../frontend
npm install
```

---

## ⚙️ Configuração

### 1. Firebase Setup

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Crie um novo projeto
3. Ative **Authentication** → selecione método **Email/Password**
4. Ative **Firestore Database** (modo de teste ou produção)
5. Ative **Storage** (configure regras de segurança)
6. Gere uma **Service Account Key**:
   - Project Settings → Service Accounts
   - Generate New Private Key
   - Salve o arquivo JSON

### 2. Backend Environment

Crie `backend/.env`:

```env
# Server
PORT=4001
NODE_ENV=development

# Firebase Admin (Service Account)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

**⚠️ Importante:** 
- Use aspas duplas na `FIREBASE_PRIVATE_KEY`
- Mantenha os `\n` literais (não substitua por quebras de linha)
- Nunca commite este arquivo

### 3. Frontend Environment

Crie `frontend/.env`:

```env
# API
VITE_API_URL=http://localhost:4001

# Firebase Client (Web App Config)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

**Onde encontrar essas informações:**
- Firebase Console → Project Settings → General
- Seção "Your apps" → Web app → Config

---

## 🚀 Executando o Projeto

### Desenvolvimento Local

#### Opção 1: Executar Backend e Frontend separadamente

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
```
Backend rodará em: http://localhost:4001

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Frontend rodará em: http://localhost:5173

#### Opção 2: Docker Compose

```bash
# Na raiz do projeto
# Build e start
docker-compose up --build

# Apenas start (após build)
docker-compose up

# Stop
docker-compose down
```

Acesse:
- Frontend: http://localhost:5173
- Backend: http://localhost:4001

---

## 🧪 Testes

### Backend

#### Testes Unitários
```bash
cd backend

# Rodar todos os testes
npm test

# Watch mode
npm run test:watch

# Com cobertura
npm run test:cov
```

#### Testes E2E
```bash
npm run test:e2e
```

### Cobertura Atual
```
Test Suites: 7 passed, 7 total
Tests:       37 passed, 37 total

Coverage Summary:
----------------------------------
Statements   : 95.75%
Branches     : 82.81%
Functions    : 88.23%
Lines        : 96.75%
----------------------------------
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:4001
```

### Autenticação
Todos os endpoints (exceto `/health`) requerem header:
```
Authorization: Bearer <firebase-id-token>
```

---

### Endpoints

#### 👤 Get Current User
```http
GET /me
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "uid": "user123",
  "email": "user@example.com"
}
```

---

#### 📤 Upload Video
```http
POST /videos
Content-Type: multipart/form-data
```
**Headers:** `Authorization: Bearer <token>`

**Body (FormData):**
- `file`: Video file (MP4, AVI, MOV, etc.)

**Response:**
```json
{
  "videoId": "uuid-v4",
  "status": "UPLOADED"
}
```

---

#### 📹 Get Video Details
```http
GET /videos/:videoId
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "videoId": "uuid-v4",
  "status": "DONE",
  "originalFilename": "video.mp4",
  "contentType": "video/mp4",
  "sizeBytes": 10485760,
  "preset": "MP4_720P",
  "createdAt": "2026-01-27T10:00:00.000Z",
  "updatedAt": "2026-01-27T10:05:00.000Z",
  "finishedAt": "2026-01-27T10:05:00.000Z",
  "input": {
    "bucket": "project.appspot.com",
    "path": "users/user123/videos/uuid/input/video.mp4"
  },
  "output": {
    "bucket": "project.appspot.com",
    "path": "users/user123/videos/uuid/output/converted.mp4"
  }
}
```

**Status Values:**
- `UPLOADED` - Vídeo enviado, aguardando conversão
- `PROCESSING` - Conversão em andamento
- `DONE` - Conversão concluída
- `FAILED` - Erro na conversão

---

#### 🔄 Request Conversion
```http
POST /videos/:videoId/convert
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "videoId": "uuid-v4",
  "status": "PROCESSING"
}
```

**Erros:**
- `404` - Vídeo não encontrado
- `403` - Vídeo não pertence ao usuário
- `409` - Status inválido para conversão

---

#### ⬇️ Get Download URL
```http
GET /videos/:videoId/download
```
**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "url": "https://storage.googleapis.com/...",
  "expiresAt": "2026-01-27T11:00:00.000Z"
}
```

**Erros:**
- `409` - Vídeo ainda não está DONE

---

#### 📋 List Videos
```http
GET /videos?status=DONE
```
**Headers:** `Authorization: Bearer <token>`

**Query Params:**
- `status` (opcional): Filter by status

**Response:**
```json
[
  {
    "videoId": "uuid-1",
    "status": "DONE",
    "originalFilename": "video1.mp4",
    ...
  },
  {
    "videoId": "uuid-2",
    "status": "PROCESSING",
    "originalFilename": "video2.mov",
    ...
  }
]
```

---

## 🎨 Frontend Usage

### Login/Cadastro
1. Acesse http://localhost:5173
2. Escolha entre "Login" ou "Cadastro"
3. Digite seu e-mail e senha (mínimo 6 caracteres)
4. Clique em "Entrar" ou "Criar conta"

### Upload de Vídeo
1. Clique em "Choose File"
2. Selecione um arquivo de vídeo
3. Clique em "Upload Video"
4. Aguarde o upload completar

### Solicitar Conversão
1. Localize o vídeo na lista (status: UPLOADED)
2. Clique em "Convert"
3. Aguarde o processamento (status muda para PROCESSING)
4. Status mudará para DONE quando concluído

### Download
1. Quando status = DONE
2. Clique em "Download"
3. Vídeo será baixado automaticamente

---

## 📊 Cobertura de Testes

### Por Módulo

| Módulo | Statements | Branches | Functions | Lines |
|--------|-----------|----------|-----------|-------|
| **Overall** | 95.75% | 82.81% | 88.23% | 96.75% |
| app.controller | 90% | 75% | 66.66% | 87.5% |
| app.service | 100% | 100% | 100% | 100% |
| auth.controller | 100% | 100% | 100% | 100% |
| firebase-auth.guard | 100% | 90% | 100% | 100% |
| firebase.service | 100% | 91.66% | 100% | 100% |
| conversion.service | 97.95% | 88.23% | 77.77% | 97.61% |
| videos.controller | 100% | 63.63% | 100% | 100% |
| videos.service | 93.67% | 82.43% | 100% | 97.22% |

### Tipos de Testes

- ✅ **37 Testes Unitários**
  - Controllers (routing e validação)
  - Services (business logic)
  - Guards (autenticação Firebase)
  - Decorators e helpers

- ✅ **Testes E2E disponíveis**
  - Fluxo completo de upload
  - Fluxo de conversão
  - Fluxo de download
  - Validação de autenticação
  - Error handling

---

## � Segurança

### Implementado
- ✅ Firebase Auth token validation (JWT)
- ✅ User-scoped resource access (cada usuário acessa apenas seus vídeos)
- ✅ Signed URLs para download seguro
- ✅ CORS configurado
- ✅ Environment variables para secrets
- ✅ Input validation via Guards e decorators
- ✅ File type validation

### Recomendações Futuras
- [ ] Rate limiting (throttle/limite de requisições)
- [ ] File size limits (validação de tamanho máximo)
- [ ] Virus scanning (análise de malware)
- [ ] API key rotation (rotação de chaves)
- [ ] Audit logging (logs de auditoria)

---

## 📝 Notas Técnicas

### Por que NestJS?
- Arquitetura enterprise-ready baseada em módulos
- TypeScript nativo com strict mode
- Dependency Injection facilita testes
- Testabilidade excepcional (96% de cobertura)
- Decorators para routing, guards e validação
- Community support e documentação completa

### Por que Firebase?
- Autenticação gerenciada (sem necessidade de gerenciar sessões)
- Storage escalável com URLs assinadas
- Firestore para metadata em tempo real
- SDK maduro e confiável
- Free tier generoso para MVPs
- Integração fácil entre frontend e backend

### Por que FFmpeg?
- Industry standard para processamento de vídeo
- Altamente configurável
- Suporte a 100+ formatos de entrada/saída
- Open source e gratuito
- Performance excelente
- Documentação extensa

### Como funciona a autenticação?
1. Frontend usa Firebase Client SDK para login (email/senha)
2. Firebase retorna um ID Token (JWT)
3. Frontend envia o token no header `Authorization: Bearer <token>`
4. Backend valida o token com Firebase Admin SDK
5. Se válido, extrai `uid` e `email` do usuário
6. O decorator `@User()` injeta os dados do usuário nos controllers

---

## 📄 Licença

Este projeto foi desenvolvido para fins de teste técnico.

---

**Última atualização:** Janeiro 2026
