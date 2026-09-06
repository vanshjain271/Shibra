# Shibra — B2B Mobile Accessories Platform

> A full-stack B2B e-commerce platform for mobile accessories by **Shibra Enterprise**

---

## Project Structure

```
shibra/
├── backend/        # Node.js + Express REST API
├── admin/          # React + Vite Admin Panel
├── storefront/     # Next.js Storefront Website
└── mobile/         # React Native iOS + Android App
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express, MongoDB Atlas, AWS S3, Firebase Admin |
| Admin Panel | React 18, Vite, MUI v5, Redux Toolkit, Recharts |
| Storefront | Next.js 15, App Router, Tailwind CSS v4 |
| Mobile App | React Native 0.83, Firebase, Redux Toolkit |

---

## Environment Setup

Each sub-project has a `.env.example`. Copy it to `.env` and fill in real credentials:

```bash
cp backend/.env.example backend/.env
cp storefront/.env.example storefront/.env
cp mobile/.env.example mobile/.env
```

---

## Running Locally

```bash
# Backend
cd backend && npm install && npm run dev

# Admin Panel
cd admin && npm install && npm run dev

# Storefront
cd storefront && npm install && npm run dev

# Mobile App
cd mobile && npm install
npx react-native run-android   # Android
npx react-native run-ios       # iOS
```

---

## Production URLs

| Service | URL |
|---------|-----|
| API | https://api.shibrab2b.com |
| Admin Panel | https://admin.shibrab2b.com |
| Storefront | https://www.shibrab2b.com |
| iOS App | App Store — com.shibra.app |
| Android App | Google Play — com.shibra.app |

---

## New Credentials Required

Before deploying, create and configure:

- [ ] **MongoDB Atlas** — New cluster, database: `shibra`
- [ ] **AWS S3** — New bucket: `shibra-uploads`, region: `ap-south-1`
- [ ] **Firebase** — New project for Firebase Phone Auth + FCM
  - Add `google-services.json` → `mobile/android/app/`
  - Add `GoogleService-Info.plist` → `mobile/ios/mobile/`
- [ ] **MSG91** — OTP/WhatsApp templates with SHIBRA sender ID
- [ ] **Domain** — `shibrab2b.com` with DNS pointing to hosting

---

*Shibra Enterprise — B2B E-Commerce System*
