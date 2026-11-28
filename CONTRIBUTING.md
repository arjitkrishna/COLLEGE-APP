# 🤝 Team Collaboration & Git Branching Guide

Welcome to the **IIIT NR Workspace** development team! This guide explains our Git branching strategy, how tasks are divided across branches, and how to collaborate smoothly without merge conflicts.

---

## 🌿 Branching Strategy Overview

We follow a modular **Git Flow** model designed for parallel, independent development:

```text
  main (production-ready stable code)
    ▲
    │ (Pull Requests / Releases)
    │
  develop (active team integration branch)
    ▲
    ├─► feature/profile-verification   (Student profiles, coding stats & verification)
    ├─► feature/channels-messaging     (Discord channels, DMs & real-time chat)
    ├─► feature/attendance-calculator  (Attendance tracker & safe bunk calculator)
    ├─► feature/timetable-schedule     (Academic timetable, schedule & class alerts)
    ├─► feature/auth-onboarding        (Google OAuth, @iiitnr login & branch selection)
    └─► feature/ui-dashboard           (Home screen widgets, navigation & theme)
```

---

## 👥 Feature Branch Breakdown

Each branch corresponds to an isolated module so team members can work simultaneously:

### 1. `feature/profile-verification`
* **Focus**: Student profile screen, competitive programming & gaming stats, anti-fake verification.
* **Key Files**:
  * `src/screens/profile/ProfileScreen.js`
  * `src/screens/profile/EditProfileScreen.js`
  * `src/components/profile/PlatformCard.js`
  * `src/components/profile/AddPlatformModal.js`
  * `src/components/profile/BioSection.js`
  * `src/lib/platforms.js`
  * `src/hooks/useProfile.js`
* **Responsibilities**:
  * LeetCode, Codeforces, CodeChef, Chess.com, and GitHub stat scrapers and APIs.
  * Bio verification token generator (`IIITNR-XXXX`) and email matching.
  * Student badges (`🛡️ Verified`, `⚠️ Unverified`).

---

### 2. `feature/channels-messaging`
* **Focus**: Discord-like real-time channels, student direct messages (DMs), and code sharing.
* **Key Files**:
  * `src/screens/channels/ChannelListScreen.js`
  * `src/screens/channels/ChatScreen.js`
  * `src/screens/channels/NewMessageScreen.js`
  * `src/screens/channels/CreateChannelScreen.js`
  * `src/screens/channels/ManageCreatorsScreen.js`
  * `src/components/ChannelItem.js`
  * `src/components/MessageBubble.js`
  * `src/lib/chat.js`
  * `src/data/channelsData.js`
* **Responsibilities**:
  * Real-time WebSocket messaging with Supabase + offline caching.
  * Campus channels (`#general`, `#announcements`, `#events`, `#memes`).
  * Branch channels (`#branch-general`, `#academics`, `#resources`).
  * Peer DMs, search students, code snippet formatting, and question tags.

---

### 3. `feature/attendance-calculator`
* **Focus**: Attendance tracking, bunk & attend calculations, and subject management.
* **Key Files**:
  * `src/screens/attendance/AttendanceScreen.js`
  * `src/components/AttendanceCard.js`
  * `src/data/subjectsData.js`
  * `src/context/AppContext.js`
* **Responsibilities**:
  * Attendance percentage calculations and color-coded 75% threshold alerts.
  * Safe bunk calculator ("You can safely miss X more classes").
  * Catch-up calculator ("You need to attend Y consecutive classes to reach 75%").
  * Adding, editing, and managing custom courses.

---

### 4. `feature/timetable-schedule`
* **Focus**: Weekly & daily class timetable, room numbers, faculty info, and lecture timers.
* **Key Files**:
  * `src/screens/timetable/TimetableScreen.js`
  * `src/data/timetableData.js`
* **Responsibilities**:
  * Monday through Friday schedule for CSE, DSAI, and ECE.
  * Lecture time slots, classroom locations (`LT-1`, `CC-3`, `ECE Lab 2`).
  * Live status indicator ("Ongoing Class", "Starting in 15 mins", "Day Complete").

---

### 5. `feature/auth-onboarding`
* **Focus**: College Google sign-in, branch selection, demo access, and auth state.
* **Key Files**:
  * `src/screens/LoginScreen.js`
  * `src/screens/auth/BranchSelectScreen.js`
  * `src/auth/AuthContext.js`
  * `src/auth/AuthBridge.js`
  * `src/navigation/AuthNavigator.js`
* **Responsibilities**:
  * Google OAuth with strict `@iiitnr.edu.in` domain validation.
  * 1-tap "Explore Demo Workspace" fallback.
  * Branch onboarding selection (CSE, DSAI, ECE).
  * Secure credential and session persistence with `expo-secure-store`.

---

### 6. `feature/ui-dashboard`
* **Focus**: Home screen dashboard, dark theme palette, navigation tabs, and shared design components.
* **Key Files**:
  * `src/screens/home/HomeScreen.js`
  * `src/navigation/MainTabNavigator.js`
  * `src/navigation/AppNavigator.js`
  * `src/theme/colors.js`
  * `src/components/BranchBadge.js`
  * `src/components/UserAvatar.js`
  * `src/components/Header.js`
* **Responsibilities**:
  * Quick stat widgets on Home screen (Today's Classes, Attendance %, Messages).
  * Dynamic branch color palettes (`#6C5CE7` for CSE, `#00B894` for DSAI, `#FD79A8` for ECE).
  * Tab navigation icons, badges, and layout animations.

---

## 🚀 How to Work in Your Branch

### Step 1: Clone or Pull the Latest Code
```bash
git pull origin main
```

### Step 2: Switch to Your Assigned Feature Branch
Check out the branch you want to work on:
```bash
# Example: If you are working on Profile & Coding Stats:
git checkout feature/profile-verification

# Example: If you are working on Channels & Chat:
git checkout feature/channels-messaging
```

### Step 3: Pull Any Recent Updates on That Branch
```bash
git pull origin <your-feature-branch>
```

### Step 4: Make Your Changes and Commit
```bash
git add .
git commit -m "feat(profile): add Chess.com bullet rating chart"
```

### Step 5: Push to GitHub
```bash
git push origin <your-feature-branch>
```

---

## 🔀 Merging Workflow & Pull Requests

1. **Keep your branch updated with `develop`**:
   Before submitting a Pull Request, merge the latest changes from `develop`:
   ```bash
   git checkout <your-feature-branch>
   git pull origin develop
   # Resolve any conflicts if they occur, then:
   git push origin <your-feature-branch>
   ```

2. **Open a Pull Request (PR)** on GitHub:
   * Target branch: **`develop`** (NOT `main` directly).
   * Have at least one teammate review your code.
   * Once approved, merge into `develop`.

3. **Releasing to `main`**:
   * Once features in `develop` are tested and stable, a PR is merged from `develop` into `main`.

---

## 🛡️ Best Practices to Avoid Conflicts
1. **Never edit files outside your feature scope** without notifying your teammate who owns that module.
2. **Commit often with descriptive messages**: Use conventional commit prefixes like `feat:`, `fix:`, `style:`, `refactor:`, `docs:`.
3. **Test the bundle before pushing**:
   Run:
   ```bash
   npx expo start -c
   ```
   Ensure there are no compile or lint errors before opening a PR!
