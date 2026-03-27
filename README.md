# Leads API — One Million Copy SAS

API REST para gestión de leads de marketing digital. Permite registrar, consultar, actualizar y eliminar leads provenientes de distintos embudos de marketing, con estadísticas y generación de resúmenes inteligentes usando IA.

## Tecnologías y justificación

| Tecnología | Justificación |
|---|---|
| **NestJS** (TypeScript) | Framework robusto con arquitectura modular, inyección de dependencias, y excelente soporte para validación, autenticación y documentación automática. |
| **TypeORM** | ORM maduro con soporte para migraciones, decoradores y múltiples bases de datos. |
| **PostgreSQL** | Base de datos relacional robusta, ideal para datos estructurados con consultas complejas. |
| **Swagger/OpenAPI** | Documentación automática e interactiva de la API. |
| **JWT** | Autenticación stateless y segura para endpoints protegidos. |
| **Docker** | Entorno reproducible para desarrollo y despliegue. |

## Requisitos previos

- Node.js >= 18
- PostgreSQL >= 14 (o Docker)
- npm

## Instalación

### Opción 1: Con Docker (recomendado)

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd leads-api

# Levantar todo con Docker
docker-compose up -d

# Ejecutar el seed
docker-compose exec api npm run seed
```

La API estará disponible en `http://localhost:3000` y la documentación Swagger en `http://localhost:3000/api/docs`.

### Opción 2: Sin Docker

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd leads-api

# Instalar dependencias
npm install

# Copiar y configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de PostgreSQL

# Crear la base de datos
createdb leads_db

# Iniciar en modo desarrollo (sincroniza el schema automáticamente)
npm run start:dev

# Ejecutar el seed (en otra terminal)
npm run seed
```

## Variables de entorno

Ver `.env.example` para la lista completa. Las principales:

| Variable | Descripción | Default |
|---|---|---|
| `DB_HOST` | Host de PostgreSQL | `localhost` |
| `DB_PORT` | Puerto de PostgreSQL | `5432` |
| `DB_USERNAME` | Usuario de PostgreSQL | `postgres` |
| `DB_PASSWORD` | Contraseña de PostgreSQL | — |
| `DB_NAME` | Nombre de la base de datos | `leads_db` |
| `JWT_SECRET` | Secreto para firmar tokens JWT | — |
| `AI_PROVIDER` | Proveedor de IA: `mock`, `openai`, `anthropic` | `mock` |
| `OPENAI_API_KEY` | API key de OpenAI (si AI_PROVIDER=openai) | — |
| `ANTHROPIC_API_KEY` | API key de Anthropic (si AI_PROVIDER=anthropic) | — |

## Seed

El seed crea 12 leads de ejemplo con datos variados:

```bash
npm run seed
```

Es idempotente: si un lead ya existe (por email), se omite.

## Endpoints

### Leads (CRUD)

| Método | Ruta | Descripción | Auth |
|---|---|---|---|
| `POST` | `/leads` | Crear un nuevo lead | No |
| `GET` | `/leads` | Listar leads (paginación, filtros) | No |
| `GET` | `/leads/:id` | Obtener un lead por ID | No |
| `PATCH` | `/leads/:id` | Actualizar un lead | No |
| `DELETE` | `/leads/:id` | Eliminar un lead (soft delete) | No |
| `GET` | `/leads/stats` | Estadísticas de leads | No |
| `POST` | `/leads/ai/summary` | Resumen ejecutivo con IA | JWT |
| `POST` | `/leads/webhook` | Webhook simulando Typeform | No |

### Auth

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/auth/register` | Registrar usuario |
| `POST` | `/auth/login` | Login (retorna JWT) |

## Ejemplos de uso

### Crear un lead

```bash
curl -X POST http://localhost:3000/leads \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "María García",
    "email": "maria@ejemplo.com",
    "telefono": "+573001234567",
    "fuente": "instagram",
    "producto_interes": "Curso de copywriting",
    "presupuesto": 350
  }'
```

### Listar leads con filtros

```bash
# Paginación
curl "http://localhost:3000/leads?page=1&limit=5"

# Filtro por fuente
curl "http://localhost:3000/leads?fuente=instagram"

# Filtro por rango de fechas
curl "http://localhost:3000/leads?fecha_inicio=2024-01-01&fecha_fin=2024-12-31"
```

### Obtener estadísticas

```bash
curl http://localhost:3000/leads/stats
```

### Registrar usuario y obtener token

```bash
# Registro
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@omc.com", "password": "password123"}'

# Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@omc.com", "password": "password123"}'
```

### Resumen con IA (requiere JWT)

```bash
curl -X POST http://localhost:3000/leads/ai/summary \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <tu-token-jwt>" \
  -d '{"fuente": "instagram"}'
```

### Webhook (simulando Typeform)

```bash
curl -X POST http://localhost:3000/leads/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "form_response": {
      "answers": [
        {"field": {"ref": "nombre"}, "text": "Nuevo Lead Typeform"},
        {"field": {"ref": "email"}, "email": "typeform@ejemplo.com"},
        {"field": {"ref": "fuente"}, "choice": {"label": "landing_page"}},
        {"field": {"ref": "presupuesto"}, "number": 200}
      ]
    }
  }'
```

## Documentación Swagger

Accede a la documentación interactiva en: `http://localhost:3000/api/docs`

## Tests

```bash
# Tests e2e (requiere PostgreSQL corriendo)
npm run test:e2e
```

## Integración con IA

La arquitectura soporta 3 proveedores (configurable via `AI_PROVIDER` en `.env`):

1. **`mock`** (default): Genera un resumen realista sin necesidad de API key. Ideal para evaluación.
2. **`openai`**: Usa GPT-3.5-turbo. Requiere `OPENAI_API_KEY`.
3. **`anthropic`**: Usa Claude. Requiere `ANTHROPIC_API_KEY`.

El servicio `AiService` está diseñado con una interfaz `AiProvider` que facilita agregar nuevos proveedores.

## Decisiones técnicas

- **Soft delete**: Los leads no se eliminan de la base de datos, se marcan con `deleted: true`. Esto permite auditoría y recuperación.
- **Rate limiting**: 30 peticiones por minuto por IP para proteger contra abuso.
- **Validación**: Se usa `class-validator` con mensajes de error en español y códigos HTTP apropiados.
- **UUID**: Se usan UUIDs en lugar de IDs incrementales para mayor seguridad y portabilidad.
- **Paginación**: Límite máximo de 100 items por página para prevenir consultas excesivas.

## Estructura del proyecto

```
src/
├── ai/                    # Módulo de integración con IA
│   ├── ai.module.ts
│   └── ai.service.ts
├── auth/                  # Módulo de autenticación JWT
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── dto/
│   ├── entities/
│   ├── guards/
│   └── strategies/
├── common/                # Filtros y utilidades compartidas
│   └── http-exception.filter.ts
├── database/              # Seed de datos
│   └── seed.ts
├── leads/                 # Módulo principal de leads
│   ├── leads.module.ts
│   ├── leads.controller.ts
│   ├── leads.service.ts
│   ├── leads-webhook.controller.ts
│   ├── dto/
│   └── entities/
├── app.module.ts
└── main.ts
```
