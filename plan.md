# Anti-Tweet Implementation Plan

## Tech Stack
- Frontend & Backend: Next.js (App Router), React, Vanilla CSS for styling (per aesthetics requirements), TypeScript.
- Database: SQLite with Prisma ORM.
- Authentication: Secure JWT stored in HTTP-only cookies.
- Media Storage: Local disk (public/uploads) or ephemeral API memory (due to 100mb limitation, formidable/multer alternative on Next API routes).

## Phase 1: Foundation & Setup
1. Initialize Next.js project with App Router, TypeScript, ESLint, no Tailwind, Vanilla CSS.
2. Setup Prisma & SQLite.
3. Create global layout & CSS resets with a modern, dynamic UI (glassmorphism, vibrant accents, dark mode default).
4. Implement basic User Authentication (Sign Up/Login).

## Phase 2: Database Schema (Prisma)
- **User**: id, email, phone, passwordHash, subscription (FREE, BRONZE, SILVER, GOLD), lastPasswordResetAt, language (default EN), notificationPref, createdAt, etc.
- **Tweet**: id, userId, content, audioUrl, createdAt.
- **LoginSession**: id, userId, browserType, os, deviceCat, ipAddress, loggedInAt.
- **OTPRequest**: id, userId, code, type (LOGIN, AUDIO, LANGUAGE_FRENCH, LANGUAGE_OTHER), createdAt, expiresAt.

## Phase 3: Login Tracking & Time Verification
- Write middleware or login function parsing `user-agent` (using `ua-parser-js`) to grab browser, OS, and device type.
- Implement environmental login constraints:
  - Mobile user check: verify IST time between 10:00 AM - 1:00 PM.
  - Chrome user: send email OTP, verify before finalizing login.
  - Microsoft Edge: direct login.

## Phase 4: Subscriptions & Payments
- Setup mock Stripe checkout page (or actual API keys if provided, but mock for seamless test).
- Check IST time between 10:00 AM - 11:00 AM for payment API route.
- Allow plan upgrades and send email containing invoice mock.

## Phase 5: Tweeting Rules & Subscriptions limits
- Create Tweet Component API.
- Check user subscription limits:
  - Free: 1 max total
  - Bronze: 3 max total
  - Silver: 5 max total
  - Gold: Unlimited total
- Audio Tweet Feature:
  - Check IST time between 2:00 PM - 7:00 PM.
  - Require OTP to email before showing upload form.
  - Upload API enforcing 100 MB max limit, calculate duration (max 5 mins using `music-metadata` or browser API before upload).

## Phase 6: Timeline & Notifications
- Request `Notification.requestPermission()`.
- Listen for tweets containing "cricket" or "science" and fire `new Notification(...)`.

## Phase 7: Forgot Password
- Implement 1 request per day limit.
- Generate random password (Uppercase + Lowercase, no numbers/specials).
- Send to user.

## Phase 8: Multi-Language
- Add i18n logic using `react-intl` or basic contextual dictionaries.
- English, Spanish, Hindi, Portuguese, Chinese, French.
- Switch to French requires Email OTP. Swich to others requires Mobile OTP.

## Phase 9: UI Polish
- Ensure it looks stunning per strict "Design Aesthetics" requirements.
- Responsive, accessible, CSS variables for theming.
