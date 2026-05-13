# Baki Khata - Digital Ledger & Credit Management

Baki Khata is a professional, hybrid (online/offline) digital ledger application designed for individuals and small business owners to track credit (baki), payments, and financial records with ease. Built with a focus on simplicity, data privacy, and a premium user experience.

<div align="center">

[![Download APK](https://img.shields.io/badge/Download-Latest_APK-2ea44f?style=for-the-badge&logo=android&logoColor=white)](https://github.com/nurulhudda247/Baki-Khata-Mobile-App/releases)

**Version 1.2.0** • **Android Only** • **Offline First** • **Cloud Sync Support**

</div>

### Performance & Optimization
- **SQLite WAL Mode**: Enabled Write-Ahead Logging (WAL) for faster database operations and better concurrency.
- **Database Indexing**: Optimized query performance with strategic indexing on shops, customers, and transaction records.
- **Smart Sync Engine**: Advanced background synchronization using `is_dirty` flags and conflict resolution to keep local and cloud data consistent.
- **Component Memoization**: Implemented `useMemo` and `useCallback` across heavy components to minimize unnecessary re-renders.
- **FlatList Optimization**: Configured efficient rendering parameters (`initialNumToRender`, `windowSize`, etc.) for smooth scrolling in long lists.
- **Hybrid Data Management**: High-speed local database operations combined with background cloud synchronization for a seamless experience.

### Technical Stack
- **TypeScript First**: Fully migrated codebase to TypeScript for robust type safety and improved maintainability.
- **Expo SDK 52**: Upgraded to the latest stable Expo environment for enhanced native capabilities.
- **Centralized Toast System**: Custom Toast context for consistent and non-intrusive user notifications.
- **Firebase Integration**: Robust authentication and manual/automatic cloud data synchronization for registered users.

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
- **Guest Mode**: Full access to app features without registration; data stays local to the device.
- **One-Tap Migration**: Seamlessly transfer all guest data to a permanent cloud account upon sign-up.
- **Firebase Sync**: Securely backup and sync your ledger across devices using Firebase Firestore (for registered users).
- **Soft Delete Architecture**: Integrated `is_deleted` logical deletion across all tables to prevent accidental data loss.
- **Cache Management**: Built-in utility to clear temporary files and free up device storage directly from Settings.
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

### Personalization & Accessibility
- **Theme Support**: Full Dark and Light mode integration matching system preferences.
- **Multi-Language**: Native support for **English** and **Bengali (বাংলা)**.
- **Profile Customization**: Personalize your account with custom names and profile photos.
- **Offline First**: 100% functional without internet; all data resides securely on the device.

## Tech Stack

- **Core**: [React Native](https://reactnative.dev/) with [Expo](https://expo.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Backend/Auth**: [Firebase](https://firebase.google.com/)
- **Navigation**: [Expo Router](https://docs.expo.dev/router/introduction/) (File-based routing)
- **Database**: [Expo SQLite](https://docs.expo.dev/versions/latest/sdk/sqlite/) (with WAL mode & Indexing)
- **Animations**: [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/)
- **Styling**: [React Native StyleSheet](https://reactnative.dev/docs/stylesheet) with Dynamic Theme & scaling context
- **Localization**: [i18next](https://www.i18next.com/) & [react-i18next](https://react.i18next.com/)

## Getting Started

1. **Clone**: `git clone https://github.com/nurulhudda247/Baki-Khata-Mobile-App.git`
2. **Install**: `npm install`
3. **Start**: `npx expo start`
4. **Build (Local Android)**: `npx expo run:android`

---

## License

This project is licensed under the **GNU General Public License v3.0** - see the [LICENSE](LICENSE) file for details.

Developed and maintained by **Nurul Hudda**.
- **Telegram**: [@nurulhudda247](https://t.me/nurulhudda247)
