document.addEventListener('DOMContentLoaded', initPage);
let data;
let appState;
let statusConfig;
function initPage() {
    data = window.__DATA__;
	appState = {
		items: data.items || [],
		customers: flattenData(data.customers, 'customers') || [],
		filters: {
			customers: [],
			statuses: []
		},
		ui: {
			sidebarOpen: false,
			legendOpen: false,
			currentWeekStart: null
		}
	};
	statusConfig = {
		complete: { 
			label: 'Complete', 
			color: '#9ca3af',
			className: 'task-complete',
			order: 1
		},
		resolved: { 
			label: 'Atera - Resolved', 
			color: '#9ca3af',
			className: 'task-complete',
			order: 1
		},
		closed: { 
			label: 'Atera - Closed', 
			color: '#9ca3af',
			className: 'task-complete',
			order: 1
		},
		replied: { 
			label: 'Atera - Replied', 
			color: '#9ca3af',
			className: 'task-complete',
			order: 1
		},
		blocked: { 
			label: 'Blocked', 
			color: '#ef4444',
			order: 3
		},
		open: { 
			label: 'Open', 
			color: '#f59e0b',
			order: 4
		},
		in_progress: { 
			label: 'In Progress', 
			color: '#f59e0b',
			order: 4
		},
		pending: { 
			label: 'Pending', 
			color: '#000000',
			order: 4
		}
	};
	loadState();
	render();
	let currentTaskId = null;
}

/*----------- App State -------------*/
function loadState() {
    const savedCustomers = localStorage.getItem('customerFilter');
    const savedStatuses = localStorage.getItem('statusFilter');
    const sidebarOpen = localStorage.getItem('sidebarOpen');
    const legendOpen = localStorage.getItem('legendOpen');
    appState.filters.customers = savedCustomers
        ? JSON.parse(savedCustomers)
        : [];
    appState.filters.statuses = savedStatuses
        ? JSON.parse(savedStatuses)
        : Object.keys(statusConfig);
    appState.ui.sidebarOpen = sidebarOpen === '1';
    appState.ui.legendOpen = legendOpen === '1';
    appState.ui.currentWeekStart = getMonday(new Date());
}

function setState(updater) {
    updater(appState);
    persistState();
    render();
}

function persistState() {
    localStorage.setItem('customerFilter', JSON.stringify(appState.filters.customers));
    localStorage.setItem('statusFilter', JSON.stringify(appState.filters.statuses));
    localStorage.setItem('sidebarOpen', appState.ui.sidebarOpen ? '1' : '0');
    localStorage.setItem('legendOpen', appState.ui.legendOpen ? '1' : '0');
}

function render() {
    renderStatusLegend();
	renderCustomerFilter();
    renderBoard();
    renderUIState();
}

function renderUIState() {
    if (appState.ui.sidebarOpen) {
        openSidebar();
    } else {
        closeSidebar();
    }
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') toggleSidebar(false);
	});
}

/*----------- Filter Sidebar ------------*/
function toggleSidebar(open) {
    setState(state => {
        state.ui.sidebarOpen = open;
    });
}

function openSidebar() {
    document.body.classList.add('sidebar-open');
    document.getElementById('sidebar').classList.add('open');
    document.getElementById('filterOverlay').classList.add('active');
}

function closeSidebar() {
    document.body.classList.remove('sidebar-open');
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('filterOverlay').classList.remove('active');
}

/* ---------------- View Toggle ---------------- */
function toggleView(view) {
    document.getElementById('boardView').style.display =
        view === 'calendar' ? 'grid' : 'none';
    document.getElementById('listView').style.display =
        view === 'list' ? 'block' : 'none';
}

function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.innerText = text;
    return e;
}

/*----------- Status Filter ------------*/
function renderStatusLegend() {
    const container = document.getElementById('statusLegend');
    container.innerHTML = '';

    Object.entries(statusConfig).forEach(([key, cfg]) => {
        const label = el('label', 'd-flex align-items-center gap-2');

        const input = document.createElement('input');
        input.type = 'checkbox';
        input.value = key;
        input.checked = appState.filters.statuses.includes(key);

        const dot = el('span');
        dot.style.color = cfg.color;
        dot.style.fontWeight = 'bold';
        dot.innerText = '●';

        label.appendChild(input);
        label.appendChild(dot);
        label.appendChild(document.createTextNode(cfg.label));

        container.appendChild(label);
    });

    container.addEventListener('change', () => {
        setState(state => {
            state.filters.statuses = Array.from(
                document.querySelectorAll('#statusLegend input:checked')
            ).map(i => i.value);
        });
    });
}

