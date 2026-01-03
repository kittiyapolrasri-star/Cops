# C.O.P.S. - Command Operations for Patrol Surveillance

Intelligent Patrol Management System with Real-time Tracking and Dashboard.

## 🚀 Deployment Guide (Linux VM)

### 1. Prerequisities
- Docker & Docker Compose installed
- Git installed

### 2. Installation

```bash
# Clone repository
git clone https://github.com/kittiyapolrasri-star/Cops.git
cd Cops

# Check for port conflicts
chmod +x check_ports.sh
./check_ports.sh
```

### 3. Configuration (Fix Port Conflicts)

If you have other services running (like port 80 or 4000 occupied), use the provided production config:

```bash
# Copy production env example
cp .env.production.example .env

# (Optional) Edit .env to change passwords or ports
nano .env
```

### 4. Start System

```bash
# Run with production compose file
docker-compose -f docker-compose.prod.yml up -d --build
```

### 5. Access System

- **Dashboard:** `http://[YOUR_VM_IP]:8085` (Default port in .env.production.example)
- **Backend API:** `http://[YOUR_VM_IP]:4005`

## 🛠 Directory Structure

- `/backend` - NestJS API Server
- `/frontend` - Next.js Dashboard & PWA
- `docker-compose.prod.yml` - Production Orchestration
- `check_ports.sh` - Utility to check available ports

## 📱 Mobile PWA
Open the dashboard link on your mobile phone and select "Add to Home Screen" to install the Patrol App.
