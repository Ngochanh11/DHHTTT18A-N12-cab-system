# 🚕 CAB Booking System - Microservices Architecture

[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-✔-blue)](https://www.docker.com/)
[![Microservices](https://img.shields.io/badge/Architecture-Microservices-orange)](https://microservices.io/)
[![OpenAPI](https://img.shields.io/badge/API-OpenAPI_3.0-brightgreen)](docs/api-spec/)

## 📋 Table of Contents
- [Overview](#-overview)
- [Architecture](#-architecture)
- [Features](#-features)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [Services Documentation](#-services-documentation)

## 🎯 Overview

**CAB Booking System** is a modern taxi booking platform built with **Microservices Architecture**, designed to handle large-scale, real-time ride-hailing operations. The system connects passengers, drivers, and administrators through a scalable, fault-tolerant, and AI-enabled platform.

### Key Capabilities
- **Real-time GPS Tracking** - Live location updates with WebSocket
- **AI Driver Matching** - Intelligent ride assignment using machine learning
- **Dynamic Pricing** - Surge pricing based on demand and supply
- **Multi-payment Support** - Cash, card, wallet, and third-party integrations
- **Zero Trust Security** - End-to-end security with mTLS and JWT
- **Event-driven Architecture** - Asynchronous communication with Kafka

---

## 🏗️ Architecture

### System Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                     CLIENT APPLICATIONS                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐      │
│  │  Passenger  │  │   Driver    │  │     Admin       │      │
│  │    App      │  │    App      │  │   Dashboard     │      │
│  └─────────────┘  └─────────────┘  └─────────────────┘      │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS/WebSocket
┌───────────────────────────▼─────────────────────────────────┐
│                   API GATEWAY (Port: 3000)                  │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  • Request Routing  • Authentication • Rate Limiting│    │
│  │  • Load Balancing   • Logging        • CORS         │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────┬───────────────────────────────────────────┘
                  │ Service-to-Service Communication
┌─────────────────▼───────────────────────────────────────────┐
│                    MICROSERVICES                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│  │  Auth   │ │  User   │ │ Driver  │ │ Booking │ │  Ride   ││
│  │ (3001)  │ │ (3002)  │ │ (3003)  │ │ (3004)  │ │(3005/6) ││
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘│
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │ Payment │ │ Pricing │ │ Notify  │ │ Review  │            │
│  │ (3007)  │ │ (3008)  │ │ (3009)  │ │ (3010)  │            │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘            │
└─────────────────┬───────────────────────────────────────────┘
                  │ Event-Driven Communication (Kafka)
┌─────────────────▼───────────────────────────────────────────┐
│                     DATA LAYER                              │
│  ┌───────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────┐  │ 
│  │PostgreSQL │ │ MongoDB │ │  Redis  │ │     Kafka       │  │
│  │   (5432)  │ │ (27017) │ │  (6379) │ │     (9092)      │  │
│  └───────────┘ └─────────┘ └─────────┘ └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack
| Component | Technology | Purpose |
|-----------|------------|---------|
| **API Gateway** | Node.js, Express, http-proxy-middleware | Request routing, authentication |
| **Backend Services** | Node.js, Express, NestJS | Business logic implementation |
| **Frontend** | React.js, Next.js, Tailwind CSS | User interfaces |
| **Databases** | PostgreSQL, MongoDB, Redis | Data persistence and caching |
| **Message Queue** | Apache Kafka | Event-driven communication |
| **Containerization** | Docker, Docker Compose | Service isolation and deployment |
| **Orchestration** | Kubernetes (optional) | Container orchestration |
| **Monitoring** | Prometheus, Grafana, ELK Stack | Observability and logging |
| **CI/CD** | GitHub Actions | Automated testing and deployment |

---

## ✨ Features

### For Passengers
- 🔐 **Secure Authentication** with JWT and OAuth2
- 🗺️ **Real-time Ride Tracking** with live GPS updates
- 💰 **Dynamic Pricing** with surge pricing algorithms
- 📱 **Multiple Payment Methods** (cash, card, wallet, VNPay, MoMo)
- ⭐ **Rating System** for drivers and services
- 📍 **Saved Locations** for quick booking
- 🔔 **Push Notifications** for ride updates

### For Drivers
- 🚗 **Driver Registration** with KYC verification
- 📍 **Live GPS Location** streaming
- 💵 **Earnings Dashboard** with daily/weekly reports
- 📞 **In-app Communication** with passengers
- 🧭 **Navigation Integration** with Google Maps
- 🔄 **Ride Queue Management** for efficient assignment

### For Administrators
- 📊 **Real-time Dashboard** with KPIs and metrics
- 👥 **User Management** for passengers and drivers
- 💰 **Pricing Configuration** and surge control
- 🚨 **Monitoring & Alerts** for system health
- 📈 **Analytics & Reports** for business insights
- 🔐 **Role-based Access Control** (RBAC)

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18.x** or higher
- **Docker & Docker Compose**
- **Git**

### Installation Steps

#### 1. Clone the Repository
```bash
git clone https://github.com/Ngochanh11/DHHTTT18A-N12-cab-system.git
cd DHHTTT18A-N12-cab-system
```

#### 2. Start All Services with Docker Compose
```bash
# Start all services (databases + microservices)
docker-compose up -d

# Check running services
docker-compose ps

# View logs
docker-compose logs -f [service-name]
```


## 📁 Project Structure

```
DHHTTT18A-N12-cab-system/
├── api-gateway/                 # API Gateway service
│
├── client/                      # Frontend applications
│   ├── admin-dashboard/        # Admin management UI
│   ├── customer-app/           # Passenger mobile app
│   └── driver-app/             # Driver mobile app
│
├── services/                    # Microservices
│   ├── auth-service/           # Authentication & authorization
│   ├── user-service/           # User profile & wallet
│   ├── driver-service/         # Driver management
│   ├── booking-service/        # Ride booking
│   ├── ride-service/           # Real-time tracking
│   ├── payment-service/        # Payment processing
│   ├── pricing-service/        # Dynamic pricing
│   ├── notification-service/   # Push notifications
│   └── review-service/         # Ratings & reviews
│
├── docs/                        # Documentation
│   ├── api-spec/               # OpenAPI specifications
│
├── databases/                   # Database configurations
│   ├── postgres/               # PostgreSQL scripts
│   ├── mongodb/                # MongoDB scripts
│   └── redis/                  # Redis configuration
│
├── docker-compose.yml           # Docker Compose configuration
├── package.json                 # Root package.json
└── README.md                    # This file
```

---

## 📚 Services Documentation


### 1. 🔐 **Auth Service** (Port: 3001)
- **Purpose**: Authentication, authorization, and token management
- **Key Endpoints**:
  - `POST /api/v1/auth/register` - User registration
  - `POST /api/v1/auth/login` - User login with JWT
  - `POST /api/v1/auth/refresh` - Refresh access token
  - `POST /api/v1/auth/logout` - User logout
- **Database**: PostgreSQL

### 2. 👤 **User Service** (Port: 3002)
- **Purpose**: User profile management and wallet operations
- **Key Endpoints**:
  - `GET /api/v1/users/{userId}` - Get user profile
  - `PUT /api/v1/users/{userId}` - Update user information
  - `GET /api/v1/users/{userId}/wallet` - Get wallet balance
  - `POST /api/v1/users/{userId}/saved-locations` - Save frequent locations
- **Database**: PostgreSQL

### 3. 🚗 **Driver Service** (Port: 3003)
- **Purpose**: Driver registration, management, and availability
- **Key Endpoints**:
  - `POST /api/v1/drivers` - Register as driver
  - `GET /api/v1/drivers/{driverId}` - Get driver details
  - `PUT /api/v1/drivers/{driverId}/status` - Update driver status
  - `GET /api/v1/drivers/nearby` - Find nearby drivers
- **Database**: MongoDB

### 4. 📅 **Booking Service** (Port: 3004)
- **Purpose**: Ride booking creation and management
- **Key Endpoints**:
  - `POST /api/v1/bookings` - Create new booking
  - `GET /api/v1/bookings/{bookingId}` - Get booking details
  - `PUT /api/v1/bookings/{bookingId}/cancel` - Cancel booking
  - `POST /api/v1/bookings/estimate` - Estimate fare and ETA
- **Database**: PostgreSQL

### 5. 🗺️ **Ride Service** (Port: 3005/3006)
- **Purpose**: Real-time ride tracking and GPS updates
- **Key Endpoints**:
  - `GET /api/v1/rides/{rideId}` - Get ride details
  - `PUT /api/v1/rides/{rideId}/location` - Update driver location
  - `GET /api/v1/rides/{rideId}/tracking` - Track ride in real-time
  - `WebSocket /ws/driver` - Real-time location streaming
- **Database**: Redis (for real-time data)

### 6. 💳 **Payment Service** (Port: 3007)
- **Purpose**: Payment processing and transaction management
- **Key Endpoints**:
  - `POST /api/v1/payments` - Create payment
  - `GET /api/v1/payments/{paymentId}` - Get payment status
  - `POST /api/v1/payments/{paymentId}/confirm` - Confirm payment
  - `POST /webhook/stripe` - Stripe webhook integration
- **Database**: PostgreSQL

### 7. 💰 **Pricing Service** (Port: 3008)
- **Purpose**: Dynamic fare calculation and surge pricing
- **Key Endpoints**:
  - `POST /api/v1/pricing/estimate` - Estimate ride fare
  - `GET /api/v1/pricing/surge/{zoneId}` - Get surge multiplier
  - `PUT /api/v1/pricing/config` - Update pricing configuration
- **Database**: Redis (for caching)

### 8. 🔔 **Notification Service** (Port: 3009)
- **Purpose**: Push notifications, SMS, and email alerts
- **Key Endpoints**:
  - `GET /api/v1/notifications` - Get user notifications
  - `PUT /api/v1/notifications/{id}/read` - Mark as read
  - `GET /api/v1/notifications/unread/count` - Count unread notifications
- **Database**: MongoDB

### 9. ⭐ **Review Service** (Port: 3010)
- **Purpose**: Ride ratings, reviews, and feedback
- **Key Endpoints**:
  - `POST /api/v1/reviews` - Create review
  - `GET /api/v1/reviews/driver/{driverId}` - Get driver reviews
  - `GET /api/v1/ratings/driver/{driverId}` - Get driver rating summary
- **Database**: MongoDB
