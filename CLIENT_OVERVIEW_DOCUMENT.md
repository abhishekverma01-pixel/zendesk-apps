# Zendesk Views Filter & Duplicate Tickets App
## Executive Overview & Client Functional Specification Document

---

### Executive Summary

The **Views Filter & Duplicates** application is an enterprise-grade private Zendesk Support app designed to enhance agent productivity, streamline ticket triage, and eliminate duplicate work across support teams. 

Operating seamlessly within the native Zendesk Agent Workspace (via the global Navigation Bar), the application provides:
1. **Dynamic In-View Filtering (9 Fields):** Allows agents to slice and dice any existing Zendesk View in real-time without requiring Zendesk Administrators to create and maintain dozens of repetitive views.
2. **Instant Ticket Hover Previews:** Delivers rich context (original customer problem description and requester metadata) without forcing agents to open new browser tabs.
3. **Automated Customer Duplicate Detection:** Identifies customers with multiple open tickets across the system, presenting a centralized queue with 1-click ID copying for Zendesk's native ticket merging.
4. **Native Zendesk View Hierarchy:** Mirrors native Zendesk view order (Admin position 1, 2, 3...) separated into bold **Shared Views** and **Personal Views**.
5. **Strict Data Privacy & Security:** Built with strict agent-level permission enforcement, ensuring personal views never leak tickets across agents and group restrictions are 100% honored.

---

## 1. Business Value & Problem Statement

| Native Zendesk Challenge | Impact on Support Teams | How the App Solves It |
| :--- | :--- | :--- |
| **View Clutter & Admin Overhead** | Admins must create separate views for every status, priority, or channel combination. | **9-Field In-View Filter Drawer** allows agents to filter on the fly inside any view. |
| **Tab Overload & Context Switching** | Agents must open 20–30 tickets in tabs just to see initial customer descriptions. | **Instant Hover Popovers** show the full subject, metadata, and dynamic description (60–70 words) on mouse hover. |
| **Fragmented Duplicate Customer Tickets** | Customers send multiple emails, chats, or web forms for the same issue, leading to multiple agents working on the same problem. | **Duplicate Tickets Queue** automatically aggregates open tickets by customer with a 1-click **Copy IDs to Merge** button. |
| **Strict Agent Privacy** | Personal views in custom apps often leak other agents' private tickets if not strictly scoped. | **Dedicated User Assignment Endpoint** ensures personal views strictly display only the logged-in agent's assigned tickets. |

---

## 2. Core Functional Modules

### Module 1: Smart Sidebar & Views Navigation
* **Dual View Classification:**
  * **Shared Views (Top Section):** Displays all public and group-restricted views accessible to the logged-in agent.
  * **Personal Views (Bottom Section):** Displays views created specifically by/for the logged-in agent.
* **Exact Admin Ordering (`position`):** All views are sequenced according to the exact numerical order configured in Zendesk Admin Center (**Admin Center > Workspaces > Agent tools > Views**).
* **Collapsible Sections:** Both Shared and Personal sections feature bold typography and collapsible chevrons to maximize sidebar space.
* **Clutter-Free Interface:** Numeric view badges have been intentionally removed from views to eliminate visual noise and eliminate unnecessary background API polling.
* **Duplicate Queue Shortcut:** A dedicated, highlighted entry at the bottom of the sidebar with an amber notification badge showing the number of customers with duplicate open tickets.

---

### Module 2: The 9-Field Real-Time Ticket Filter Drawer
Accessible via the **⚡ Filter** button in any active view, this expandable drawer allows agents to instantly filter ticket results in real time with zero latency.

