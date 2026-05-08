# Baki Khata - Digital Ledger & Credit Management

Baki Khata is a professional, offline-first digital ledger application designed for individuals and small business owners to track credit (baki), payments, and financial records with ease. Built with a focus on simplicity, data privacy, and a premium user experience.

### Performance & Optimization
- **SQLite WAL Mode**: Enabled Write-Ahead Logging (WAL) for faster database operations and better concurrency.
- **Database Indexing**: Optimized query performance with strategic indexing on shops, customers, and transaction records.
- **Component Memoization**: Implemented `useMemo` and `useCallback` across heavy components to minimize unnecessary re-renders.
- **FlatList Optimization**: Configured efficient rendering parameters (`initialNumToRender`, `windowSize`, etc.) for smooth scrolling in long lists.

### Technical Stack
- **TypeScript First**: Fully migrated codebase to TypeScript for robust type safety and improved maintainability.
- **Expo SDK 52**: Upgraded to the latest stable Expo environment for enhanced native capabilities.
- **Centralized Toast System**: Custom Toast context for consistent and non-intrusive user notifications.

### UI/UX Refinements
- **Custom Font Scaling**: Proprietary `sfs()` utility for consistent typography across different device screen densities.
- **BST Enforcement**: Automated timezone handling ensuring all records strictly follow **Bangladesh Standard Time (UTC+6)**.
- **Premium Modals**: Unified and beautifully designed confirmation and input modals for a high-end feel.
- **Guided Tour**: Fully interactive tutorial system for onboarding and re-training users.
- **Refined Search**: High-performance search functionality for products with category-based filtering.

## Key Features

### Digital Shop Management
- **Multi-Shop Ledger**: Create and manage financial records for multiple shops or business entities separately.
- **Robust Deletion Logic**: Safe shop removal system that ensures data integrity while allowing flexible management.
- **Detailed Profiles**: Save shop details including name, address, and phone number with profile photo support.
- **Swipe Actions**: Efficiently manage shop lists with gesture-driven swipe-to-delete functionality.

### Transaction & Credit Tracking
- **Real-time Balance**: Instantly view total due balances on the dashboard and shop detail views.
- **Granular History**: Detailed logs of purchases (Product, Qty, Unit, Price) and payments (Amount, Note).
- **Automated Settlement**: Intelligent logic that tracks partial payments and automatically marks transactions as "PAID" as balances clear.
- **Daily Auditing**: Automated grouping of transactions by date with daily totals for easy reconciliation.

### Personalization & Accessibility
- **Theme Support**: Full Dark and Light mode integration matching system preferences.
- **Multi-Language**: Native support for **English** and **Bengali (বাংলা)**.
- **Cache Management**: Built-in utility to clear temporary files and free up device storage.
- **Offline First**: 100% functional without internet; all data resides securely on the device.

## Tech Stack

- **Core**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Database**: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (with WAL mode & Indexing)
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **Styling**: [React Native StyleSheet](https://reactnative.dev/docs/stylesheet) with Dynamic Theme Context
- **Localization**: [i18next](https://www.i18next.com/) & [react-i18next](https://react.i18next.com/)

## Getting Started

1. **Clone**: `git clone https://github.com/nurulhudda247/Baki-Khata-Mobile-App.git`
2. **Install**: `npm install`
3. **Start**: `npx expo start`
4. **Build (Local Android)**: `npx expo run:android`

---

Developed and maintained by **Nurul Hudda**.
- **Telegram**: [@nurulhudda247](https://t.me/nurulhudda247)
