# 🎓 IIIT NR Workspace

> An all-in-one mobile campus ecosystem and academic workspace designed specifically for students of **Dr. SPM International Institute of Information Technology, Naya Raipur (IIIT NR)**.

[![React Native](https://img.shields.io/badge/React%20Native-0.76-61DAFB?logo=react&logoColor=black)](https://reactnative.dev/)
[![Expo SDK 52](https://img.shields.io/badge/Expo-SDK%2052-000020?logo=expo&logoColor=white)](https://expo.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend%20%26%20Realtime-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com/)
[![IIIT Naya Raipur](https://img.shields.io/badge/IIIT%20NR-Campus%20App-6C5CE7)](https://www.iiitnr.ac.in/)

---

## 📱 Overview

**IIIT NR Workspace** streamlines day-to-day campus life into a unified, Discord-inspired mobile interface. It combines class timetables, attendance tracking, branch-specific collaborative channels, peer messaging, and competitive programming showcases into a single, cohesive experience.

Built with **Expo SDK 52** and **Hermes**, the app supports dark mode natively, features resilient offline-first caching via `AsyncStorage`, and synchronizes in real time using **Supabase**.

---

## ✨ Key Features

### 1. 🏛️ Department-Specific Workspaces
* Customized environments with distinctive department accent colors:
  * **CSE (Computer Science & Engineering)** — Royal Purple (`#6C5CE7`)
  * **DSAI (Data Science & AI)** — Mint Emerald (`#00B894`)
  * **ECE (Electronics & Communication)** — Vibrant Rose (`#FD79A8`)
* Dynamic switching between departments automatically adapts schedules, course lists, and discussion forums.

### 2. 📅 Smart Academic Timetable
* Real-time view of daily classes with classroom venues (e.g. `LT-1`, `CC-3`, `ECE Lab 2`), professor names, and exact lecture hours.
* Day-by-day selector (Monday through Friday) with instant highlights for upcoming and active lectures.

### 3. 📊 Attendance Tracker & Safe Bunk Calculator
* Subject-wise attendance percentages with color-coded warning indicators for the mandatory **75% minimum threshold**.
* **Bunk / Attend Calculator**: Calculates exactly how many upcoming lectures a student can safely miss, or how many consecutive classes must be attended to regain eligibility.

### 4. 💬 Discord-like Campus Channels & Peer DMs
* **Public & Branch Channels**:
  * Campus-wide: `#general`, `#announcements`, `#events`, `#memes`
  * Academic: `#branch-general`, `#academics`, `#assignments`, `#resources`
* **Real-time Peer Direct Messages (DMs)**: Search any batchmate and chat one-on-one.
* **Developer-Friendly Tools**: 1-tap insertion of code snippet templates (C++/Python) and doubt/resource inquiry tags (`📌 [Resource/Doubt]`).
* **Offline-First Resilience**: Messages and channels fallback seamlessly to local storage when offline or before database tables are created.

### 5. 🛡️ Verified Student Profiles & Coding Stats
Showcase verified competitive programming and gaming achievements without fake handles:
* 🟡 **LeetCode**: Problems solved by difficulty (Easy / Medium / Hard), contest rating, global ranking, badges, and active streak.
* 🔵 **Codeforces**: Current and max rating, color-coded division ranks (*Specialist*, *Expert*, *Candidate Master*, *Master*), and contest count.
* 🟤 **CodeChef**: Star rating (1★ to 7★), global rank, and country rank.
* ♟️ **Chess.com**: Rapid, Blitz, and Bullet ELO ratings with win/loss records.
* 🐙 **GitHub**: Public repositories, stars, and language stats.

> #### 🔒 Anti-Fake Ownership Verification:
> To ensure students only link accounts they personally own, the app generates a temporary `IIITNR-XXXX` token to be placed in the platform's public bio/about, and validates matching personal or `@iiitnr.edu.in` college emails before conferring the **`🛡️ Verified`** badge.

### 6. 🔐 Campus Authentication
* **Google OAuth 2.0**: Restricted strictly to official `@iiitnr.edu.in` college email addresses.
* **Demo Workspace Mode**: Instant 1-tap exploratory access for testing without an active institutional login.

---

## 🛠️ Tech Stack

| Component | Technology |
|---|---|
| **Framework** | [React Native](https://reactnative.dev/) with [Expo SDK 52](https://expo.dev/) |
| **JS Engine** | [Hermes Engine](https://hermesengine.dev/) |
| **Navigation** | [React Navigation 6](https://reactnavigation.org/) (Bottom Tabs + Stack) |
| **Database & Realtime** | [Supabase](https://supabase.com/) (PostgreSQL + Realtime WebSockets) |
| **Local Storage** | [@react-native-async-storage/async-storage](https://github.com/react-native-async-storage/async-storage) |
| **Authentication** | [expo-auth-session](https://docs.expo.dev/versions/latest/sdk/auth-session/) + Google Identity Services |
| **Icons & UI** | [@expo/vector-icons](https://icons.expo.fyi/) (Material Community Icons) + [expo-linear-gradient](https://docs.expo.dev/versions/latest/sdk/linear-gradient/) |

---

## 📂 Project Directory Structure

```text
iiit-nr-workspace/
├── index.js                     # Root Expo entry point (registerRootComponent)
├── App.js                       # Top-level application component with providers
├── app.json                     # Expo configuration and metadata
├── package.json                 # Dependencies and build scripts
├── supabase_schema.sql          # Complete Supabase database schema & policies
│
├── assets/                      # Icons, splash screens, and image assets
│
└── src/
    ├── auth/                    # AuthContext and Google OAuth handler
    ├── context/                 # AppContext (branch state, attendance store)
    ├── data/                    # Static timetable, subjects, and seed channel data
    │   ├── timetableData.js
    │   ├── subjectsData.js
    │   └── channelsData.js
    ├── hooks/
    │   └── useProfile.js        # Profile state & dual-layer sync hook
    ├── lib/
    │   ├── supabase.js          # Supabase client initialization
    │   ├── chat.js              # Realtime thread messaging & offline fallback
    │   └── platforms.js         # API scrapers & bio ownership verification
    ├── navigation/              # AppNavigator, MainTabNavigator, AuthNavigator
    ├── screens/
    │   ├── LoginScreen.js       # Campus Google sign-in & demo workspace
    │   ├── home/                # HomeScreen dashboard & shortcuts
    │   ├── timetable/           # Daily & weekly academic timetable
    │   ├── attendance/          # Attendance tracker & bunk calculator
    │   ├── channels/            # Discord channel list, chat, DMs, create channel
    │   └── profile/             # ProfileScreen & EditProfileScreen
    ├── components/              # Shared UI cards, badges, and avatars
    │   └── profile/             # PlatformCard, BioSection, AddPlatformModal
    └── theme/
        └── colors.js            # Dark theme palette & branch color definitions
```

---

## 🚀 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
* [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
* Either:
  * **Expo Go App** installed on your Android/iOS phone from the Play Store or App Store, **OR**
  * An Android Emulator / Custom Development Build APK.

### 1. Installation

Clone this repository and install dependencies:

```bash
cd "iiit-nr-workspace"
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the project root (or verify your existing one):

```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=your-google-android-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=placeholder
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
```

### 3. Run the Development Server

#### Option A: Using the official **Expo Go** mobile app
```bash
npx expo start --go --tunnel -c
```
1. Open the **Expo Go** app on your phone.
2. Scan the terminal's QR code.

#### Option B: Using a **Custom Dev Client** APK
```bash
npx expo start --dev-client --tunnel -c
```

#### Option C: In the Browser (Web Mode)
```bash
npx expo start --web
```

> [!TIP]
> The `-c` flag clears Metro's bundler cache to ensure clean updates without leftover bundle artifacts.

---

## 🗄️ Supabase Backend Setup

To enable multi-device sync, real-time message feeds, and peer DMs across devices:

1. Create a free project at [supabase.com](https://supabase.com).
2. Navigate to the **SQL Editor** tab in your Supabase dashboard.
3. Open the [supabase_schema.sql](file:///c:/Users/Arjit/OneDrive/Desktop/my%20app/iiit-nr-workspace/supabase_schema.sql) file included at the root of this project.
4. Copy and paste the SQL script into the editor and click **Run**.
5. Copy your **Project URL** and **Anon Public Key** from *Project Settings → API* into your `.env` file.

> [!NOTE]
> Even if Supabase is offline or not yet configured, the app will run seamlessly in offline-first fallback mode.

---

## 💡 Troubleshooting & FAQ

#### 1. Port 8081 is already in use
If an orphaned Node process is holding onto port 8081, release it in PowerShell:
```powershell
Stop-Process -Name node -Force -ErrorAction SilentlyContinue
```

#### 2. `"App entry not found"` error on phone
Make sure [package.json](file:///c:/Users/Arjit/OneDrive/Desktop/my%20app/iiit-nr-workspace/package.json) has `"main": "index.js"` and that [index.js](file:///c:/Users/Arjit/OneDrive/Desktop/my%20app/iiit-nr-workspace/index.js) exists at the root with `registerRootComponent(App)`.

#### 3. Tunnel connection times out
If `--tunnel` fails on slow network connections, make sure your mobile device and computer are on the same Wi-Fi network and launch with:
```bash
npx expo start -c
```

---

## 📄 License

This project is created for the students and community of **Dr. SPM IIIT Naya Raipur**. All academic data and trademarks belong to their respective owners.