| # | Filter Field | Control Type | Description & Capabilities |
| :---: | :--- | :--- | :--- |
| **1** | **Subject / Description** | Text Input | Real-time text search across ticket titles and problem descriptions. |
| **2** | **Tags** | Interactive Chip Selector | Multi-tag selector with search dropdown, interactive badge removal, and keyboard navigation (Enter / Backspace). |
| **3** | **Status** | Dropdown | Filter by `New`, `Open`, `Pending`, `On-hold`, `Solved`, or `Closed`. |
| **4** | **Priority** | Dropdown | Filter by `Urgent`, `High`, `Normal`, or `Low`. |
| **5** | **Channel** | Dropdown | Filter by source channel: `Email`, `Web`, `Chat`, `Voice / Phone`, `Messaging`, `SMS`, `API`, `Help Center`, or `Social`. |
| **6** | **Type** | Dropdown | Filter by ticket classification: `Question`, `Incident`, `Problem`, or `Task`. |
| **7** | **Requester** | Text Input | Search requester name, email address, or phone number. |
| **8** | **Assignee** | Dropdown | Quickly toggle between `All Assignees`, `Assigned to Me` (Current Agent), or `Unassigned`. |
| **9** | **Request Date** | Date Range + Quick Chips | Custom `From` and `To` date pickers, paired with instant 1-click presets: **"In 2026"**, **"Last 30 Days"**, and **"Clear Dates"**. |

* **Active Filter Pill:** A dynamic pill indicator (`X active`) shows how many filters are currently engaged.
* **1-Click Reset:** "Reset All Filters" immediately clears all 9 inputs and restores the complete view dataset.

---

### Module 3: High-Performance Ticket Table & Pagination
* **Zendesk Native Look & Feel:** Table columns include:
  * **Ticket Status** (Color-coded native pills: New, Open, Pending, Solved, Hold).
  * **Subject** (Clickable link routing directly to the ticket tab in Zendesk Agent Workspace).
  * **Requester** (Customer name or email).
  * **Requested Date** (Formatted date e.g., Oct 24, 2026).
  * **Type & Priority** (Clean hyphen when unset).
  * **Quick Action Button (⋮)** (Direct ticket opener).
* **Strict 30 Tickets Per Page Pagination:**
  * Clean controls: `« First`, `‹ Previous`, `Page X of Y`, `Next ›`, `Last »`.
  * Eliminates browser lag when viewing large ticket backlogs (e.g., views with 3,000+ tickets).
* **Fast Batch Copy IDs:**
  * **📋 Copy IDs Button:** Located in the view header, copies all ticket IDs on the active page into clipboard (e.g., `4501, 4502, 4503`) for quick search, reporting, or batch updates.

---

### Module 4: Hover Ticket Preview Popover
* **220ms Intelligent Debounce:** Displays a floating card when hovering over any ticket subject without triggering accidental popovers during rapid mouse movement.
* **Information Displayed:**
  * Status Pill + Ticket `#ID`.
  * Full Subject title.
  * Requester details (Name, Email, Channel).
  * **Original Problem Description (Dynamic Formatter):**
    * If the ticket description has 60 words or fewer, displays the complete text cleanly.
    * If the description exceeds 60 words, dynamically cuts off between 60 and 70 words strictly at the nearest natural sentence ending (`.`, `!`, `?`), ensuring clean readability.
