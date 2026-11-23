/**
 * Views & Duplicates Navigation Bar App
 * Zendesk Apps Framework (ZAF v2)
 *
 * Layout & Features:
 * 1. 2-Column Zendesk Native Views Layout (Left Sidebar + Right Table)
 * 2. Sidebar Views Navigation + Bottom Duplicate Tickets Queue link
 * 3. 30 Tickets Per Page Pagination with First / Prev / Page X of Y / Next / Last
 * 4. Hover Ticket Description & Latest Comment Popover (Exact Zendesk Style)
 * 5. 7-Field Collapsible Filter Drawer with Quick Date Presets
 * 6. Duplicate Customer Tickets Detection & Grouping with 1-Click Merge IDs Copy
 * 7. Clean Customer Meta (No raw numeric user IDs)
 */

(function () {
  'use strict';

  const state = {
    client: null,
    location: 'nav_bar',

    // Views & Sidebar State
    viewsList: [],
    selectedViewId: '',
    currentViewTitle: 'Your unsolved tickets',
    activeSection: 'view-tickets', // 'view-tickets' or 'duplicates'

    // Tickets State
    rawViewTickets: [],
    filteredViewTickets: [],

    // Multi-Tag Filter State
    selectedTags: [],
    availableTags: [],

    // Current Agent Info & Permissions (for strict views access filtering)
    currentUserId: null,
    currentUserName: '',
    currentUserGroupIds: new Set(),
    collapsedSections: {},

    // Pagination (Strict 30 Tickets per page) & View Table Selection
    pageSize: 30,
    currentPage: 1,
    selectedViewTicketIds: new Set(),

    // Zendesk Native Link Popover & Tooltip Pill
    linkPopoverState: null,
    activeTooltipLink: null,
    activeTooltipEditor: null,

    // Duplicate Customers State & Pagination (10 Customer Groups per page)
    duplicateRequesters: [],
    dupPageSize: 10,
    dupCurrentPage: 1,

    // Merge Modal State
    mergeState: {
      customer: null,
      customerId: null,
      sourceTicketIds: [],
      sourceTickets: [],
      allCustomerTickets: [],
      candidateTickets: [],
      targetTicket: null,
      searchQuery: '',
      isSubmitting: false,
      sourceCommentIsPublic: false,
      targetCommentIsPublic: false
    },

    // Macros & Bulk Edit State
    macros: [],
    macrosLoading: false,
    editState: {
      selectedTicketIds: [],
      selectedTickets: [],
      selectedMacro: null,
      evaluatedPayload: null,
      macroSearchQuery: '',
      isSubmitting: false
    }
  };

  const elements = {
    // Sidebar
    btnRefreshAll: document.getElementById('btn-refresh-all'),
    viewsList: document.getElementById('views-list'),
    navItemDuplicates: document.getElementById('nav-item-duplicates'),
    dupSidebarCount: document.getElementById('dup-sidebar-count'),

    // Main Sections
    sectionViewTickets: document.getElementById('section-view-tickets'),
    sectionDuplicates: document.getElementById('section-duplicates'),

    // View Header & Actions
    currentViewTitle: document.getElementById('current-view-title'),
    btnCopyViewIds: document.getElementById('btn-copy-view-ids'),
    btnRefreshCurrentView: document.getElementById('btn-refresh-current-view'),

    // Filter Toggle & Drawer (7 Fields)
    btnToggleFilters: document.getElementById('btn-toggle-filters'),
    filterActivePill: document.getElementById('filter-active-pill'),
    filtersDrawer: document.getElementById('filters-drawer'),
    btnResetViewFilters: document.getElementById('btn-reset-view-filters'),

    vfSubject: document.getElementById('vf-subject'),
    tagMultiselect: document.getElementById('tag-multiselect'),
    tagChipsWrap: document.getElementById('tag-chips-wrap'),
    tagChipInput: document.getElementById('tag-chip-input'),
    tagChevron: document.getElementById('tag-chevron'),
    tagDropdown: document.getElementById('tag-dropdown'),
    tagOptionsList: document.getElementById('tag-options-list'),
    vfStatus: document.getElementById('vf-status'),
    vfPriority: document.getElementById('vf-priority'),
    vfChannel: document.getElementById('vf-channel'),
    vfType: document.getElementById('vf-type'),
    vfRequester: document.getElementById('vf-requester'),
    vfAssignee: document.getElementById('vf-assignee'),
    vfDateFrom: document.getElementById('vf-date-from'),
    vfDateTo: document.getElementById('vf-date-to'),
    btnDate2026: document.getElementById('btn-date-2026'),
    btnDate30d: document.getElementById('btn-date-30d'),
    btnDateClear: document.getElementById('btn-date-clear'),

    // View Meta & Bulk Actions
    viewMetaCount: document.getElementById('view-meta-count'),
    viewMetaUpdated: document.getElementById('view-meta-updated'),
    viewSelectAllTickets: document.getElementById('view-select-all-tickets'),
    viewBulkActions: document.getElementById('view-bulk-actions'),
    viewBulkCount: document.getElementById('view-bulk-count'),
    btnViewBulkEdit: document.getElementById('btn-view-bulk-edit'),
    viewEditCount: document.getElementById('view-edit-count'),
    btnViewBulkMerge: document.getElementById('btn-view-bulk-merge'),
    btnViewBulkDelete: document.getElementById('btn-view-bulk-delete'),
    viewMergeCount: document.getElementById('view-merge-count'),
    viewDeleteCount: document.getElementById('view-delete-count'),

    // Table Body
    ticketsTableBody: document.getElementById('tickets-table-body'),

    // View Pagination Controls
    btnPageFirst: document.getElementById('btn-page-first'),
    btnPagePrev: document.getElementById('btn-page-prev'),
    paginationPagesIndicator: document.getElementById('pagination-pages-indicator'),
    btnPageNext: document.getElementById('btn-page-next'),
    btnPageLast: document.getElementById('btn-page-last'),

    // Duplicates Section & Pagination Controls
    dupRequestersCount: document.getElementById('dup-requesters-count'),
    dupTotalTicketsCount: document.getElementById('dup-total-tickets-count'),
    btnRescanDuplicates: document.getElementById('btn-rescan-duplicates'),
    duplicatesList: document.getElementById('duplicates-list'),
    dupMetaCount: document.getElementById('dup-meta-count'),
    dupMetaUpdated: document.getElementById('dup-meta-updated'),
    btnDupPageFirst: document.getElementById('btn-dup-page-first'),
    btnDupPagePrev: document.getElementById('btn-dup-page-prev'),
    dupPaginationPagesIndicator: document.getElementById('dup-pagination-pages-indicator'),
    btnDupPageNext: document.getElementById('btn-dup-page-next'),
    btnDupPageLast: document.getElementById('btn-dup-page-last'),

    // Merge Modal Elements (Native Zendesk Style)
    mergeModal: document.getElementById('merge-modal'),
    btnCloseMergeModal: document.getElementById('btn-close-merge-modal'),
    btnCancelMerge: document.getElementById('btn-cancel-merge'),
    btnConfirmMerge: document.getElementById('btn-confirm-merge'),
    mergeBtnText: document.getElementById('merge-btn-text'),
    mergeBtnSpinner: document.getElementById('merge-btn-spinner'),
    mergeSourceList: document.getElementById('merge-source-list'),
    mergeSourceCountBadge: document.getElementById('merge-source-count-badge'),
    mergeTargetSearch: document.getElementById('merge-target-search'),
    btnMergeSearchGo: document.getElementById('btn-merge-search-go'),
    mergeTargetCandidates: document.getElementById('merge-target-candidates'),
    mergeCandidatesTitle: document.getElementById('merge-candidates-title'),
    mergeSelectedTargetCard: document.getElementById('merge-selected-target-card'),
    mergeSelectedTargetContent: document.getElementById('merge-selected-target-content'),
    mergeOrgWarning: document.getElementById('merge-org-warning'),
    btnDismissOrgWarning: document.getElementById('btn-dismiss-org-warning'),
    mergeDestinationBadge: document.getElementById('merge-destination-badge'),
    mergeTargetComment: document.getElementById('merge-target-comment'),
    mergeSourceComment: document.getElementById('merge-source-comment'),
    btnPrivacyClosing: document.getElementById('btn-privacy-closing'),
    menuPrivacyClosing: document.getElementById('menu-privacy-closing'),
    textPrivacyClosing: document.getElementById('text-privacy-closing'),
    btnPrivacyDestination: document.getElementById('btn-privacy-destination'),
    menuPrivacyDestination: document.getElementById('menu-privacy-destination'),
    textPrivacyDestination: document.getElementById('text-privacy-destination'),
    mergeModalAlert: document.getElementById('merge-modal-alert'),
    appToast: document.getElementById('app-toast'),

    // Zendesk Native Link Popover
    zdLinkPopover: document.getElementById('zd-link-popover'),
    zdLinkUrl: document.getElementById('zd-link-url'),
    zdLinkText: document.getElementById('zd-link-text'),
    btnCancelLink: document.getElementById('btn-cancel-link'),
    btnAddLink: document.getElementById('btn-add-link'),

    // Zendesk Native Link Action Tooltip Pill (Exact Image 2)
    zdLinkTooltip: document.getElementById('zd-link-tooltip'),
    zdLinkTooltipUrl: document.getElementById('zd-link-tooltip-url'),
    btnLinkActionOpen: document.getElementById('btn-link-action-open'),
    btnLinkActionEdit: document.getElementById('btn-link-action-edit'),
    btnLinkActionUnlink: document.getElementById('btn-link-action-unlink'),

    // Bulk Edit / Macro Modal
    editModal: document.getElementById('edit-modal'),
    editModalTitle: document.getElementById('edit-modal-title'),
    editModalTicketCount: document.getElementById('edit-modal-ticket-count'),
    btnCloseEditModal: document.getElementById('btn-close-edit-modal'),
    btnCancelEdit: document.getElementById('btn-cancel-edit'),
    btnConfirmApplyMacro: document.getElementById('btn-confirm-apply-macro'),
    editBtnText: document.getElementById('edit-btn-text'),
    editBtnSpinner: document.getElementById('edit-btn-spinner'),
    editTicketsChips: document.getElementById('edit-tickets-chips'),
    editMacroSearch: document.getElementById('edit-macro-search'),
    btnClearMacroSearch: document.getElementById('btn-clear-macro-search'),
    editMacroList: document.getElementById('edit-macro-list'),
    editMacroStatusText: document.getElementById('edit-macro-status-text'),
    editMacroPreviewWrap: document.getElementById('edit-macro-preview-wrap'),
    editPreviewMacroName: document.getElementById('edit-preview-macro-name'),
    btnClearSelectedMacro: document.getElementById('btn-clear-selected-macro'),
    editPreviewBadges: document.getElementById('edit-preview-badges'),
    editPreviewCommentGroup: document.getElementById('edit-preview-comment-group'),
    editCommentPrivacyPill: document.getElementById('edit-comment-privacy-pill'),
    editPreviewCommentBody: document.getElementById('edit-preview-comment-body'),
    editModalAlert: document.getElementById('edit-modal-alert'),

    // Bulk Delete Modal Elements
    deleteModal: document.getElementById('delete-modal'),
    btnCloseDeleteModal: document.getElementById('btn-close-delete-modal'),
    btnCancelDelete: document.getElementById('btn-cancel-delete'),
    btnConfirmDelete: document.getElementById('btn-confirm-delete'),
    deleteBtnText: document.getElementById('delete-btn-text'),
    deleteBtnSpinner: document.getElementById('delete-btn-spinner'),
    deleteModalCount: document.getElementById('delete-modal-count'),
    deleteTicketsList: document.getElementById('delete-tickets-list'),
    deleteModalAlert: document.getElementById('delete-modal-alert'),

    // Hover Popover
    ticketHoverPopover: document.getElementById('ticket-hover-popover'),
    popoverStatusBadge: document.getElementById('popover-status-badge'),
    popoverTicketId: document.getElementById('popover-ticket-id'),
    popoverSubject: document.getElementById('popover-subject'),
    popoverDetails: document.getElementById('popover-details'),
    popoverAuthor: document.getElementById('popover-author'),
    popoverDate: document.getElementById('popover-date'),
    popoverCommentBody: document.getElementById('popover-comment-body')
  };

  let popoverShowTimeout = null;
  let popoverHideTimeout = null;
  let activeHoveredTicketId = null;

  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function routeToTicket(ticketId) {
    if (state.client && typeof state.client.invoke === 'function') {
      state.client.invoke('routeTo', 'ticket', ticketId).catch(() => {
        window.open(`/agent/tickets/${ticketId}`, '_blank');
      });
    } else {
      alert(`[Preview Mode] Open Ticket #${ticketId}`);
    }
  }

  function copyTextToClipboard(text, btnElement, successMsg = 'Copied!') {
    if (!navigator.clipboard) {
      prompt('Copy to clipboard:', text);
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      const orig = btnElement.innerHTML;
      btnElement.innerHTML = `&#10003; ${successMsg}`;
      setTimeout(() => { btnElement.innerHTML = orig; }, 1600);
    }).catch(() => {
      prompt('Copy to clipboard:', text);
    });
  }

  // ==========================================
  // SIDEBAR & VIEW ACCESS MANAGEMENT
  // ==========================================

  function loadCurrentAgentInfo() {
    if (!state.client) return Promise.resolve();

    return Promise.all([
      state.client.get('currentUser').catch(() => null),
      state.client.request({
        url: '/api/v2/users/me.json',
        type: 'GET',
        dataType: 'json'
      }).catch(() => null)
    ]).then(([zafRes, meRes]) => {
      const zUser = (zafRes && zafRes.currentUser) ? zafRes.currentUser : {};
      const apiUser = (meRes && meRes.user) ? meRes.user : {};

      const resolvedId = apiUser.id || zUser.id;
      if (resolvedId) {
        state.currentUserId = String(resolvedId);
      }
      state.currentUserName = apiUser.name || zUser.name || '';
      const role = (apiUser.role || zUser.role || '').toLowerCase();
      state.currentUserRole = role;
      state.isAdmin = role === 'admin';
      state.currentUserGroupIds.clear();

      const defaultGid = apiUser.default_group_id || zUser.defaultGroupId;
      if (defaultGid) {
        state.currentUserGroupIds.add(String(defaultGid));
      }

      const groups = zUser.groups || [];
      if (Array.isArray(groups)) {
        groups.forEach(g => {
          const gid = (g && typeof g === 'object') ? g.id : g;
          if (gid !== undefined && gid !== null) {
            state.currentUserGroupIds.add(String(gid));
          }
        });
      }

      if (state.currentUserId) {
        return state.client.request({
          url: `/api/v2/users/${state.currentUserId}/group_memberships.json`,
          type: 'GET',
          dataType: 'json'
        }).then(gmRes => {
          if (gmRes && Array.isArray(gmRes.group_memberships)) {
            gmRes.group_memberships.forEach(gm => {
              if (gm && gm.group_id) {
                state.currentUserGroupIds.add(String(gm.group_id));
              }
            });
          }
        }).catch(gmErr => {
          console.warn('Could not load group_memberships via REST API:', gmErr);
        });
      }
    }).catch(err => {
      console.warn('Error in loadCurrentAgentInfo:', err);
    });
  }

  // Detect whether a view is personal to the current agent
  function isViewPersonalToCurrentUser(view) {
    if (!view) return false;

    // 1. Restriction strictly matching current logged-in agent ID
    const r = view.restriction;
    if (r && (r.type || '').toLowerCase() === 'user') {
      return String(r.id) === String(state.currentUserId);
    }

    // 2. Conditions check for assignee is current_user / me / current agent ID
    const conds = view.conditions || {};
    const allConds = [...(conds.all || []), ...(conds.any || [])];
    const hasCurrentUserAssignee = allConds.some(c => {
      const field = (c.field || '').toLowerCase();
      const val = String(c.value || '').toLowerCase();
      if (field === 'assignee_id' || field === 'assignee') {
        if (val === 'current_user' || val === 'me' || (state.currentUserId && val === String(state.currentUserId))) {
          return true;
        }
      }
      return false;
    });
    if (hasCurrentUserAssignee) return true;

    // 3. Native Zendesk personal view titles
    const titleLower = (view.title || '').trim().toLowerCase();
    if (
      titleLower.includes('your unsolved') ||
      titleLower.includes('my unsolved') ||
      titleLower.includes('assigned to me') ||
      titleLower.includes('my tickets') ||
      titleLower.includes('tickets assigned to you')
    ) {
      return true;
    }

    return false;
  }

  function isViewAccessibleToCurrentAgent(view) {
    if (!view) return false;

    const r = view.restriction;
    if (r && r.type) {
      const rType = r.type.toLowerCase();

      // If personal view: STRICTLY only allow if it belongs to current logged-in agent
      // Discard any personal view belonging to another agent!
      if (rType === 'user') {
        if (!state.currentUserId || r.id === undefined || r.id === null) return false;
        return String(r.id) === String(state.currentUserId);
      }

      // If group view: allow if admin or if current agent is member of the group
      if (rType === 'group') {
        if (state.isAdmin) return true;
        if (Array.isArray(r.ids) && r.ids.length > 0) {
          return r.ids.some(gid => state.currentUserGroupIds.has(String(gid)));
        }
        if (r.id !== undefined && r.id !== null) {
          return state.currentUserGroupIds.has(String(r.id));
        }
        return false;
      }

      return false;
    }

    // Shared / unrestricted views are accessible to all
    return true;
  }

  function loadViewsList() {
    elements.viewsList.innerHTML = '<div class="views-loading">Loading Views...</div>';

    if (!state.client) {
      elements.viewsList.innerHTML = '<div class="views-loading" style="color:#d93f4c;">Zendesk SDK not connected</div>';
      return;
    }

    loadCurrentAgentInfo().then(() => {
      // Helper to fetch all pages for a given view query
      function fetchViewsPaginated(endpointUrl) {
        let accumulatedViews = [];
        function getBatch(url) {
          return state.client.request({
            url: url,
            type: 'GET',
            dataType: 'json'
          }).then(res => {
            const list = res.views || [];
            accumulatedViews = accumulatedViews.concat(list);
            if (res.next_page && accumulatedViews.length < 500) {
              let nextUrl = res.next_page;
              const match = nextUrl.match(/\/api\/v2\/.+$/);
              if (match) nextUrl = match[0];
              return getBatch(nextUrl);
            }
            return accumulatedViews;
          }).catch(err => {
            console.warn('View fetch error on', url, err);
            return accumulatedViews;
          });
        }
        return getBatch(endpointUrl);
      }

      // 1. ONLY fetch current user's personal views: GET /api/v2/views/active.json?access=personal
      const personalPromise = fetchViewsPaginated('/api/v2/views/active.json?access=personal&per_page=100');

      // 2. ONLY fetch legitimate shared views: GET /api/v2/views/active.json?access=shared
      const sharedPromise = fetchViewsPaginated('/api/v2/views/active.json?access=shared&per_page=100');

      return Promise.all([personalPromise, sharedPromise]);
    }).then(([personalList, sharedList]) => {
      const seenIds = new Set();
      const combinedViews = [];

      // Tag and add Shared Views
      (sharedList || []).forEach(v => {
        if (v && v.id && !seenIds.has(String(v.id))) {
          seenIds.add(String(v.id));
          v._scope = 'shared';
          combinedViews.push(v);
        }
      });

      // Tag and add Personal Views (strictly belonging to the logged-in user)
      (personalList || []).forEach(v => {
        if (v && v.id && !seenIds.has(String(v.id))) {
          seenIds.add(String(v.id));
          v._scope = 'personal';
          combinedViews.push(v);
        }
      });

      // Filter with permission validator for absolute safety
      state.viewsList = combinedViews.filter(isViewAccessibleToCurrentAgent);

      // Sort strictly by native Zendesk 'position' (1st, 2nd, 3rd...)
      state.viewsList.sort((a, b) => {
        const posA = (a.position !== undefined && a.position !== null) ? a.position : 9999;
        const posB = (b.position !== undefined && b.position !== null) ? b.position : 9999;
        return posA - posB;
      });

      renderSidebarViews();
    }).catch(err => {
      console.error('Error fetching active views:', err);
      elements.viewsList.innerHTML = '<div class="views-loading" style="color:#d93f4c;">Failed to load views</div>';
    });
  }

  // Count functions disabled as requested (no ticket counts in app)
  function fetchAllViewCounts() {}
  function updateViewCountInDOM() {}
  function fetchSingleViewCount() {}

  function updateCurrentViewTitle() {
    if (!elements.currentViewTitle) return;

    const viewObj = state.viewsList.find(v => String(v.id) === String(state.selectedViewId));
    const baseTitle = (viewObj && viewObj.title) ? viewObj.title : (state.currentViewTitle || 'Tickets');
    elements.currentViewTitle.textContent = baseTitle;
  }

  function getViewScope(view) {
    if (!view) return 'shared';
    if (view._scope) return view._scope;
    if (isViewPersonalToCurrentUser(view)) return 'personal';
    return 'shared';
  }

  function renderSingleViewItem(v) {
    const isSelected = String(v.id) === String(state.selectedViewId);

    return `
      <div class="view-item ${isSelected ? 'active' : ''}" data-view-id="${v.id}" data-view-title="${escapeHtml(v.title)}" title="${escapeHtml(v.title)}">
        <span class="view-item-title">${escapeHtml(v.title)}</span>
      </div>
    `;
  }

  function renderSidebarViews() {
    if (state.viewsList.length === 0) {
      elements.viewsList.innerHTML = '<div class="views-loading">No views available for your account</div>';
      return;
    }

    // Segregate into Personal Views and Shared Views ONLY (No Group Views)
    const personalViews = [];
    const sharedViews = [];

    state.viewsList.forEach(v => {
      const scope = getViewScope(v);
      if (scope === 'personal') {
        personalViews.push(v);
      } else {
        sharedViews.push(v);
      }
    });

    let html = '';

    // 1. Shared Views Dropdown FIRST (Bold header - Includes all team and group-shared views)
    if (sharedViews.length > 0) {
      const isCollapsed = !!state.collapsedSections['shared'];
      html += `
        <div class="views-section-header ${isCollapsed ? 'collapsed' : ''}" data-section="shared" title="Shared Views">
          <div class="views-section-left">
            <svg class="views-section-chevron-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            <span class="views-section-title">Shared Views</span>
          </div>
        </div>
        <div class="views-section-items ${isCollapsed ? 'collapsed' : ''}">
          ${sharedViews.map(renderSingleViewItem).join('')}
        </div>
      `;
    }

    // 2. Personal Views Dropdown THEN (Bold header)
    if (personalViews.length > 0) {
      const isCollapsed = !!state.collapsedSections['personal'];
      html += `
        <div class="views-section-header ${isCollapsed ? 'collapsed' : ''}" data-section="personal" title="Personal Views">
          <div class="views-section-left">
            <svg class="views-section-chevron-icon" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
            <span class="views-section-title">Personal Views</span>
          </div>
        </div>
        <div class="views-section-items ${isCollapsed ? 'collapsed' : ''}">
          ${personalViews.map(renderSingleViewItem).join('')}
        </div>
      `;
    }

    elements.viewsList.innerHTML = html;

    // If no view is selected yet or selected view is no longer in viewsList, select the first accessible view
    const currentSelectedStillValid = state.viewsList.some(v => String(v.id) === String(state.selectedViewId));
    if (!currentSelectedStillValid && state.viewsList.length > 0) {
      const firstRendered = (sharedViews.length > 0 ? sharedViews[0] : personalViews[0]) || state.viewsList[0];
      selectView(firstRendered.id, firstRendered.title);
    }
  }

  function selectView(viewId, viewTitle) {
    state.selectedViewId = String(viewId);
    state.currentViewTitle = viewTitle || 'Tickets';
    state.activeSection = 'view-tickets';

    // Update Section Visibility
    elements.sectionViewTickets.classList.add('active');
    elements.sectionDuplicates.classList.remove('active');

    // Update Sidebar Highlights
    elements.navItemDuplicates.classList.remove('active');
    document.querySelectorAll('.view-item[data-view-id]').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-view-id') === String(viewId));
    });

    // Update View Title
    updateCurrentViewTitle();

    fetchTicketsForSelectedView(true);
  }

  function showDuplicateTicketsSection() {
    state.activeSection = 'duplicates';

    // Update Section Visibility
    elements.sectionViewTickets.classList.remove('active');
    elements.sectionDuplicates.classList.add('active');

    // Update Sidebar Highlights
    document.querySelectorAll('.view-item[data-view-id]').forEach(el => {
      el.classList.remove('active');
    });
    elements.navItemDuplicates.classList.add('active');

    scanDuplicateCustomers();
  }

  // ==========================================
  // VIEW TICKETS FETCHING & FILTERING
  // ==========================================

  function fetchTicketsForSelectedView(smoothTransition = true) {
    if (!state.selectedViewId || !state.client) return;

    state.selectedViewTicketIds.clear();
    updateViewBulkActionBar();

    const tableWrap = document.querySelector('.tickets-table-wrap');
    if (tableWrap) tableWrap.classList.add('is-loading');

    elements.ticketsTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="table-loading-cell">Loading view tickets...</td>
      </tr>
    `;

    const currentViewId = state.selectedViewId;
    const viewObj = state.viewsList.find(v => String(v.id) === String(currentViewId));
    const isPersonal = isViewPersonalToCurrentUser(viewObj);

    let allTickets = [];
    const usersMap = new Map();

    function fetchViewPage(pageUrl) {
      state.client.request({
        url: pageUrl,
        type: 'GET',
        dataType: 'json'
      }).then(res => {
        // Abort if the user switched to another view while in flight
        if (state.selectedViewId !== currentViewId) return;

        const rawTickets = res.tickets || res.results || [];
        if (Array.isArray(res.users)) {
          res.users.forEach(u => usersMap.set(u.id, u));
        }

        const mapped = rawTickets.map(t => {
          if (!t.requester && t.requester_id && usersMap.has(t.requester_id)) {
            t.requester = usersMap.get(t.requester_id);
          }
          return t;
        }).filter(t => {
          // If this view is personal, strictly show tickets assigned to the logged-in agent!
          if (isPersonal && state.currentUserId) {
            const aid = t.assignee_id || (t.assignee && t.assignee.id);
            return aid && String(aid) === String(state.currentUserId);
          }
          return true;
        });

        allTickets = allTickets.concat(mapped);
        state.rawViewTickets = allTickets;

        populateDynamicChannels(allTickets);
        updateAvailableTags(allTickets);
        applyViewFilters();
        if (tableWrap) tableWrap.classList.remove('is-loading');

        // Check if there are further pages of tickets to fetch
        if (res.next_page && allTickets.length < 3000) {
          let nextUrl = res.next_page;
          const match = nextUrl.match(/\/api\/v2\/.+$/);
          if (match) nextUrl = match[0];
          fetchViewPage(nextUrl);
        }
      }).catch(err => {
        console.warn('tickets.json error, trying execute.json fallback:', err);
        if (allTickets.length === 0) {
          state.client.request({
            url: `/api/v2/views/${state.selectedViewId}/execute.json?per_page=100`,
            type: 'GET',
            dataType: 'json'
          }).then(execRes => {
            const rows = execRes.rows || [];
            const mappedRows = rows.map(r => r.ticket || r).filter(t => {
              if (isPersonal && state.currentUserId) {
                const aid = t.assignee_id || (t.assignee && t.assignee.id);
                return aid && String(aid) === String(state.currentUserId);
              }
              return true;
            });
            state.rawViewTickets = mappedRows;
            state.currentPage = 1;

            populateDynamicChannels(state.rawViewTickets);
            updateAvailableTags(state.rawViewTickets);
            applyViewFilters();
            if (tableWrap) tableWrap.classList.remove('is-loading');
          }).catch(finalErr => {
            console.error('execute.json failed:', finalErr);
            elements.ticketsTableBody.innerHTML = `
              <tr>
                <td colspan="8" class="table-empty-cell" style="color:#d93f4c;">Unable to load tickets for this view.</td>
              </tr>
            `;
            if (tableWrap) tableWrap.classList.remove('is-loading');
          });
        }
      });
    }

    // For native "Your unsolved tickets" view, query tickets directly assigned to current user so other agents' tickets never show!
    const titleLower = (viewObj && viewObj.title ? viewObj.title : state.currentViewTitle || '').toLowerCase();
    if (state.currentUserId && (titleLower.includes('your unsolved') || titleLower.includes('my unsolved'))) {
      fetchViewPage(`/api/v2/users/${state.currentUserId}/tickets/assigned.json?include=users&per_page=100`);
    } else {
      fetchViewPage(`/api/v2/views/${state.selectedViewId}/tickets.json?include=users&per_page=100`);
    }
  }

  // Helper: Extract normalized channel identifier from ticket object
  function getTicketChannel(t) {
    if (!t) return '';
    if (t.via && t.via.channel) return String(t.via.channel).toLowerCase();
    if (t.channel) return String(t.channel).toLowerCase();
    return '';
  }

  // Populate any custom channels present in loaded tickets into channel filter select
  function populateDynamicChannels(tickets) {
    if (!elements.vfChannel || !Array.isArray(tickets)) return;
    const currentVal = elements.vfChannel.value.toLowerCase();
    const existingValues = new Set(Array.from(elements.vfChannel.options).map(o => o.value.toLowerCase()));

    tickets.forEach(t => {
      const ch = getTicketChannel(t);
      if (ch && !existingValues.has(ch)) {
        existingValues.add(ch);
        const opt = document.createElement('option');
        opt.value = ch;
        opt.textContent = capitalize(ch.replace(/_/g, ' '));
        elements.vfChannel.appendChild(opt);
      }
    });

    if (currentVal) {
      elements.vfChannel.value = currentVal;
    }
  }

  // ==========================================
  // MULTI-TAG SELECTOR LOGIC
  // ==========================================

  // Collect all unique tags dynamically from loaded tickets with their counts
  function updateAvailableTags(tickets) {
    if (!Array.isArray(tickets)) return;
    const tagCountMap = new Map();
    tickets.forEach(t => {
      if (Array.isArray(t.tags)) {
        t.tags.forEach(tag => {
          if (tag) {
            const clean = String(tag).trim().toLowerCase();
            if (clean) {
              tagCountMap.set(clean, (tagCountMap.get(clean) || 0) + 1);
            }
          }
        });
      }
    });

    state.availableTags = Array.from(tagCountMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    renderTagDropdownOptions(elements.tagChipInput ? elements.tagChipInput.value : '');
  }

  // Render selected tag chips
  function renderTagChips() {
    if (!elements.tagChipsWrap) return;
    elements.tagChipsWrap.innerHTML = state.selectedTags.map(tag => `
      <span class="tag-chip" data-tag="${escapeHtml(tag)}">
        <span class="tag-chip-label">${escapeHtml(tag)}</span>
        <span class="tag-chip-remove" data-action="remove" title="Remove tag">&times;</span>
      </span>
    `).join('');

    if (elements.tagChipInput) {
      if (state.selectedTags.length > 0) {
        elements.tagChipInput.placeholder = 'add tag...';
      } else {
        elements.tagChipInput.placeholder = 'e.g. vip, sub...';
      }
    }
  }

  // Add tag
  function addTag(tagText) {
    if (!tagText) return;
    const clean = String(tagText).trim().toLowerCase();
    if (!clean) return;
    if (!state.selectedTags.includes(clean)) {
      state.selectedTags.push(clean);
      renderTagChips();
      applyViewFilters();
    }
    if (elements.tagChipInput) {
      elements.tagChipInput.value = '';
    }
    renderTagDropdownOptions('');
    if (elements.tagMultiselect) {
      setTimeout(() => {
        elements.tagMultiselect.scrollTop = elements.tagMultiselect.scrollHeight;
      }, 0);
    }
  }

  // Remove tag
  function removeTag(tagText) {
    const clean = String(tagText).trim().toLowerCase();
    const idx = state.selectedTags.indexOf(clean);
    if (idx !== -1) {
      state.selectedTags.splice(idx, 1);
      renderTagChips();
      applyViewFilters();
      renderTagDropdownOptions(elements.tagChipInput ? elements.tagChipInput.value : '');
    }
  }

  // Render dropdown options based on query
  function renderTagDropdownOptions(query = '') {
    if (!elements.tagOptionsList) return;
    const q = String(query).trim().toLowerCase();
    const unselectedTags = state.availableTags.filter(t => !state.selectedTags.includes(t.name));
    const matching = q ? unselectedTags.filter(t => t.name.includes(q)) : unselectedTags;

    let html = '';

    if (q && !state.selectedTags.includes(q)) {
      const exactMatch = state.availableTags.some(t => t.name.toLowerCase() === q);
      if (!exactMatch) {
        html += `
          <div class="tag-option-item tag-option-custom" data-tag="${escapeHtml(q)}">
            <span class="tag-option-name">+ Add "${escapeHtml(q)}"</span>
            <span class="tag-option-badge">new tag</span>
          </div>
        `;
      }
    }

    if (matching.length === 0 && !html) {
      html = `<div class="tag-options-empty">No tags found</div>`;
    } else {
      html += matching.slice(0, 50).map(t => `
        <div class="tag-option-item" data-tag="${escapeHtml(t.name)}">
          <span class="tag-option-name">${escapeHtml(t.name)}</span>
          <span class="tag-option-count">${t.count}</span>
        </div>
      `).join('');
    }

    elements.tagOptionsList.innerHTML = html;
  }

  function openTagDropdown() {
    if (!elements.tagDropdown) return;
    renderTagDropdownOptions(elements.tagChipInput ? elements.tagChipInput.value : '');
    elements.tagDropdown.classList.remove('hidden');
    if (elements.tagMultiselect) elements.tagMultiselect.classList.add('open');
  }

  function closeTagDropdown() {
    if (!elements.tagDropdown) return;
    elements.tagDropdown.classList.add('hidden');
    if (elements.tagMultiselect) elements.tagMultiselect.classList.remove('open');
  }

  // 9-Field Filter Logic: [1. Subject/Desc, 2. Tags (Multi), 3. Status, 4. Priority, 5. Channel, 6. Type, 7. Requester, 8. Assignee, 9. Request Date]
  function applyViewFilters() {
    const subjectQuery = elements.vfSubject.value.trim().toLowerCase();
    const statusVal = elements.vfStatus.value.toLowerCase();
    const priorityVal = elements.vfPriority.value.toLowerCase();
    const channelVal = elements.vfChannel ? elements.vfChannel.value.toLowerCase() : '';
    const typeVal = elements.vfType.value.toLowerCase();
    const requesterQuery = elements.vfRequester.value.trim().toLowerCase();
    const assigneeVal = elements.vfAssignee ? elements.vfAssignee.value.toLowerCase() : '';
    const fromDateVal = elements.vfDateFrom.value;
    const toDateVal = elements.vfDateTo.value;

    const fromDate = fromDateVal ? new Date(fromDateVal + 'T00:00:00Z') : null;
    const toDate = toDateVal ? new Date(toDateVal + 'T23:59:59Z') : null;

    // Count active filters for badge
    let activeFilterCount = 0;
    if (subjectQuery) activeFilterCount++;
    if (state.selectedTags.length > 0) activeFilterCount++;
    if (statusVal) activeFilterCount++;
    if (priorityVal) activeFilterCount++;
    if (channelVal) activeFilterCount++;
    if (typeVal) activeFilterCount++;
    if (requesterQuery) activeFilterCount++;
    if (assigneeVal) activeFilterCount++;
    if (fromDateVal || toDateVal) activeFilterCount++;

    if (activeFilterCount > 0) {
      elements.filterActivePill.textContent = `${activeFilterCount} active`;
      elements.filterActivePill.classList.remove('hidden');
      elements.btnToggleFilters.classList.add('active-filter');
    } else {
      elements.filterActivePill.classList.add('hidden');
      elements.btnToggleFilters.classList.remove('active-filter');
    }

    state.filteredViewTickets = state.rawViewTickets.filter(t => {
      // 1. Subject & Description Filter
      if (subjectQuery) {
        const ticketSubject = (t.subject || '').toLowerCase();
        const ticketDesc = (t.description || '').toLowerCase();
        if (!ticketSubject.includes(subjectQuery) && !ticketDesc.includes(subjectQuery)) {
          return false;
        }
      }

      // 2. Multi-Tag Filter (Dynamic match for 1 or more tags)
      if (state.selectedTags.length > 0) {
        const ticketTags = Array.isArray(t.tags)
          ? t.tags.map(tag => String(tag).toLowerCase())
          : [];

        const matchAll = state.selectedTags.every(selTag =>
          ticketTags.some(tt => tt.includes(selTag))
        );
        if (!matchAll) return false;
      }

      // 3. Status Filter
      if (statusVal) {
        const ticketStatus = (t.status || '').toLowerCase();
        if (statusVal === 'hold' && (ticketStatus === 'hold' || ticketStatus === 'on-hold')) {
          // match
        } else if (ticketStatus !== statusVal) {
          return false;
        }
      }

      // 4. Priority Filter
      if (priorityVal) {
        const ticketPriority = (t.priority || '').toLowerCase();
        if (ticketPriority !== priorityVal) return false;
      }

      // 5. Channel Filter
      if (channelVal) {
        const ch = getTicketChannel(t);
        let match = false;
        if (ch === channelVal || ch.includes(channelVal)) {
          match = true;
        } else if (channelVal === 'voice' && (ch.includes('phone') || ch.includes('call') || ch.includes('cti'))) {
          match = true;
        } else if (channelVal === 'web' && (ch.includes('help_center') || ch.includes('helpcenter') || ch.includes('form') || ch.includes('widget') || ch.includes('portal'))) {
          match = true;
        } else if (channelVal === 'messaging' && (ch.includes('chat') || ch.includes('sunshine') || ch.includes('conversation') || ch.includes('social'))) {
          match = true;
        } else if (channelVal === 'social' && (ch.includes('facebook') || ch.includes('twitter') || ch.includes('instagram') || ch.includes('whatsapp') || ch.includes('line'))) {
          match = true;
        } else if (channelVal === 'help_center' && (ch.includes('help') || ch.includes('guide') || ch.includes('hc'))) {
          match = true;
        } else if (channelVal === 'sms' && (ch.includes('text') || ch.includes('sms'))) {
          match = true;
        }
        if (!match) return false;
      }

      // 6. Type Filter
      if (typeVal) {
        const ticketType = (t.type || '').toLowerCase();
        if (ticketType !== typeVal) return false;
      }

      // 7. Requester Filter (Name or Email only - NO raw ID)
      if (requesterQuery) {
        const reqName = t.requester ? (t.requester.name || '').toLowerCase() : '';
        const reqEmail = t.requester ? (t.requester.email || '').toLowerCase() : '';
        const matchRequester = reqName.includes(requesterQuery) || reqEmail.includes(requesterQuery);
        if (!matchRequester) return false;
      }

      // 8. Assignee Filter
      if (assigneeVal) {
        const aid = t.assignee_id || (t.assignee && t.assignee.id);
        if (assigneeVal === 'me') {
          if (!state.currentUserId || String(aid) !== String(state.currentUserId)) {
            return false;
          }
        } else if (assigneeVal === 'unassigned') {
          if (aid) return false;
        }
      }

      // 9. Request Date Range
      if (fromDate || toDate) {
        const createdDate = new Date(t.created_at);
        if (fromDate && createdDate < fromDate) return false;
        if (toDate && createdDate > toDate) return false;
      }

      return true;
    });

    // Reset pagination to page 1 if current page exceeds total pages
    const totalPages = Math.max(1, Math.ceil(state.filteredViewTickets.length / state.pageSize));
    if (state.currentPage > totalPages) {
      state.currentPage = 1;
    }

    state.selectedViewTicketIds.clear();
    updateViewBulkActionBar();
    renderViewTicketsTable();
  }

  // ==========================================
  // TABLE RENDERING & PAGINATION (30 PER PAGE)
  // ==========================================

  function renderViewTicketsTable() {
    const list = state.filteredViewTickets;
    const totalCount = list.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / state.pageSize));

    // Update View Subheader Info
    elements.viewMetaCount.textContent = `${totalCount} tickets (Page ${state.currentPage} of ${totalPages})`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    elements.viewMetaUpdated.textContent = `Last updated ${nowTime}`;

    // Update Pagination Controls
    elements.paginationPagesIndicator.textContent = `Page ${state.currentPage} of ${totalPages}`;
    elements.btnPageFirst.disabled = state.currentPage === 1;
    elements.btnPagePrev.disabled = state.currentPage === 1;
    elements.btnPageNext.disabled = state.currentPage === totalPages || totalPages === 0;
    elements.btnPageLast.disabled = state.currentPage === totalPages || totalPages === 0;

    if (totalCount === 0) {
      elements.ticketsTableBody.innerHTML = `
        <tr>
          <td colspan="8" class="table-empty-cell">
            ${state.rawViewTickets.length === 0 ? 'No tickets in this view.' : 'No tickets match the active filters. Click "Reset All Filters" to clear.'}
          </td>
        </tr>
      `;
      updateViewBulkActionBar();
      return;
    }

    // Slice tickets for the current page (strictly 30 items)
    const startIndex = (state.currentPage - 1) * state.pageSize;
    const pageTickets = list.slice(startIndex, startIndex + state.pageSize);

    elements.ticketsTableBody.innerHTML = pageTickets.map(t => {
      const status = t.status || 'open';
      const statusBadgeClass = `badge badge-${status.toLowerCase()}`;
      const isSelected = state.selectedViewTicketIds.has(t.id);
      
      let requesterName = 'Customer';
      if (t.requester) {
        requesterName = t.requester.name || t.requester.email || (t.requester.phone ? t.requester.phone : 'Customer');
      }

      const requestedDate = new Date(t.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      const priorityText = t.priority ? capitalize(t.priority) : '-';
      const typeText = t.type ? capitalize(t.type) : '-';

      return `
        <tr class="ticket-row ${isSelected ? 'is-selected' : ''}" data-id="${t.id}">
          <td class="td-cb" onclick="event.stopPropagation()">
            <input type="checkbox" class="view-ticket-checkbox zd-checkbox" data-ticket-id="${t.id}" ${isSelected ? 'checked' : ''} />
          </td>
          <td class="td-status">
            <span class="${statusBadgeClass}">${escapeHtml(status)}</span>
          </td>
          <td class="td-subject" title="Open ticket #${t.id}">
            <span class="subject-link" data-id="${t.id}" onclick="window.appRoute(${t.id})">${escapeHtml(t.subject)}</span>
          </td>
          <td class="td-requester" title="${escapeHtml(requesterName)}">
            ${escapeHtml(requesterName)}
          </td>
          <td class="td-date">${escapeHtml(requestedDate)}</td>
          <td class="td-type">${escapeHtml(typeText)}</td>
          <td class="td-priority">${escapeHtml(priorityText)}</td>
          <td class="td-action">
            <button class="icon-btn btn-open-direct" onclick="window.appRoute(${t.id})" title="Open ticket #${t.id}">⋮</button>
          </td>
        </tr>
      `;
    }).join('');

    updateViewBulkActionBar();
    attachTableHoverListeners();
  }

  function updateViewBulkActionBar() {
    const count = state.selectedViewTicketIds.size;
    if (elements.viewBulkActions) {
      if (count > 0) {
        elements.viewBulkActions.classList.remove('hidden');
        if (elements.viewBulkCount) elements.viewBulkCount.textContent = `${count} selected`;
        if (elements.viewEditCount) elements.viewEditCount.textContent = count;
        if (elements.viewMergeCount) elements.viewMergeCount.textContent = count;
        if (elements.viewDeleteCount) elements.viewDeleteCount.textContent = count;
      } else {
        elements.viewBulkActions.classList.add('hidden');
      }
    }

    // Update Header select-all checkbox state
    if (elements.viewSelectAllTickets) {
      const pageCbs = Array.from(document.querySelectorAll('.view-ticket-checkbox'));
      if (pageCbs.length === 0) {
        elements.viewSelectAllTickets.checked = false;
        elements.viewSelectAllTickets.indeterminate = false;
      } else {
        const checkedCount = pageCbs.filter(cb => cb.checked).length;
        elements.viewSelectAllTickets.checked = (checkedCount === pageCbs.length && checkedCount > 0);
        elements.viewSelectAllTickets.indeterminate = (checkedCount > 0 && checkedCount < pageCbs.length);
      }
    }
  }

  function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // ==========================================
  // HOVER TICKET PREVIEW POPOVER (Exact Image 2)
  // ==========================================

  function attachTableHoverListeners() {
    const subjectLinks = elements.ticketsTableBody.querySelectorAll('.subject-link');

    subjectLinks.forEach(link => {
      link.addEventListener('mouseenter', () => {
        clearTimeout(popoverHideTimeout);
        const ticketId = parseInt(link.getAttribute('data-id'), 10);
        activeHoveredTicketId = ticketId;

        // Smooth 220ms delay before showing hover card (prevents flickering while scanning)
        clearTimeout(popoverShowTimeout);
        popoverShowTimeout = setTimeout(() => {
          if (activeHoveredTicketId === ticketId) {
            const ticket = state.rawViewTickets.find(t => t.id === ticketId);
            if (ticket) {
              showHoverPopover(ticket, link);
            }
          }
        }, 220);
      });

      link.addEventListener('mouseleave', () => {
        clearTimeout(popoverShowTimeout);
        activeHoveredTicketId = null;
        scheduleHidePopover();
      });
    });
  }

  // Dynamic Word Limiter:
  // - If ticket has <= 60 words (e.g. 15 words), show full text as-is
  // - If ticket has > 60 words, dynamically limit between 60 and 70 words (never > 70 words)
  function formatDynamicTicketDescription(text, ticketId) {
    if (!text || typeof text !== 'string') return 'No description provided.';
    const trimmed = text.trim();
    if (!trimmed) return 'No description provided.';

    // Extract word tokens and their character positions
    const wordMatches = [...trimmed.matchAll(/\S+/g)];
    const totalWords = wordMatches.length;

    // Rule 1: If 60 words or fewer (e.g. 15 words), display full text without truncation
    if (totalWords <= 60) {
      return trimmed;
    }

    // Rule 2: Dynamically vary word limit between 60 and 70 based on ticket ID
    // Some tickets will show 60, some 63, some 65, some 67, up to 70 (strictly <= 70 words)
    const rawId = parseInt(String(ticketId).replace(/\D/g, ''), 10) || 0;
    const dynamicLimit = 60 + (rawId % 11); // Range: 60 to 70

    // Prefer cutting cleanly at end of sentence punctuation (. ! ?) between word 60 and dynamicLimit
    let cutoffWordIndex = dynamicLimit;
    for (let i = 59; i < dynamicLimit; i++) {
      const w = wordMatches[i][0];
      if (/[.!?]$/.test(w)) {
        cutoffWordIndex = i + 1;
        break;
      }
    }

    // Strictly enforce bounds [60, 70]
    if (cutoffWordIndex > 70) cutoffWordIndex = 70;
    if (cutoffWordIndex < 60) cutoffWordIndex = 60;

    const lastWordMatch = wordMatches[cutoffWordIndex - 1];
    const endPos = lastWordMatch.index + lastWordMatch[0].length;

    let truncatedText = trimmed.slice(0, endPos).trim();
    truncatedText = truncatedText.replace(/[,;:\s-]+$/, '');
    if (!truncatedText.endsWith('...')) {
      truncatedText += '...';
    }

    return truncatedText;
  }

  function showHoverPopover(ticket, subjectElement) {
    clearTimeout(popoverHideTimeout);

    const status = ticket.status || 'open';
    elements.popoverStatusBadge.className = `badge badge-${status.toLowerCase()}`;
    elements.popoverStatusBadge.textContent = capitalize(status);
    elements.popoverTicketId.textContent = `Ticket #${ticket.id}`;
    elements.popoverSubject.textContent = ticket.subject || `Ticket #${ticket.id}`;

    // Details line (Customer name, channel or phone)
    let detailsText = '';
    const ticketChannel = getTicketChannel(ticket);
    const channelLabel = ticketChannel ? `via ${capitalize(ticketChannel.replace(/_/g, ' '))}` : '';

    if (ticket.requester && ticket.requester.name) {
      detailsText = `${ticket.requester.name}`;
      if (ticket.requester.email) detailsText += ` (${ticket.requester.email})`;
      if (channelLabel) detailsText += ` • ${channelLabel}`;
    } else if (ticket.requester && ticket.requester.email) {
      detailsText = ticket.requester.email;
      if (channelLabel) detailsText += ` • ${channelLabel}`;
    } else {
      detailsText = channelLabel || 'Direct Support Channel';
    }
    elements.popoverDetails.textContent = detailsText;

    // Ticket description author & date
    let authorName = 'Customer';
    if (ticket.requester && ticket.requester.name) {
      authorName = ticket.requester.name;
    } else if (ticket.assignee && ticket.assignee.name) {
      authorName = ticket.assignee.name;
    }
    elements.popoverAuthor.textContent = authorName;

    const dt = new Date(ticket.created_at || ticket.updated_at);
    elements.popoverDate.textContent = dt.toLocaleDateString('en-US', {
      month: '2-digit', day: '2-digit', year: 'numeric'
    }) + ' ' + dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Ticket Description (Dynamic 60 to 70 words limit, or full if <= 60 words)
    const rawDesc = ticket.description || ticket.subject || 'No description provided.';
    elements.popoverCommentBody.textContent = formatDynamicTicketDescription(rawDesc, ticket.id);

    // Position Popover dynamically next to hovered subject link
    const rect = subjectElement.getBoundingClientRect();
    const popover = elements.ticketHoverPopover;
    popover.classList.remove('hidden');

    const popoverHeight = popover.offsetHeight || 220;
    const popoverWidth = popover.offsetWidth || 440;

    // Vertical positioning: align with subject link, clamp inside window
    let top = rect.top + window.scrollY - 10;
    if (top + popoverHeight > window.innerHeight - 15) {
      top = window.innerHeight - popoverHeight - 15;
    }
    if (top < 10) top = 10;

    // Horizontal positioning: place to the right of subject
    let left = rect.left + 80;
    if (left + popoverWidth > window.innerWidth - 15) {
      left = window.innerWidth - popoverWidth - 15;
    }
    if (left < 10) left = 10;

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;

    // Trigger smooth fade and translate
    requestAnimationFrame(() => {
      popover.classList.add('visible');
    });
  }

  function scheduleHidePopover() {
    clearTimeout(popoverHideTimeout);
    popoverHideTimeout = setTimeout(() => {
      elements.ticketHoverPopover.classList.remove('visible');
      setTimeout(() => {
        if (!elements.ticketHoverPopover.classList.contains('visible')) {
          elements.ticketHoverPopover.classList.add('hidden');
        }
      }, 220);
    }, 180);
  }

  // ==========================================
  // DUPLICATES QUEUE (Image 3 Replacement)
  // ==========================================

  function scanDuplicateCustomers() {
    elements.duplicatesList.innerHTML = '<div class="empty-state">Scanning active tickets for duplicate customers across your Zendesk account...</div>';

    if (!state.client) {
      elements.duplicatesList.innerHTML = '<div class="empty-state" style="color:#d93f4c;">Zendesk SDK not connected</div>';
      return;
    }

    // Dynamic Multi-Page Search across ALL open tickets in Zendesk
    let allOpenTickets = [];
    let pageCount = 0;
    const maxSearchPages = 10; // Zendesk search ceiling is 1,000 tickets (10 pages of 100)

    function fetchSearchBatch(searchUrl) {
      state.client.request({
        url: searchUrl,
        type: 'GET',
        dataType: 'json'
      }).then(res => {
        pageCount++;
        const results = res.results || [];
        allOpenTickets = allOpenTickets.concat(results);

        if (res.next_page && pageCount < maxSearchPages) {
          let nextUrl = res.next_page;
          const match = nextUrl.match(/\/api\/v2\/.+$/);
          if (match) nextUrl = match[0];
          fetchSearchBatch(nextUrl);
        } else {
          processDuplicateTickets(allOpenTickets);
        }
      }).catch(err => {
        console.error('Duplicate search error:', err);
        if (allOpenTickets.length > 0) {
          processDuplicateTickets(allOpenTickets);
        } else {
          elements.duplicatesList.innerHTML = `<div class="empty-state" style="color:#d93f4c;">Scan error: ${err.statusText || 'Unable to scan'}</div>`;
        }
      });
    }

    fetchSearchBatch(`/api/v2/search.json?query=type:ticket status<solved&sort_by=created_at&sort_order=desc&per_page=100`);
  }

  function processDuplicateTickets(tickets) {
    const requesterMap = new Map();

    tickets.forEach(t => {
      // Group by requester identifier (prefer ID internally, email, or name)
      const reqId = t.requester ? t.requester.id : (t.requester_id || 'unknown');
      const reqName = t.requester ? t.requester.name : '';
      const reqEmail = t.requester ? t.requester.email : '';
      const reqPhone = t.requester ? (t.requester.phone || '') : '';

      if (!requesterMap.has(reqId)) {
        requesterMap.set(reqId, {
          id: reqId,
          name: reqName,
          email: reqEmail,
          phone: reqPhone,
          tickets: []
        });
      }
      requesterMap.get(reqId).tickets.push(t);
    });

    const duplicates = Array.from(requesterMap.values()).filter(c => c.tickets.length > 1);
    duplicates.sort((a, b) => b.tickets.length - a.tickets.length);
    state.duplicateRequesters = duplicates;
    state.dupCurrentPage = 1;

    const totalDuplicateTickets = duplicates.reduce((acc, curr) => acc + curr.tickets.length, 0);
    elements.dupRequestersCount.textContent = duplicates.length;
    elements.dupTotalTicketsCount.textContent = totalDuplicateTickets;

    // Update Sidebar badge count if element exists
    if (elements.dupSidebarCount) {
      elements.dupSidebarCount.textContent = duplicates.length;
    }

    // Extract phone numbers from subjects for call tickets if not present
    duplicates.forEach(c => {
      if (!c.phone) {
        for (const t of c.tickets) {
          const phoneMatch = (t.subject || '').match(/(\+?\d[\d\s\(\)\-\.]{7,}\d)/);
          if (phoneMatch) {
            c.phone = phoneMatch[1].trim();
            break;
          }
        }
      }
    });

    // Fetch live user profile details if missing in Zendesk mode
    const userIdsToFetch = duplicates
      .filter(c => (!c.name || !c.email) && c.id && c.id !== 'unknown')
      .map(c => c.id);

    if (userIdsToFetch.length > 0 && state.client) {
      const idsParam = userIdsToFetch.slice(0, 100).join(',');
      state.client.request({
        url: `/api/v2/users/show_many.json?ids=${idsParam}`,
        type: 'GET',
        dataType: 'json'
      }).then(userRes => {
        const users = userRes.users || [];
        users.forEach(u => {
          const match = duplicates.find(c => String(c.id) === String(u.id));
          if (match) {
            if (u.name) match.name = u.name;
            if (u.email) match.email = u.email;
            if (u.phone) match.phone = u.phone;
          }
        });
        renderDuplicateResults();
      }).catch(err => {
        console.warn('Could not fetch user details for duplicates:', err);
        renderDuplicateResults();
      });
    } else {
      renderDuplicateResults();
    }
  }

  function renderDuplicateResults() {
    const list = state.duplicateRequesters;
    const totalCount = list.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / state.dupPageSize));

    // Update Duplicate Subheader Info
    if (elements.dupMetaCount) {
      elements.dupMetaCount.textContent = `${totalCount} duplicate customer groups (Page ${state.dupCurrentPage} of ${totalPages})`;
    }
    if (elements.dupMetaUpdated) {
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      elements.dupMetaUpdated.textContent = `Last updated ${nowTime}`;
    }

    // Update Duplicate Pagination Controls
    if (elements.dupPaginationPagesIndicator) {
      elements.dupPaginationPagesIndicator.textContent = `Page ${state.dupCurrentPage} of ${totalPages}`;
    }
    if (elements.btnDupPageFirst) elements.btnDupPageFirst.disabled = state.dupCurrentPage === 1;
    if (elements.btnDupPagePrev) elements.btnDupPagePrev.disabled = state.dupCurrentPage === 1;
    if (elements.btnDupPageNext) elements.btnDupPageNext.disabled = state.dupCurrentPage === totalPages || totalPages === 0;
    if (elements.btnDupPageLast) elements.btnDupPageLast.disabled = state.dupCurrentPage === totalPages || totalPages === 0;

    if (totalCount === 0) {
      elements.duplicatesList.innerHTML = '<div class="empty-state">🎉 No duplicate open tickets found across active customers.</div>';
      return;
    }

    // Slice customer groups for the current page (strictly 10 customer groups per page)
    const startIndex = (state.dupCurrentPage - 1) * state.dupPageSize;
    const pageCustomers = list.slice(startIndex, startIndex + state.dupPageSize);

    elements.duplicatesList.innerHTML = pageCustomers.map(customer => {
      const rawIds = customer.tickets.map(t => t.id).join(', ');

      // Never show raw user ID; use Customer Name, Email, or Phone
      let displayName = customer.name;
      if (!displayName || displayName === 'undefined' || !isNaN(displayName)) {
        displayName = customer.email || (customer.phone ? customer.phone : 'Customer');
      }

      const primaryTickets = customer.tickets.slice(0, 3);
      const remainingTickets = customer.tickets.slice(3);
      const hasMore = remainingTickets.length > 0;

      function renderTicketItem(t) {
        return `
          <div class="dup-ticket-item-box" data-ticket-id="${t.id}" data-customer-id="${customer.id}">
            <div class="dup-ticket-row-header">
              <label class="dup-ticket-checkbox-wrap" title="Select ticket #${t.id} to merge">
                <input type="checkbox" class="dup-ticket-checkbox" data-ticket-id="${t.id}" data-customer-id="${customer.id}" />
              </label>
              <div class="dup-ticket-item-content">
                <div class="dup-ticket-item">
                  <div class="dup-ticket-item-left">
                    <span class="dup-ticket-id" onclick="window.appRoute(${t.id})" title="Open ticket #${t.id}">#${t.id}</span>
                    <span class="dup-ticket-subject" title="${escapeHtml(t.subject)}">${escapeHtml(t.subject || 'Ticket #' + t.id)}</span>
                  </div>
                  <span class="badge badge-${t.status || 'open'}">${escapeHtml(t.status)}</span>
                </div>
                <div class="dup-ticket-meta-line">
                  ${customer.name ? `<span class="dup-ticket-user">👤 ${escapeHtml(customer.name)}</span>` : ''}
                  ${customer.email ? `<span class="dup-ticket-user">✉️ ${escapeHtml(customer.email)}</span>` : ''}
                  ${customer.phone && !customer.name ? `<span class="dup-ticket-user">📞 ${escapeHtml(customer.phone)}</span>` : ''}
                </div>
                ${t.description ? `
                  <div class="dup-ticket-desc">${escapeHtml(t.description.length > 120 ? t.description.substring(0, 120) + '...' : t.description)}</div>
                ` : ''}
              </div>
            </div>
          </div>
        `;
      }

      const hasMeta = (customer.name && displayName !== customer.name) || customer.email || (customer.phone && displayName !== customer.phone);

      return `
        <div class="duplicate-card" data-customer-id="${customer.id}">
          <div class="customer-header">
            <div class="customer-info-col">
              <div class="customer-name-row">
                <label class="dup-select-all-label" title="Select all tickets for this requester">
                  <input type="checkbox" class="dup-select-all-checkbox" data-customer-id="${customer.id}" />
                  <span>Select all</span>
                </label>
                <div class="customer-name">${escapeHtml(displayName)}</div>
              </div>
              ${hasMeta ? `
                <div class="customer-meta-row">
                  ${customer.name && displayName !== customer.name ? `<span class="customer-meta-item">👤 ${escapeHtml(customer.name)}</span>` : ''}
                  ${customer.email ? `<span class="customer-meta-item">✉️ ${escapeHtml(customer.email)}</span>` : ''}
                  ${customer.phone && displayName !== customer.phone ? `<span class="customer-meta-item">📞 ${escapeHtml(customer.phone)}</span>` : ''}
                </div>
              ` : ''}
            </div>
            <span class="badge badge-count">${customer.tickets.length} OPEN TICKETS</span>
          </div>

          <div class="dup-tickets-sublist">
            ${primaryTickets.map(renderTicketItem).join('')}

            ${hasMore ? `
              <div id="more-tickets-${customer.id}" class="collapsible-tickets-box hidden">
                ${remainingTickets.map(renderTicketItem).join('')}
              </div>
              <button class="btn-toggle-more" data-target="more-tickets-${customer.id}" data-count="${remainingTickets.length}">
                ▼ View ${remainingTickets.length} more tickets
              </button>
            ` : ''}
          </div>

          <div class="dup-actions-bar">
            <div class="dup-actions-left">
              <button class="btn btn-primary btn-sm btn-merge-selected hidden" data-customer-id="${customer.id}" id="btn-merge-cust-${customer.id}">
                ⚡ Merge (<span class="merge-count">0</span>)
              </button>
            </div>
            <button class="btn btn-primary btn-sm btn-open-ticket" data-id="${customer.tickets[0].id}">
              Open First Ticket &rarr;
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function goToDupPage(newPage) {
    const totalPages = Math.max(1, Math.ceil(state.duplicateRequesters.length / state.dupPageSize));
    if (newPage < 1 || newPage > totalPages || newPage === state.dupCurrentPage) return;

    if (elements.duplicatesList) elements.duplicatesList.classList.add('is-loading');

    setTimeout(() => {
      state.dupCurrentPage = newPage;
      renderDuplicateResults();
      if (elements.duplicatesList) elements.duplicatesList.classList.remove('is-loading');
      const mainContent = document.getElementById('main-content');
      if (mainContent) mainContent.scrollTop = 0;
    }, 180);
  }

  // ==========================================
  // MERGE TICKETS LOGIC (Zendesk Native Style)
  // ==========================================

  function showToast(message) {
    if (state.client && typeof state.client.invoke === 'function') {
      state.client.invoke('notify', message, 'notice').catch(() => {});
    }
    if (elements.appToast) {
      elements.appToast.textContent = message;
      elements.appToast.classList.remove('hidden');
      clearTimeout(elements.appToast._timer);
      elements.appToast._timer = setTimeout(() => {
        elements.appToast.classList.add('hidden');
      }, 3500);
    }
  }

  function updateCustomerMergeButton(customerId) {
    const checkedBoxes = document.querySelectorAll(`.dup-ticket-checkbox[data-customer-id="${customerId}"]:checked`);
    const count = checkedBoxes.length;
    const mergeBtn = document.getElementById(`btn-merge-cust-${customerId}`);
    const selectAllCb = document.querySelector(`.dup-select-all-checkbox[data-customer-id="${customerId}"]`);
    const allBoxes = document.querySelectorAll(`.dup-ticket-checkbox[data-customer-id="${customerId}"]`);

    if (selectAllCb && allBoxes.length > 0) {
      selectAllCb.checked = (count === allBoxes.length && count > 0);
      selectAllCb.indeterminate = (count > 0 && count < allBoxes.length);
    }

    if (mergeBtn) {
      if (count > 0) {
        mergeBtn.classList.remove('hidden');
        const countSpan = mergeBtn.querySelector('.merge-count');
        if (countSpan) countSpan.textContent = count;
      } else {
        mergeBtn.classList.add('hidden');
      }
    }
  }

  function setComposerPrivacy(targetType, isPublic) {
    if (targetType === 'closing') {
      state.mergeState.sourceCommentIsPublic = isPublic;
      if (elements.textPrivacyClosing) {
        elements.textPrivacyClosing.textContent = isPublic ? 'Public reply' : 'Internal note';
      }
      if (elements.mergeSourceComment) {
        elements.mergeSourceComment.classList.toggle('is-internal', !isPublic);
      }
      if (elements.menuPrivacyClosing) {
        const items = elements.menuPrivacyClosing.querySelectorAll('.zd-privacy-item');
        items.forEach(item => {
          const val = item.getAttribute('data-value');
          const isSelected = (val === 'public' && isPublic) || (val === 'internal' && !isPublic);
          item.classList.toggle('selected', isSelected);
          const check = item.querySelector('.zd-item-check');
          if (check) check.classList.toggle('hidden', !isSelected);
        });
        elements.menuPrivacyClosing.classList.add('hidden');
      }
    } else if (targetType === 'destination') {
      state.mergeState.targetCommentIsPublic = isPublic;
      if (elements.textPrivacyDestination) {
        elements.textPrivacyDestination.textContent = isPublic ? 'Public reply' : 'Internal note';
      }
      if (elements.mergeTargetComment) {
        elements.mergeTargetComment.classList.toggle('is-internal', !isPublic);
      }
      if (elements.menuPrivacyDestination) {
        const items = elements.menuPrivacyDestination.querySelectorAll('.zd-privacy-item');
        items.forEach(item => {
          const val = item.getAttribute('data-value');
          const isSelected = (val === 'public' && isPublic) || (val === 'internal' && !isPublic);
          item.classList.toggle('selected', isSelected);
          const check = item.querySelector('.zd-item-check');
          if (check) check.classList.toggle('hidden', !isSelected);
        });
        elements.menuPrivacyDestination.classList.add('hidden');
      }
    }
  }

  function setComposerText(editorEl, text) {
    if (!editorEl) return;
    editorEl.innerText = text || '';
  }

  function getComposerText(editorEl) {
    if (!editorEl) return '';
    return editorEl.innerText ? editorEl.innerText.trim() : '';
  }

  function getComposerHtml(editorEl) {
    if (!editorEl) return '';
    return editorEl.innerHTML ? editorEl.innerHTML.trim() : '';
  }

  function getClosestParent(node, tagName, rootBoundary) {
    if (!node) return null;
    let curr = (node.nodeType === Node.ELEMENT_NODE) ? node : node.parentElement;
    const targetTag = tagName.toUpperCase();
    while (curr && curr !== rootBoundary && curr !== document.body) {
      if (curr.tagName === targetTag) {
        return curr;
      }
      curr = curr.parentElement;
    }
    return null;
  }

  function sanitizeEditorPreElements(editor) {
    if (!editor) return;
    const nestedPres = editor.querySelectorAll('pre pre');
    nestedPres.forEach(nested => {
      const parent = nested.parentElement;
      if (parent) {
        while (nested.firstChild) {
          parent.insertBefore(nested.firstChild, nested);
        }
        parent.removeChild(nested);
      }
    });
  }

  function updateComposerActiveToolbar(editor) {
    if (!editor) return;
    const toolbar = editor.parentElement ? editor.parentElement.querySelector('.zd-composer-toolbar') : null;
    if (!toolbar) return;

    try {
      const isB = document.queryCommandState('bold');
      const isI = document.queryCommandState('italic');
      const isU = document.queryCommandState('underline');
      const isUL = document.queryCommandState('insertUnorderedList');
      const isOL = document.queryCommandState('insertOrderedList');

      let isQuote = false;
      let isCode = false;
      let isCodeBlock = false;

      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
        const range = sel.getRangeAt(0);
        const preNode = getClosestParent(range.commonAncestorContainer, 'pre', editor)
                     || getClosestParent(sel.anchorNode, 'pre', editor);
        if (preNode) {
          isCodeBlock = true;
        } else {
          const codeNode = getClosestParent(range.commonAncestorContainer, 'code', editor)
                        || getClosestParent(sel.anchorNode, 'code', editor);
          if (codeNode && !getClosestParent(codeNode, 'pre', editor)) {
            isCode = true;
          }
        }
        const bqNode = getClosestParent(range.commonAncestorContainer, 'blockquote', editor)
                    || getClosestParent(sel.anchorNode, 'blockquote', editor);
        if (bqNode) {
          isQuote = true;
        }
      }

      const btnB = toolbar.querySelector('[data-action="bold"]');
      const btnI = toolbar.querySelector('[data-action="italic"]');
      const btnU = toolbar.querySelector('[data-action="underline"]');
      const btnUL = toolbar.querySelector('[data-action="bullet"]');
      const btnOL = toolbar.querySelector('[data-action="numbered"]');
      const btnQuote = toolbar.querySelector('[data-action="quote"]');
      const btnCode = toolbar.querySelector('[data-action="code"]');
      const btnCodeBlock = toolbar.querySelector('[data-action="codeblock"]');

      if (btnB) btnB.classList.toggle('is-active', !!isB);
      if (btnI) btnI.classList.toggle('is-active', !!isI);
      if (btnU) btnU.classList.toggle('is-active', !!isU);
      if (btnUL) btnUL.classList.toggle('is-active', !!isUL);
      if (btnOL) btnOL.classList.toggle('is-active', !!isOL);
      if (btnQuote) btnQuote.classList.toggle('is-active', !!isQuote);
      if (btnCode) btnCode.classList.toggle('is-active', !!isCode);
      if (btnCodeBlock) btnCodeBlock.classList.toggle('is-active', !!isCodeBlock);
    } catch (e) {}
  }

  function applyToolbarFormatting(editor, action) {
    if (!editor) return;
    editor.focus();

    switch (action) {
      case 'bold':
        document.execCommand('bold', false, null);
        break;

      case 'italic':
        document.execCommand('italic', false, null);
        break;

      case 'underline':
        document.execCommand('underline', false, null);
        break;

      case 'bullet':
        document.execCommand('insertUnorderedList', false, null);
        break;

      case 'numbered':
        document.execCommand('insertOrderedList', false, null);
        break;

      case 'indent':
        document.execCommand('indent', false, null);
        break;

      case 'outdent':
        document.execCommand('outdent', false, null);
        break;

      case 'quote': {
        const sel = window.getSelection();
        const bqNode = (sel && sel.anchorNode) ? getClosestParent(sel.anchorNode, 'blockquote', editor) : null;
        if (bqNode) {
          // Toggle off quote: unwrap and restore normal paragraph/div
          const div = document.createElement('div');
          div.innerHTML = bqNode.innerHTML;
          bqNode.parentNode.replaceChild(div, bqNode);
          if (sel) {
            const range = document.createRange();
            range.selectNodeContents(div);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        } else {
          document.execCommand('formatBlock', false, '<blockquote>');
        }
        break;
      }

      case 'code': {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) break;
        const range = sel.getRangeAt(0);

        // Check if cursor/selection is already inside an inline <code> (excluding <pre><code>)
        let codeNode = getClosestParent(range.commonAncestorContainer, 'code', editor)
                    || getClosestParent(sel.anchorNode, 'code', editor);
        if (codeNode && getClosestParent(codeNode, 'pre', editor)) {
          codeNode = null;
        }

        if (codeNode) {
          // Toggle off inline code: unwrap and restore normal text
          const rawText = codeNode.textContent.replace(/^\u200B+|\u200B+$/g, '');
          const textNode = document.createTextNode(rawText);
          codeNode.parentNode.replaceChild(textNode, codeNode);
          const newRange = document.createRange();
          newRange.setStart(textNode, textNode.length);
          newRange.collapse(true);
          sel.removeAllRanges();
          sel.addRange(newRange);
        } else {
          // Apply inline code
          const selectedText = sel.toString();
          if (selectedText && selectedText.length > 0) {
            const codeEl = document.createElement('code');
            codeEl.className = 'zd-inline-code';
            codeEl.textContent = selectedText;
            range.deleteContents();
            range.insertNode(codeEl);
            const newRange = document.createRange();
            newRange.selectNodeContents(codeEl);
            sel.removeAllRanges();
            sel.addRange(newRange);
          } else {
            // No selection: check word under cursor or insert empty inline code
            let wordWrapped = false;
            if (range.startContainer && range.startContainer.nodeType === Node.TEXT_NODE) {
              const fullText = range.startContainer.textContent;
              const offset = range.startOffset;
              const before = fullText.slice(0, offset);
              const after = fullText.slice(offset);
              const matchBefore = before.match(/\S+$/);
              const matchAfter = after.match(/^\S+/);
              if (matchBefore || matchAfter) {
                const start = matchBefore ? offset - matchBefore[0].length : offset;
                const end = matchAfter ? offset + matchAfter[0].length : offset;
                if (end > start) {
                  range.setStart(range.startContainer, start);
                  range.setEnd(range.startContainer, end);
                  const word = range.toString();
                  const codeEl = document.createElement('code');
                  codeEl.className = 'zd-inline-code';
                  codeEl.textContent = word;
                  range.deleteContents();
                  range.insertNode(codeEl);
                  const newRange = document.createRange();
                  newRange.selectNodeContents(codeEl);
                  sel.removeAllRanges();
                  sel.addRange(newRange);
                  wordWrapped = true;
                }
              }
            }
            if (!wordWrapped) {
              const codeEl = document.createElement('code');
              codeEl.className = 'zd-inline-code';
              const zwsp = document.createTextNode('\u200B');
              codeEl.appendChild(zwsp);
              range.insertNode(codeEl);
              const newRange = document.createRange();
              newRange.setStart(zwsp, 1);
              newRange.collapse(true);
              sel.removeAllRanges();
              sel.addRange(newRange);
            }
          }
        }
        break;
      }

      case 'codeblock': {
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) break;
        const range = sel.getRangeAt(0);

        // Check if cursor/selection is already inside a <pre>
        const preNode = getClosestParent(range.commonAncestorContainer, 'pre', editor)
                     || getClosestParent(sel.anchorNode, 'pre', editor);

        if (preNode) {
          // Toggle off Code Block: unwrap and restore normal text/divs
          const codeInside = preNode.querySelector('code');
          const plainText = codeInside ? codeInside.innerText : preNode.innerText;
          const cleanText = (plainText || '').replace(/^\u200B+|\u200B+$/g, '');

          const parent = preNode.parentNode;
          if (cleanText.includes('\n')) {
            const lines = cleanText.split('\n');
            const frag = document.createDocumentFragment();
            let lastDiv = null;
            lines.forEach(line => {
              const lineDiv = document.createElement('div');
              lineDiv.textContent = line || '\u200B';
              frag.appendChild(lineDiv);
              lastDiv = lineDiv;
            });
            parent.replaceChild(frag, preNode);
            if (lastDiv) {
              const newRange = document.createRange();
              newRange.selectNodeContents(lastDiv);
              newRange.collapse(false);
              sel.removeAllRanges();
              sel.addRange(newRange);
            }
          } else {
            const div = document.createElement('div');
            div.textContent = cleanText;
            parent.replaceChild(div, preNode);
            const newRange = document.createRange();
            newRange.selectNodeContents(div);
            newRange.collapse(false);
            sel.removeAllRanges();
            sel.addRange(newRange);
          }
        } else {
          // Apply Code Block
          const selectedText = sel.toString();
          if (selectedText && selectedText.trim().length > 0) {
            // Selected text becomes code block
            const preEl = document.createElement('pre');
            preEl.className = 'zd-code-block';
            const codeEl = document.createElement('code');
            codeEl.textContent = selectedText;
            preEl.appendChild(codeEl);
            range.deleteContents();
            range.insertNode(preEl);
            const newRange = document.createRange();
            newRange.selectNodeContents(codeEl);
            sel.removeAllRanges();
            sel.addRange(newRange);
          } else {
            // No selection: like native Zendesk in Image 2, put all editor text into the code block!
            const fullText = editor.innerText ? editor.innerText.trim() : '';
            if (fullText.length > 0) {
              const preEl = document.createElement('pre');
              preEl.className = 'zd-code-block';
              const codeEl = document.createElement('code');
              codeEl.textContent = fullText;
              preEl.appendChild(codeEl);
              editor.innerHTML = '';
              editor.appendChild(preEl);
              const newRange = document.createRange();
              newRange.selectNodeContents(codeEl);
              sel.removeAllRanges();
              sel.addRange(newRange);
            } else {
              // Completely blank editor: create empty code block with zero-width space
              const preEl = document.createElement('pre');
              preEl.className = 'zd-code-block';
              const codeEl = document.createElement('code');
              const zwsp = document.createTextNode('\u200B');
              codeEl.appendChild(zwsp);
              preEl.appendChild(codeEl);
              editor.innerHTML = '';
              editor.appendChild(preEl);
              const newRange = document.createRange();
              newRange.setStart(zwsp, 1);
              newRange.collapse(true);
              sel.removeAllRanges();
              sel.addRange(newRange);
            }
          }
        }
        sanitizeEditorPreElements(editor);
        break;
      }

      case 'link': {
        const toolbar = editor.parentElement ? editor.parentElement.querySelector('.zd-composer-toolbar') : null;
        const linkBtn = toolbar ? toolbar.querySelector('[data-action="link"]') : null;
        openLinkPopover(editor, linkBtn);
        return;
      }

      default:
        return;
    }

    updateComposerActiveToolbar(editor);
  }

  function openLinkPopover(editor, linkBtn, customAnchor) {
    if (!elements.zdLinkPopover) return;

    // If already open for this editor & button, toggle close
    if (!customAnchor && !elements.zdLinkPopover.classList.contains('hidden') && state.linkPopoverState && state.linkPopoverState.editor === editor) {
      closeLinkPopover();
      return;
    }

    state.linkPopoverState = {
      editor: editor,
      linkBtn: linkBtn,
      savedRange: null,
      editingAnchor: customAnchor || null
    };

    const sel = window.getSelection();
    let selectedText = '';
    if (customAnchor) {
      state.linkPopoverState.editingAnchor = customAnchor;
      selectedText = customAnchor.textContent || '';
    } else if (sel && sel.rangeCount > 0 && editor.contains(sel.anchorNode)) {
      state.linkPopoverState.savedRange = sel.getRangeAt(0).cloneRange();
      selectedText = sel.toString().trim();
      const existingAnchor = getClosestParent(sel.anchorNode, 'a', editor);
      if (existingAnchor) {
        state.linkPopoverState.editingAnchor = existingAnchor;
      }
    }

    if (state.linkPopoverState.editingAnchor) {
      const href = state.linkPopoverState.editingAnchor.getAttribute('href') || '';
      if (elements.zdLinkUrl) elements.zdLinkUrl.value = href;
      if (elements.zdLinkText) elements.zdLinkText.value = state.linkPopoverState.editingAnchor.textContent || '';
    } else {
      if (elements.zdLinkUrl) elements.zdLinkUrl.value = '';
      if (elements.zdLinkText) elements.zdLinkText.value = selectedText;
    }

    if (elements.zdLinkUrl) {
      elements.zdLinkUrl.classList.remove('input-error');
    }

    hideLinkTooltip();
    elements.zdLinkPopover.classList.remove('hidden');

    // Position popover right above linkBtn (or customAnchor if editing from tooltip)
    const anchorTarget = customAnchor || linkBtn;
    if (anchorTarget) {
      if (linkBtn) linkBtn.classList.add('is-active');
      const btnRect = anchorTarget.getBoundingClientRect();
      const popoverWidth = 320;
      const popoverHeight = 195;

      let top = btnRect.top - popoverHeight - 8;
      let left = btnRect.right - popoverWidth + 6;

      // Ensure within viewport bounds
      if (top < 10) {
        top = btnRect.bottom + 8;
      }
      if (left < 10) {
        left = 10;
      }
      if (left + popoverWidth > window.innerWidth - 10) {
        left = window.innerWidth - popoverWidth - 10;
      }

      elements.zdLinkPopover.style.top = `${top}px`;
      elements.zdLinkPopover.style.left = `${left}px`;
    }

    setTimeout(() => {
      if (elements.zdLinkUrl) {
        elements.zdLinkUrl.focus();
        elements.zdLinkUrl.select();
      }
    }, 60);
  }

  function closeLinkPopover() {
    if (elements.zdLinkPopover) {
      elements.zdLinkPopover.classList.add('hidden');
    }
    if (state.linkPopoverState && state.linkPopoverState.linkBtn) {
      state.linkPopoverState.linkBtn.classList.remove('is-active');
    }
    if (elements.zdLinkUrl) {
      elements.zdLinkUrl.value = '';
      elements.zdLinkUrl.classList.remove('input-error');
    }
    if (elements.zdLinkText) {
      elements.zdLinkText.value = '';
    }
    state.linkPopoverState = null;
  }

  let linkTooltipHideTimeout = null;

  function showLinkTooltip(anchorEl, editorEl) {
    if (!anchorEl || !editorEl || !elements.zdLinkTooltip) return;
    clearTimeout(linkTooltipHideTimeout);

    state.activeTooltipLink = anchorEl;
    state.activeTooltipEditor = editorEl;

    const href = anchorEl.getAttribute('href') || '#';
    if (elements.zdLinkTooltipUrl) {
      elements.zdLinkTooltipUrl.textContent = href;
      elements.zdLinkTooltipUrl.href = href;
    }

    elements.zdLinkTooltip.classList.remove('hidden');

    const anchorRect = anchorEl.getBoundingClientRect();
    const tooltipRect = elements.zdLinkTooltip.getBoundingClientRect();
    const tooltipHeight = tooltipRect.height || 36;
    const tooltipWidth = tooltipRect.width || 280;

    let top = anchorRect.top - tooltipHeight - 6;
    let left = anchorRect.left;

    // Bounds checking inside viewport
    if (top < 10) {
      top = anchorRect.bottom + 6;
    }
    if (left + tooltipWidth > window.innerWidth - 10) {
      left = window.innerWidth - tooltipWidth - 10;
    }
    if (left < 10) left = 10;

    elements.zdLinkTooltip.style.top = `${top}px`;
    elements.zdLinkTooltip.style.left = `${left}px`;
  }

  function hideLinkTooltip() {
    clearTimeout(linkTooltipHideTimeout);
    if (elements.zdLinkTooltip) {
      elements.zdLinkTooltip.classList.add('hidden');
    }
    state.activeTooltipLink = null;
    state.activeTooltipEditor = null;
  }

  function scheduleHideLinkTooltip() {
    clearTimeout(linkTooltipHideTimeout);
    linkTooltipHideTimeout = setTimeout(() => {
      hideLinkTooltip();
    }, 280);
  }

  function cancelHideLinkTooltip() {
    clearTimeout(linkTooltipHideTimeout);
  }

  // Convert rich text composer HTML into Zendesk-compliant Markdown
  // This ensures links like [closed](url) render as real clickable hyperlinks in Zendesk ticket view!
  function convertHtmlToZendeskMarkdown(htmlOrNode) {
    if (!htmlOrNode) return '';
    let container;
    if (typeof htmlOrNode === 'string') {
      container = document.createElement('div');
      container.innerHTML = htmlOrNode;
    } else if (htmlOrNode.cloneNode) {
      container = htmlOrNode.cloneNode(true);
    } else {
      return String(htmlOrNode);
    }

    function processNode(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        return node.nodeValue;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) {
        return '';
      }

      const tag = node.tagName.toLowerCase();
      let childrenText = '';
      for (const child of node.childNodes) {
        childrenText += processNode(child);
      }

      switch (tag) {
        case 'a': {
          const href = node.getAttribute('href') || '';
          const text = childrenText.trim() || href;
          if (href) {
            return `[${text}](${href})`;
          }
          return text;
        }
        case 'b':
        case 'strong': {
          const trimmed = childrenText.trim();
          if (!trimmed) return '';
          return `**${trimmed}**`;
        }
        case 'i':
        case 'em': {
          const trimmed = childrenText.trim();
          if (!trimmed) return '';
          return `*${trimmed}*`;
        }
        case 'u': {
          const trimmed = childrenText.trim();
          if (!trimmed) return '';
          return `<u>${trimmed}</u>`;
        }
        case 'code': {
          if (node.parentElement && node.parentElement.tagName.toLowerCase() === 'pre') {
            return childrenText;
          }
          const trimmed = childrenText.trim();
          if (!trimmed) return '';
          return `\`${trimmed}\``;
        }
        case 'pre': {
          const codeText = node.innerText || childrenText;
          return `\n\`\`\`\n${codeText.trim()}\n\`\`\`\n`;
        }
        case 'blockquote': {
          const lines = childrenText.trim().split('\n');
          return '\n' + lines.map(l => `> ${l}`).join('\n') + '\n';
        }
        case 'li': {
          const isOrdered = node.parentElement && node.parentElement.tagName.toLowerCase() === 'ol';
          const index = Array.prototype.indexOf.call(node.parentElement ? node.parentElement.children : [], node) + 1;
          const prefix = isOrdered ? `${index}. ` : '- ';
          return `\n${prefix}${childrenText.trim()}`;
        }
        case 'ul':
        case 'ol': {
          return `\n${childrenText.trim()}\n`;
        }
        case 'br': {
          return '\n';
        }
        case 'p':
        case 'div': {
          return childrenText ? `\n${childrenText}` : '\n';
        }
        default:
          return childrenText;
      }
    }

    let md = processNode(container);
    md = md.replace(/\n{3,}/g, '\n\n').trim();
    return md;
  }

  function submitLinkPopover() {
    if (!state.linkPopoverState || !state.linkPopoverState.editor) {
      closeLinkPopover();
      return;
    }

    const { editor, savedRange, editingAnchor } = state.linkPopoverState;
    const rawUrl = elements.zdLinkUrl ? elements.zdLinkUrl.value.trim() : '';
    const rawText = elements.zdLinkText ? elements.zdLinkText.value.trim() : '';

    if (!rawUrl) {
      if (elements.zdLinkUrl) {
        elements.zdLinkUrl.classList.add('input-error');
        elements.zdLinkUrl.focus();
      }
      return;
    }
    if (elements.zdLinkUrl) {
      elements.zdLinkUrl.classList.remove('input-error');
    }

    let cleanUrl = rawUrl;
    if (!/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    const displayText = rawText || rawUrl;

    editor.focus();

    if (editingAnchor && editor.contains(editingAnchor)) {
      editingAnchor.setAttribute('href', cleanUrl);
      editingAnchor.textContent = displayText;
      editingAnchor.setAttribute('target', '_blank');
      editingAnchor.setAttribute('rel', 'noopener');
    } else {
      const a = document.createElement('a');
      a.setAttribute('href', cleanUrl);
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener');
      a.textContent = displayText;

      const sel = window.getSelection();
      if (savedRange) {
        sel.removeAllRanges();
        sel.addRange(savedRange);
        try {
          savedRange.deleteContents();
          savedRange.insertNode(a);
        } catch (e) {
          editor.appendChild(a);
        }
      } else {
        editor.appendChild(a);
      }

      // Position cursor right after newly inserted link
      const newRange = document.createRange();
      newRange.setStartAfter(a);
      newRange.collapse(true);
      sel.removeAllRanges();
      sel.addRange(newRange);
    }

    editor.dispatchEvent(new Event('input', { bubbles: true }));
    closeLinkPopover();
  }

  function openMergeModal(customerIdOrTickets) {
    let customer = null;
    let customerId = null;
    let selectedIds = [];
    let selectedTickets = [];
    let allTickets = [];

    if (Array.isArray(customerIdOrTickets)) {
      // Called with array of tickets (e.g. from View tickets table bulk action)
      selectedTickets = [...customerIdOrTickets];
      selectedIds = selectedTickets.map(t => t.id);
      allTickets = [...selectedTickets];
      if (selectedTickets.length > 0) {
        const first = selectedTickets[0];
        const req = first.requester || {};
        customerId = req.id || 'view-selected';
        customer = {
          id: customerId,
          name: req.name || 'Selected Tickets',
          email: req.email || '',
          tickets: selectedTickets
        };
      }
    } else {
      // Called with customerId (from Duplicates Queue)
      customerId = customerIdOrTickets;
      customer = state.duplicateRequesters.find(c => String(c.id) === String(customerId));
      if (!customer || !customer.tickets || customer.tickets.length === 0) return;

      const checkedBoxes = Array.from(document.querySelectorAll(`.dup-ticket-checkbox[data-customer-id="${customerId}"]:checked`));
      selectedIds = checkedBoxes.map(cb => parseInt(cb.getAttribute('data-ticket-id'), 10)).filter(Boolean);

      // If agent clicked without checking boxes, select first 2 tickets as default
      if (selectedIds.length === 0 && customer.tickets.length >= 2) {
        selectedIds = [customer.tickets[0].id, customer.tickets[1].id];
      }

      selectedTickets = customer.tickets.filter(t => selectedIds.includes(t.id));
      allTickets = [...customer.tickets];
    }

    if (selectedTickets.length === 0) return;

    state.mergeState = {
      customer: customer,
      customerId: customerId,
      sourceTicketIds: selectedIds,
      sourceTickets: selectedTickets,
      allCustomerTickets: allTickets,
      candidateTickets: allTickets,
      targetTicket: null,
      searchQuery: '',
      isSubmitting: false,
      sourceCommentIsPublic: false,
      targetCommentIsPublic: false,
      closingComments: {}
    };

    // Render source tickets list
    renderMergeSourceList();

    // Reset Search & Alerts
    if (elements.mergeTargetSearch) elements.mergeTargetSearch.value = '';
    hideMergeAlert();

    // Render Candidate Target Tickets
    renderMergeCandidates(state.mergeState.allCustomerTickets);

    // Hide Selected Target Card & Org Warning until chosen
    if (elements.mergeSelectedTargetCard) elements.mergeSelectedTargetCard.classList.add('hidden');
    if (elements.mergeOrgWarning) elements.mergeOrgWarning.classList.add('hidden');
    if (elements.btnConfirmMerge) elements.btnConfirmMerge.disabled = true;
    if (elements.mergeBtnText) elements.mergeBtnText.textContent = 'Confirm and Merge';
    if (elements.mergeBtnSpinner) elements.mergeBtnSpinner.classList.add('hidden');

    // Reset composers privacy & textareas to Zendesk native defaults
    setComposerPrivacy('closing', false);
    setComposerPrivacy('destination', false);
    if (elements.mergeDestinationBadge) elements.mergeDestinationBadge.textContent = '#---';
    setComposerText(elements.mergeTargetComment, '');
    setComposerText(elements.mergeSourceComment, '');
    if (elements.menuPrivacyClosing) elements.menuPrivacyClosing.classList.add('hidden');
    if (elements.menuPrivacyDestination) elements.menuPrivacyDestination.classList.add('hidden');

    // If 2 or more tickets selected, pre-select the first ticket as target for instant convenience
    if (selectedTickets.length >= 2) {
      selectTargetTicket(selectedTickets[0]);
    }

    // Open Modal
    if (elements.mergeModal) {
      elements.mergeModal.classList.remove('hidden');
      setTimeout(() => {
        if (elements.mergeTargetSearch) elements.mergeTargetSearch.focus();
      }, 100);
    }
  }

  function renderMergeSourceList() {
    if (!elements.mergeSourceList) return;
    const sourceTickets = state.mergeState.sourceTickets;
    if (elements.mergeSourceCountBadge) {
      elements.mergeSourceCountBadge.textContent = `${sourceTickets.length} ticket${sourceTickets.length === 1 ? '' : 's'}`;
    }

    if (sourceTickets.length === 0) {
      elements.mergeSourceList.innerHTML = '<div class="empty-hint" style="font-size:11px; color:#68737d;">No tickets selected.</div>';
      return;
    }

    elements.mergeSourceList.innerHTML = sourceTickets.map(t => `
      <div class="merge-source-item" data-id="${t.id}">
        <div class="merge-source-item-left">
          <span class="merge-source-item-id">#${t.id}</span>
          <span class="merge-source-item-subject" title="${escapeHtml(t.subject || '')}">${escapeHtml(t.subject || 'Ticket #' + t.id)}</span>
        </div>
        <span class="badge badge-${t.status || 'open'}">${escapeHtml(t.status || 'open')}</span>
      </div>
    `).join('');
  }

  function renderMergeCandidates(candidatesList, selectedTargetId = null) {
    if (!elements.mergeTargetCandidates) return;
    const q = (state.mergeState.searchQuery || '').trim();

    if (!candidatesList || candidatesList.length === 0) {
      elements.mergeTargetCandidates.innerHTML = `
        <div style="padding:16px 12px; font-size:12px; color:#68737d; text-align:center;">
          No matching customer tickets found in this list.
          ${q ? `
            <div style="margin-top:10px;">
              <button class="btn btn-secondary btn-sm" id="btn-search-zendesk-live" data-query="${escapeHtml(q)}">
                🔍 Search Zendesk for "${escapeHtml(q)}" (by Ticket #, Name, or Email)
              </button>
            </div>
          ` : ''}
        </div>
      `;
      return;
    }

    const itemsHtml = candidatesList.map(t => {
      const isSelected = selectedTargetId && String(t.id) === String(selectedTargetId);
      const isSource = state.mergeState.sourceTicketIds.includes(t.id);

      const reqName = t.requester ? t.requester.name : (state.mergeState.customer && state.mergeState.customer.name ? state.mergeState.customer.name : '');
      const reqEmail = t.requester ? t.requester.email : (state.mergeState.customer && state.mergeState.customer.email ? state.mergeState.customer.email : '');
      let reqDisplay = '';
      if (reqName && reqEmail) {
        reqDisplay = `${reqName} (${reqEmail})`;
      } else {
        reqDisplay = reqName || reqEmail || '';
      }
      const orgDisplay = t.organization ? t.organization.name : (t.organization_id ? `Org #${t.organization_id}` : '');

      return `
        <div class="merge-candidate-item ${isSelected ? 'selected' : ''}" data-ticket-id="${t.id}">
          <input type="radio" name="merge-target-radio" class="merge-candidate-radio" value="${t.id}" ${isSelected ? 'checked' : ''} />
          <div class="merge-candidate-info">
            <div class="merge-candidate-title-row">
              <div>
                <span class="merge-candidate-id">#${t.id}</span>
                <span class="merge-candidate-subject" title="${escapeHtml(t.subject || '')}">${escapeHtml(t.subject || 'Ticket #' + t.id)}</span>
              </div>
              <span class="badge badge-${t.status || 'open'}">${escapeHtml(t.status || 'open')}</span>
            </div>
            <div class="merge-candidate-meta">
              ${isSource ? '<span style="color:#1f73b7; font-weight:600;">(Closing ticket)</span> &bull; ' : ''}
              Created: ${t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A'}
              ${reqDisplay ? ` &bull; Requester: <strong>${escapeHtml(reqDisplay)}</strong>` : ''}
              ${orgDisplay ? ` &bull; Org: <strong>${escapeHtml(orgDisplay)}</strong>` : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');

    const searchBarHtml = q.length >= 2 ? `
      <div class="merge-external-search-bar">
        <button class="btn btn-secondary btn-sm" id="btn-search-zendesk-live" data-query="${escapeHtml(q)}">
          🔍 Search all Zendesk tickets for "${escapeHtml(q)}"
        </button>
      </div>
    ` : '';

    elements.mergeTargetCandidates.innerHTML = itemsHtml + searchBarHtml;
  }

  function getClosingTicketIds() {
    if (!state.mergeState.targetTicket) return [];
    const targetId = state.mergeState.targetTicket.id;
    let closing = state.mergeState.sourceTicketIds.filter(id => id !== targetId);
    return closing;
  }

  function checkOrgAndRequesterMismatch(targetTicket, closingTickets) {
    if (!targetTicket || !closingTickets || closingTickets.length === 0) return false;

    const targetReqId = targetTicket.requester_id || (targetTicket.requester ? targetTicket.requester.id : null);
    const targetReqEmail = (targetTicket.requester && targetTicket.requester.email) ? targetTicket.requester.email.toLowerCase().trim() : null;
    const targetOrgId = targetTicket.organization_id;

    for (const source of closingTickets) {
      const sourceReqId = source.requester_id || (source.requester ? source.requester.id : null);
      const sourceReqEmail = (source.requester && source.requester.email) ? source.requester.email.toLowerCase().trim() : null;
      const sourceOrgId = source.organization_id;

      // 1. Organization mismatch:
      if (targetOrgId !== undefined && sourceOrgId !== undefined && targetOrgId !== null && sourceOrgId !== null) {
        if (targetOrgId !== sourceOrgId) return true;
      } else if ((targetOrgId && !sourceOrgId) || (!targetOrgId && sourceOrgId)) {
        return true;
      }

      // 2. Requester mismatch:
      if (targetReqId && sourceReqId && targetReqId !== sourceReqId) {
        return true;
      }
      if (targetReqEmail && sourceReqEmail && targetReqEmail !== sourceReqEmail) {
        return true;
      }
    }

    return false;
  }

  function fetchTicketLatestComment(ticketId) {
    if (!ticketId) return Promise.resolve(null);
    state.mergeState = state.mergeState || {};
    state.mergeState.closingComments = state.mergeState.closingComments || {};

    if (state.mergeState.closingComments[ticketId]) {
      return Promise.resolve(state.mergeState.closingComments[ticketId]);
    }

    if (!state.client) {
      const mockComment = {
        id: 9000 + Number(ticketId),
        body: 'Latest comment for ticket #' + ticketId,
        public: true,
        created_at: new Date().toISOString()
      };
      state.mergeState.closingComments[ticketId] = mockComment;
      return Promise.resolve(mockComment);
    }

    return state.client.request({
      url: `/api/v2/tickets/${ticketId}/comments.json?sort_order=desc`,
      type: 'GET',
      dataType: 'json'
    }).then(res => {
      const comments = (res && res.comments) || [];
      if (comments.length === 0) return null;
      comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      const latest = comments[0];
      const bodyText = (latest.plain_body || latest.body || '').trim();
      const commentData = {
        id: latest.id,
        body: bodyText,
        public: !!latest.public,
        created_at: latest.created_at
      };
      state.mergeState.closingComments[ticketId] = commentData;
      return commentData;
    }).catch(err => {
      console.warn(`[Merge] Could not fetch comments for ticket #${ticketId}:`, err);
      return null;
    });
  }

  function buildNativeDestinationComment(closingTickets, commentsMap) {
    if (!closingTickets || closingTickets.length === 0) {
      return 'This ticket now includes merged content.';
    }

    return closingTickets.map(t => {
      const rawSubj = (t.subject || '').trim();
      const cleanSubj = rawSubj ? ` ${rawSubj.replace(/\.+$/, '')}.` : '.';
      let block = `This ticket now includes merged content from #${t.id}${cleanSubj}`;
      const commentObj = commentsMap && commentsMap[t.id];
      if (commentObj && commentObj.body && commentObj.body.trim()) {
        block += `\nLast comment in ticket #${t.id}:\n${commentObj.body.trim()}`;
      }
      return block;
    }).join('\n\n');
  }

  function selectTargetTicket(ticket) {
    if (!ticket) return;
    state.mergeState.targetTicket = ticket;

    let closingIds = getClosingTicketIds();

    if (closingIds.length === 0) {
      const otherTickets = state.mergeState.allCustomerTickets.filter(t => t.id !== ticket.id);
      if (otherTickets.length > 0) {
        state.mergeState.sourceTicketIds = otherTickets.map(t => t.id);
        state.mergeState.sourceTickets = otherTickets;
        closingIds = otherTickets.map(t => t.id);
        renderMergeSourceList();
      }
    } else {
      state.mergeState.sourceTickets = state.mergeState.allCustomerTickets.filter(t => closingIds.includes(t.id));
      renderMergeSourceList();
    }

    // Highlight candidate item in list
    const candidateItems = document.querySelectorAll('.merge-candidate-item');
    candidateItems.forEach(item => {
      const id = parseInt(item.getAttribute('data-ticket-id'), 10);
      const isMatch = (id === ticket.id);
      item.classList.toggle('selected', isMatch);
      const radio = item.querySelector('.merge-candidate-radio');
      if (radio) radio.checked = isMatch;
    });

    // Show Selected Target Card
    if (elements.mergeSelectedTargetCard) {
      elements.mergeSelectedTargetCard.classList.remove('hidden');
      if (elements.mergeSelectedTargetContent) {
        const reqName = ticket.requester ? ticket.requester.name : '';
        const reqEmail = ticket.requester ? ticket.requester.email : '';
        const reqStr = reqName ? (reqEmail ? ` - Requester: ${reqName} (${reqEmail})` : ` - Requester: ${reqName}`) : '';
        elements.mergeSelectedTargetContent.textContent = `#${ticket.id} - ${ticket.subject || 'Ticket #' + ticket.id} (${ticket.status || 'open'})${reqStr}`;
      }
    }

    // Find all closing ticket objects
    const closingTickets = closingIds.map(id => {
      return (state.mergeState.sourceTickets && state.mergeState.sourceTickets.find(t => t.id === id)) ||
             (state.mergeState.allCustomerTickets && state.mergeState.allCustomerTickets.find(t => t.id === id)) ||
             (state.rawViewTickets && state.rawViewTickets.find(t => t.id === id)) ||
             { id: id, subject: '' };
    });
    state.mergeState.closingTickets = closingTickets;
    state.mergeState.closingComments = state.mergeState.closingComments || {};

    // Check if tickets belong to different organization or requester
    const hasMismatch = checkOrgAndRequesterMismatch(ticket, closingTickets);

    if (elements.mergeOrgWarning) {
      if (hasMismatch) {
        elements.mergeOrgWarning.classList.remove('hidden');
      } else {
        elements.mergeOrgWarning.classList.add('hidden');
      }
    }

    // Update Destination Badge
    if (elements.mergeDestinationBadge) {
      elements.mergeDestinationBadge.textContent = `#${ticket.id}`;
    }

    // Pre-fill native Zendesk comments
    const rawTargetSubj = (ticket.subject && ticket.subject.trim()) ? ticket.subject.trim().replace(/\.+$/, '') : '';
    const targetSubject = rawTargetSubj ? ` ${rawTargetSubj}.` : '.';
    const defaultClosingComment = `Merged into #${ticket.id}${targetSubject} This ticket is now closed.`;

    const initialDestComment = buildNativeDestinationComment(closingTickets, state.mergeState.closingComments);

    setComposerText(elements.mergeSourceComment, defaultClosingComment);
    setComposerText(elements.mergeTargetComment, initialDestComment);

    // Fetch latest comments for closing tickets asynchronously and update composer
    const currentTargetId = ticket.id;
    const ticketsToFetch = closingTickets.filter(t => !state.mergeState.closingComments[t.id]);

    if (ticketsToFetch.length > 0) {
      Promise.all(ticketsToFetch.map(t => fetchTicketLatestComment(t.id))).then(() => {
        // If the selected target is still the active target, update composer with the full native comment!
        if (state.mergeState.targetTicket && state.mergeState.targetTicket.id === currentTargetId) {
          const updatedDestComment = buildNativeDestinationComment(closingTickets, state.mergeState.closingComments);
          const currentText = getComposerText(elements.mergeTargetComment).trim();
          const baseInitial = initialDestComment.trim();
          if (!currentText || currentText === baseInitial || currentText.startsWith('This ticket now includes merged content')) {
            setComposerText(elements.mergeTargetComment, updatedDestComment);
          }
        }
      });
    }

    // Enable Confirm Button - NOTE: warning is IGNORABLE and DOES NOT block or disable button!
    if (elements.btnConfirmMerge) {
      elements.btnConfirmMerge.disabled = (closingIds.length === 0);
    }
    hideMergeAlert();
  }

  let autoSearchDebounce = null;
  function handleMergeTargetSearch(query) {
    state.mergeState.searchQuery = (query || '').toLowerCase().trim();
    const q = state.mergeState.searchQuery;

    clearTimeout(autoSearchDebounce);

    if (!q) {
      const currentTargetId = state.mergeState.targetTicket ? state.mergeState.targetTicket.id : null;
      renderMergeCandidates(state.mergeState.allCustomerTickets, currentTargetId);
      hideMergeAlert();
      return;
    }

    let filtered = state.mergeState.allCustomerTickets.filter(t => {
      const idMatch = String(t.id).includes(q);
      const subMatch = (t.subject || '').toLowerCase().includes(q);
      const reqNameMatch = t.requester && (t.requester.name || '').toLowerCase().includes(q);
      const reqEmailMatch = t.requester && (t.requester.email || '').toLowerCase().includes(q);
      const custNameMatch = state.mergeState.customer && (state.mergeState.customer.name || '').toLowerCase().includes(q);
      const custEmailMatch = state.mergeState.customer && (state.mergeState.customer.email || '').toLowerCase().includes(q);
      const orgMatch = (t.organization && t.organization.name && t.organization.name.toLowerCase().includes(q)) || (t.organization_id && String(t.organization_id).includes(q));
      return idMatch || subMatch || reqNameMatch || reqEmailMatch || custNameMatch || custEmailMatch || orgMatch;
    });

    const currentTargetId = state.mergeState.targetTicket ? state.mergeState.targetTicket.id : null;
    renderMergeCandidates(filtered, currentTargetId);

    // If an exact ticket ID match is already in filtered list, auto-select it immediately!
    const exactLocal = filtered.find(t => String(t.id) === q);
    if (exactLocal) {
      selectTargetTicket(exactLocal);
      return;
    }

    // Automatically trigger Zendesk ticket search without needing manual enter or search click!
    const isNum = /^\d+$/.test(q);
    const delay = isNum ? 180 : 350;

    autoSearchDebounce = setTimeout(() => {
      searchZendeskTickets(q, true);
    }, delay);
  }

  function searchZendeskTickets(query, isAuto = false) {
    const q = (query || (elements.mergeTargetSearch ? elements.mergeTargetSearch.value : '') || '').trim();
    if (!q) {
      if (!isAuto) showMergeAlert('Please type a ticket number, requester name, or email to search.', 'error');
      return;
    }

    if (!state.client) {
      // Local preview mode
      const isNum = /^\d+$/.test(q);
      const mockTicket = {
        id: isNum ? parseInt(q, 10) : 9944001,
        subject: `Ticket for "${q}"`,
        status: 'open',
        created_at: new Date().toISOString(),
        requester: {
          id: 88801,
          name: q.includes('@') ? q.split('@')[0] : q,
          email: q.includes('@') ? q : `${q.replace(/\s+/g, '.').toLowerCase()}@example.com`
        },
        organization_id: 202
      };
      if (!state.mergeState.allCustomerTickets.some(x => x.id === mockTicket.id)) {
        state.mergeState.allCustomerTickets.unshift(mockTicket);
      }
      renderMergeCandidates([mockTicket], mockTicket.id);
      selectTargetTicket(mockTicket);
      showToast(`Loaded ticket #${mockTicket.id}`);
      return;
    }

    if (!isAuto) {
      showMergeAlert(`Searching Zendesk for "${q}"...`, 'info');
    }

    // If pure number, try direct ticket ID lookup first
    if (/^\d+$/.test(q)) {
      state.client.request({
        url: `/api/v2/tickets/${q}.json`,
        type: 'GET'
      }).then(res => {
        hideMergeAlert();
        if (res && res.ticket) {
          const t = res.ticket;
          if (!state.mergeState.allCustomerTickets.some(x => x.id === t.id)) {
            state.mergeState.allCustomerTickets.unshift(t);
          }
          renderMergeCandidates(state.mergeState.allCustomerTickets, t.id);
          selectTargetTicket(t);
          showToast(`Found Ticket #${t.id}`);
        } else {
          executeZendeskTextSearch(q, isAuto);
        }
      }).catch(() => {
        executeZendeskTextSearch(q, isAuto);
      });
    } else {
      executeZendeskTextSearch(q, isAuto);
    }
  }

  function executeZendeskTextSearch(q, isAuto = false) {
    let zdSearchQuery = `type:ticket ${q}`;
    if (q.includes('@')) {
      zdSearchQuery = `type:ticket requester:${q}`;
    }

    state.client.request({
      url: `/api/v2/search.json?query=${encodeURIComponent(zdSearchQuery)}&sort_by=updated_at&sort_order=desc`,
      type: 'GET'
    }).then(res => {
      hideMergeAlert();
      const results = (res && res.results) || [];
      if (results.length > 0) {
        results.forEach(t => {
          if (!state.mergeState.allCustomerTickets.some(x => x.id === t.id)) {
            state.mergeState.allCustomerTickets.push(t);
          }
        });
        const currentTargetId = state.mergeState.targetTicket ? state.mergeState.targetTicket.id : (results.length === 1 ? results[0].id : null);
        renderMergeCandidates(results, currentTargetId);
        if (results.length === 1) {
          selectTargetTicket(results[0]);
        }
        showToast(`Found ${results.length} ticket(s) matching "${q}"`);
      } else if (!isAuto) {
        showMergeAlert(`No tickets found in Zendesk for "${q}".`, 'error');
      }
    }).catch(err => {
      console.warn('Search query error:', err);
      if (!isAuto) {
        showMergeAlert(`Search error for "${q}". Please check your query.`, 'error');
      }
    });
  }

  function executeTicketMerge() {
    if (!state.mergeState.targetTicket) {
      showMergeAlert('Please select a target ticket to merge into.', 'error');
      return;
    }

    const targetId = state.mergeState.targetTicket.id;
    const closingIds = getClosingTicketIds();

    if (closingIds.length === 0) {
      showMergeAlert('No tickets to merge into target ticket. Please select at least one ticket to close.', 'error');
      return;
    }

    // Set Loading State
    if (elements.btnConfirmMerge) elements.btnConfirmMerge.disabled = true;
    if (elements.mergeBtnText) elements.mergeBtnText.textContent = 'Merging...';
    if (elements.mergeBtnSpinner) elements.mergeBtnSpinner.classList.remove('hidden');
    hideMergeAlert();

    const closingTickets = closingIds.map(id => {
      return (state.mergeState.sourceTickets && state.mergeState.sourceTickets.find(t => t.id === id)) ||
             (state.mergeState.allCustomerTickets && state.mergeState.allCustomerTickets.find(t => t.id === id)) ||
             (state.rawViewTickets && state.rawViewTickets.find(t => t.id === id)) ||
             { id: id, subject: '' };
    });

    state.mergeState.closingComments = state.mergeState.closingComments || {};
    const pendingTickets = closingTickets.filter(t => !state.mergeState.closingComments[t.id]);

    const proceedWithMerge = () => {
      const rawTargetSubj = (state.mergeState.targetTicket.subject && state.mergeState.targetTicket.subject.trim())
        ? state.mergeState.targetTicket.subject.trim().replace(/\.+$/, '')
        : '';
      const targetSubject = rawTargetSubj ? ` ${rawTargetSubj}.` : '.';
      const defaultSourceComment = `Merged into #${targetId}${targetSubject} This ticket is now closed.`;

      const defaultTargetComment = buildNativeDestinationComment(closingTickets, state.mergeState.closingComments);

      const targetText = getComposerText(elements.mergeTargetComment);
      const targetHtml = getComposerHtml(elements.mergeTargetComment);
      const sourceText = getComposerText(elements.mergeSourceComment);
      const sourceHtml = getComposerHtml(elements.mergeSourceComment);

      const hasTargetHtml = /<(b|i|u|strong|em|ul|ol|li|blockquote|code|pre|a)\b/i.test(targetHtml);
      const hasSourceHtml = /<(b|i|u|strong|em|ul|ol|li|blockquote|code|pre|a)\b/i.test(sourceHtml);

      // Determine final target comment: prefer custom if modified, else full native comment with last comments
      let targetComment = targetText;
      const hasLastCommentBlock = targetComment && targetComment.includes('Last comment in ticket #');
      if (!targetComment || (!hasLastCommentBlock && defaultTargetComment.includes('Last comment in ticket #'))) {
        targetComment = defaultTargetComment;
      } else if (hasTargetHtml) {
        targetComment = convertHtmlToZendeskMarkdown(targetHtml);
      }

      const sourceComment = sourceText ? (hasSourceHtml ? convertHtmlToZendeskMarkdown(sourceHtml) : sourceText) : defaultSourceComment;

      const payload = {
        ids: closingIds,
        target_comment: targetComment,
        source_comment: sourceComment,
        target_comment_is_public: !!state.mergeState.targetCommentIsPublic,
        source_comment_is_public: !!state.mergeState.sourceCommentIsPublic
      };

      if (state.client) {
        state.client.request({
          url: `/api/v2/tickets/${targetId}/merge.json`,
          type: 'POST',
          contentType: 'application/json',
          data: JSON.stringify(payload)
        }).then(() => {
          showToast(`Successfully merged ${closingIds.length} ticket(s) into #${targetId}!`);
          closeMergeModal();
          // Remove closed tickets from view table if present
          if (state.rawViewTickets && state.rawViewTickets.length > 0) {
            state.rawViewTickets = state.rawViewTickets.filter(t => !closingIds.includes(t.id));
            state.filteredViewTickets = state.filteredViewTickets.filter(t => !closingIds.includes(t.id));
            state.selectedViewTicketIds.clear();
            updateViewBulkActionBar();
            renderViewTicketsTable();
          }
          scanDuplicateCustomers();
        }).catch(err => {
          console.error('Zendesk merge failed:', err);
          let errMsg = 'Failed to merge tickets in Zendesk.';
          if (err && err.responseJSON && err.responseJSON.description) {
            errMsg = err.responseJSON.description;
          } else if (err && err.responseJSON && err.responseJSON.error) {
            errMsg = typeof err.responseJSON.error === 'string' ? err.responseJSON.error : JSON.stringify(err.responseJSON.error);
          } else if (err && err.message) {
            errMsg = err.message;
          }
          showMergeAlert(errMsg, 'error');
          if (elements.btnConfirmMerge) elements.btnConfirmMerge.disabled = false;
          if (elements.mergeBtnText) elements.mergeBtnText.textContent = 'Confirm and Merge';
          if (elements.mergeBtnSpinner) elements.mergeBtnSpinner.classList.add('hidden');
        });
      } else {
        // Local development preview fallback
        setTimeout(() => {
          showToast(`[Preview] Merged ${closingIds.length} ticket(s) into #${targetId}!`);
          closeMergeModal();
          if (state.mergeState.customer) {
            state.mergeState.customer.tickets = state.mergeState.customer.tickets.filter(t => !closingIds.includes(t.id));
          }
          if (state.rawViewTickets && state.rawViewTickets.length > 0) {
            state.rawViewTickets = state.rawViewTickets.filter(t => !closingIds.includes(t.id));
            state.filteredViewTickets = state.filteredViewTickets.filter(t => !closingIds.includes(t.id));
            state.selectedViewTicketIds.clear();
            updateViewBulkActionBar();
            renderViewTicketsTable();
          }
          renderDuplicateResults();
        }, 600);
      }
    };

    if (pendingTickets.length > 0) {
      Promise.all(pendingTickets.map(t => fetchTicketLatestComment(t.id))).then(() => {
        proceedWithMerge();
      }).catch(() => {
        proceedWithMerge();
      });
    } else {
      proceedWithMerge();
    }
  }

  function closeMergeModal() {
    closeLinkPopover();
    hideLinkTooltip();
    if (elements.mergeModal) {
      elements.mergeModal.classList.add('hidden');
    }
    if (elements.btnConfirmMerge) elements.btnConfirmMerge.disabled = false;
    if (elements.mergeBtnText) elements.mergeBtnText.textContent = 'Confirm and Merge';
    if (elements.mergeBtnSpinner) elements.mergeBtnSpinner.classList.add('hidden');
    hideMergeAlert();
  }

  function showMergeAlert(message, type = 'error') {
    if (!elements.mergeModalAlert) return;
    elements.mergeModalAlert.className = `merge-modal-alert ${type}`;
    elements.mergeModalAlert.textContent = message;
    elements.mergeModalAlert.classList.remove('hidden');
  }

  function hideMergeAlert() {
    if (elements.mergeModalAlert) {
      elements.mergeModalAlert.classList.add('hidden');
      elements.mergeModalAlert.textContent = '';
    }
  }

  // ==========================================
  // BULK EDIT / MACROS TICKETS MODAL & ACTION
  // ==========================================

  function fetchActiveMacros() {
    if (state.macros && state.macros.length > 0) {
      return Promise.resolve(state.macros);
    }

    if (state.macrosLoading) {
      return new Promise(resolve => {
        const interval = setInterval(() => {
          if (!state.macrosLoading) {
            clearInterval(interval);
            resolve(state.macros || []);
          }
        }, 80);
      });
    }

    state.macrosLoading = true;

    if (!state.client) {
      // Realistic mock macros for preview mode
      state.macros = [
        {
          id: 101,
          title: "General::Thank you & Close (Solved)",
          description: "Sends a closing response and sets ticket status to Solved.",
          actions: [
            { field: "comment_mode_is_public", value: "true" },
            { field: "comment_value", value: "Thank you for reaching out to us. We have resolved your issue and are marking this ticket as Solved. Please reply to this email if you need any further assistance!" },
            { field: "status", value: "solved" },
            { field: "current_tags", value: "resolved_by_macro customer_satisfied" }
          ]
        },
        {
          id: 102,
          title: "Support::Awaiting Customer Response (Pending)",
          description: "Requests more details and sets ticket status to Pending.",
          actions: [
            { field: "comment_mode_is_public", value: "true" },
            { field: "comment_value", value: "Hi there,\n\nCould you please provide more details or screenshots regarding this issue so we can investigate further?\n\nThanks!" },
            { field: "status", value: "pending" },
            { field: "current_tags", value: "waiting_on_customer" }
          ]
        },
        {
          id: 103,
          title: "Internal::Escalate to Tier 2",
          description: "Adds an internal note for engineers and marks ticket high priority.",
          actions: [
            { field: "comment_mode_is_public", value: "false" },
            { field: "comment_value", value: "Issue escalated to engineering team for bug inspection. Logs attached." },
            { field: "priority", value: "high" },
            { field: "current_tags", value: "escalated_engineering tier_2" }
          ]
        },
        {
          id: 104,
          title: "Billing::Refund Processed",
          description: "Notifies customer that refund has been issued.",
          actions: [
            { field: "comment_mode_is_public", value: "true" },
            { field: "comment_value", value: "Your refund request has been processed successfully. It should reflect in your account within 3-5 business days." },
            { field: "status", value: "solved" },
            { field: "current_tags", value: "refund_processed finance" }
          ]
        }
      ];
      state.macrosLoading = false;
      return Promise.resolve(state.macros);
    }

    return state.client.request({
      url: '/api/v2/macros/active.json?per_page=100',
      type: 'GET',
      dataType: 'json'
    }).then(res => {
      state.macros = (res && res.macros) || [];
      state.macrosLoading = false;
      return state.macros;
    }).catch(err => {
      console.warn('Failed to fetch macros:', err);
      state.macrosLoading = false;
      return [];
    });
  }

  function openEditModal() {
    const selectedIds = Array.from(state.selectedViewTicketIds);
    if (selectedIds.length === 0) return;

    const selectedTickets = (state.rawViewTickets || []).filter(t => selectedIds.includes(t.id));

    state.editState = {
      selectedTicketIds: selectedIds,
      selectedTickets: selectedTickets,
      selectedMacro: null,
      evaluatedPayload: null,
      macroSearchQuery: '',
      isSubmitting: false
    };

    if (elements.editModalTicketCount) {
      elements.editModalTicketCount.textContent = selectedIds.length;
    }

    if (elements.editTicketsChips) {
      elements.editTicketsChips.innerHTML = selectedTickets.map(t => `
        <span class="edit-ticket-chip" title="${escapeHtml(t.subject || '')}">
          #${t.id} <span class="chip-status">${escapeHtml(t.status || 'open')}</span>
        </span>
      `).join('');
    }

    if (elements.editMacroSearch) elements.editMacroSearch.value = '';
    if (elements.btnClearMacroSearch) elements.btnClearMacroSearch.classList.add('hidden');
    if (elements.editMacroPreviewWrap) elements.editMacroPreviewWrap.classList.add('hidden');
    if (elements.editMacroStatusText) elements.editMacroStatusText.textContent = 'Select a macro below';
    if (elements.btnConfirmApplyMacro) {
      elements.btnConfirmApplyMacro.disabled = true;
      if (elements.editBtnText) elements.editBtnText.textContent = 'Apply to Tickets';
      if (elements.editBtnSpinner) elements.editBtnSpinner.classList.add('hidden');
    }
    hideEditAlert();

    if (elements.editMacroList) {
      elements.editMacroList.innerHTML = '<div class="edit-macro-empty">Loading active macros...</div>';
    }

    if (elements.editModal) {
      elements.editModal.classList.remove('hidden');
    }

    fetchActiveMacros().then(macros => {
      renderMacroList(macros);
      if (elements.editMacroSearch) elements.editMacroSearch.focus();
    });
  }

  function closeEditModal() {
    if (elements.editModal) {
      elements.editModal.classList.add('hidden');
    }
    hideEditAlert();
    state.editState.selectedMacro = null;
    state.editState.evaluatedPayload = null;
    if (elements.btnConfirmApplyMacro) elements.btnConfirmApplyMacro.disabled = false;
    if (elements.editBtnText) elements.editBtnText.textContent = 'Apply to Tickets';
    if (elements.editBtnSpinner) elements.editBtnSpinner.classList.add('hidden');
  }

  function showEditAlert(msg) {
    if (elements.editModalAlert) {
      elements.editModalAlert.textContent = msg;
      elements.editModalAlert.classList.remove('hidden');
    }
  }

  function hideEditAlert() {
    if (elements.editModalAlert) {
      elements.editModalAlert.classList.add('hidden');
      elements.editModalAlert.textContent = '';
    }
  }

  function renderMacroList(macros) {
    if (!elements.editMacroList) return;
    const q = (state.editState.macroSearchQuery || '').toLowerCase().trim();

    let filtered = macros || [];
    if (q) {
      filtered = filtered.filter(m => {
        const titleMatch = (m.title || '').toLowerCase().includes(q);
        const descMatch = (m.description || '').toLowerCase().includes(q);
        return titleMatch || descMatch;
      });
    }

    if (filtered.length === 0) {
      elements.editMacroList.innerHTML = `<div class="edit-macro-empty">${q ? 'No macros found matching "' + escapeHtml(q) + '"' : 'No active macros found.'}</div>`;
      return;
    }

    elements.editMacroList.innerHTML = filtered.map(m => {
      const isSelected = state.editState.selectedMacro && (state.editState.selectedMacro.id === m.id);
      const parts = (m.title || '').split('::');
      const category = parts.length > 1 ? parts.slice(0, -1).join(' › ') : '';
      const leafTitle = parts[parts.length - 1];

      // Summarize actions
      const actions = m.actions || [];
      const statusAction = actions.find(a => a.field === 'status');
      const commentAction = actions.find(a => a.field && a.field.startsWith('comment'));
      const isPublic = actions.find(a => a.field === 'comment_mode_is_public' && String(a.value) === 'true');

      const hints = [];
      if (commentAction) hints.push(isPublic ? 'Public Reply' : 'Internal Note');
      if (statusAction) hints.push(`Status: ${statusAction.value}`);

      return `
        <div class="edit-macro-item ${isSelected ? 'selected' : ''}" data-macro-id="${m.id}">
          ${category ? `<div class="edit-macro-category">${escapeHtml(category)}</div>` : ''}
          <div class="edit-macro-title">
            <span>${escapeHtml(leafTitle)}</span>
            ${isSelected ? '<span style="color:#038153; font-weight:700;">✓</span>' : ''}
          </div>
          ${m.description ? `<div class="edit-macro-desc" title="${escapeHtml(m.description)}">${escapeHtml(m.description)}</div>` : ''}
          ${hints.length > 0 ? `<div class="edit-macro-actions-hint">${hints.join(' • ')}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  function selectMacro(macro) {
    if (!macro) return;
    state.editState.selectedMacro = macro;

    // Highlight item in list
    const items = document.querySelectorAll('.edit-macro-item');
    items.forEach(el => {
      const id = parseInt(el.getAttribute('data-macro-id'), 10);
      const isMatch = (id === macro.id);
      el.classList.toggle('selected', isMatch);
    });

    if (elements.editMacroStatusText) {
      elements.editMacroStatusText.textContent = `Selected: ${macro.title.replace(/::/g, ' › ')}`;
    }

    if (elements.editPreviewMacroName) {
      elements.editPreviewMacroName.textContent = macro.title.replace(/::/g, ' › ');
    }

    if (elements.editMacroPreviewWrap) {
      elements.editMacroPreviewWrap.classList.remove('hidden');
    }

    hideEditAlert();

    const selectedIds = state.editState.selectedTicketIds || [];
    const firstTicketId = selectedIds[0];

    // Attempt to evaluate macro natively via Zendesk if connected
    if (state.client && firstTicketId) {
      state.client.request({
        url: `/api/v2/tickets/${firstTicketId}/macros/${macro.id}/apply.json`,
        type: 'GET',
        dataType: 'json'
      }).then(res => {
        if (res && res.result && res.result.ticket) {
          state.editState.evaluatedPayload = res.result.ticket;
          renderMacroActionPreview(macro, res.result.ticket);
        } else {
          renderMacroActionPreview(macro, null);
        }
      }).catch(err => {
        console.warn('Macro evaluation endpoint failed, using static actions:', err);
        renderMacroActionPreview(macro, null);
      });
    } else {
      renderMacroActionPreview(macro, null);
    }

    // Enable Apply button
    if (elements.btnConfirmApplyMacro) {
      elements.btnConfirmApplyMacro.disabled = false;
      const count = selectedIds.length;
      if (elements.editBtnText) {
        elements.editBtnText.textContent = `Apply to ${count} Ticket${count === 1 ? '' : 's'}`;
      }
    }
  }

  function updateEditCommentPrivacyBadge(isPublic) {
    if (!elements.editCommentPrivacyPill) return;
    state.editState.commentIsPublic = isPublic;
    if (isPublic) {
      elements.editCommentPrivacyPill.textContent = 'Public reply ▾';
      elements.editCommentPrivacyPill.className = 'badge badge-public zd-privacy-toggle';
      elements.editCommentPrivacyPill.title = 'Click to switch to Internal note';
    } else {
      elements.editCommentPrivacyPill.textContent = 'Internal note ▾';
      elements.editCommentPrivacyPill.className = 'badge badge-internal zd-privacy-toggle';
      elements.editCommentPrivacyPill.title = 'Click to switch to Public reply';
    }
  }

  function renderMacroActionPreview(macro, evaluatedTicket) {
    const badgesContainer = elements.editPreviewBadges;
    const commentGroup = elements.editPreviewCommentGroup;
    const commentBody = elements.editPreviewCommentBody;

    const badges = [];
    let commentText = '';
    let isPublic = true; // In Zendesk, default to public reply for macro comments

    if (evaluatedTicket) {
      if (evaluatedTicket.status) {
        badges.push(`<span class="preview-badge preview-badge-status">Status: ${escapeHtml(evaluatedTicket.status)}</span>`);
      }
      if (evaluatedTicket.priority) {
        badges.push(`<span class="preview-badge preview-badge-priority">Priority: ${escapeHtml(evaluatedTicket.priority)}</span>`);
      }
      if (evaluatedTicket.tags && evaluatedTicket.tags.length > 0) {
        badges.push(`<span class="preview-badge preview-badge-tag">Tags: ${escapeHtml(evaluatedTicket.tags.join(', '))}</span>`);
      }
      if (evaluatedTicket.comment) {
        commentText = evaluatedTicket.comment.html_body || evaluatedTicket.comment.body || evaluatedTicket.comment.value || '';
        if (typeof evaluatedTicket.comment.public === 'boolean') {
          isPublic = evaluatedTicket.comment.public;
        }
      }
    } else {
      // Fallback: parse raw macro actions
      const actions = macro.actions || [];
      const statusAct = actions.find(a => a.field === 'status');
      const priorityAct = actions.find(a => a.field === 'priority');
      const tagAct = actions.find(a => a.field === 'current_tags' || a.field === 'set_tags');
      const publicAct = actions.find(a => a.field === 'comment_mode_is_public');
      const commentHtmlAct = actions.find(a => a.field === 'comment_value_html');
      const commentPlainAct = actions.find(a => a.field === 'comment_value');
      const commentAct = commentHtmlAct || commentPlainAct;

      if (statusAct) badges.push(`<span class="preview-badge preview-badge-status">Status: ${escapeHtml(statusAct.value)}</span>`);
      if (priorityAct) badges.push(`<span class="preview-badge preview-badge-priority">Priority: ${escapeHtml(priorityAct.value)}</span>`);
      if (tagAct) badges.push(`<span class="preview-badge preview-badge-tag">Tags: ${escapeHtml(tagAct.value)}</span>`);

      if (publicAct) {
        isPublic = (String(publicAct.value) === 'true');
      } else {
        isPublic = true; // In Zendesk, default to public reply
      }

      if (commentAct) {
        commentText = commentAct.value || '';
      }
    }

    state.editState.commentText = commentText;
    state.editState.commentIsPublic = isPublic;

    if (badgesContainer) {
      badgesContainer.innerHTML = badges.join('');
    }

    if (commentGroup && commentBody) {
      if (commentText && commentText.trim()) {
        commentGroup.classList.remove('hidden');
        // Render rich HTML in the preview so user sees bold and formatting
        commentBody.innerHTML = commentText;
        updateEditCommentPrivacyBadge(isPublic);
      } else {
        commentGroup.classList.add('hidden');
      }
    }
  }

  function executeApplyMacro() {
    const macro = state.editState.selectedMacro;
    if (!macro) {
      showEditAlert('Please select a macro to apply.');
      return;
    }

    const selectedIds = state.editState.selectedTicketIds || [];
    if (selectedIds.length === 0) {
      closeEditModal();
      return;
    }

    // Set Loading state
    if (elements.btnConfirmApplyMacro) elements.btnConfirmApplyMacro.disabled = true;
    if (elements.editBtnText) elements.editBtnText.textContent = 'Applying...';
    if (elements.editBtnSpinner) elements.editBtnSpinner.classList.remove('hidden');
    hideEditAlert();

    // Construct update payload
    let ticketPayload = {};

    if (state.editState.evaluatedPayload) {
      const evalTicket = state.editState.evaluatedPayload;
      if (evalTicket.status) ticketPayload.status = evalTicket.status;
      if (evalTicket.priority) ticketPayload.priority = evalTicket.priority;
      if (evalTicket.tags) ticketPayload.additional_tags = evalTicket.tags;
      if (evalTicket.assignee_id) ticketPayload.assignee_id = evalTicket.assignee_id;
      if (evalTicket.group_id) ticketPayload.group_id = evalTicket.group_id;
    } else {
      // Build from macro actions directly
      const actions = macro.actions || [];
      const statusAct = actions.find(a => a.field === 'status');
      const priorityAct = actions.find(a => a.field === 'priority');
      const tagAct = actions.find(a => a.field === 'current_tags' || a.field === 'set_tags');
      const assigneeAct = actions.find(a => a.field === 'assignee_id');
      const groupAct = actions.find(a => a.field === 'group_id');

      if (statusAct) ticketPayload.status = statusAct.value;
      if (priorityAct) ticketPayload.priority = priorityAct.value;
      if (tagAct) ticketPayload.additional_tags = tagAct.value.split(/\s+/).filter(Boolean);
      if (assigneeAct && assigneeAct.value !== 'current_user') ticketPayload.assignee_id = assigneeAct.value;
      if (groupAct) ticketPayload.group_id = groupAct.value;
    }

    // Process Comment Payload with proper rich HTML support
    const commentContent = state.editState.commentText || '';
    if (commentContent && commentContent.trim()) {
      const isPublic = (state.editState.commentIsPublic !== undefined) ? !!state.editState.commentIsPublic : true;
      const isHtml = /<[a-z][\s\S]*>/i.test(commentContent);

      ticketPayload.comment = {
        public: isPublic
      };

      if (isHtml) {
        // CRITICAL FOR ZENDESK: html_body instructs Zendesk to render rich text/HTML (bold, links, etc.)
        // instead of printing raw <p> and <strong> tags as literal text!
        ticketPayload.comment.html_body = commentContent;
        // body provides the markdown fallback
        ticketPayload.comment.body = convertHtmlToZendeskMarkdown(commentContent);
      } else {
        ticketPayload.comment.body = commentContent;
      }
    }

    const macroTitle = macro.title.replace(/::/g, ' › ');

    if (state.client) {
      const updateUrl = (selectedIds.length === 1)
        ? `/api/v2/tickets/${selectedIds[0]}.json`
        : `/api/v2/tickets/update_many.json?ids=${selectedIds.join(',')}`;

      state.client.request({
        url: updateUrl,
        type: 'PUT',
        contentType: 'application/json',
        data: JSON.stringify({ ticket: ticketPayload })
      }).then(() => {
        showToast(`Successfully applied macro "${macroTitle}" to ${selectedIds.length} ticket(s)!`);
        closeEditModal();

        // Update in-memory ticket objects so table reflects changes immediately
        if (state.rawViewTickets) {
          state.rawViewTickets.forEach(t => {
            if (selectedIds.includes(t.id)) {
              if (ticketPayload.status) t.status = ticketPayload.status;
              if (ticketPayload.priority) t.priority = ticketPayload.priority;
              if (ticketPayload.additional_tags) {
                t.tags = Array.from(new Set([...(t.tags || []), ...ticketPayload.additional_tags]));
              }
            }
          });
        }
        if (state.filteredViewTickets) {
          state.filteredViewTickets.forEach(t => {
            if (selectedIds.includes(t.id)) {
              if (ticketPayload.status) t.status = ticketPayload.status;
              if (ticketPayload.priority) t.priority = ticketPayload.priority;
              if (ticketPayload.additional_tags) {
                t.tags = Array.from(new Set([...(t.tags || []), ...ticketPayload.additional_tags]));
              }
            }
          });
        }

        state.selectedViewTicketIds.clear();
        updateViewBulkActionBar();
        renderViewTicketsTable();
      }).catch(err => {
        console.error('Failed to apply macro to tickets:', err);
        let errMsg = 'Failed to apply macro to tickets.';
        if (err && err.responseJSON && err.responseJSON.description) {
          errMsg = err.responseJSON.description;
        } else if (err && err.message) {
          errMsg = err.message;
        }
        showEditAlert(errMsg);
        if (elements.btnConfirmApplyMacro) elements.btnConfirmApplyMacro.disabled = false;
        if (elements.editBtnText) elements.editBtnText.textContent = `Apply to ${selectedIds.length} Ticket${selectedIds.length === 1 ? '' : 's'}`;
        if (elements.editBtnSpinner) elements.editBtnSpinner.classList.add('hidden');
      });
    } else {
      // Local preview mode
      setTimeout(() => {
        showToast(`[Preview] Applied macro "${macroTitle}" to ${selectedIds.length} ticket(s)!`);
        closeEditModal();

        if (state.rawViewTickets) {
          state.rawViewTickets.forEach(t => {
            if (selectedIds.includes(t.id)) {
              if (ticketPayload.status) t.status = ticketPayload.status;
              if (ticketPayload.priority) t.priority = ticketPayload.priority;
            }
          });
        }
        if (state.filteredViewTickets) {
          state.filteredViewTickets.forEach(t => {
            if (selectedIds.includes(t.id)) {
              if (ticketPayload.status) t.status = ticketPayload.status;
              if (ticketPayload.priority) t.priority = ticketPayload.priority;
            }
          });
        }

        state.selectedViewTicketIds.clear();
        updateViewBulkActionBar();
        renderViewTicketsTable();
      }, 500);
    }
  }

  // ==========================================
  // BULK DELETE TICKETS MODAL & ACTION
  // ==========================================

  function openDeleteModal() {
    const selectedIds = Array.from(state.selectedViewTicketIds);
    if (selectedIds.length === 0) return;

    const selectedTickets = state.rawViewTickets.filter(t => selectedIds.includes(t.id));

    if (elements.deleteModalCount) {
      elements.deleteModalCount.textContent = selectedIds.length;
    }

    if (elements.deleteTicketsList) {
      elements.deleteTicketsList.innerHTML = selectedTickets.map(t => `
        <div class="delete-ticket-item">
          <span class="delete-ticket-id">#${t.id}</span>
          <span class="delete-ticket-subject" title="${escapeHtml(t.subject || '')}">${escapeHtml(t.subject || 'Ticket #' + t.id)}</span>
        </div>
      `).join('');
    }

    if (elements.deleteBtnText) elements.deleteBtnText.textContent = 'Permanently Delete';
    if (elements.deleteBtnSpinner) elements.deleteBtnSpinner.classList.add('hidden');
    if (elements.btnConfirmDelete) elements.btnConfirmDelete.disabled = false;
    hideDeleteAlert();

    if (elements.deleteModal) {
      elements.deleteModal.classList.remove('hidden');
    }
  }

  function closeDeleteModal() {
    if (elements.deleteModal) {
      elements.deleteModal.classList.add('hidden');
    }
    hideDeleteAlert();
  }

  function showDeleteAlert(msg) {
    if (elements.deleteModalAlert) {
      elements.deleteModalAlert.textContent = msg;
      elements.deleteModalAlert.classList.remove('hidden');
    }
  }

  function hideDeleteAlert() {
    if (elements.deleteModalAlert) {
      elements.deleteModalAlert.classList.add('hidden');
      elements.deleteModalAlert.textContent = '';
    }
  }

  function executeTicketDelete() {
    const selectedIds = Array.from(state.selectedViewTicketIds);
    if (selectedIds.length === 0) {
      closeDeleteModal();
      return;
    }

    if (elements.btnConfirmDelete) elements.btnConfirmDelete.disabled = true;
    if (elements.deleteBtnText) elements.deleteBtnText.textContent = 'Deleting...';
    if (elements.deleteBtnSpinner) elements.deleteBtnSpinner.classList.remove('hidden');
    hideDeleteAlert();

    if (state.client) {
      const deleteUrl = (selectedIds.length === 1)
        ? `/api/v2/tickets/${selectedIds[0]}.json`
        : `/api/v2/tickets/destroy_many.json?ids=${selectedIds.join(',')}`;

      state.client.request({
        url: deleteUrl,
        type: 'DELETE',
        dataType: 'json'
      }).then(() => {
        showToast(`Successfully deleted ${selectedIds.length} ticket(s).`);
        closeDeleteModal();

        state.rawViewTickets = state.rawViewTickets.filter(t => !selectedIds.includes(t.id));
        state.filteredViewTickets = state.filteredViewTickets.filter(t => !selectedIds.includes(t.id));
        state.selectedViewTicketIds.clear();
        updateViewBulkActionBar();
        renderViewTicketsTable();

        if (state.duplicateRequesters.length > 0) {
          scanDuplicateCustomers();
        }
      }).catch(err => {
        console.error('Zendesk delete failed:', err);
        let errMsg = 'Failed to delete tickets in Zendesk.';
        if (err && err.responseJSON && err.responseJSON.description) {
          errMsg = err.responseJSON.description;
        } else if (err && err.responseJSON && err.responseJSON.error) {
          errMsg = typeof err.responseJSON.error === 'string' ? err.responseJSON.error : JSON.stringify(err.responseJSON.error);
        } else if (err && err.message) {
          errMsg = err.message;
        }
        showDeleteAlert(errMsg);
        if (elements.btnConfirmDelete) elements.btnConfirmDelete.disabled = false;
        if (elements.deleteBtnText) elements.deleteBtnText.textContent = 'Permanently Delete';
        if (elements.deleteBtnSpinner) elements.deleteBtnSpinner.classList.add('hidden');
      });
    } else {
      // Local preview fallback
      setTimeout(() => {
        showToast(`[Preview] Deleted ${selectedIds.length} ticket(s).`);
        closeDeleteModal();
        state.rawViewTickets = state.rawViewTickets.filter(t => !selectedIds.includes(t.id));
        state.filteredViewTickets = state.filteredViewTickets.filter(t => !selectedIds.includes(t.id));
        state.selectedViewTicketIds.clear();
        updateViewBulkActionBar();
        renderViewTicketsTable();
      }, 500);
    }
  }

  // ==========================================
  // EVENT BINDINGS
  // ==========================================

  function bindEvents() {
    // 1. Sidebar Views selection & Section Collapsing
    elements.viewsList.addEventListener('click', (e) => {
      const header = e.target.closest('.views-section-header');
      if (header) {
        const sectionKey = header.dataset.section;
        state.collapsedSections[sectionKey] = !state.collapsedSections[sectionKey];
        header.classList.toggle('collapsed', state.collapsedSections[sectionKey]);
        const itemsContainer = header.nextElementSibling;
        if (itemsContainer && itemsContainer.classList.contains('views-section-items')) {
          itemsContainer.classList.toggle('collapsed', state.collapsedSections[sectionKey]);
        }
        return;
      }

      const item = e.target.closest('.view-item');
      if (item) {
        const viewId = item.getAttribute('data-view-id');
        const viewTitle = item.getAttribute('data-view-title');
        selectView(viewId, viewTitle);
      }
    });

    // 2. Sidebar Duplicate Tickets link (Image 3 replacement)
    elements.navItemDuplicates.addEventListener('click', () => {
      showDuplicateTicketsSection();
    });

    // 3. Refresh Buttons
    elements.btnRefreshAll.addEventListener('click', () => {
      loadViewsList();
      scanDuplicateCustomers();
    });

    elements.btnRefreshCurrentView.addEventListener('click', () => {
      fetchTicketsForSelectedView(true);
      fetchSingleViewCount(state.selectedViewId);
    });

    elements.btnRescanDuplicates.addEventListener('click', () => {
      scanDuplicateCustomers();
    });

    // 4. Copy View IDs (if button present)
    if (elements.btnCopyViewIds) {
      elements.btnCopyViewIds.addEventListener('click', (e) => {
        const ids = state.filteredViewTickets.map(t => t.id).join(', ');
        copyTextToClipboard(ids, e.target, 'Copied Filtered IDs!');
      });
    }

    // 5. Filter Toggle Drawer
    elements.btnToggleFilters.addEventListener('click', () => {
      elements.filtersDrawer.classList.toggle('hidden');
    });

  function updateDatePresetActiveState(activePreset) {
    if (elements.btnDate2026) {
      elements.btnDate2026.classList.toggle('active', activePreset === '2026');
      elements.btnDate2026.classList.toggle('selected', activePreset === '2026');
    }
    if (elements.btnDate30d) {
      elements.btnDate30d.classList.toggle('active', activePreset === '30d');
      elements.btnDate30d.classList.toggle('selected', activePreset === '30d');
    }
  }

    // 6. Reset Filters
    elements.btnResetViewFilters.addEventListener('click', () => {
      elements.vfSubject.value = '';
      state.selectedTags = [];
      renderTagChips();
      if (elements.tagChipInput) elements.tagChipInput.value = '';
      closeTagDropdown();
      elements.vfStatus.value = '';
      elements.vfPriority.value = '';
      if (elements.vfChannel) elements.vfChannel.value = '';
      elements.vfType.value = '';
      elements.vfRequester.value = '';
      if (elements.vfAssignee) elements.vfAssignee.value = '';
      elements.vfDateFrom.value = '';
      elements.vfDateTo.value = '';
      updateDatePresetActiveState(null);
      applyViewFilters();
    });

    // 7. Live Real-time Filters
    [
      elements.vfSubject, elements.vfStatus,
      elements.vfPriority, elements.vfChannel, elements.vfType, elements.vfRequester,
      elements.vfAssignee,
      elements.vfDateFrom, elements.vfDateTo
    ].forEach(el => {
      if (!el) return;
      el.addEventListener('input', applyViewFilters);
      el.addEventListener('change', applyViewFilters);
    });

    // 7b. Multi-Tag Component Event Handlers
    if (elements.tagMultiselect) {
      elements.tagMultiselect.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.tag-chip-remove');
        if (removeBtn) {
          e.stopPropagation();
          const chip = removeBtn.closest('.tag-chip');
          if (chip && chip.dataset.tag) {
            removeTag(chip.dataset.tag);
          }
          return;
        }
        if (e.target.closest('#tag-chevron')) return;
        if (elements.tagChipInput) elements.tagChipInput.focus();
        openTagDropdown();
      });
    }

    if (elements.tagChevron) {
      elements.tagChevron.addEventListener('click', (e) => {
        e.stopPropagation();
        if (elements.tagDropdown && elements.tagDropdown.classList.contains('hidden')) {
          if (elements.tagChipInput) elements.tagChipInput.focus();
          openTagDropdown();
        } else {
          closeTagDropdown();
        }
      });
    }

    if (elements.tagChipInput) {
      elements.tagChipInput.addEventListener('focus', () => {
        openTagDropdown();
      });

      elements.tagChipInput.addEventListener('input', (e) => {
        const val = e.target.value;
        if (val.includes(',')) {
          const parts = val.split(',');
          parts.forEach(p => {
            if (p.trim()) addTag(p.trim());
          });
          e.target.value = '';
        } else {
          renderTagDropdownOptions(val);
          openTagDropdown();
        }
      });

      elements.tagChipInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault();
          const val = elements.tagChipInput.value.replace(/,/g, '').trim();
          if (val) {
            addTag(val);
          }
        } else if (e.key === 'Backspace' && !elements.tagChipInput.value && state.selectedTags.length > 0) {
          removeTag(state.selectedTags[state.selectedTags.length - 1]);
        } else if (e.key === 'Escape') {
          closeTagDropdown();
        }
      });
    }

    if (elements.tagOptionsList) {
      elements.tagOptionsList.addEventListener('click', (e) => {
        const item = e.target.closest('.tag-option-item');
        if (item && item.dataset.tag) {
          addTag(item.dataset.tag);
          if (elements.tagChipInput) elements.tagChipInput.focus();
        }
      });
    }

    // Close tag dropdown on outside click
    document.addEventListener('click', (e) => {
      if (elements.tagMultiselect && elements.tagDropdown) {
        if (!elements.tagMultiselect.contains(e.target) && !elements.tagDropdown.contains(e.target)) {
          closeTagDropdown();
        }
      }
    });

    // 8. Quick Date Presets
    elements.btnDate2026.addEventListener('click', () => {
      elements.vfDateFrom.value = '2026-01-01';
      elements.vfDateTo.value = '';
      updateDatePresetActiveState('2026');
      applyViewFilters();
    });

    elements.btnDate30d.addEventListener('click', () => {
      const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      elements.vfDateFrom.value = d.toISOString().split('T')[0];
      elements.vfDateTo.value = '';
      updateDatePresetActiveState('30d');
      applyViewFilters();
    });

    elements.btnDateClear.addEventListener('click', () => {
      elements.vfDateFrom.value = '';
      elements.vfDateTo.value = '';
      updateDatePresetActiveState(null);
      applyViewFilters();
    });

    // Clear preset button active highlight if user manually edits date inputs
    [elements.vfDateFrom, elements.vfDateTo].forEach(el => {
      if (!el) return;
      el.addEventListener('input', () => updateDatePresetActiveState(null));
      el.addEventListener('change', () => updateDatePresetActiveState(null));
    });

    // 9. Pagination Controls (Strict 30 tickets per page with smooth transition delay)
    function goToPage(newPage) {
      const totalPages = Math.max(1, Math.ceil(state.filteredViewTickets.length / state.pageSize));
      if (newPage < 1 || newPage > totalPages || newPage === state.currentPage) return;

      const tableWrap = document.querySelector('.tickets-table-wrap');
      if (tableWrap) tableWrap.classList.add('is-loading');

      setTimeout(() => {
        state.currentPage = newPage;
        renderViewTicketsTable();
        if (tableWrap) tableWrap.classList.remove('is-loading');
      }, 180);
    }

    elements.btnPageFirst.addEventListener('click', () => goToPage(1));
    elements.btnPagePrev.addEventListener('click', () => goToPage(state.currentPage - 1));
    elements.btnPageNext.addEventListener('click', () => goToPage(state.currentPage + 1));
    elements.btnPageLast.addEventListener('click', () => {
      const totalPages = Math.max(1, Math.ceil(state.filteredViewTickets.length / state.pageSize));
      goToPage(totalPages);
    });

    // 10. Duplicate Pagination Controls (10 customer groups per page with smooth transition)
    if (elements.btnDupPageFirst) elements.btnDupPageFirst.addEventListener('click', () => goToDupPage(1));
    if (elements.btnDupPagePrev) elements.btnDupPagePrev.addEventListener('click', () => goToDupPage(state.dupCurrentPage - 1));
    if (elements.btnDupPageNext) elements.btnDupPageNext.addEventListener('click', () => goToDupPage(state.dupCurrentPage + 1));
    if (elements.btnDupPageLast) {
      elements.btnDupPageLast.addEventListener('click', () => {
        const totalPages = Math.max(1, Math.ceil(state.duplicateRequesters.length / state.dupPageSize));
        goToDupPage(totalPages);
      });
    }

    // 11. Popover keep-alive on popover hover
    elements.ticketHoverPopover.addEventListener('mouseenter', () => {
      clearTimeout(popoverHideTimeout);
    });
    elements.ticketHoverPopover.addEventListener('mouseleave', () => {
      scheduleHidePopover();
    });

    // 12. Checkboxes change listener (Views & Duplicates)
    document.addEventListener('change', (e) => {
      // Normal View Tickets Checkbox
      if (e.target.classList.contains('view-ticket-checkbox')) {
        const ticketId = parseInt(e.target.getAttribute('data-ticket-id'), 10);
        if (e.target.checked) {
          state.selectedViewTicketIds.add(ticketId);
        } else {
          state.selectedViewTicketIds.delete(ticketId);
        }
        const row = e.target.closest('tr');
        if (row) row.classList.toggle('is-selected', e.target.checked);
        updateViewBulkActionBar();
        return;
      }

      // Duplicate Customer Tickets Checkbox
      if (e.target.classList.contains('dup-ticket-checkbox')) {
        const customerId = e.target.getAttribute('data-customer-id');
        updateCustomerMergeButton(customerId);
        return;
      }

      // Duplicate Customer Select All
      if (e.target.classList.contains('dup-select-all-checkbox')) {
        const customerId = e.target.getAttribute('data-customer-id');
        const isChecked = e.target.checked;
        const ticketChecks = document.querySelectorAll(`.dup-ticket-checkbox[data-customer-id="${customerId}"]`);
        ticketChecks.forEach(cb => { cb.checked = isChecked; });
        updateCustomerMergeButton(customerId);
        return;
      }
    });

    // 12b. Normal View Table Header Select All Checkbox
    if (elements.viewSelectAllTickets) {
      elements.viewSelectAllTickets.addEventListener('change', (e) => {
        const isChecked = e.target.checked;
        const pageCbs = Array.from(document.querySelectorAll('.view-ticket-checkbox'));
        pageCbs.forEach(cb => {
          cb.checked = isChecked;
          const ticketId = parseInt(cb.getAttribute('data-ticket-id'), 10);
          if (isChecked) {
            state.selectedViewTicketIds.add(ticketId);
          } else {
            state.selectedViewTicketIds.delete(ticketId);
          }
          const row = cb.closest('tr');
          if (row) row.classList.toggle('is-selected', isChecked);
        });
        updateViewBulkActionBar();
      });
    }

    // 12c. Prevent editor losing focus/selection when clicking toolbar buttons
    document.addEventListener('mousedown', (e) => {
      if (e.target.closest('.zd-tool-btn')) {
        e.preventDefault();
      }
    });

    // 12d. Update active state of toolbar buttons (Bold, Italic, Underline, Lists, Code, Codeblock, Quote) on selection change
    ['keyup', 'mouseup', 'focus', 'input'].forEach(evtType => {
      document.addEventListener(evtType, (e) => {
        const editor = e.target.closest ? e.target.closest('.zd-composer-editor') : null;
        if (editor) {
          updateComposerActiveToolbar(editor);
        }
      });
    });

    document.addEventListener('selectionchange', () => {
      const activeEl = document.activeElement;
      const editor = activeEl && activeEl.closest ? activeEl.closest('.zd-composer-editor') : null;
      if (editor) {
        updateComposerActiveToolbar(editor);
      }
    });

    // 12e. Support clean multi-line formatting inside code blocks on Enter
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const sel = window.getSelection();
        if (sel && sel.anchorNode) {
          const editor = (sel.anchorNode.nodeType === Node.ELEMENT_NODE)
            ? sel.anchorNode.closest('.zd-composer-editor')
            : (sel.anchorNode.parentElement ? sel.anchorNode.parentElement.closest('.zd-composer-editor') : null);
          if (editor) {
            const pre = getClosestParent(sel.anchorNode, 'pre', editor);
            if (pre) {
              e.preventDefault();
              document.execCommand('insertLineBreak');
            }
          }
        }
      }
    });

    // 12f. Zendesk Native Link Popover Event Handlers
    if (elements.btnCancelLink) {
      elements.btnCancelLink.addEventListener('click', (e) => {
        e.preventDefault();
        closeLinkPopover();
      });
    }

    if (elements.btnAddLink) {
      elements.btnAddLink.addEventListener('click', (e) => {
        e.preventDefault();
        submitLinkPopover();
      });
    }

    if (elements.zdLinkUrl) {
      elements.zdLinkUrl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitLinkPopover();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closeLinkPopover();
        }
      });
    }

    if (elements.zdLinkText) {
      elements.zdLinkText.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitLinkPopover();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          closeLinkPopover();
        }
      });
    }

    // 12g. Zendesk Native Link Tooltip Actions (Open, Edit, Unlink - Exact Image 2)
    if (elements.btnLinkActionOpen) {
      elements.btnLinkActionOpen.addEventListener('click', (e) => {
        e.preventDefault();
        if (state.activeTooltipLink) {
          const url = state.activeTooltipLink.getAttribute('href');
          if (url) window.open(url, '_blank', 'noopener,noreferrer');
        }
      });
    }

    if (elements.btnLinkActionEdit) {
      elements.btnLinkActionEdit.addEventListener('click', (e) => {
        e.preventDefault();
        const anchor = state.activeTooltipLink;
        const editor = state.activeTooltipEditor;
        hideLinkTooltip();
        if (anchor && editor) {
          const toolbar = editor.parentElement ? editor.parentElement.querySelector('.zd-composer-toolbar') : null;
          const linkBtn = toolbar ? toolbar.querySelector('[data-action="link"]') : null;
          openLinkPopover(editor, linkBtn, anchor);
        }
      });
    }

    if (elements.btnLinkActionUnlink) {
      elements.btnLinkActionUnlink.addEventListener('click', (e) => {
        e.preventDefault();
        const anchor = state.activeTooltipLink;
        const editor = state.activeTooltipEditor;
        if (anchor && anchor.parentNode) {
          const textNode = document.createTextNode(anchor.textContent);
          anchor.parentNode.replaceChild(textNode, anchor);
          hideLinkTooltip();
          if (editor) {
            editor.focus();
            updateComposerActiveToolbar(editor);
            editor.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
      });
    }

    if (elements.zdLinkTooltip) {
      elements.zdLinkTooltip.addEventListener('mouseenter', cancelHideLinkTooltip);
      elements.zdLinkTooltip.addEventListener('mouseleave', scheduleHideLinkTooltip);
    }

    // Hover & focus detection for links inside rich text editors
    document.addEventListener('mouseover', (e) => {
      const anchor = e.target.closest ? e.target.closest('.zd-composer-editor a') : null;
      if (anchor) {
        const editor = anchor.closest('.zd-composer-editor');
        if (editor) {
          cancelHideLinkTooltip();
          showLinkTooltip(anchor, editor);
        }
      }
    });

    document.addEventListener('mouseout', (e) => {
      const anchor = e.target.closest ? e.target.closest('.zd-composer-editor a') : null;
      if (anchor) {
        scheduleHideLinkTooltip();
      }
    });

    // 13. Search inside Merge Modal (Auto-searches as you type)
    if (elements.mergeTargetSearch) {
      let searchDebounce = null;
      elements.mergeTargetSearch.addEventListener('input', (e) => {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
          handleMergeTargetSearch(e.target.value);
        }, 150);
      });
      elements.mergeTargetSearch.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          searchZendeskTickets(elements.mergeTargetSearch.value);
        }
      });
    }

    // 14. Keyboard Escape to close popovers and modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        if (elements.zdLinkTooltip && !elements.zdLinkTooltip.classList.contains('hidden')) {
          e.stopPropagation();
          hideLinkTooltip();
          return;
        }
        if (elements.zdLinkPopover && !elements.zdLinkPopover.classList.contains('hidden')) {
          e.stopPropagation();
          closeLinkPopover();
          return;
        }
        if (elements.editModal && !elements.editModal.classList.contains('hidden')) {
          closeEditModal();
        }
        if (elements.mergeModal && !elements.mergeModal.classList.contains('hidden')) {
          closeMergeModal();
        }
        if (elements.deleteModal && !elements.deleteModal.classList.contains('hidden')) {
          closeDeleteModal();
        }
      }
    });

    // Macro Search Input Event
    if (elements.editMacroSearch) {
      elements.editMacroSearch.addEventListener('input', (e) => {
        state.editState.macroSearchQuery = e.target.value || '';
        if (elements.btnClearMacroSearch) {
          elements.btnClearMacroSearch.classList.toggle('hidden', !state.editState.macroSearchQuery);
        }
        renderMacroList(state.macros);
      });
    }

    // 15. Delegate Clicks for ticket opening, merge flow, bulk actions, search, and show more
    document.addEventListener('click', (e) => {
      // View Bulk Action: Edit / Apply Macro to Selected Tickets
      if (e.target.closest('#btn-view-bulk-edit')) {
        openEditModal();
        return;
      }

      // Edit Modal Actions
      if (e.target.closest('#btn-close-edit-modal') || e.target.closest('#btn-cancel-edit')) {
        closeEditModal();
        return;
      }

      if (e.target.closest('#btn-confirm-apply-macro')) {
        executeApplyMacro();
        return;
      }

      if (e.target.closest('#btn-clear-macro-search')) {
        if (elements.editMacroSearch) elements.editMacroSearch.value = '';
        state.editState.macroSearchQuery = '';
        if (elements.btnClearMacroSearch) elements.btnClearMacroSearch.classList.add('hidden');
        renderMacroList(state.macros);
        return;
      }

      if (e.target.closest('#btn-clear-selected-macro')) {
        state.editState.selectedMacro = null;
        state.editState.evaluatedPayload = null;
        if (elements.editMacroPreviewWrap) elements.editMacroPreviewWrap.classList.add('hidden');
        if (elements.editMacroStatusText) elements.editMacroStatusText.textContent = 'Select a macro below';
        if (elements.btnConfirmApplyMacro) elements.btnConfirmApplyMacro.disabled = true;
        renderMacroList(state.macros);
        return;
      }

      // Toggle Macro Comment Privacy (Public reply vs Internal note)
      if (e.target.closest('#edit-comment-privacy-pill')) {
        updateEditCommentPrivacyBadge(!state.editState.commentIsPublic);
        return;
      }

      const macroItem = e.target.closest('.edit-macro-item');
      if (macroItem) {
        const id = parseInt(macroItem.getAttribute('data-macro-id'), 10);
        const m = (state.macros || []).find(macro => macro.id === id);
        if (m) selectMacro(m);
        return;
      }

      if (e.target === elements.editModal) {
        closeEditModal();
        return;
      }

      // View Bulk Action: Merge Selected Tickets
      if (e.target.closest('#btn-view-bulk-merge')) {
        const selectedIds = Array.from(state.selectedViewTicketIds);
        if (selectedIds.length === 0) return;
        const selectedTickets = state.rawViewTickets.filter(t => selectedIds.includes(t.id));
        openMergeModal(selectedTickets);
        return;
      }

      // View Bulk Action: Delete Selected Tickets
      if (e.target.closest('#btn-view-bulk-delete')) {
        openDeleteModal();
        return;
      }

      // Delete Modal Close / Cancel / Confirm Buttons
      if (e.target.closest('#btn-close-delete-modal') || e.target.closest('#btn-cancel-delete')) {
        closeDeleteModal();
        return;
      }

      if (e.target.closest('#btn-confirm-delete')) {
        executeTicketDelete();
        return;
      }

      if (e.target === elements.deleteModal) {
        closeDeleteModal();
        return;
      }

      const openBtn = e.target.closest('.btn-open-ticket');
      if (openBtn) {
        const id = openBtn.getAttribute('data-id');
        routeToTicket(id);
        return;
      }

      // Merge Button on Customer Card
      const mergeBtn = e.target.closest('.btn-merge-selected');
      if (mergeBtn) {
        const customerId = mergeBtn.getAttribute('data-customer-id');
        openMergeModal(customerId);
        return;
      }

      // Candidate Target item clicked inside Merge Modal
      const candidateItem = e.target.closest('.merge-candidate-item');
      if (candidateItem) {
        const ticketId = parseInt(candidateItem.getAttribute('data-ticket-id'), 10);
        const ticket = state.mergeState.allCustomerTickets.find(t => t.id === ticketId);
        if (ticket) selectTargetTicket(ticket);
        return;
      }

      // Search button in Merge Modal search box
      if (e.target.closest('#btn-merge-search-go')) {
        searchZendeskTickets(elements.mergeTargetSearch ? elements.mergeTargetSearch.value : '');
        return;
      }

      // Search Zendesk live button (from candidates list)
      const liveSearchBtn = e.target.closest('#btn-search-zendesk-live');
      if (liveSearchBtn) {
        const query = liveSearchBtn.getAttribute('data-query');
        searchZendeskTickets(query);
        return;
      }

      // Dismiss Organization / Requester Warning (Ignorable)
      if (e.target.closest('#btn-dismiss-org-warning')) {
        if (elements.mergeOrgWarning) elements.mergeOrgWarning.classList.add('hidden');
        return;
      }

      // Privacy Dropdown Toggle Button
      const privacyBtn = e.target.closest('.zd-privacy-btn');
      if (privacyBtn) {
        const target = privacyBtn.getAttribute('data-target');
        if (target === 'closing') {
          if (elements.menuPrivacyClosing) elements.menuPrivacyClosing.classList.toggle('hidden');
          if (elements.menuPrivacyDestination) elements.menuPrivacyDestination.classList.add('hidden');
        } else if (target === 'destination') {
          if (elements.menuPrivacyDestination) elements.menuPrivacyDestination.classList.toggle('hidden');
          if (elements.menuPrivacyClosing) elements.menuPrivacyClosing.classList.add('hidden');
        }
        return;
      }

      // Privacy Dropdown Menu Item Click
      const privacyItem = e.target.closest('.zd-privacy-item');
      if (privacyItem) {
        const target = privacyItem.getAttribute('data-target');
        const val = privacyItem.getAttribute('data-value');
        setComposerPrivacy(target, val === 'public');
        return;
      }

      // Formatting Toolbar Button Click (WYSIWYG Zendesk Rich Text)
      const toolBtn = e.target.closest('.zd-tool-btn');
      if (toolBtn) {
        const action = toolBtn.getAttribute('data-action');
        const toolbar = toolBtn.closest('.zd-composer-toolbar');
        const editorId = toolbar ? (toolbar.getAttribute('data-editor') || toolbar.getAttribute('data-textarea')) : null;
        const editor = editorId ? document.getElementById(editorId) : null;
        if (editor && action) {
          applyToolbarFormatting(editor, action);
        }
        return;
      }

      // Click outside privacy dropdowns to close them
      if (!e.target.closest('.zd-privacy-select-wrap')) {
        if (elements.menuPrivacyClosing) elements.menuPrivacyClosing.classList.add('hidden');
        if (elements.menuPrivacyDestination) elements.menuPrivacyDestination.classList.add('hidden');
      }

      // Click outside link popover to close it
      if (elements.zdLinkPopover && !elements.zdLinkPopover.classList.contains('hidden')) {
        if (!elements.zdLinkPopover.contains(e.target) && !e.target.closest('[data-action="link"]')) {
          closeLinkPopover();
        }
      }

      // Click on link in composer to show Link Action Tooltip Pill (Exact Image 2)
      const clickedAnchor = e.target.closest ? e.target.closest('.zd-composer-editor a') : null;
      if (clickedAnchor) {
        e.preventDefault();
        const editor = clickedAnchor.closest('.zd-composer-editor');
        if (editor) {
          cancelHideLinkTooltip();
          showLinkTooltip(clickedAnchor, editor);
        }
      } else if (elements.zdLinkTooltip && !elements.zdLinkTooltip.classList.contains('hidden')) {
        // Click outside tooltip to hide it
        if (!elements.zdLinkTooltip.contains(e.target)) {
          hideLinkTooltip();
        }
      }

      // Search external ticket button
      const searchExtBtn = e.target.closest('#btn-search-external-ticket');
      if (searchExtBtn) {
        const ticketId = searchExtBtn.getAttribute('data-id');
        searchZendeskTickets(ticketId);
        return;
      }

      // Modal Close / Cancel Buttons
      if (e.target.closest('#btn-close-merge-modal') || e.target.closest('#btn-cancel-merge')) {
        closeMergeModal();
        return;
      }

      // Confirm Merge Button
      if (e.target.closest('#btn-confirm-merge')) {
        executeTicketMerge();
        return;
      }

      // Click outside dialog to close modal
      if (e.target === elements.mergeModal) {
        closeMergeModal();
        return;
      }

      const copyDupBtn = e.target.closest('.btn-copy-dup-ids');
      if (copyDupBtn) {
        const ids = copyDupBtn.getAttribute('data-ids');
        copyTextToClipboard(ids, copyDupBtn, 'Copied IDs!');
        return;
      }

      const toggleBtn = e.target.closest('.btn-toggle-more');
      if (toggleBtn) {
        const targetId = toggleBtn.getAttribute('data-target');
        const count = toggleBtn.getAttribute('data-count');
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          const isHidden = targetEl.classList.toggle('hidden');
          toggleBtn.textContent = isHidden ? `▼ View ${count} more tickets` : `▲ Hide extra tickets`;
        }
        return;
      }
    });

    window.appRoute = (id) => routeToTicket(id);
  }

  // ==========================================
  // INITIALIZATION (Dynamic Zendesk Data Mode)
  // ==========================================

  function initApp() {
    bindEvents();

    // Check if running inside Zendesk Apps Framework
    const hasZAF = typeof window.ZAFClient !== 'undefined';

    if (typeof window.ZAFClient === 'undefined') {
      console.warn('ZAFClient SDK not detected. App must be loaded within Zendesk Support.');
      elements.viewsList.innerHTML = '<div class="views-loading" style="color:#d93f4c;">Zendesk SDK not detected. Please upload and run inside Zendesk Support.</div>';
      elements.ticketsTableBody.innerHTML = '<tr><td colspan="7" class="table-empty-cell">Open app inside Zendesk Support to view live dynamic tickets.</td></tr>';
      elements.duplicatesList.innerHTML = '<div class="empty-state">Open app inside Zendesk Support to scan live dynamic duplicate tickets.</div>';
      return;
    }

    try {
      state.client = window.ZAFClient.init();
      if (!state.client) {
        throw new Error('ZAFClient.init() returned null');
      }

      state.client.context().then(ctx => {
        state.location = ctx.location || 'nav_bar';
        loadViewsList();
        scanDuplicateCustomers();
      }).catch(initErr => {
        console.warn('client context warning, proceeding with dynamic live Zendesk data:', initErr);
        loadViewsList();
        scanDuplicateCustomers();
      });
    } catch (e) {
      console.error('ZAF init failure:', e);
      elements.viewsList.innerHTML = '<div class="views-loading" style="color:#d93f4c;">Zendesk initialization error. Please refresh.</div>';
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }

})();
