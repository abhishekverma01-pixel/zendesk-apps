# 🚀 Zendesk Views, Filters & Duplicate Ticket Merge App

[![Zendesk Apps Framework](https://img.shields.io/badge/Zendesk_Apps_Framework-v2.0-03363d.svg?style=for-the-badge&logo=zendesk)](https://developer.zendesk.com/api-reference/apps/apps-support-api/introduction/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E.svg?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/UI-Zendesk_Garden_Design-1f73b7.svg?style=for-the-badge)](https://garden.zendesk.com/)
[![License](https://img.shields.io/badge/License-Private_Client_Project-blue.svg?style=for-the-badge)]()

A production-grade **Zendesk Support Navigation App (ZAF v2)** engineered to solve the most common bottlenecks support teams face in daily ticket operations:
1. **Instant Ticket Hover Previews**: Read initial problem descriptions without opening dozens of browser tabs.
2. **9-Field Real-Time Filtering**: Advanced filter drawer allowing agents to slice any view by subject, multi-tags, status, priority, channel, ticket type, requester, assignee, and calendar date presets (e.g. *Last 30 Days*, *In 2026*).
3. **Automated Duplicate Detection & Native Merge Dialog**: Automatically scans open queues for customers with multiple open tickets, provides ticket selection checkboxes, dynamic `Merge` action, and a full Zendesk-style Search & Merge modal (supporting search by **ticket ID, requester email, or customer name** with an ignorable customer mismatch alert).

---

## 📸 Key Features & Capabilities

### 1. View Navigation & Fast Hover Preview
- Displays all standard **Shared Views** and individual **Personal Views** in an interactive collapsible sidebar.
- **Hover Popover Card:** Moving mouse over any ticket subject displays:
  - Ticket ID, Status badge, and Channel.
  - Customer name, email, and created timestamp.
  - Cleanly formatted customer problem description (60–70 words) for 5-second triage.

### 2. 9-Field Live Filter Drawer (⚡ Filter)
- **Subject / Description Search:** Real-time text match against ticket subjects and opening descriptions.
- **Multi-Tag Chips:** Search, add, and remove multiple tags simultaneously with chip pills.
- **Status & Priority:** Quickly isolate New, Open, Pending, Urgent, or High tickets.
- **Channel & Type:** Filter by Email, Web, Chat, Voice, SMS, API, Social, Help Center.
- **Assignee:** 1-click filter for **Assigned to Me** vs **Unassigned**.
- **Calendar Date Presets:** 1-click **Last 30 Days**, **In 2026**, or custom date range.

### 3. Duplicate Tickets Queue & Native Merge Workflow
- Real-time aggregation of customers with multiple unresolved tickets.
- **Selection Checkboxes:** Individual checkboxes per ticket + **Select all** convenience toggle.
- **Dynamic Action Button:** Triggers `⚡ Merge (X)` once tickets are selected.
- **Zendesk-Style Search & Merge Dialog:**
  - **Live Search:** Search candidate tickets by **Ticket ID, Requester Email, Requester Name, or Subject**.
  - **Cross-Zendesk Search:** One-click live lookup across all tickets in the Zendesk account.
  - **Ignorable Warning Alert:** Displays `⚠️ These tickets don't belong to the same customer` when tickets have different requesters/orgs, while keeping the merge action completely unblocked and ignorable.
  - **Comment Customization:** Pre-fills target and closing comments with public/internal visibility toggle.
  - **Direct REST API Execution:** Calls `POST /api/v2/tickets/{target_id}/merge.json` directly through the ZAF SDK and auto-refreshes the duplicate queue.

---

## 📂 Project Architecture

```
zendesk-view-descriptions-app/
├── manifest.json              # ZAF v2 manifest (nav_bar location, permissions, sizing)
├── package.json               # Project metadata & build scripts
├── build-zip.py               # Automated packaging script for Zendesk Admin Center
├── translations/
│   └── en.json                # English strings and app metadata
├── assets/
│   ├── iframe.html            # App layout, filter drawer, duplicate queue & merge modal
│   ├── style.css              # Custom Zendesk Garden design system (clean, responsive)
│   ├── main.js                # Core logic (ZAF SDK, REST API requests, state management, search)
│   ├── logo.png               # 128x128 app icon
│   ├── logo-small.png         # 32x32 app icon
│   ├── icon_nav_bar.svg       # Left nav bar SVG icon
│   └── icon_top_bar.svg       # Top bar SVG icon
├── dist/
│   └── zendesk-view-descriptions-app.zip  # Production installable zip package
├── CLIENT_APP_OVERVIEW.md     # Agent user guide & cheatsheet
└── Zendesk_App_Overview_For_Client.docx # Client-ready documentation
```

---

## 🛠️ Installation Guide (Zendesk Admin Center)

1. Download or locate the pre-built zip package:
   ```
   dist/zendesk-view-descriptions-app.zip
   ```
2. Log in to your Zendesk account as an **Administrator**.
3. Go to **Admin Center**:
   ```
   https://YOUR_SUBDOMAIN.zendesk.com/admin
   ```
4. In the left navigation, navigate to:
   **Apps and integrations** ➔ **Apps** ➔ **Zendesk Support apps**
5. Click **Upload private app** (top-right corner).
6. Fill in the modal:
   - **App Name:** `Views Filter & Duplicates`
   - **App Package:** Select `zendesk-view-descriptions-app.zip`
7. Click **Upload** and complete the installation.
8. Refresh Zendesk: the app icon (📊) will appear on the far-left navigation bar!

---

## 🧪 Local Testing & Development

You can preview the interface directly in any web browser without needing a live Zendesk instance:
```bash
# Preview directly in browser
open assets/iframe.html
```
The app includes intelligent fallback handling: when loaded outside the ZAF iframe container, it runs in **Preview Mode** with simulated views, tickets, search, and merge workflows.

---

## 👨‍💻 Built by
Developed for production support operations teams seeking enhanced Zendesk view management and ticket consolidation workflows.
