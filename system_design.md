# Shibra — System Design Document

## 1. Overview
**Shibra** is a comprehensive B2B wholesale platform for mobile accessories (chargers, cables, earbuds). It allows bulk buyers and retailers to place wholesale orders via mobile or web.

## 2. Architecture
The platform is built with a decoupled architecture spanning four core components:

1. **Backend API** (Node.js/Express)
2. **Admin Panel** (React/Vite/MUI)
3. **Storefront Website** (Next.js)
4. **Mobile App** (React Native)

---

### 2.1 Backend API (Node.js/Express)
- **Database**: MongoDB (Atlas) using Mongoose ORM.
- **Authentication**:
  - Web Storefront: Phone number + OTP (via MSG91/Twilio) -> JWT.
  - Mobile App: Firebase Phone Auth -> Firebase ID Token -> Verified by Backend -> JWT.
  - Admin Panel: Email/Password -> JWT.
- **Storage**: AWS S3 for all images and product assets.
- **Payments**: COD & UPI QR (Manual). Razorpay integration logic exists but is currently disabled for launch.
- **Architecture**: Controller-Service-Route pattern. Strict separation of concerns.

### 2.2 Admin Panel (React/Vite)
- **Framework**: React 18 + Vite.
- **UI Library**: Material-UI (MUI v5) styled with Shibra brand colors (Primary: `#2563EB`).
- **State Management**: Redux Toolkit (RTK).
- **Key Modules**: Dashboard, Order Management, Product Catalog, Inventory (Lots), Customers, Coupons, Settings.

### 2.3 Storefront Website (Next.js)
- **Framework**: Next.js 15 (App Router).
- **Styling**: Tailwind CSS v4 with custom Shibra CSS variables in `globals.css`.
- **Data Fetching**: SWR for client-side data fetching.
- **SEO**: Dynamic metadata generation using Next.js Metadata API.

### 2.4 Mobile App (React Native)
- **Framework**: React Native 0.83 (CLI).
- **State Management**: Redux Toolkit.
- **Authentication**: Firebase Phone Auth (bypasses local DLT SMS issues).
- **Navigation**: React Navigation v6 (Bottom Tabs + Stack).
- **Platform**: iOS & Android (Bundle ID: `com.shibra.app`).

---

## 3. Brand Identity
- **Primary Color**: Electric Blue (`#2563EB`)
- **Accent Color**: Cyan (`#00B4D8`)
- **Dark Shade**: Deep Navy (`#0D1B2A`)
- **Domains**: 
  - Storefront: `www.shibrab2b.com`
  - Admin: `admin.shibrab2b.com`
  - API: `api.shibrab2b.com`
- **Business Name**: Shibra Enterprise

## 4. Key Workflows

### Order Flow
1. Buyer adds products to cart (minimum order value constraints apply).
2. Checkout using COD or UPI.
3. Order created in `orders` collection (`status: PENDING`).
4. Admin reviews and approves -> `status: PROCESSING`.
5. Admin packs and ships -> `status: SHIPPED`.
6. Buyer receives -> `status: DELIVERED`.

### Firebase Auth Flow (Mobile)
1. User enters phone number in React Native app.
2. Firebase SDK sends OTP (free tier, robust delivery).
3. User verifies OTP locally. Firebase returns an `idToken`.
4. App sends `idToken` to `/api/v1/auth/firebase-login`.
5. Backend verifies token using `firebase-admin`, creates/updates User in MongoDB.
6. Backend returns standard JWT for subsequent API calls.

## 5. Security & Infrastructure
- **CORS**: Strictly limited to allowed Vercel domains and `*.shibrab2b.com`.
- **Rate Limiting**: `express-rate-limit` prevents brute-forcing of OTP endpoints.
- **Secrets Management**: No `.env` files committed. Keys stored in Vercel/Render environments.
- **Data Model**: `User`, `Product`, `Order`, `Category`, `Cart`, `Config`.

## 6. Deployment Strategy (Proposed)
- **Backend**: Render / AWS EC2 / Railway.
- **Database**: MongoDB Atlas.
- **Admin & Storefront**: Vercel (Auto-deployed from Git).
- **Mobile Apps**: App Store (TestFlight) & Google Play Console (Internal Testing).
