# Correge (SGP Católica SC) — Back-end REST API

API REST institucional do **Sistema de Geração, Randomização e Correção Automática de Provas (SGP / Correge)** desenvolvida em **Node.js + Express + TypeScript + Prisma ORM (MySQL / TiDB Cloud)**.

Opera **exclusivamente sobre banco de dados relacional** via Prisma ORM (sem repositórios *mock* ou dados simulados em produção).

---

## Stack Tecnológica

- **Runtime & Linguagem**: Node.js 20+, TypeScript 5
- **Framework HTTP**: Express 4, CORS, Multer (upload de planilhas)
- **ORM & Banco de Dados**: Prisma ORM 6 + MySQL / TiDB Cloud (`prisma/schema.prisma`)
- **Autenticação & Segurança**: `bcryptjs` (hash de senhas), `jsonwebtoken` (JWT Bearer), rate limiting em janela deslizante contra força bruta
- **Validação de Contratos**: Zod
- **Documentos & Relatórios**: PDFKit (cadernos A4 duplex e cartões-resposta OMR), ExcelJS (importação de alunos e exportação `.xlsx`), `qrcode` (ISO/IEC 18004 + checksum SHA-256)
- **Testes**: Node Test Runner (`node --test`) + `tsx`

---

## Arquitetura e Estrutura de Diretórios

Arquitetura Hexagonal (Ports & Adapters), separando rotas, controladores, serviços de domínio e repositórios Prisma:

```text
back-end/
├── api/
│   └── index.ts                  # Entrypoint serverless (Vercel)
├── prisma/
│   ├── schema.prisma             # 10 tabelas relacionais MySQL/TiDB
│   └── seed.ts                   # Validação de conectividade e contagem de registros
├── src/
│   ├── config/
│   │   └── database.ts           # Singleton Prisma Client e teste de conexão
│   ├── controllers/              # Controladores HTTP REST (validação + resposta JSON)
│   ├── middlewares/
│   │   ├── authMiddleware.ts     # requireAuth (Bearer JWT) + createAuthRateLimiter
│   │   └── errorHandler.ts       # Tratamento centralizado de erros
│   ├── repositories/
│   │   ├── interfaces/           # Contratos (Ports) de persistência
│   │   ├── prisma/               # Adaptadores Prisma ORM (MySQL/TiDB)
│   │   ├── ReportRepository.ts   # Consultas analíticas para relatórios
│   │   └── index.ts              # Instanciação exclusiva dos repositórios Prisma
│   ├── routes/                   # Definição de endpoints /api/v1/*
│   ├── services/                 # Regras de negócio (variações, PDF A4, QR SHA-256, relatórios)
│   ├── types/                    # DTOs e declarações TypeScript
│   ├── utils/                    # Fisher-Yates, matriz QR, helpers
│   ├── app.ts                    # Composição Express, middlewares e rotas /api/v1
│   └── server.ts                 # Inicialização HTTP (porta padrão 3001)
└── tests/
    ├── helpers/                  # Dublês em memória estritamente para testes unitários
    ├── unit/                     # Testes unitários de serviços, auth e segurança
    ├── integration/              # Testes de integração da API
    └── results.test.ts           # Testes de relatórios, XLSX e PDFs
```

---

## Modelo de Dados (MER / DER — Prisma MySQL)

```mermaid
erDiagram
    PROFESSORES ||--o{ DISCIPLINAS : "cria"
    PROFESSORES ||--o{ TURMAS : "gerencia"
    DISCIPLINAS ||--o{ TURMAS : "vincula"
    DISCIPLINAS ||--o{ PROVAS : "classifica"
    TURMAS ||--o{ ALUNOS : "possui"
    QUESTOES ||--o{ ALTERNATIVAS : "contem"
    PROVAS ||--o{ VERSOES_PROVA : "gera (A..Z)"
    VERSOES_PROVA ||--o{ CORRECOES : "recebe"
    ALUNOS ||--o{ CORRECOES : "atribuida a"

    PROFESSORES {
        uuid id PK
        string nome_completo
        string email UK
        string senha_hash
        datetime criado_em
    }
    CONFIGURACOES {
        uuid id PK
        string id_professor UK
        string nome_instituicao
        string departamento
        string nome_professor
        string email_professor
        float nota_minima
        string sensibilidade_omr
        float threshold_omr
        boolean auto_rotacionar
    }
    DISCIPLINAS {
        uuid id PK
        uuid id_professor FK
        string codigo
        string nome
        string curso
    }
    TURMAS {
        uuid id PK
        uuid id_professor FK
        uuid id_disciplina FK
        string nome
        string periodo_letivo
        string status
    }
    ALUNOS {
        uuid id PK
        uuid id_turma FK
        string nome
        string matricula
        string curso
        string email
        string turma
        string disciplina
    }
    QUESTOES {
        uuid id PK
        string id_professor
        string codigo
        string tipo
        string disciplina
        string dificuldade
        text enunciado
        char alternativa_correta
        float pontuacao
        datetime excluido_em
    }
    ALTERNATIVAS {
        uuid id PK
        uuid id_questao FK
        char letra
        text texto
        boolean correta
    }
    PROVAS {
        uuid id PK
        uuid id_disciplina FK
        string codigo
        string titulo
        string disciplina
        string turma
        string semestre
        string data_aplicacao
        json instrucoes
        json variacoes_json
    }
    VERSOES_PROVA {
        uuid id PK
        uuid id_prova FK
        char letra_versao
        json layout_questoes
        json gabarito_oficial
        text payload_qr_code
    }
    QR_CODES {
        uuid id PK
        string id_aplicacao
        string id_versao_prova
        char letra_versao
        string codigo_prova
        string checksum
    }
    CORRECOES {
        uuid id PK
        uuid id_versao_prova FK
        uuid id_aluno FK
        string nome_manuscrito
        string matricula_manuscrita
        float nota_total
        json respostas_lidas
        boolean atribuicao_automatica
        char versao_marcada
        datetime data_confirmacao
    }
```