/*----------- Customer Filter ------------*/
function renderCustomerFilter() {
    const container = document.getElementById('customerFilterContainer');
    container.innerHTML = '';
	container.appendChild(buildSearchableSelect({
        name: 'customerFilter',
        data: [
            { id: '', name: 'All Customers' },
            ...appState.customers
        ],
        placeholder: 'Filter Customers',
        multiple: true,
		grouped: true
    }));
    initSearchableSelects();
    const wrapper = container.querySelector('[data-name="customerFilter"]');
    wrapper.setValues(appState.filters.customers);
    wrapper.addEventListener('change', () => {
        setState(state => {
            state.filters.customers = wrapper.getValues();
        });
    });
}
	
function getFilteredItems() {
    const customerSelected = appState.filters.customers;
    const hasCustomerFilter = customerSelected.length && !customerSelected.includes('');
    return appState.items.filter(t => {
        const matchesCustomer = !hasCustomerFilter ||
            customerSelected.includes(String(t.customer_id));
        const matchesStatus = appState.filters.statuses.includes(t.status);
        return matchesCustomer && matchesStatus;
    });
}

/* ---------------- CALENDAR ---------------- */
function getWeekDates(baseDate = new Date()) {
    const start = new Date(baseDate);
    start.setDate(start.getDate() - start.getDay() + 1);

    return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
    });
}

function getRollingWeekDates(baseDate = new Date()) {
    const start = new Date(baseDate);

    return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
    });
}

function orderWeekDates(weekDates) {
    const today = new Date().toDateString();

    const idx = weekDates.findIndex(
        d => d.toDateString() === today
    );

    if (idx === -1) return weekDates;

    return [
        ...weekDates.slice(idx),
        ...weekDates.slice(0, idx)
    ];
}


function groupItems(items) {
    const now = new Date();
    const weekDates = getWeekDates(appState.ui.currentWeekStart);
    const buckets = {
        pastDue: [],
        days: {}
    };
    weekDates.forEach(d => {
		buckets.days[d.toDateString()] = [];
	});
    items.forEach(t => {
        const due = new Date(t.due_date);
        if (due < now && t.status_name !== 'complete') {
            buckets.pastDue.push(t);
            return;
        }
        const key = new Date(due).toDateString();
		if (buckets.days[key]) {
			buckets.days[key].push(t);
		}
    });
    return buckets;
}

function renderBoard() {
    const container = document.getElementById('boardView');

    const filtered = getFilteredItems();
    const buckets = groupItems(filtered);

    let weekDates;
    let ordered;

    if (isCurrentWeek(appState.ui.currentWeekStart)) {
        ordered = getRollingWeekDates(new Date());
        weekDates = ordered;
    } else {
        weekDates = getWeekDates(appState.ui.currentWeekStart);
        ordered = weekDates;
    }

    renderDateLabel(weekDates);

    // -------- 1. Measure FIRST positions --------
    const firstRects = new Map();
    Array.from(container.children).forEach(el => {
        firstRects.set(el.dataset.key, el.getBoundingClientRect());
    });

    // -------- 2. Build new columns --------
    const newColumns = [];

    if (buckets.pastDue.length > 0) {
        const col = renderPastDueColumn(buckets.pastDue);
        col.dataset.key = 'pastDue';
        newColumns.push(col);
    }

    buildColumns(ordered, buckets.days).forEach((col, i) => {
        col.dataset.key = col.dataset.key || `day-${i}`;
        newColumns.push(col);
    });

    // -------- 3. Replace DOM --------
    container.innerHTML = '';
    newColumns.forEach(col => {
        col.classList.add('entering'); // for fade-in
        container.appendChild(col);
    });

    // -------- 4. Measure LAST positions --------
    const lastRects = new Map();
    Array.from(container.children).forEach(el => {
        lastRects.set(el.dataset.key, el.getBoundingClientRect());
    });

    // -------- 5. Animate (FLIP) --------
    Array.from(container.children).forEach(el => {
        const key = el.dataset.key;
        const first = firstRects.get(key);
        const last = lastRects.get(key);

        if (first && last) {
			const dx = first.left - last.left;

			if (dx !== 0) {
				el.style.transform = `translateX(${dx}px)`;

				requestAnimationFrame(() => {
					el.style.transform = '';
				});
			}
		}

        // fade in new columns
        requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				el.classList.remove('entering');
			});
		});
    });
}

