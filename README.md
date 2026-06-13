# Anti-Tweet Platform

Anti-Tweet is a modern, responsive, full-stack micro-blogging platform designed with rich aesthetics and premium functionality. Built with Next.js, Prisma, and a robust CSS Grid & Flexbox architecture, it provides a feature-rich "Twitter/X-style" experience optimized for both desktop and mobile devices.

## Features

- **Responsive Layout Shell:** Seamlessly scales from a 3-column desktop view to a mobile-friendly drawer navigation.
- **Dynamic Messaging System:** Real-time direct messaging with optimal split-pane view on desktop and full-screen view on mobile.
- **Rich Media Support:** Supports posting, engaging with, and viewing dynamic multimedia content.
- **Advanced User Profiles:** Complete profile management with login history, following/follower metrics, and mutual follow badges.
- **Comprehensive Notification Center:** Keeps users up to date with interactions and platform alerts.
- **Dark Mode Aesthetic:** Premium glass-morphism UI elements, curated typography, and fluid micro-animations.

## Technology Stack

- **Frontend:** Next.js (App Router), React, Lucide React (Icons), Framer Motion (Animations)
- **Styling:** CSS variables, Grid, Flexbox (Responsive Design)
- **Backend/API:** Next.js Serverless Routes
- **Database:** SQLite / Prisma ORM
- **Authentication:** Custom Auth Implementation (Session based)

## Getting Started

### Prerequisites

Ensure you have Node.js (v18+) and npm (or pnpm/yarn) installed.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Kunal-sabale10/anti-tweet.git
   cd anti-tweet
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up the database:**
   Rename `.env.example` to `.env` (if provided) and configure your variables. Then run:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This application is optimized for deployment on [Vercel](https://vercel.com). Connect your GitHub repository to Vercel and it will automatically configure the build settings for Next.js.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request if you have suggestions or bug fixes.
