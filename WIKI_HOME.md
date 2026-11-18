# 📚 Welcome to the Zendesk Apps Suite Wiki

Welcome to the official technical and operational documentation for the **Zendesk Views, Filters & Duplicate Management** application suite. This wiki serves as the central knowledge base for software engineers, Zendesk administrators, operations leads, and interviewers evaluating the system's architecture.

---

## 📑 Wiki Table of Contents

* [1. System Overview & Problem Statement](#1-system-overview--problem-statement)
* [2. High-Level Architecture (ZAF v2)](#2-high-level-architecture-zaf-v2)
* [3. Core Modules & Deep Dive](#3-core-modules--deep-dive)
  * [3.1 Instant Ticket Hover Previews](#31-instant-ticket-hover-previews)
  * [3.2 9-Field Real-Time Filter Drawer](#32-9-field-real-time-filter-drawer)
  * [3.3 Duplicate Tickets Queue & Native Merge Workflow](#33-duplicate-tickets-queue--native-merge-workflow)
* [4. API Integration & Data Flow](#4-api-integration--data-flow)
* [5. Security, Permissions & Scopes](#5-security-permissions--scopes)
* [6. Installation & Deployment Guide](#6-installation--deployment-guide)
* [7. Roadmap & Future Enhancements](#7-roadmap--future-enhancements)

---

## 1. System Overview & Problem Statement

In high-volume customer support operations (handling 10,000+ tickets/month), support teams face severe operational bottlenecks when relying solely on default Zendesk views:

1. **Tab Fatigue & Slow Triage:** Agents must open 20–30 separate browser tabs just to read the customer's initial problem description, consuming significant time and system memory.
2. **Rigid View Filtering:** Native views do not permit real-time calendar date filtering (e.g., "Tickets in 2026" or "Last 30 Days") or combined multi-tag filtering without re-configuring administrator views.
3. **Duplicate Ticket Accumulation:** Customers frequently reach out via multiple touchpoints (Email, Web Widget, Chat, Phone) for the same underlying issue, creating fragmented, duplicate open tickets that inflate backlog metrics.

### The Solution:
A native, zero-dependency **Zendesk Apps Framework (ZAF v2)** application embedded directly into the agent workspace, providing instant hover previews, real-time client-side slicing across 9 dimensions, and an intelligent duplicate detection queue with native ticket merging.

---

## 2. High-Level Architecture (ZAF v2)

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Zendesk Agent Workspace                        │
├───────────────────────────────┬────────────────────────────────────────┤
│     Left Navigation Bar       │           Main Iframe Window           │
│   ┌───────────────────────┐   │  ┌──────────────────────────────────┐  │
│   │ 📊 Views App Icon     │───┼─▶│ 1. Views Sidebar (Shared/Private)│  │
│   └───────────────────────┘   │  │ 2. Real-Time Filter Drawer (⚡)   │  │
│                               │  │ 3. 30-per-page Fast Table View   │  │
│                               │  │ 4. Duplicate Detection Queue     │  │
│                               │  │ 5. Zendesk Native Search & Merge │  │
│                               │  └──────────────────────────────────┘  │
└───────────────────────────────┴────────────────────────────────────────┘
                                   │
                                   ▼ ZAF SDK v2 (`client.request`)
┌────────────────────────────────────────────────────────────────────────┐
│                     Zendesk Support REST APIs                          │
│  • GET  /api/v2/views/active.json       • GET /api/v2/users/me.json    │
│  • GET  /api/v2/views/{id}/execute.json • GET /api/v2/search.json      │
│  • POST /api/v2/tickets/{id}/merge.json • GET /api/v2/tickets/{id}.json│
└────────────────────────────────────────────────────────────────────────┘
```

### Technology Stack:
* **Framework:** Zendesk Apps Framework (ZAF) v2.0
* **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3 (Zendesk Garden Design System compliance)
* **Libraries/Dependencies:** Zero external npm bundles or third-party CDNs (ensuring maximum security, near-zero load latency, and compliance with Zendesk Marketplace security standards).
* **Package Format:** Standard zip archive adhering to Zendesk `manifest.json` schema.

---

## 3. Core Modules & Deep Dive

### 3.1 Instant Ticket Hover Previews
* **Mechanism:** Subscribes to pointer events (`mouseenter` / `mouseleave`) with a 150ms debounce delay to avoid accidental triggers during rapid scrolling.
* **Payload Displayed:**
  * Ticket ID & Status badge (New, Open, Pending, Solved).
  * Customer Name, Verified Email, Channel (Email, Web, Phone, Chat).
  * Original customer description cleanly formatted and truncated to 60–70 words.
* **Performance:** Descriptions are fetched during view execution and cached in memory, eliminating secondary network calls on hover.

### 3.2 9-Field Real-Time Filter Drawer
Agents can click **⚡ Filter** to open an interactive drawer with 9 simultaneous filter dimensions:
1. **Subject & Body Keyword Search:** Live case-insensitive substring matching against subjects and opening descriptions.
2. **Interactive Multi-Tag Chips:** Searchable tag selector with multi-chip selection and individual removal.
3. **Status:** Single or multi-status isolation (New, Open, Pending, Hold, Solved, Closed).
4. **Priority:** Urgent, High, Normal, Low.
5. **Channel:** Email, Web Form, Chat, Voice/Phone, SMS, API, Help Center, Social.
6. **Ticket Type:** Question, Incident, Problem, Task.
7. **Requester:** Match customer name or email.
8. **Assignee:** 1-click filter for **Assigned to Me** vs **Unassigned**.
9. **Calendar Date Presets:** 1-click **"Last 30 Days"**, **"In 2026"**, or custom HTML5 date pickers (`From` / `To`).

### 3.3 Duplicate Tickets Queue & Native Merge Workflow
* **Automatic Aggregation:** Queries all active unresolved tickets (`status < solved`) and clusters them by customer identity (Requester ID, Email, Phone).
* **Interactive Ticket Selection:**
  * Individual checkboxes in front of every ticket item.
  * Customer-level **Select all** toggle with indeterminate state management.
* **Dynamic Action Button:** Displays `⚡ Merge (X)` indicating the exact count of selected tickets.
* **Native Search & Merge Dialog:**
  * **Candidate Selection:** Pre-loads all open tickets for the requester as selectable target candidates.
  * **Multi-Attribute Search:** Search target tickets by **Ticket ID, Requester Email, Requester Name, or Subject** with real-time local filtering and global Zendesk API fallback.
  * **Ignorable Customer Mismatch Alert:** When candidate and closing tickets have differing requesters or organizations, the exact alert displays:
    > ⚠️ **These tickets don't belong to the same customer**
    *Crucially, this alert is non-blocking (ignorable)*—agents can review the notice, dismiss it, and proceed with the merge if desired.
  * **Comment Customization:** Auto-generates standard Zendesk target and source merge comments, with a toggle for public vs internal visibility.
  * **Execution:** Calls Zendesk REST API `POST /api/v2/tickets/{target_id}/merge.json` and refreshes the queue dynamically.

---

## 4. API Integration & Data Flow

| Endpoint | Method | Purpose |
| :--- | :---: | :--- |
| `/api/v2/views/active.json` | `GET` | Fetches active views accessible by the current agent |
| `/api/v2/views/{id}/execute.json` | `GET` | Executes selected view and returns paginated tickets |
| `/api/v2/views/{id}/count.json` | `GET` | Fetches real-time ticket counts for views |
| `/api/v2/search.json?query=...` | `GET` | Live backlog query for duplicate clustering & global ticket search |
| `/api/v2/tickets/{id}.json` | `GET` | Single ticket lookup by ID |
| `/api/v2/tickets/{id}/merge.json` | `POST` | Executes native ticket merge with source & target comments |

### Sample Merge Payload:
```json
POST /api/v2/tickets/9443861/merge.json
Content-Type: application/json

{
  "ids": [9443862, 9443863],
  "target_comment": "Ticket(s) #9443862, #9443863 have been merged into this ticket.",
  "source_comment": "This ticket was merged into ticket #9443861.",
  "target_comment_is_public": false,
  "source_comment_is_public": false
}
```

---

## 5. Security, Permissions & Scopes

* **Access Control:** The app strictly enforces Zendesk's role-based access rules. Personal views belonging to other agents are excluded, and shared views respect group restrictions (`currentUserGroupIds`).
* **Cross-Site Scripting (XSS) Prevention:** All dynamic data (ticket subjects, descriptions, user names, emails) passes through an HTML entity sanitizer (`escapeHtml`) before DOM insertion.
* **Sandbox Compliance:** Complies with modern browser iframe isolation standards under ZAF v2 without requiring unvetted external scripts.

---

## 6. Installation & Deployment Guide

### Building the Package:
Run the automated packaging script from the project root:
```bash
python3 build-zip.py
```
This generates `dist/zendesk-view-descriptions-app.zip` containing all validated assets, translations, and manifest metadata.

### Installing in Zendesk:
1. Log in to Zendesk Support as an **Administrator**.
2. Navigate to **Admin Center** ➔ **Apps and integrations** ➔ **Apps** ➔ **Zendesk Support apps**.
3. Click **Upload private app** (top-right).
4. Enter App Name: `Views Filter & Duplicates`.
5. Upload `dist/zendesk-view-descriptions-app.zip`.
6. Click **Install**. The app will appear on the far-left navigation bar (📊).

---

## 7. Roadmap & Future Enhancements

* [x] Instant Hover Problem Descriptions
* [x] 9-Field Real-Time Multi-Dimensional Filter
* [x] Calendar Date Presets (2026, 30 Days)
* [x] Duplicate Customer Ticket Queue
* [x] Interactive Checkboxes & Dynamic Merge Action
* [x] Zendesk-Native Search & Merge Dialog (ID, Name, Email)
* [x] Ignorable Customer Mismatch Alert
* [ ] AI-Powered Ticket Similarity Scoring
* [ ] Automated Macro Suggestions Based on Hover Description