function renderDateLabel(dates) {
    const start = dates[0];
    const end = dates[dates.length - 1];

    document.getElementById('dateLabel').innerText = `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
}

function buildColumns(orderedDates, dayBuckets) {
    const cols = [];
    for (let i = 0; i < orderedDates.length; i++) {
        const d = orderedDates[i];
        const day = d.getDay();
        if (day === 6) {
            const next = orderedDates[i + 1];
            let sunItems = [];

            if (next && next.getDay() === 0) {
                sunItems = dayBuckets[next.toDateString()] || [];
                i++; // skip Sunday
            }
            cols.push(
                renderWeekendColumn(
                    dayBuckets[d.toDateString()] || [],
                    sunItems,
					`weekend-${d.toDateString()}`
                )
            );
        }
        else if (day === 0) {
            cols.push(
                renderWeekendColumn(
                    [],
                    dayBuckets[d.toDateString()] || [],
					`weekend-${d.toDateString()}`
                )
            );
        }
        else {
            cols.push(
                renderDayColumn(
                    d,
                    dayBuckets[d.toDateString()] || []
                )
            );
        }
    }
    return cols;
}

function renderPastDueColumn(items) {
    const col = renderColumn(null, 'Past Due', items);
    col.dataset.key = 'pastDue';
    return col;
}

function renderDayColumn(date, items) {
    const col = renderColumn(
        date,
        date.toLocaleDateString([], { weekday: 'short' }),
        items
    );
    col.dataset.key = date.toDateString(); // stable identity
    return col;
}

function renderWeekendColumn(satItems, sunItems, key) {
    const column = el('div', 'board-column');
    column.dataset.key = key;

    const header = el('div', 'board-header', 'Weekend');

    const split = el('div', 'weekend-split');

    const sat = el('div', 'weekend-half');
    sat.appendChild(el('strong', null, 'Sat'));
    satItems.forEach(i => sat.appendChild(renderDashboardItem(i)));

    const sun = el('div', 'weekend-half');
    sun.appendChild(el('strong', null, 'Sun'));
    sunItems.forEach(i => sun.appendChild(renderDashboardItem(i)));

    split.appendChild(sat);
    split.appendChild(sun);

    column.appendChild(header);
    column.appendChild(split);

    return column;
}

function renderColumn(date, title, items) {
    const sorted = sortItems(items);

    const column = el('div', 'board-column');

    const header = el('div', 'board-header');
    header.appendChild(document.createTextNode(title));

    if (title !== 'Past Due' && date) {
        const btn = el('button', 'btn btn-sm', '+');
        btn.addEventListener('click', () => {
            openCreateTaskModal(date.toISOString());
        });
        header.appendChild(btn);
    }

    const content = el('div', 'board-content');

    sorted.forEach(item => {
        content.appendChild(renderDashboardItem(item));
    });

    column.appendChild(header);
    column.appendChild(content);

    return column;
}

function renderDashboardItem(item) {
    const div = el('div', `dashboard-item ${item.isComplete ? 'task-complete-card' : ''}`);

    const strong = el('strong', null, formatItemTitle(item));
    const small = el('small', null, item.customer_name || 'Internal');

    div.appendChild(strong);
    div.appendChild(document.createElement('br'));
    div.appendChild(small);

    div.addEventListener('click', () => {
        if (item.type === 'ticket') {
            window.open(`https://app.atera.com/new/ticket/${item.id}`, '_blank');
        } else {
            loadTask(item.id);
        }
    });

    return div;
}

function getMonday(d) {
	const date = new Date(d);
	const day = date.getDay();
	const diff = date.getDate() - day + (day === 0 ? -6 : 1);
	return new Date(date.setDate(diff));
}

function isCurrentWeek(weekStart) {
    const thisMonday = getMonday(new Date()).toDateString();
    return new Date(weekStart).toDateString() === thisMonday;
}

function changeWeek(offset) {
    setState(state => {
        const newDate = new Date(state.ui.currentWeekStart);
        newDate.setDate(newDate.getDate() + (offset * 7));
        state.ui.currentWeekStart = newDate;
    });
}

function resetWeek() {
    setState(state => {
        state.ui.currentWeekStart = getMonday(new Date());
    });
}

function sortItems(items) {
    return [...items].sort((a, b) => {
        const aDate = new Date(a.due_date);
        const bDate = new Date(b.due_date);

        const aHasTime = aDate.getHours() || aDate.getMinutes();
        const bHasTime = bDate.getHours() || bDate.getMinutes();

        // All-day first
        if (!!aHasTime !== !!bHasTime) {
            return aHasTime ? 1 : -1;
        }

        // Both all-day → sort by status
        if (!aHasTime && !bHasTime || (aHasTime == bHasTime)) {
            return (statusConfig[a.status_name]?.order || 99) -
                   (statusConfig[b.status_name]?.order || 99);
        }

        // Both timed → sort by time
        return aDate - bDate;
    });
}

/* ---------------- TASK DRAWER ---------------- */
function openDrawer() {
    document.getElementById('taskDrawer').style.right = '0';
    document.getElementById('drawerOverlay').classList.add('active');
}

