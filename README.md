# Baki Khata - Digital Ledger & Credit Management

Baki Khata is a professional, hybrid (online/offline) digital ledger application designed for individuals and small business owners to track credit (baki), payments, and financial records with ease. Built with a focus on simplicity, data privacy, and a premium user experience.

<div align="center">

[![Download APK](https://img.shields.io/badge/Download-Latest_APK-2ea44f?style=for-the-badge&logo=android&logoColor=white)](https://github.com/nurulhudda247/Baki-Khata-Mobile-App/releases)

**Version 1.3.0** • **Android Only** • **Offline First** • **Cloud Sync Support**

</div>

### Performance & Optimization
- **SQLite WAL Mode**: Enabled Write-Ahead Logging (WAL) for faster database operations and better concurrency.
- **Database Indexing**: Optimized query performance with strategic indexing on shops, customers, and transaction records.
- **Smart Sync Engine**: Advanced background synchronization using `is_dirty` flags and conflict resolution to keep local and cloud data consistent.
- **Component Memoization**: Implemented `useMemo` and `useCallback` across heavy components to minimize unnecessary re-renders.
- **FlatList Optimization**: Configured efficient rendering parameters (`initialNumToRender`, `windowSize`, etc.) for smooth scrolling in long lists.
- **Hybrid Data Management**: High-speed local database operations combined with background cloud synchronization for a seamless experience.


### UI/UX Refinements
- **Custom Font Scaling**: Proprietary `sfs()` utility for consistent typography across different device screen densities.
- **Dynamic Theming**: Sophisticated dark/light mode system with premium color palettes and glassmorphism elements.
- **BST Enforcement**: Automated timezone handling ensuring all records strictly follow **Bangladesh Standard Time (UTC+6)**.
- **Swipe-to-Dismiss Notifications**: Interactive gesture-driven toast notification system for a more native feel.
- **Dual-Action Gestures**: Enhanced shop list interactions with vertical stacked actions for Call and WhatsApp.
- **Font Size Customization**: Dynamic scaling support for Small, Normal, and Large typography to improve accessibility.
- **Consolidated Account Management**: Refined Settings architecture with a central hub for Cloud Sync, Profile edits, and Account Deletion.
- **Premium Modals**: Unified and beautifully designed confirmation and input modals for a high-end feel.
- **Guided Tour**: Fully interactive tutorial system for onboarding and re-training users.

### Authentication & Data Safety
- **Guest Mode Evolution**: Enhanced guest experience with a clear path to registration. Guest accounts are now limited to 5 customers, 10 products, and 1 shop to prioritize performance and encourage cloud synchronization.
- **Multi-Profile Identity Lock**: New security layer for guest users that locks the application to their first profile choice (Personal or Business), ensuring a consistent and simplified experience while preventing data fragmentation.
- **One-Tap Migration**: Seamlessly transfer all guest data to a permanent cloud account upon sign-up.
- **Firebase Sync**: Securely backup and sync your ledger across devices using Firebase Firestore (for registered users).
- **Soft Delete Architecture**: Integrated `is_deleted` logical deletion across all tables to prevent accidental data loss.
- **Secure Account Deletion**: Full control with permanent account removal, featuring Google Re-authentication for enhanced security.

### Transaction & Credit Tracking
- **Smart Entry Flow**: Interactive quantity controls with +/- buttons for fast purchase recording.
- **One-Tap Payments**: Intelligent preset payment amounts (৳50, ৳100, ৳200, ৳500) for rapid reconciliation.
- **Audit Trails**: Detailed `edit_history` tracking for both purchase and payment records to ensure financial transparency.
- **Real-time Balance**: Instantly view total due balances on the dashboard and shop detail views.
- **Granular History**: Detailed logs of purchases (Product, Qty, Unit, Price) and payments (Amount, Note).

### Digital Shop Management
- **Multi-Shop Ledger**: Create and manage financial records for multiple shops or business entities separately.
- **Enhanced Communication**: Quick access to shopkeepers via Call and WhatsApp directly from the list view.
- **Robust Deletion Logic**: Safe shop removal system that ensures data integrity while allowing flexible management.
- **Detailed Profiles**: Save shop details including name, address, and phone number with profile photo support.
- **Automated Settlement**: Intelligent logic that tracks partial payments and automatically marks transactions as "PAID" as balances clear.
- **Daily Auditing**: Automated grouping of transactions by date with daily totals for easy reconciliation.

### Core Features & Business Logic

- **Multi-Role Architecture**: Intelligent dual-profile system allowing users to switch between **Personal Ledger** (tracking personal debts) and **Business Manager** (managing shop operations) within a single app.
- **Communication Integration**: Direct 1-tap integration with **Call** and **WhatsApp**. Features language-aware payment reminders that automatically include due amounts and oldest bill dates.
- **Smart Settlement Logic**: Advanced transaction engine that tracks partial payments and automatically marks records as **"PAID"** once the balance is cleared, maintaining perfect financial integrity.
- **Guest Experience & Conversion**: Strategic usage limits for guest users (max 5 customers, 10 products, 1 shop) to prioritize local performance while providing a clear upgrade path to cloud-synced accounts.
- **Identity Security**: Guest profile locking mechanism that prevents data fragmentation by binding guest sessions to their initial profile choice (Personal or Business).
- **Bangladesh Standard Time (BST)**: Strict enforcement of **UTC+6** across the entire application, ensuring transaction timestamps remain accurate regardless of device settings or global location.
- **Audit Trails**: Built-in transparency with `edit_history` tracking, allowing users to see when a transaction or payment was modified after its initial entry.
- **Dynamic UX Engine**: A premium interface featuring a custom-built font scaling system (`sfs`), glassmorphism UI elements, and a sophisticated dark/light mode engine.

## ✨ Key Highlights

- **Hybrid Persistence**: High-performance local SQLite storage with seamless Firebase cloud synchronization.
- **Multi-Tenant Ready**: Switch between Personal and Business profiles with zero data leakage.
- **Localized UX**: Fully translated in English and Bengali with dynamic RTL-friendly layouts.
- **Performance Driven**: Optimized with SQLite WAL mode and heavy memoization for a lag-free experience.

## 📂 Project Structure

```text
├── app/                  # Expo Router file-based navigation
│   ├── (auth)/           # Authentication flows (Login, Signup)
│   ├── (shopkeeper)/     # Business management dashboard
│   ├── customer/         # Detailed credit tracking & history
│   ├── product/          # Inventory & pricing management
│   └── ...
├── components/           # Atomic UI Design System
├── context/              # Global state (Auth, Theme, Localization)
├── database/             # SQLite architecture & query engine
├── assets/               # Media, Fonts, and Brand assets
├── utils/                # Business logic & timezone (BST) helpers
└── constants/            # Design tokens & app configurations
```

## 🛠️ Tech Stack

- **Framework**: [React Native](https://reactnative.dev/) + [Expo SDK 52](https://expo.dev/)
- **State/Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/)
- **Database**: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (WAL Mode)
- **Realtime/Cloud**: [Firebase](https://firebase.google.com/) (Auth & Firestore)
- **Styling**: Theme-aware [StyleSheet](https://reactnative.dev/docs/stylesheet) with `sfs` scaling.

## 🗺️ Roadmap

- [ ] **Automated Reminders**: Push & SMS notifications for due dates.
- [ ] **Data Portability**: Export accounts to PDF, Excel, and CSV.
- [ ] **Interactive Analytics**: Visual charts for revenue and debt trends.

## 🚀 Getting Started

1. **Clone**: `git clone https://github.com/nurulhudda247/Baki-Khata-Mobile-App.git`
2. **Install**: `npm install`
3. **Environment**: Setup `.env` with Firebase credentials.
4. **Run**: `npx expo start`

---

## ⚖️ License

Distributed under the **GNU General Public License v3.0**. See `LICENSE` for more information.

Developed with ❤️ by **Nurul Hudda**.
- **Telegram**: [@nurulhudda247](https://t.me/nurulhudda247)
