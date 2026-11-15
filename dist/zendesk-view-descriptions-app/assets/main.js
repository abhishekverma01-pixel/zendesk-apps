/**
 * Enhanced Views & Backlog Manager
 * Framework: Zendesk Apps Framework (ZAF v2)
 */

(function () {
  'use strict';

  const state = {
    isMockMode: false,
    client: null,
    location: 'ticket_sidebar',
    currentTicket: null,
    activeTab: 'tab-description',
    
    // Tab 1: Description search
    descQuery: '',
    descStatus: 'active',
    descResults: [],
    
    // Tab 2: Calendar filter
    calendarPreset: 'after-2026',
    calendarFrom: '',
    calendarTo: '',
    calendarStatus: 'active',
    calendarResults: [],
    
    // Tab 3: Duplicate customer tickets
    duplicateRequesters: []
  };

  const elements = {
    statusBadge: document.getElementById('global-status-badge'),
    btnRefresh: document.getElementById('btn-refresh'),
    sidebarAlert: document.getElementById('sidebar-duplicate-alert'),
    sidebarDuplicateTitle: document.getElementById('sidebar-duplicate-title'),
    sidebarDuplicateDesc: document.getElementById('sidebar-duplicate-desc'),
    btnViewCustomerDuplicates: document.getElementById('btn-view-customer-duplicates'),
    
    // Tabs
    navTabs: document.querySelectorAll('.nav-tab'),
    tabPanels: document.querySelectorAll('.tab-panel'),
    tabDuplicatesCount: document.getElementById('tab-duplicates-count'),
    
    // Tab 1 elements
    descSearchInput: document.getElementById('desc-search-input'),
    descSearchClear: document.getElementById('desc-search-clear'),
    descStatusFilter: document.getElementById('desc-status-filter'),
    btnRunDescSearch: document.getElementById('btn-run-desc-search'),
    descResultsCount: document.getElementById('desc-results-count'),
    btnCopyDescIds: document.getElementById('btn-copy-desc-ids'),
    descResultsList: document.getElementById('desc-results-list'),
    keywordChips: document.querySelectorAll('.chip'),
    
    // Tab 2 elements
    presetButtons: document.querySelectorAll('.preset-btn'),
    customDateBox: document.getElementById('custom-date-box'),
    dateFrom: document.getElementById('date-from'),
    dateTo: document.getElementById('date-to'),
    btnApplyCustomDate: document.getElementById('btn-apply-custom-date'),
    calendarStatusFilter: document.getElementById('calendar-status-filter'),
    btnRunCalendarFilter: document.getElementById('btn-run-calendar-filter'),
    calendarResultsCount: document.getElementById('calendar-results-count'),
    btnCopyCalendarIds: document.getElementById('btn-copy-calendar-ids'),
    calendarResultsList: document.getElementById('calendar-results-list'),
    
    // Tab 3 elements
    dupRequestersCount: document.getElementById('dup-requesters-count'),
    dupTotalTicketsCount: document.getElementById('dup-total-tickets-count'),
    btnRescanDuplicates: document.getElementById('btn-rescan-duplicates'),
    duplicatesList: document.getElementById('duplicates-list'),
    
    footerStatusText: document.getElementById('footer-status-text')
  };

  function escapeHtml(text) {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function highlightKeywords(text, query) {
    const escaped = escapeHtml(text);
    if (!query || !query.trim()) return escaped;
    const cleanQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${cleanQuery})`, 'gi');
    return escaped.replace(regex, '<mark>$1</mark>');
  }

  function resizeApp() {
    if (state.client && typeof state.client.invoke === 'function') {
      setTimeout(() => {
        const height = Math.max(380, document.body.scrollHeight + 15);
        state.client.invoke('resize', { width: '100%', height: `${height}px` }).catch(() => {});
      }, 50);
    }
  }

  function routeToTicket(ticketId) {
    if (state.client && typeof state.client.invoke === 'function') {
      state.client.invoke('routeTo', 'ticket', ticketId).catch(() => {
        window.open(`/agent/tickets/${ticketId}`, '_blank');
      });
    } else {
      alert(`[Preview Mode] Route to Ticket #${ticketId}`);
    }
  }

  function copyTextToClipboard(text, btnElement, successMsg = 'Copied!') {
    navigator.clipboard.writeText(text).then(() => {
      const orig = btnElement.innerHTML;
      btnElement.innerHTML = `&#10003; ${successMsg}`;
      setTimeout(() => { btnElement.innerHTML = orig; }, 1600);
    }).catch(() => {
      prompt('Copy to clipboard:', text);
    });
  }

  // ==========================================
  // TAB 1: Ticket Description & Body Search
  // ==========================================

  function buildSearchStatusClause(statusFilter) {
    if (statusFilter === 'active') return 'status<solved';
    if (statusFilter === 'open') return 'status:open';
    if (statusFilter === 'new') return 'status:new';
    if (statusFilter === 'pending') return 'status:pending';
    if (statusFilter === 'solved') return 'status:solved';
    return ''; // any
  }

  function runDescriptionSearch() {
    state.descQuery = elements.descSearchInput.value.trim();
    state.descStatus = elements.descStatusFilter.value;
    
    elements.descResultsList.innerHTML = '<div class="empty-state">Searching ticket bodies...</div>';

    if (state.isMockMode) {
      setTimeout(() => {
        const query = state.descQuery.toLowerCase();
        const tickets = window.MOCK_BACKLOG_TICKETS || [];
        
        state.descResults = tickets.filter(t => {
          // Status check
          if (state.descStatus === 'active' && ['solved', 'closed'].includes(t.status)) return false;
          if (state.descStatus !== 'active' && state.descStatus !== 'any' && t.status !== state.descStatus) return false;
          
          // Body / description text check
          if (!query) return true;
          const bodyText = (t.description || '').toLowerCase();
          const subjectText = (t.subject || '').toLowerCase();
          return bodyText.includes(query) || subjectText.includes(query);
        });

        renderDescriptionResults();
      }, 200);
      return;
    }

    // Call Zendesk Search API
    const statusClause = buildSearchStatusClause(state.descStatus);
    const queryParts = ['type:ticket'];
    if (statusClause) queryParts.push(statusClause);
    if (state.descQuery) queryParts.push(`"${state.descQuery}"`);

    const fullQuery = queryParts.join(' ');

    state.client.request({
      url: `/api/v2/search.json?query=${encodeURIComponent(fullQuery)}`,
      type: 'GET',
      dataType: 'json'
    }).then(res => {
      state.descResults = res.results || [];
      renderDescriptionResults();
    }).catch(err => {
      console.error('Description search error:', err);
      elements.descResultsList.innerHTML = `<div class="empty-state" style="color:#d93f4c;">Search error: ${err.statusText || 'Unable to query tickets'}</div>`;
    });
  }

  function renderDescriptionResults() {
    const list = state.descResults;
    elements.descResultsCount.textContent = `Matching Tickets (${list.length})`;
    
    if (list.length > 0) {
      elements.btnCopyDescIds.classList.remove('hidden');
    } else {
      elements.btnCopyDescIds.classList.add('hidden');
      elements.descResultsList.innerHTML = '<div class="empty-state">No tickets matched the specified description keywords.</div>';
      resizeApp();
      return;
    }

    elements.descResultsList.innerHTML = list.map(t => {
      const statusBadgeClass = `badge-${t.status || 'open'}`;
      const requesterName = t.requester ? t.requester.name : (t.requester_id || 'Unknown');
      const requesterEmail = t.requester ? t.requester.email : '';
      const dateStr = new Date(t.created_at).toLocaleDateString();
      const snippet = t.description ? t.description : t.subject;

      return `
        <div class="ticket-card" data-id="${t.id}">
          <div class="ticket-top">
            <span class="ticket-id">#${t.id}</span>
            <span class="badge ${statusBadgeClass}">${escapeHtml(t.status)}</span>
          </div>
          <div class="ticket-subject">${escapeHtml(t.subject)}</div>
          
          <div class="ticket-meta-row">
            <span class="ticket-requester">👤 ${escapeHtml(requesterName)} ${requesterEmail ? `&lt;${escapeHtml(requesterEmail)}&gt;` : ''}</span>
            <span class="ticket-date">📅 ${dateStr}</span>
          </div>

          <div class="ticket-snippet-box">
            ${highlightKeywords(snippet, state.descQuery)}
          </div>

          <div class="ticket-bottom-bar">
            <button class="btn-link btn-open-ticket" data-id="${t.id}">Open Ticket &rarr;</button>
            <span style="font-size:10px; color:#87929d;">Priority: <strong>${escapeHtml(t.priority || 'Normal')}</strong></span>
          </div>
        </div>
      `;
    }).join('');

    resizeApp();
  }

  // ==========================================
  // TAB 2: Calendar-Based Filters
  // ==========================================

  function getCalendarDateQuery() {
    const preset = state.calendarPreset;
    const now = new Date();

    if (preset === 'after-2026') {
      return { queryPart: 'created>2026-01-01', fromDate: new Date('2026-01-01T00:00:00Z'), toDate: null };
    }
    if (preset === 'last-30') {
      const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const iso = d.toISOString().split('T')[0];
      return { queryPart: `created>=${iso}`, fromDate: d, toDate: null };
    }
    if (preset === 'last-180') {
      const d = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      const iso = d.toISOString().split('T')[0];
      return { queryPart: `created>=${iso}`, fromDate: d, toDate: null };
    }
    if (preset === 'custom') {
      const from = elements.dateFrom.value;
      const to = elements.dateTo.value;
      let part = '';
      if (from) part += `created>=${from} `;
      if (to) part += `created<=${to}`;
      return {
        queryPart: part.trim(),
        fromDate: from ? new Date(from) : null,
        toDate: to ? new Date(to + 'T23:59:59Z') : null
      };
    }
    return { queryPart: '', fromDate: null, toDate: null };
  }

  function runCalendarFilter() {
    state.calendarStatus = elements.calendarStatusFilter.value;
    elements.calendarResultsList.innerHTML = '<div class="empty-state">Applying calendar date filter...</div>';

    const { queryPart, fromDate, toDate } = getCalendarDateQuery();

    if (state.isMockMode) {
      setTimeout(() => {
        const tickets = window.MOCK_BACKLOG_TICKETS || [];
        state.calendarResults = tickets.filter(t => {
          // Status check
          if (state.calendarStatus === 'active' && ['solved', 'closed'].includes(t.status)) return false;
          if (state.calendarStatus !== 'active' && state.calendarStatus !== 'any' && t.status !== state.calendarStatus) return false;

          // Date check
          const created = new Date(t.created_at);
          if (fromDate && created < fromDate) return false;
          if (toDate && created > toDate) return false;
          return true;
        });

        renderCalendarResults();
      }, 200);
      return;
    }

    // Call Zendesk Search API
    const statusClause = buildSearchStatusClause(state.calendarStatus);
    const queryParts = ['type:ticket'];
    if (statusClause) queryParts.push(statusClause);
    if (queryPart) queryParts.push(queryPart);

    const fullQuery = queryParts.join(' ');

    state.client.request({
      url: `/api/v2/search.json?query=${encodeURIComponent(fullQuery)}`,
      type: 'GET',
      dataType: 'json'
    }).then(res => {
      state.calendarResults = res.results || [];
      renderCalendarResults();
    }).catch(err => {
      console.error('Calendar search error:', err);
      elements.calendarResultsList.innerHTML = `<div class="empty-state" style="color:#d93f4c;">Filter error: ${err.statusText || 'Unable to filter tickets'}</div>`;
    });
  }

  function renderCalendarResults() {
    const list = state.calendarResults;
    elements.calendarResultsCount.textContent = `Filtered Tickets (${list.length})`;

    if (list.length > 0) {
      elements.btnCopyCalendarIds.classList.remove('hidden');
    } else {
      elements.btnCopyCalendarIds.classList.add('hidden');
      elements.calendarResultsList.innerHTML = '<div class="empty-state">No tickets found for this date range and status.</div>';
      resizeApp();
      return;
    }

    elements.calendarResultsList.innerHTML = list.map(t => {
      const statusBadgeClass = `badge-${t.status || 'open'}`;
      const requesterName = t.requester ? t.requester.name : (t.requester_id || 'Unknown');
      const dateStr = new Date(t.created_at).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric'
      });

      return `
        <div class="ticket-card" data-id="${t.id}">
          <div class="ticket-top">
            <span class="ticket-id">#${t.id}</span>
            <span class="badge ${statusBadgeClass}">${escapeHtml(t.status)}</span>
          </div>
          <div class="ticket-subject">${escapeHtml(t.subject)}</div>

          <div class="ticket-meta-row">
            <span class="ticket-requester">👤 ${escapeHtml(requesterName)}</span>
            <span class="ticket-date" style="font-weight:600; color:#17494D;">📅 Created: ${dateStr}</span>
          </div>

          <div class="ticket-bottom-bar">
            <button class="btn-link btn-open-ticket" data-id="${t.id}">Open Ticket &rarr;</button>
            <span style="font-size:10px; color:#87929d;">Priority: <strong>${escapeHtml(t.priority || 'Normal')}</strong></span>
          </div>
        </div>
      `;
    }).join('');

    resizeApp();
  }

  // ==========================================
  // TAB 3: Duplicate Customer Ticket View
  // ==========================================

  function scanDuplicateCustomers() {
    elements.duplicatesList.innerHTML = '<div class="empty-state">Scanning active tickets for duplicate customers...</div>';

    if (state.isMockMode) {
      setTimeout(() => {
        const tickets = (window.MOCK_BACKLOG_TICKETS || []).filter(t => !['solved', 'closed'].includes(t.status));
        processDuplicateTickets(tickets);
      }, 250);
      return;
    }

    // Call Zendesk Search API for all active tickets
    state.client.request({
      url: `/api/v2/search.json?query=type:ticket status<solved`,
      type: 'GET',
      dataType: 'json'
    }).then(res => {
      const tickets = res.results || [];
      processDuplicateTickets(tickets);
    }).catch(err => {
      console.error('Duplicate scan error:', err);
      elements.duplicatesList.innerHTML = `<div class="empty-state" style="color:#d93f4c;">Scan error: ${err.statusText || 'Unable to scan tickets'}</div>`;
    });
  }

  function processDuplicateTickets(tickets) {
    const requesterMap = new Map();

    tickets.forEach(t => {
      const reqId = t.requester ? t.requester.id : (t.requester_id || 'unknown');
      const reqName = t.requester ? t.requester.name : `Customer #${reqId}`;
      const reqEmail = t.requester ? t.requester.email : '';

      if (!requesterMap.has(reqId)) {
        requesterMap.set(reqId, {
          id: reqId,
          name: reqName,
          email: reqEmail,
          tickets: []
        });
      }
      requesterMap.get(reqId).tickets.push(t);
    });

    // Filter for customers with 2 or more tickets
    const duplicates = Array.from(requesterMap.values()).filter(c => c.tickets.length > 1);
    
    // Sort customers with highest duplicate count first
    duplicates.sort((a, b) => b.tickets.length - a.tickets.length);
    state.duplicateRequesters = duplicates;

    const totalDuplicateTickets = duplicates.reduce((acc, curr) => acc + curr.tickets.length, 0);
    elements.dupRequestersCount.textContent = duplicates.length;
    elements.dupTotalTicketsCount.textContent = totalDuplicateTickets;

    if (duplicates.length > 0) {
      elements.tabDuplicatesCount.textContent = duplicates.length;
      elements.tabDuplicatesCount.classList.remove('hidden');
    } else {
      elements.tabDuplicatesCount.classList.add('hidden');
    }

    renderDuplicateResults();
    checkCurrentTicketDuplicates();
  }

  function renderDuplicateResults() {
    const list = state.duplicateRequesters;

    if (list.length === 0) {
      elements.duplicatesList.innerHTML = '<div class="empty-state">🎉 Great news! No duplicate open tickets found across active customers.</div>';
      resizeApp();
      return;
    }

    elements.duplicatesList.innerHTML = list.map(customer => {
      const ticketIdsList = customer.tickets.map(t => `#${t.id}`).join(', ');
      const rawIds = customer.tickets.map(t => t.id).join(', ');

      return `
        <div class="duplicate-card">
          <div class="customer-header">
            <div>
              <div class="customer-name">${escapeHtml(customer.name)}</div>
              <div class="customer-email">${escapeHtml(customer.email || 'No email')}</div>
            </div>
            <span class="badge badge-count">${customer.tickets.length} Open Tickets</span>
          </div>

          <div class="dup-tickets-sublist">
            ${customer.tickets.map(t => `
              <div class="dup-ticket-item">
                <div class="dup-ticket-info">
                  <span class="ticket-id" style="cursor:pointer;" onclick="window.appRoute(${t.id})">#${t.id}</span>
                  <span title="${escapeHtml(t.subject)}">${escapeHtml(t.subject)}</span>
                </div>
                <span class="badge badge-${t.status || 'open'}">${escapeHtml(t.status)}</span>
              </div>
            `).join('')}
          </div>

          <div class="dup-actions-bar">
            <button class="btn btn-secondary btn-sm btn-copy-dup-ids" data-ids="${rawIds}">
              Copy IDs for Merge
            </button>
            <button class="btn btn-primary btn-sm btn-open-ticket" data-id="${customer.tickets[0].id}">
              Review First Ticket &rarr;
            </button>
          </div>
        </div>
      `;
    }).join('');

    resizeApp();
  }

  function checkCurrentTicketDuplicates() {
    if (!state.currentTicket || !state.currentTicket.requester) return;

    const reqId = state.currentTicket.requester.id;
    const match = state.duplicateRequesters.find(c => String(c.id) === String(reqId));

    if (match && match.tickets.length > 1) {
      const otherTicketsCount = match.tickets.length - 1;
      elements.sidebarAlert.classList.remove('hidden');
      elements.sidebarDuplicateTitle.textContent = `${match.name} has ${otherTicketsCount} other open ticket(s)`;
      elements.sidebarDuplicateDesc.textContent = `Other tickets: ${match.tickets.filter(t => t.id !== state.currentTicket.id).map(t => '#' + t.id).join(', ')}`;
    } else {
      elements.sidebarAlert.classList.add('hidden');
    }
  }

  // ==========================================
  // Context & Initialization
  // ==========================================

  function switchTab(targetTabId) {
    state.activeTab = targetTabId;
    elements.navTabs.forEach(tab => {
      const isActive = tab.getAttribute('data-tab') === targetTabId;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    });

    elements.tabPanels.forEach(panel => {
      panel.classList.toggle('active', panel.id === targetTabId);
    });

    resizeApp();
  }

  function bindEvents() {
    // Nav tabs
    elements.navTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        switchTab(tab.getAttribute('data-tab'));
      });
    });

    // Refresh
    elements.btnRefresh.addEventListener('click', () => {
      if (state.activeTab === 'tab-description') runDescriptionSearch();
      else if (state.activeTab === 'tab-calendar') runCalendarFilter();
      else if (state.activeTab === 'tab-duplicates') scanDuplicateCustomers();
    });

    // Tab 1 events
    elements.btnRunDescSearch.addEventListener('click', runDescriptionSearch);
    elements.descSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') runDescriptionSearch();
    });
    elements.descSearchInput.addEventListener('input', (e) => {
      elements.descSearchClear.classList.toggle('hidden', !e.target.value);
    });
    elements.descSearchClear.addEventListener('click', () => {
      elements.descSearchInput.value = '';
      elements.descSearchClear.classList.add('hidden');
      runDescriptionSearch();
    });
    elements.keywordChips.forEach(chip => {
      chip.addEventListener('click', () => {
        elements.descSearchInput.value = chip.getAttribute('data-keyword');
        elements.descSearchClear.classList.remove('hidden');
        runDescriptionSearch();
      });
    });
    elements.btnCopyDescIds.addEventListener('click', (e) => {
      const ids = state.descResults.map(t => t.id).join(', ');
      copyTextToClipboard(ids, e.target, 'Copied Ticket IDs!');
    });

    // Tab 2 events
    elements.presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        elements.presetButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.calendarPreset = btn.getAttribute('data-preset');

        if (state.calendarPreset === 'custom') {
          elements.customDateBox.classList.remove('hidden');
        } else {
          elements.customDateBox.classList.add('hidden');
          runCalendarFilter();
        }
      });
    });
    elements.btnApplyCustomDate.addEventListener('click', runCalendarFilter);
    elements.btnRunCalendarFilter.addEventListener('click', runCalendarFilter);
    elements.btnCopyCalendarIds.addEventListener('click', (e) => {
      const ids = state.calendarResults.map(t => t.id).join(', ');
      copyTextToClipboard(ids, e.target, 'Copied Ticket IDs!');
    });

    // Tab 3 events
    elements.btnRescanDuplicates.addEventListener('click', scanDuplicateCustomers);
    elements.btnViewCustomerDuplicates.addEventListener('click', () => {
      switchTab('tab-duplicates');
    });

    // Global click delegate for ticket opening and ID copying
    document.addEventListener('click', (e) => {
      const openBtn = e.target.closest('.btn-open-ticket');
      if (openBtn) {
        const id = openBtn.getAttribute('data-id');
        routeToTicket(id);
        return;
      }

      const copyDupBtn = e.target.closest('.btn-copy-dup-ids');
      if (copyDupBtn) {
        const ids = copyDupBtn.getAttribute('data-ids');
        copyTextToClipboard(ids, copyDupBtn, 'Copied IDs!');
        return;
      }
    });

    // Helper for onclick in string templates
    window.appRoute = (id) => routeToTicket(id);
  }

  function loadTicketSidebarContext() {
    if (!state.client || (state.location !== 'ticket_sidebar' && state.location !== 'new_ticket_sidebar')) {
      return;
    }

    state.client.get(['ticket.id', 'ticket.requester']).then(data => {
      if (data && data['ticket.id']) {
        state.currentTicket = {
          id: data['ticket.id'],
          requester: data['ticket.requester']
        };
        checkCurrentTicketDuplicates();
      }
    }).catch(console.warn);
  }

  function initApp() {
    bindEvents();

    const isInsideZendesk = typeof window.ZAFClient !== 'undefined' && window.self !== window.top;

    if (!isInsideZendesk) {
      console.log('Running in Preview Mode with mock backlog data');
      state.isMockMode = true;
      elements.statusBadge.textContent = 'Preview Mode';
      elements.statusBadge.className = 'badge badge-count';

      // Set default mock open ticket for sidebar demonstration
      state.currentTicket = {
        id: 48921,
        requester: { id: 7001, name: 'Alex Rivera', email: 'alex.rivera@acme.corp' }
      };

      runDescriptionSearch();
      runCalendarFilter();
      scanDuplicateCustomers();
      return;
    }

    try {
      state.client = window.ZAFClient.init();

      state.client.context().then(ctx => {
        state.location = ctx.location || 'ticket_sidebar';
        elements.statusBadge.textContent = state.location === 'nav_bar' ? 'Nav Tray' : 'Sidebar';

        loadTicketSidebarContext();
        runDescriptionSearch();
        runCalendarFilter();
        scanDuplicateCustomers();
      }).catch(() => {
        runDescriptionSearch();
        runCalendarFilter();
        scanDuplicateCustomers();
      });

    } catch (e) {
      console.error('ZAF init failure:', e);
      state.isMockMode = true;
      runDescriptionSearch();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
