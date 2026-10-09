# Correge — Backend Architecture & Structure

This repository contains the architecture folder structure for the **Correge** REST API backend (Node.js + Express.js + TypeScript).

The folder structure is prepared so that the entire development team can collaborate and build out the modules according to their responsibilities.

---

## 📁 Directory Structure & Responsibilities

```
C:\Users\davii\back-end/
├── prisma/                    # Database schemas, migrations, and seed scripts
├── src/
│   ├── config/                # Environment variables, database connection, logger config
│   ├── constants/             # Global enums, fixed options (DifficultyLevel, VersionLetter, etc.)
│   ├── controllers/           # HTTP controllers (receives req, calls services, sends res)
│   ├── middlewares/           # Express middlewares (auth, validation, error handler, uploads)
│   ├── models/                # Domain models, database entities, or Prisma extension types
│   ├── routes/                # Express route definitions (auth, questions, exams, students, omr, reports)
│   ├── services/              # Core business logic:
│   │                          #   - Exam version generator & shuffling (Cadernos A, B, C, D)
│   │                          #   - OMR optical reader & grading engine
│   │                          #   - Printable OMR PDF sheet generator (with QR code & crosshair markers)
│   │                          #   - Performance matrix & question analytics
│   │                          #   - Excel roster importer & report exporter
│   ├── types/                 # TypeScript interfaces, DTOs, and request/response payloads
│   ├── utils/                 # Helper utilities (Fisher-Yates shuffle, QR code generator, AppError)
│   └── validators/            # Input validation schemas (Zod or Joi)
├── tests/
│   ├── unit/                  # Unit tests (services, algorithms, utils)
│   └── integration/           # Integration tests (API endpoints, database operations)
├── uploads/                   # Temporary directory for uploaded spreadsheets & scanned images
├── .env.example               # Example environment variables
├── package.json               # Dependencies and npm scripts
└── tsconfig.json              # TypeScript compiler configuration
```

---

## 👥 Team Collaboration Guide

| Layer / Folder | Purpose & Expected Implementation | Suggested Responsibilities |
|---|---|---|
| `src/routes/` | Route definitions mapping HTTP methods & paths to controllers | API & Routing team |
| `src/controllers/` | Request/response handling, HTTP status codes, error forwarding | API & Routing team |
| `src/validators/` | Validation schemas (Zod) for request body, query, and params | API & Routing team |
| `src/services/` | Core business logic: exam generation, OMR grading, analytics | Core Business Logic team |
| `src/middlewares/` | JWT auth, centralized error handling, Multer file upload | Security & Infrastructure team |
| `src/config/` | Environment parsing, Prisma client singleton, logging | Security & Infrastructure team |
| `prisma/` | `schema.prisma`, migrations, and seed script | Database team |
| `tests/` | Unit and integration test suites | QA & Testing |

---

## 🚀 Recommended Next Steps

1. Install dependencies:
   ```bash
   npm install
   ```
2. Define the database schema in `prisma/schema.prisma` and push/migrate:
   ```bash
   npx prisma db push
   ```
3. Implement `src/server.ts` and `src/app.ts` to initialize Express.
4. Build features module-by-module collaboratively across `routes`, `controllers`, and `services`.