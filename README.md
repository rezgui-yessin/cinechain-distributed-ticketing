# 🎬 CineChain — Decentralized Cinema Ticketing & Web3 Entertainment Platform

[![Frontend Deployment](https://img.shields.io/badge/Vercel-Deployed-brightgreen?logo=vercel)](https://frontend-three-inky-29.vercel.app)
[![Backend](https://img.shields.io/badge/Spring%20Boot-3.2.3-green?logo=springboot)](https://spring.io/projects/spring-boot)
[![Frontend](https://img.shields.io/badge/Angular-18-red?logo=angular)](https://angular.dev)
[![AI Integration](https://img.shields.io/badge/Google%20Gemini-1.5%20Flash-blue?logo=google)](https://ai.google.dev/)
[![Payments](https://img.shields.io/badge/Stripe-Payment%20Engine-635bff?logo=stripe)](https://stripe.com)
[![Storage](https://img.shields.io/badge/Cloudinary-CDN%20Storage-3448C5?logo=cloudinary)](https://cloudinary.com)
[![Test Suite](https://img.shields.io/badge/Tests-57%2F57%20Passed%20(100%25)-success)](./test_suite.js)

**CineChain** is an enterprise-grade, distributed cinema ticketing and web3 entertainment platform. It combines high-concurrency seat reservation algorithms, SHA-256 cryptographic blockchain audit trails, automated P2P ticket resale with anti-scalping policies, dynamic commemorative NFT ticket stubs (POAP), in-seat gourmet concessions ordering with kitchen display systems (KDS), real-time WebSockets, Stripe payment processing, and Google Gemini AI concierge & smart sentiment moderation.

---

## 🌐 Live Production Links

* **Frontend (Vercel):** [https://frontend-three-inky-29.vercel.app](https://frontend-three-inky-29.vercel.app)
* **GitHub Repository:** [rezgui-yessin/cinechain-distributed-ticketing](https://github.com/rezgui-yessin/cinechain-distributed-ticketing)

---

## ✨ Core Feature Highlights

### 1. 🎟️ Decentralized & Web3 / Ticket Resale (P2P Secondary Market)
* **Regulated P2P Ticket Resale (Anti-Scalping):**
  * Customers who cannot attend can list tickets at or below original face value (anti-scalping rule strictly enforced in code and DB).
  * Instant ownership transfer upon purchase: the old cryptographic QR code is immediately revoked, a newly signed QR code is issued to the buyer, and the transition (`TICKET_RESOLD`) is committed to the blockchain audit ledger.
* **Smart NFT / Digital Collectible Ticket Stub (POAP):**
  * Once validated at the gate scanner, physical/digital tickets automatically transform into post-event commemorative digital NFT stubs with custom artwork, movie attendance badges, and cryptographic proof of attendance.

### 2. 🤖 AI & Smart Cinema Experiences (Using Google Gemini API)
* **AI Movie Concierge / Assistant (Chatbot):**
  * Natural language conversational concierge (`/concierge`) powered by **Gemini 1.5 Flash**.
  * Context-aware: dynamically injects live screenings, hall configurations, and available seats to answer queries like: *"Suggest an action movie playing tonight with good center seats"* or *"Which movie is best for kids under 10?"*.
  * Returns interactive, clickable movie recommendation cards with direct booking links.
* **AI Sentiment & Smart Reviews Moderation:**
  * Automated content moderation against spoilers (`isSpoiler`) and offensive language (`isFlagged`).
  * NLP sentiment extraction (`POSITIVE`, `NEGATIVE`, `MIXED`, `NEUTRAL`) and automatic tagging (`Stellar Acting`, `Epic Visuals`, etc.).
  * Automated AI consensus summary aggregating audience highlights (Pros), key themes, and critiques.

### 3. 💳 Real Payment Engine (Stripe Official Integration)
* **Stripe PaymentIntent Workflow:** Full PCI-DSS compliant checkout flow supporting live card payments with 3D Secure / Elements.
* **Seamless UI Checkout:** Embedded Stripe Elements payment sheet directly inside the cinema dark-mode theme, supporting automatic card formatting, validation, and instantaneous on-chain booking confirmation.

### 4. 🍿 In-Seat Gourmet Concessions & Kitchen Display System (KDS)
* Real-time snack and beverage ordering straight to seat coordinates (Row & Seat Number).
* Dedicated live Kitchen Display System (KDS) for cinema staff with real-time status updates (`RECEIVED` → `PREPARING` → `OUT_FOR_DELIVERY` → `DELIVERED`).

### 5. ⚡ Real-Time WebSockets & Cryptographic QR Gate Scanner
* **STOMP / SockJS WebSockets:** Instant seat locking feedback across all connected users to prevent double-booking.
* **Pessimistic DB Locks:** High-concurrency seat reservation guaranteed via `@Lock(LockModeType.PESSIMISTIC_WRITE)`.
* **Gate Scanner:** High-speed QR scanner for cinema staff at the gate with real-time cryptographic validation against the blockchain ledger.

---

## 🚀 Tech Stack

### Backend
* **Framework:** Spring Boot 3.2.3 (Java 21)
* **Security:** Spring Security 6 + Stateless JWT (Access & Refresh tokens) + Role-Based Access Control (`ADMIN`, `CUSTOMER`)
* **Persistence:** Spring Data JPA + Hibernate + PostgreSQL 15
* **Caching & Queues:** Spring Data Redis
* **Real-Time:** Spring WebSocket + STOMP Broker
* **AI / NLP:** Google Gemini 1.5 Flash REST API + heuristic fallback engine
* **Payments:** Official Stripe Java SDK (`v24.23.0`)
* **QR & Crypto:** ZXing 3.5.2 + SHA-256 Ledger
* **Media CDN:** Cloudinary Java SDK (`v1.36.0`)
* **Containerization:** Docker & Docker Compose

### Frontend
* **Framework:** Angular 18 (Standalone Components, Signals & Reactive Forms)
* **Styling:** Tailwind CSS 3 (Custom Cinema Dark Theme `#070716`)
* **Payments UI:** Stripe.js v3 + Stripe Elements
* **Visuals & Charts:** Chart.js & ng2-charts (Interactive admin & customer analytics)
* **Deployment:** Vercel Production Platform (Automated CI/CD with SPA rewrites)

---

## 👥 Default Demo Credentials

| Role | Email | Password | Access Area |
|---|---|---|---|
| **Admin** | `admin@cinechain.com` | `Admin@CineChain2024!` | `/admin/dashboard` |
| **Customer** | `customer@cinechain.com` | `Password@123` | `/customer/dashboard` |

*(You can also register a new customer account at `/register`)*

---

## 🛠️ Quick Start with Docker

```bash
# 1. Clone the repository
git clone https://github.com/rezgui-yessin/cinechain-distributed-ticketing.git
cd cinechain-distributed-ticketing

# 2. Start all services (PostgreSQL, Redis, Spring Boot Backend, Angular Frontend)
docker compose up -d

# 3. Access the applications
# Frontend: http://localhost:4200
# Backend API: http://localhost:8080
# Vercel Production: https://frontend-three-inky-29.vercel.app
```

---

## 🧪 Comprehensive Automated Test Suite

CineChain comes with an automated end-to-end integration test suite (`test_suite.js`) covering 100% of all platform endpoints:

```bash
# Run full suite
node test_suite.js
```

```text
========================================================
                   TEST SUITE SUMMARY                   
========================================================
Total Endpoints Tested: 57
Passed: 57
Failed: 0
Success Rate: 100.0%

🎉 ALL ENDPOINTS PASSED WITH 100% SUCCESS RATE!
```

### Covered Test Modules:
1. `Authentication & Token Refresh` (Admin & Customer JWT)
2. `Cloudinary Media Storage` (Upload & Delete posters)
3. `Movie Catalog CRUD`
4. `Cinemas & Halls Management`
5. `Screenings & Real-Time Seat Availability`
6. `Seat Booking with Pessimistic Locking`
7. `Gate Validation & Anti-Reuse Gate Scanner`
8. `Blockchain SHA-256 Transaction Ledger`
9. `In-Seat Concessions & Kitchen Display System (KDS)`
10. `Admin & Customer Metric Dashboards`
11. `P2P Ticket Resale Marketplace & Commemorative NFT Stubs (POAP)`
12. `Google Gemini AI Concierge Chatbot & Review Moderation`
13. `Stripe PaymentIntent & Real Payment Processing`

---

## 📁 Repository Structure

```text
cinema/
├── backend/                               # Spring Boot 3.2 Java application
│   ├── src/main/java/com/cinechain/
│   │   ├── config/                        # Security, CORS, WebSocket configs
│   │   ├── controller/                    # REST APIs (Ai, Payment, Resale, NftStub, etc.)
│   │   ├── dto/                           # Data Transfer Objects
│   │   ├── entity/                        # PostgreSQL JPA Entities
│   │   ├── repository/                    # Spring Data Repositories
│   │   └── service/                       # Business logic (Gemini, Stripe, Blockchain, etc.)
│   ├── src/main/resources/                # application.yml
│   └── Dockerfile
├── frontend/                              # Angular 18 Application
│   ├── src/app/
│   │   ├── core/                          # Services, Guards, Interceptors, Models
│   │   ├── features/
│   │   │   ├── admin/                     # Admin Dashboard, KDS, Scanner, Blockchain
│   │   │   ├── customer/                  # Customer Dashboard, My Tickets, NFT Stubs
│   │   │   ├── public/                    # Home, Movies, AI Concierge, Resale Marketplace
│   │   │   └── booking/                   # Seat Selection & Stripe Checkout
│   │   └── shared/                        # Navbar, UI Components
│   ├── vercel.json                        # Vercel SPA routing & build configuration
│   └── Dockerfile
├── docker-compose.yml                     # Multi-container orchestration
├── test_suite.js                          # Comprehensive automated test suite (57 endpoints)
└── README.md
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
