# 🎬 CineChain — Premium Cinema Booking Platform

A full-stack cinema ticket booking platform with blockchain-verified tickets, QR code generation, and real-time seat availability.

## 🚀 Tech Stack

**Backend:**
- Spring Boot 3.2 + Java clear

- Spring Security + JWT Authentication
- Spring Data JPA + PostgreSQL 15
- Spring Data Redis (caching)
- Spring WebSocket (real-time updates)
- ZXing (QR Code generation)
- Blockchain simulation (SHA-256 based)
- Docker + Docker Compose

**Frontend:**
- Angular 17 (Standalone Components)
- Tailwind CSS 3
- Chart.js (dashboard analytics)
- Reactive Forms
- Route Guards (Auth, Admin, Customer)
- JWT interceptor

## 👥 Two Actor System

### Admin
- Access: `/admin/dashboard`
- Full platform management
- Ticket validation
- Blockchain monitoring
- Statistics and reports

### Customer
- Access: `/customer/dashboard`
- Movie browsing and booking
- QR code tickets
- Booking history

## 🔐 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@cinechain.com | Admin@CineChain2024! |
| Customer | Register at /register | Your chosen password |

## 🐳 Quick Start with Docker

```bash
# Clone the repository
git clone <repo-url>
cd cinema

# Start all services
docker compose up -d

# Access the application
# Frontend: http://localhost:4200
# Backend API: http://localhost:8080
# API Docs: http://localhost:8080/swagger-ui.html
```

## 💻 Local Development

### Backend
```bash
cd backend
# Requires Java 21 and PostgreSQL running locally
./mvnw spring-boot:run
```

### Frontend
```bash
cd frontend
npm install
npm start
# Opens at http://localhost:4200
```

## 🏗 Project Structure

```
cinema/
├── backend/              # Spring Boot application
│   ├── src/main/java/com/cinechain/
│   │   ├── config/       # Security, JWT, Redis, WebSocket configs
│   │   ├── controller/   # REST API endpoints
│   │   ├── dto/          # Data Transfer Objects
│   │   ├── entity/       # JPA entities
│   │   ├── enums/        # Enumerations (Role, Status, etc.)
│   │   ├── exception/    # Exception handling
│   │   ├── repository/   # Spring Data JPA repositories
│   │   ├── security/     # JWT filter, UserDetailsService
│   │   └── service/      # Business logic
│   └── Dockerfile
├── frontend/             # Angular application
│   ├── src/app/
│   │   ├── core/         # Guards, interceptors, models, services
│   │   ├── features/
│   │   │   ├── admin/    # Admin dashboard and management
│   │   │   ├── auth/     # Login, Register pages
│   │   │   ├── customer/ # Customer dashboard
│   │   │   └── public/   # Public pages (home, movies, cinemas)
│   │   └── shared/       # Shared components (navbar, footer)
│   └── Dockerfile
├── docker-compose.yml
├── .env
└── README.md
```

## 🛡 Security Features

- JWT access tokens (15 min expiry)
- Refresh tokens (7 days)
- BCrypt password hashing
- Role-based access control (RBAC)
- Angular route guards
- Backend @PreAuthorize annotations
- Pessimistic locking for concurrent seat booking
- Ownership validation on all customer endpoints

## 🎫 Booking Flow

1. Browse movies → Select movie
2. Choose cinema & screening
3. Select seats (interactive seat map)
4. Review order & confirm
5. Simulated payment
6. QR code ticket generation
7. Blockchain transaction recorded
8. Download/view ticket in dashboard

## 📊 Admin Features

- Real-time statistics dashboard
- Full CRUD for movies, cinemas, halls, screenings
- Customer management (view, suspend/reactivate)
- Ticket validation via QR code scan
- Blockchain transaction history
- Revenue and occupancy reports

## 🔗 API Endpoints

### Public
- `GET /api/movies` — List movies
- `GET /api/movies/{id}` — Movie details
- `GET /api/cinemas` — List cinemas
- `GET /api/screenings` — List screenings

### Auth
- `POST /api/auth/register` — Register (creates CUSTOMER)
- `POST /api/auth/login` — Login (returns JWT)

### Customer (requires CUSTOMER role)
- `GET /api/customer/dashboard/stats`
- `POST /api/bookings` — Create booking
- `GET /api/customer/tickets` — My tickets
- `POST /api/tickets/{id}/cancel`

### Admin (requires ADMIN role)
- `GET /api/admin/dashboard/stats`
- `POST /api/admin/movies` — Create movie
- `POST /api/validation/validate` — Validate ticket
- `GET /api/blockchain/transactions`

## 🌐 Application URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:8080 |
| Login | http://localhost:4200/login |
| Admin Dashboard | http://localhost:4200/admin/dashboard |
| Customer Dashboard | http://localhost:4200/customer/dashboard |
