# BREWAI v4 - AI-First Restaurant Operations Platform

A comprehensive, AI-powered restaurant management system with intelligent automation, real-time analytics, and human-in-the-loop approval workflows.

## Architecture Overview

```
brewai/
├── backend-api/          # Express + TypeScript API server
│   ├── src/
│   │   ├── adapters/     # External service integrations (OpenRouter, Firecrawl, Reducto)
│   │   ├── agents/       # AI agent framework
│   │   ├── config/       # Database, Redis, MinIO configuration
│   │   ├── middleware/   # Auth, validation, RBAC
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # API endpoints
│   │   └── utils/        # Logger, helpers
│   └── Dockerfile
├── frontend-next/        # Next.js 14 frontend
│   ├── app/              # App router pages
│   ├── components/       # React components
│   └── lib/              # Auth context, API client
├── docker-compose.yml    # Full stack orchestration
└── .env.example          # Environment variables template
```

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local development)
- API keys for: OpenRouter, Firecrawl (optional), Reducto (optional)

### Development Setup

1. **Clone and setup environment**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Seed the database**
   ```bash
   docker-compose exec api npm run seed
   ```

4. **Access the application**
   - Frontend: http://localhost:3001
   - API: http://localhost:3000
   - API Docs: http://localhost:3000/api/docs

### Test Accounts

After seeding:
- **Owner:** owner@urbankitchen.com / Password123!
- **Manager:** manager@urbankitchen.com / Password123!
- **Staff:** staff@urbankitchen.com / Password123!

## Core Features

### Authentication & RBAC
- JWT-based authentication with refresh tokens
- Role-based access control (owner, manager, staff)
- Fine-grained permissions per restaurant

### AI Agent Framework
- **Inventory Agent:** Monitors stock levels, suggests reorders
- **Pricing Agent:** Analyzes margins, recommends price changes
- Human-in-the-loop approval for high-impact actions
- Auto-approval for low-risk, high-confidence actions

### Session Recording & Replay
- Captures user interactions for UX analysis
- Event-based recording with efficient storage
- Playback with timeline scrubbing

### Menu Management
- Full CRUD for menu items
- Ingredient cost tracking
- Profit margin analysis
- Popularity tracking

### Inventory Management
- Par level and reorder point configuration
- Multi-supplier support
- Low stock alerts
- Automated reordering suggestions

### Analytics
- Real-time sales metrics
- Cost analysis
- Customer insights
- Performance trends

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh tokens
- `GET /api/auth/me` - Get current user

### Menu
- `GET /api/menu` - List menu items
- `POST /api/menu` - Create menu item
- `PUT /api/menu/:id` - Update menu item
- `DELETE /api/menu/:id` - Delete menu item

### Inventory
- `GET /api/inventory` - List ingredients
- `POST /api/inventory` - Add ingredient
- `POST /api/inventory/count` - Record inventory count

### AI Agents
- `GET /api/agents/actions` - List pending actions
- `POST /api/agents/actions/:id/approve` - Approve action
- `POST /api/agents/actions/:id/reject` - Reject action
- `POST /api/agents/trigger` - Manually trigger agents

### Sessions
- `POST /api/sessions/start` - Start recording
- `POST /api/sessions/:id/events` - Record events
- `POST /api/sessions/:id/end` - End session
- `GET /api/sessions` - List sessions
- `GET /api/sessions/:id` - Get session with replay URL

## Running Tests

```bash
cd backend-api
npm test
npm run test:coverage
```

## Environment Variables

See `.env.example` for all required variables:

- `MONGO_URI` - MongoDB connection string
- `REDIS_URL` - Redis connection string
- `JWT_SECRET` - JWT signing secret
- `OPENROUTER_API_KEY` - For AI capabilities
- `MINIO_*` - Object storage configuration

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- MongoDB + Mongoose
- Redis for caching
- MinIO for file storage
- Jest for testing

### Frontend
- Next.js 14 (App Router)
- React 18
- Tailwind CSS
- Lucide Icons

### Infrastructure
- Docker + Docker Compose
- Nginx reverse proxy
- Health checks and auto-restart

## License

Proprietary - All rights reserved
