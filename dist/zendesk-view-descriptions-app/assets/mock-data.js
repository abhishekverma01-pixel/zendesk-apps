/**
 * Mock data for Enhanced Views & Backlog Manager
 * Provides realistic tickets for:
 * 1. Keyword Description Filtering
 * 2. Calendar Date Ranges
 * 3. Duplicate Customer Ticket Detection
 */

window.MOCK_BACKLOG_TICKETS = [
  {
    id: 48921,
    subject: "Production database timeout during checkout - urgent assistance needed",
    description: "Our payment processing service experienced multiple 504 gateway timeout errors during checkout. The logs show high latency connecting to the US-East replica cluster. We need engineering to check connection pool settings immediately.",
    status: "open",
    priority: "urgent",
    type: "incident",
    created_at: "2026-10-06T10:15:00Z",
    updated_at: "2026-10-06T14:30:00Z",
    requester: { id: 7001, name: "Alex Rivera", email: "alex.rivera@acme.corp" },
    assignee: { id: 9812, name: "Jordan Lee" },
    tags: ["production", "database", "checkout", "latency"]
  },
  {
    id: 48922,
    subject: "Question about invoice #INV-2026-881 duplicate charge",
    description: "Hello, looking at our corporate credit card statement, I noticed we were billed twice for invoice #INV-2026-881 on October 2nd. Could you please review and process a refund for the second duplicate charge of $450?",
    status: "open",
    priority: "normal",
    type: "question",
    created_at: "2026-10-05T09:40:00Z",
    updated_at: "2026-10-05T11:20:00Z",
    requester: { id: 7002, name: "Jessica Huang", email: "jessica@techflow.io" },
    assignee: { id: 9814, name: "Sarah Miller" },
    tags: ["billing", "invoice", "refund", "duplicate"]
  },
  {
    id: 48923,
    subject: "New employee unable to log in via Okta SSO",
    description: "A new hire in marketing is receiving error code SAML-403 when trying to access the portal through Okta SSO. Other users in the same group have access. Can you verify their provisioning profile?",
    status: "new",
    priority: "normal",
    type: "question",
    created_at: "2026-10-04T15:00:00Z",
    updated_at: "2026-10-04T15:00:00Z",
    requester: { id: 7003, name: "Marcus Brody", email: "m.brody@globalmedia.net" },
    assignee: null,
    tags: ["sso", "okta", "auth", "provisioning"]
  },
  {
    id: 48924,
    subject: "Follow up: Checkout still slow on mobile app",
    description: "Following up on my earlier message regarding checkout latency. Our mobile iOS app users are reporting the same timeout screen when tapping 'Pay Now'. Here are the network logs from TestFlight.",
    status: "open",
    priority: "high",
    type: "incident",
    created_at: "2026-10-06T12:00:00Z",
    updated_at: "2026-10-06T13:45:00Z",
    requester: { id: 7001, name: "Alex Rivera", email: "alex.rivera@acme.corp" },
    assignee: { id: 9812, name: "Jordan Lee" },
    tags: ["mobile", "ios", "checkout", "latency"]
  },
  {
    id: 48925,
    subject: "Hardware shipment package damaged in transit - RMA request",
    description: "We received package tracking #1Z999AA1012345 today, but the box was severely crushed and the scanner sensor is cracked. Please issue an immediate RMA replacement so our warehouse operations aren't delayed.",
    status: "open",
    priority: "high",
    type: "problem",
    created_at: "2026-09-18T08:30:00Z",
    updated_at: "2026-09-19T14:10:00Z",
    requester: { id: 7004, name: "Carlos Santana", email: "carlos@logistics-pro.com" },
    assignee: { id: 9815, name: "Rachel Adams" },
    tags: ["hardware", "shipping", "damaged", "rma"]
  },
  {
    id: 48926,
    subject: "Request for annual W-9 and tax exemption certificate",
    description: "Please provide your updated 2026 W-9 form and state sales tax exemption form so our accounts payable team can release payment for the annual enterprise renewal.",
    status: "pending",
    priority: "low",
    type: "question",
    created_at: "2026-08-10T11:00:00Z",
    updated_at: "2026-08-12T09:20:00Z",
    requester: { id: 7005, name: "Elena Rostova", email: "elena@apexholdings.org" },
    assignee: { id: 9814, name: "Sarah Miller" },
    tags: ["billing", "tax", "w9", "renewal"]
  },
  {
    id: 48927,
    subject: "Invoice #INV-2026-881 question regarding tax calculation",
    description: "One more question on the invoice: the tax rate seems to be calculated at 8.875% instead of our exempt municipal rate. Can this be corrected on the revised invoice?",
    status: "open",
    priority: "normal",
    type: "question",
    created_at: "2026-10-05T14:20:00Z",
    updated_at: "2026-10-05T16:00:00Z",
    requester: { id: 7002, name: "Jessica Huang", email: "jessica@techflow.io" },
    assignee: { id: 9814, name: "Sarah Miller" },
    tags: ["billing", "invoice", "tax"]
  },
  {
    id: 48928,
    subject: "URGENT: Re-occurrence of connection pool exhaustion",
    description: "Database connection pool reached 100% capacity again at 15:45 UTC. Checkout is completely failing now across all regions. Please escalate to DevOps immediately.",
    status: "open",
    priority: "urgent",
    type: "incident",
    created_at: "2026-10-06T15:50:00Z",
    updated_at: "2026-10-06T16:10:00Z",
    requester: { id: 7001, name: "Alex Rivera", email: "alex.rivera@acme.corp" },
    assignee: { id: 9812, name: "Jordan Lee" },
    tags: ["database", "urgent", "production", "devops"]
  },
  {
    id: 48800,
    subject: "Legacy system migration inquiry from Q4 2025",
    description: "Checking back on the migration timeline discussed last November. Do we have a target date for the API v1 sunset?",
    status: "open",
    priority: "low",
    type: "question",
    created_at: "2025-11-15T09:00:00Z",
    updated_at: "2025-11-20T10:00:00Z",
    requester: { id: 7006, name: "Liam Vance", email: "liam@legacypartners.com" },
    assignee: { id: 9815, name: "Rachel Adams" },
    tags: ["migration", "api", "q4-2025"]
  }
];
