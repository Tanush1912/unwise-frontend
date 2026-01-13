# Unwise - Premium Expense Splitting

**Unwise** is a high-performance, mobile-first Progressive Web App (PWA) designed to replace legacy expense splitters with a premium, neobrutalist aesthetic and cutting-edge tech.

## Overview

A modern expense splitting application built with Next.js 15, featuring a bold neobrutalist design system. Unwise enables users to split bills, track debts, and manage group expenses with real-time synchronization. The app includes AI-powered receipt scanning, advanced group management with placeholder members, and comprehensive friend debt tracking. Built with TypeScript, Tailwind CSS 4, TanStack Query, and Framer Motion for smooth animations.

## Features

- **Mobile-First Neobrutalism**: Striking high-contrast UI with large touch targets and smooth Framer Motion animations.
- **AI Receipt Scanning**: Upload receipts and extract items automatically using a Zustand-powered workflow.
- **Advanced Group Management**: Create groups, manage members (including virtual/placeholder members), and track group-specific balances.
- **Friend Management**: Track individual debts and settle up with friends outside of groups.
- **Dynamic Splitting**: Support for Equal, Exact Amount, Percentage, and Itemized (receipt-based) splitting.
- **Real-time Synchronization**: Powered by TanStack Query for optimistic updates and seamless data fetching.
- **PWA Ready**: Installable on iOS and Android with standalone display mode.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) (Modern CSS-first approach)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) (Client-side UI state) & [TanStack Query v5](https://tanstack.com/query/latest) (Server state)
- **Backend API**: Go (Gin) / Supabase Auth & Database
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/) & [Tabler Icons](https://tabler-icons.io/)

## Project Structure

```
unwise-frontend/
├── app/
│   ├── (auth)/             # Login and Password Reset flows
│   ├── expenses/           # Add, Edit, and View specific expenses
│   ├── friends/            # Friend listing and debt tracking
│   ├── groups/             # Group management and group-specific timelines
│   ├── profile/            # User account settings and avatar management
│   ├── layout.tsx          # Root layout with Auth & Query providers
│   └── page.tsx            # Main Dashboard (Metrics & Recent Activity)
├── components/
│   ├── ui/                 # Atomic neobrutalist UI components
│   ├── add-expense-flow.tsx # Multi-step expense creation workflow
│   ├── groups-view.tsx     # Tree-style group list with balances
│   ├── dashboard.tsx       # Core metrics and activity feed
│   └── bottom-nav.tsx      # Floating Dock navigation
├── hooks/
│   ├── use-groups.ts       # Group & Transaction logic via React Query
│   └── use-friends.ts      # Friend management queries/mutations
├── lib/
│   ├── auth-fetch.ts       # Authenticated API wrapper
│   └── server-api.ts       # Backend proxy logic
└── store/
    └── expense-store.ts    # Zustand store for the multi-step expense flow
```

## Key Pages & Functionality

### 1. Dashboard (`/`)
The command center. Shows your net balance, total owed, and total you owe. Features a "Recent Activity" feed for quick updates.

### 2. Groups (`/groups`)
A neobrutalist tree-style view of your groups. Shows member-specific balances at a glance and allows deep-diving into group expenses and debt settlement.

### 3. Add Expense (`/expenses/add`)
A comprehensive flow that supports:
- **Manual Entry**: Quick description and amount.
- **AI Scan**: Upload a receipt to automatically populate itemized splits.
- **Advanced Splitting**: Choose specific payers and split methods (Equal, %, etc.).

### 4. Friends (`/friends`)
Manage direct relationships. View who you owe or who owes you outside of a group context.

### 5. Profile (`/profile`)
Manage your identity. Update your avatar, view account details, and handle security (password resets).

## Environment Variables

Create a `.env.local` file in the root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_BACKEND_URL=your_go_backend_api_url
```

##  Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Run Dev Server**:
   ```bash
   npm run dev
   ```

3. **Build & Start**:
   ```bash
   npm run build
   npm run start
   ```

## PWA Support
To ensure a native feel, the app is configured with a custom viewport manifest. When adding to the home screen on iOS/Android, it will hide browser chrome and utilize `safe-area-inset` for a seamless experience.

## License

**Copyright (c) 2024 Tanush Govind**

All rights reserved.

This project, including all source code, design elements, styling, and documentation, is proprietary and confidential.

**You may NOT:**
- Use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of this software
- Use the design, styling, or UI components for commercial or personal projects
- Remove or alter any copyright notices

**You MAY:**
- View the source code for educational purposes
- Reference this project in your portfolio with proper attribution
- Fork this repository for personal learning (not for redistribution)

**Attribution Required:**
If you reference, derive inspiration from, or use any portion of this codebase in any form (including but not limited to code, design patterns, UI components, or styling), you must:

1. Provide clear and visible attribution to the original author
2. Include a link to this repository
3. State that your work is "inspired by" or "based on" this project

**Commercial Use:**
Commercial use of any part of this codebase is strictly prohibited without explicit written permission from the copyright holder.

For licensing inquiries, please contact [tanush1912@gmail.com]

---

**Note:** This license applies to the entire codebase, including but not limited to:
- All source code files
- UI/UX design and styling
- Component architecture and patterns
- Documentation and README files

See [LICENSE](./LICENSE) file for full terms and conditions.