function closeDrawer() {
    document.getElementById('taskDrawer').style.right = '-520px';
    document.getElementById('drawerOverlay').classList.remove('active');
    currentTaskId = null;
}

/* ---------------- TASK LOADING ---------------- */
async function loadTask(id) {
    const stepsContainer = document.getElementById('drawerSteps');
    const titleEl = document.getElementById('drawerTitle');
    const metaEl = document.getElementById('drawerMeta');

    stepsContainer.innerHTML = 'Loading...';
    openDrawer();

    const res = await api_fetch('GET', `/task/${id}`, null);
    const task = res.task;
    const steps = res.steps;

    currentTaskId = id;

    titleEl.innerText = task.name;
	if (!task.template_id) {
        const btn = document.createElement('button');
        btn.className = 'btn btn-sm btn-outline-secondary ms-2';
        btn.innerText = 'Edit Task';

        btn.addEventListener('click', () => openEditTaskModal(task));

        titleEl.appendChild(btn);
    }
	
    metaEl.innerHTML = '';
    const metaText = document.createTextNode(
        `${task.customer_name || 'Internal'}
		Due ${(new Date(task.due_date)).toLocaleDateString()}`
    );
    metaEl.appendChild(metaText);

    stepsContainer.innerHTML = '';
    steps.forEach(step => {
        const card = document.createElement('div');
        card.className = 'card mb-2 card-row';
        const label = document.createElement('label');

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = !!step.is_completed;

        checkbox.addEventListener('change', () => {
            updateStep(step.id, checkbox.checked);
        });

        const strong = el('strong', null, step.title);

        label.appendChild(checkbox);
        label.appendChild(document.createTextNode(' '));
        label.appendChild(strong);

        // Notes textarea
        const textarea = document.createElement('textarea');
        textarea.className = 'form-control mt-2';
        textarea.placeholder = 'Notes...';
        textarea.value = step.notes || '';

        textarea.addEventListener('blur', () => {
            updateStep(
                step.id,
                checkbox.checked,
                textarea.value
            );
        });

        card.appendChild(label);
        card.appendChild(textarea);

        stepsContainer.appendChild(card);
    });
}

/* ---------------- STEP UPDATE ---------------- */
async function updateStep(id, completed, notes = null) {
    await api_fetch('POST', '/step/update', {
		step_id: id,
		completed: completed,
		notes: notes,
		user_id: 1
    });
}

/* ---------------- TASK COMPLETE ---------------- */
async function completeTask() {
    const stepCheckboxes = document.querySelectorAll('#drawerSteps input[type="checkbox"]');
    const allChecked = Array.from(stepCheckboxes).every(chk => chk.checked);
    if (!allChecked) {
        alert('All steps must be completed before finishing this task.');
        return;
    }
    const res = await api_fetch('POST', '/task/complete', {
		task_id: currentTaskId,
		user_id: 1
    });
    if (!res.ok) {
        return alert('Failed to complete task');
    }
    const item = appState.items.find(t => t.id === currentTaskId);
    if (item) {
        item.status_name = 'complete';
    }
    render();
    closeDrawer();
}

function formatItemTitle(t) {
    if (!t.due_date || t.isComplete) return t.name;
    const date = new Date(t.due_date);
    const hasTime =
        date.getHours() !== 0 ||
        date.getMinutes() !== 0 || 
		(date.getHours() !== 5 &&
        date.getMinutes() !== 0);

    if (!hasTime) return t.name;
    const time = date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
    });
    return `${time} - ${t.name}`;
}

/* ---------------- Manual Task ---------------- */
function getTaskFormFields() {
    return [
	    { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
		{ name: 'due_date', label: 'Due Date', type: 'date', placeholder: (new Date()).toISOString().slice(0,10) },
        {
            name: 'customer_id',
            label: 'Customer',
            type: 'select',
            options: flattenData(data.customers, 'customers'),
			multiple: true,
			grouped:true
        },
        {
            name: 'group_id',
            label: 'Group',
            type: 'select',
            options: data.groups
        }
    ];
}

function openCreateTaskModal(prefillDate = null) {
	const initialValues = {}
	if (prefillDate) {
        const d = new Date(prefillDate);
        initialValues.due_date = d.toISOString().slice(0,10);
    }
	openFormModal({
        title: 'Create Task',
        fields: getTaskFormFields(),
		initialValues: initialValues,
        onSubmit: async (formData) => {
            await api_fetch('POST', '/task', formData);
            location.reload();
        }
    });
}

function openEditTaskModal(task) {
	openFormModal({
        title: 'Edit Task',
        fields: getTaskFormFields(),
		initialValues: task,
        onSubmit: async (formData) => {
            await api_fetch('PUT', `/task/${template.id}`, formData);
            location.reload();
        }
    });
}