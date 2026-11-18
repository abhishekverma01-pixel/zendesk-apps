# Zendesk Views & Duplicates App
## Agent Quick-Start & User Guide

Welcome to the **Views Filter & Duplicates** app! This guide will help you understand how the app works and how to start using it to manage your daily tickets faster.

---

## 1. How to Open the App

1. Look at the **far-left navigation bar** in Zendesk (the dark icon strip).
2. Click the **Views Description** icon (📊).
3. The app will open directly inside your Zendesk workspace.

---

## 2. Screen Overview (What You See)

The app is divided into two simple sections:

* **Left Sidebar:** Shows all your **Shared Views** (team queues) and **Personal Views** (your own queues), plus a shortcut for **Duplicate tickets** at the bottom.
* **Right Main Area:** Displays the tickets table for the selected view, the **⚡ Filter** button, and the Duplicate Tickets Queue.

---

## 3. How to Use the App (Step-by-Step Guide)

### Step 1: Select Your View
* **Shared Views (Top):** Standard team views like *Your unsolved tickets*, *Unassigned tickets*, *Pending tickets*, *Urgent*, etc.
* **Personal Views (Below):** Private views created specifically for you.
* Click on any view name in the sidebar to load its tickets in the main table.

---

### Step 2: Read Ticket Descriptions Instantly (Hover Preview)
**No need to open multiple browser tabs to read tickets!**

* Simply **hover your mouse over any ticket subject** in the table.
* A preview card pops up instantly showing:
  * **Ticket ID and Status** (Open, Pending, New).
  * **Customer Name, Email, and Channel** (Email, Chat, Phone, Web).
  * **Customer's Problem Description:** The customer's opening message, cleanly formatted so you can understand the issue in 5 seconds.
* Move your mouse away, and the preview closes automatically.

---

### Step 3: Filter Tickets on the Fly (Click "⚡ Filter")
If a view has many tickets and you want to find specific ones, click the **⚡ Filter** button at the top. 

A 9-field drawer will slide open. You can filter by:

1. **Subject / Description:** Type any keyword to find tickets with matching text.
2. **Tags:** Type or choose tags using interactive chips.
3. **Status:** Select *Open*, *Pending*, *New*, etc.
4. **Priority:** Focus on *Urgent* or *High* priority issues.
5. **Channel:** Filter by source (Email, Chat, Web Form, Phone).
6. **Type:** Filter by Incident, Question, Problem, or Task.
7. **Requester:** Type a customer's name or email address.
8. **Assignee:** Quickly choose **Assigned to Me** to see only your tickets, or **Unassigned** to pick up new tickets.
9. **Request Date:** Click 1-click buttons like **"Last 30 Days"**, **"In 2026"**, or pick custom dates.

> **Tip:** To clear your search and see all tickets again, click **"Reset All Filters"** on the right side of the filter drawer.

---

### Step 4: Find and Merge Duplicate Customer Tickets (Native Zendesk Style)
Customers often submit multiple tickets (via email, web forms, or chat) for the exact same problem. The app automatically detects duplicate requesters and lets you select and merge their tickets directly in Zendesk.

**How to select and merge duplicate tickets:**
1. Click **Duplicate tickets** at the bottom of the left sidebar (shows an orange badge with the count of duplicate customers).
2. The **Duplicate Tickets Queue** opens with cards grouped by customer:
   * Each customer card shows all their open tickets with subjects, status, requester details, and preview descriptions.
   * **Tick the Checkboxes:** In front of each ticket, tick the checkbox for the tickets you want to merge (e.g. 2 or 3 tickets), or click **Select all** in the customer header.
3. **Click the Dynamic "Merge" Button:**
   * As soon as you select tickets, a dynamic **⚡ Merge (X)** button appears at the bottom of that customer card (e.g. `⚡ Merge (3)`).
   * Click **⚡ Merge** to open the Zendesk-style Search & Merge dialog.
4. **Search & Select Target Ticket:**
   * **Search by Email, Name, Ticket ID, or Subject:** You can search the target ticket using the customer's email address, requester name, ticket number, or keywords.
   * You can select from the customer's duplicate list or search all Zendesk tickets live.
   * **Customer Mismatch Warning (Ignorable):** If the selected target ticket belongs to a different customer, a warning appears: *"These tickets don't belong to the same customer"*. **This warning is completely ignorable**—it does not block you, and you can still proceed and click Confirm and Merge!
5. **Review Comments & Confirm:**
   * Review or customize the notes added to the target ticket and closing tickets.
   * Click **Confirm and Merge**: The app executes the merge directly in Zendesk and updates the queue immediately.

---

## 4. Quick Cheatsheet for Agents

| What do you want to do? | How to do it in the app: |
| :--- | :--- |
| **Check your assigned tickets** | Click *Your unsolved tickets* or open filter and set Assignee to *Assigned to Me*. |
| **Read ticket details fast** | Hover your mouse over the ticket subject line. |
| **Find tickets with a specific tag or keyword** | Click **⚡ Filter**, type in the *Subject* or *Tags* box. |
| **Select duplicate customer tickets** | In **Duplicate tickets**, tick the checkboxes in front of the tickets you want to merge. |
| **Search target ticket by name or email** | In the Merge dialog, type the requester's name, email, ticket #, or subject in the search box. |
| **Merge tickets across different customers** | Select the target ticket; if *"These tickets don't belong to the same customer"* appears, ignore it and click **Confirm and Merge**. |
| **Clear all active filters** | Click **Reset All Filters** inside the filter drawer. |