---

## Principais Endpoints (`/api/v1`)

| Módulo | Método | Rota | Descrição |
|---|---|---|---|
| **Saúde** | `GET` | `/api/v1/health` | Status da API, módulos ativos e `dataSource: "database"` |
| **Autenticação** | `POST` | `/api/v1/professores/login` (e `/api/v1/auth/login`) | Autenticação docente (`@catolicasc.org.br`, bcrypt + JWT + rate limit) |
| **Cadastro** | `POST` | `/api/v1/professores` (e `/api/v1/auth/register`) | Cadastro docente com hash bcrypt e emissão imediata de JWT |
| **Sessão** | `GET` | `/api/v1/professores/me` | Valida token Bearer JWT e retorna perfil atualizado do docente |
| **Senha** | `PUT` | `/api/v1/professores/me/password` | Alteração autenticada de senha validando senha atual |
| **Recuperação** | `POST` | `/api/v1/professores/forgot-password` / `reset-password` | Fluxo de redefinição via token criptográfico de uso único (requer SMTP) |
| **LGPD** | `POST` | `/api/v1/professores/me/anonymize` | Anonimiza dados pessoais do docente preservando histórico acadêmico |
| **Disciplinas** | `GET` / `POST` / `DELETE` | `/api/v1/disciplinas` | CRUD de disciplinas |
| **Turmas** | `GET` / `POST` / `PUT` / `DELETE` | `/api/v1/turmas` | CRUD de turmas letivas |
| **Alunos** | `GET` / `POST` / `PUT` / `DELETE` | `/api/v1/students` | CRUD, `/batch`, `/import` (Excel/CSV), `/import-template` |
| **Questões** | `GET` / `POST` / `PUT` / `DELETE` | `/api/v1/questions` | Banco de questões com soft-delete (`excluido_em`) |
| **Provas** | `GET` / `POST` / `PUT` / `DELETE` | `/api/v1/exams` | Gestão de provas, sincronização automática de `versoes_prova` |
| **Variações & PDF** | `POST` / `GET` | `/api/v1/exams/:id/variations/generate`, `/layout`, `/download-pdf`, `/answer-sheet/pdf` | Permutação A–Z e geração de PDF A4 (com suporte Duplex) |
| **QR Codes** | `POST` | `/api/v1/qr-codes/generate`, `/validate` | Geração e verificação de integridade SHA-256 (`chk`) |
| **Correções OMR** | `GET` / `POST` / `PATCH` | `/api/v1/correcoes`, `/:id/assign-student` | Registro de correções e atribuição manual de folhas avulsas |
| **Relatórios** | `GET` | `/api/v1/exams/:id/results`, `/results/export.xlsx`, `/results/export.pdf` | Estatísticas consolidadas, matriz de acertos e exportação |
| **Configurações** | `GET` / `PUT` / `POST` | `/api/v1/settings`, `/reset`, `/anonymize` | Parâmetros institucionais e OMR persistidos por docente |

---

## Variáveis de Ambiente (`.env`)

Copie `.env.example` para `.env` e preencha os valores reais:

```env
PORT=3001
NODE_ENV=development
DATABASE_URL="mysql://usuario:senha@host:4000/correge?sslaccept=strict"
JWT_SECRET="substitua-por-chave-forte-aleatoria"
JWT_EXPIRES_IN="7d"
CORS_ORIGIN="*"
```

---

## Como Executar e Testar

```bash
# 1. Instalar dependências
npm install

# 2. Gerar Prisma Client e aplicar schema no banco
npx prisma generate
npx prisma db push

# 3. Compilar TypeScript
npm run build

# 4. Executar suítes de testes (unitários, integração e relatórios/PDF/XLSX)
npm test
npm run test:results

# 5. Iniciar servidor em modo desenvolvimento (porta 3001)
npm run dev
```

URL em produção (Vercel): `https://back-end-coral-eta.vercel.app/api/v1`