* *(Note: To maintain zero-latency hover performance and prevent Zendesk API rate limit exhaustion, the card displays the customer's opening issue description. Full conversation threads are accessed by opening the ticket).*

---

### Module 5: Customer Duplicate Tickets Queue
When customers submit multiple requests across different channels (e.g., an email followed by a live chat and an SMS), support agents often waste time drafting duplicate responses. 

The Duplicate Tickets Queue solves this systematically:
1. **Automated Account-Wide Scan:** Searches all active tickets (`status < solved`) across the organization and aggregates them by customer identifier (Email, Name, Phone).
2. **Executive Metric Cards:**
   * **Requesters with Multiple Open Tickets** (Total unique customers who currently have active duplicate requests).
   * **Total Open Duplicate Tickets** (Aggregate count of tickets involved).
3. **Customer Grouping Cards:**
   * Clean customer header displaying Customer Name, Email, and Phone number (clean UI that never shows raw internal database IDs).
   * Total open tickets badge (e.g., `3 OPEN TICKETS`).
   * Primary preview showing the first 3 tickets with subjects, status pills, and brief summaries.
   * Expandable **"▼ View X more tickets"** button for customers with extensive ticket histories.
4. **1-Click Merge Workflow:**
   * **📋 Copy IDs to Merge:** Copies all ticket IDs for that customer as a comma-delimited string (e.g., `1024, 1029, 1035`) directly to clipboard.
   * **Open First Ticket →:** Instantly launches the master ticket in Zendesk Agent Workspace.
   * The agent clicks Zendesk's native **Ticket Options > Merge into another ticket**, pastes the copied IDs, and completes the merge in seconds.
5. **Pagination:** Duplicate customer groups are paginated at **10 customer cards per page** for rapid navigation and zero UI lag.

---

## 3. Technical Architecture & Security

### Technology Stack
* **Framework:** Zendesk Apps Framework (ZAF v2)
* **App Location:** `nav_bar` (Global left navigation icon)
* **Runtime:** Pure Vanilla JavaScript (ES6+), Modern Responsive CSS3, HTML5 (Zero heavy external framework bloat like React/Angular, resulting in near-instant load times).
* **Live Zendesk APIs Used:**
  * `GET /api/v2/views/active.json?access=shared` (Shared Views)
  * `GET /api/v2/views/active.json?access=personal` (Personal Views)
  * `GET /api/v2/views/{view_id}/tickets.json` (Tickets in View)
  * `GET /api/v2/users/{user_id}/tickets/assigned.json` (Secure Personal Ticket Isolation)
  * `GET /api/v2/search.json?query=type:ticket status<solved` (Duplicate Scanner)
  * `GET /api/v2/users/show_many.json` (Customer Metadata Enrichment)

### Security & Permission Model
* **Zendesk Group Security:** When fetching shared views, the app cross-references the logged-in agent's `currentUserGroupIds`. If a view is restricted to "Tier 2 Support" and the agent belongs only to "Tier 1", the view is strictly hidden.
* **Role-Based Admin Elevation:** Account Administrators (`currentUserRole === 'admin'`) inherit full visibility to all **Shared & Group-restricted views** across the organization as per Zendesk's native permissions. Importantly, **Personal Views** remain 100% private to each individual user—an Admin only sees their own personal views in their workspace sidebar.
* **Cross-Agent Data Isolation:** Zendesk's native `/views/{id}/tickets.json` API can leak company-wide tickets when querying personal views that use the `(current user)` condition. This app prevents this leak by routing "Your unsolved tickets" through the dedicated user assignment endpoint (`/users/{id}/tickets/assigned.json`), ensuring agents only see tickets assigned directly to them.

---

## 4. Operational Comparison: Before vs. After

| Feature | Standard Zendesk Agent Workspace | With Views Filter & Duplicates App |
| :--- | :--- | :--- |
| **Filter tickets inside a view** | ❌ Not available. Admin must create a brand-new permanent view. | ✅ **Yes.** Real-time 9-field filter drawer available inside any view. |
| **Find duplicate customer tickets** | ❌ Manual search required per customer. | ✅ **Automated.** Dedicated queue identifies all duplicate requesters across the account. |
| **Merge ticket IDs** | ❌ Agent must memorize or manually write down ticket numbers. | ✅ **1-Click.** "Copy IDs to Merge" copies all IDs directly to clipboard. |
| **Preview ticket description** | ❌ Must open ticket in a new tab. | ✅ **Instant.** Hover over any subject to read full description and latest comment. |
| **Filter by multiple tags** | ❌ Complex Zendesk search syntax required. | ✅ **Interactive tag picker** with chips and autocomplete dropdown. |
| **View Sorting** | ⚠️ Can be inconsistent across custom integrations. | ✅ **100% mirrors Admin position ordering** (Shared Views first, Personal Views second). |

---

## 5. Installation & Deployment Guide

1. **Package File:** Use the production-ready zip archive: `zendesk-view-descriptions-app.zip`.
2. **Access Admin Center:** Log in to Zendesk as an Administrator and navigate to:
   * **Admin Center > Apps and integrations > Apps > Zendesk Support apps**.
3. **Upload Private App:**
   * Click **Upload private app**.
   * App Name: `Views Filter & Duplicates`
   * Select `zendesk-view-descriptions-app.zip` and click **Upload**.
4. **Assign Permissions:** Set role or group restrictions if desired, then click **Install**.
5. **Usage:** The app icon will appear immediately on the left-hand global navigation bar for all authorized agents.

---
*Document Version: 1.0.0 | Built for Zendesk Support Agent Workspace (ZAF v2)*
