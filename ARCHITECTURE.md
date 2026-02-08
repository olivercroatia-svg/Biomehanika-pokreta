# Biomehanika Pokreta - System Architecture

This document outlines the technical architecture and logic for the Biomehanika Pokreta system.

## 1. MySQL Database Schema
See `database_schema.sql` for the full SQL definition. Key tables:
- `users`: Staff and clients including registration status.
- `services`: Therapy types, durations, and pricing.
- `appointments`: Booking data linked to Google Calendar.
- `packages`: Tracking session bundles (e.g., 10+2).
- `staff_schedule`: Availability roster.

## 2. API Endpoints (PHP/Laravel)

### Client Endpoints
- `GET /api/v1/services`: List available therapies.
- `GET /api/v1/availability?service_id=X&staff_id=Y`: Fetch available slots (checks MySQL roster + Google Calendar).
- `POST /api/v1/bookings`: Create a new appointment.
- `POST /api/v1/register`: Onboarding for new clients.

### Admin/Staff Endpoints
- `POST /api/v1/admin/login`: Secure authentication.
- `GET /api/v1/admin/dashboard`: Stats and upcoming appointments.
- `PATCH /api/v1/admin/appointments/{id}`: Update status (confirm, no-show, etc).
- `POST /api/v1/admin/staff/roster`: Update weekly working hours.

### Webhooks
- `POST /api/webhooks/whatsapp`: Listens to incoming WhatsApp messages.
- `POST /api/webhooks/google-calendar`: Listens to calendar changes.

## 3. AI Logic Flow (GPT-4 Integration)

**Goal:** Transform natural language "I want a session tomorrow afternoon" into a structured booking.

**Logic Chain:**
1. **Input:** User message (WhatsApp) + Client Context (Package status, History).
2. **Context Injection:** System sends current availability for the requested period to GPT.
3. **GPT Prompt:** "You are an assistant for Biomehanika. Extract: `service`, `staff`, `time`. Output JSON."
4. **Processing:**
   - If missing info -> Responds: "Which therapy do you need?"
   - If slot taken -> Responds: "That slot is busy, how about these 3 alternatives?"
   - If valid -> Returns JSON for Backend to process.
5. **Action:** Backend updates MySQL and Google Calendar, then sends confirmation back.

## 4. Visual Identity (Tailwind CSS)
```javascript
theme: {
  extend: {
    colors: {
      'primary-pink': '#FF69B4',
      'primary-purple': '#4B0082',
      'accent-grey': '#F5F5F5',
      'dark-accent': '#1A1A1A',
    }
  }
}
```

## 5. Deployment Strategy (Docker)
- **Nginx:** Reverse proxy & SSL.
- **Frontend:** React SPA (Vite).
- **Backend:** PHP-FPM (Laravel).
- **DB:** MySQL 8.0.
- **Cache:** Redis for Google API caching.
```
