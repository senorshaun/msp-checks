document.addEventListener('DOMContentLoaded', initPage);
let data;
let appState;
let statusConfig;
function initPage() {
    data = window.__DATA__;
	appState = {
		tasks: data.tasks || [],
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
		blocked: { 
			label: 'Blocked', 
			color: '#ef4444',
			order: 2
		},
		in_progress: { 
			label: 'In Progress', 
			color: '#f59e0b',
			order: 3
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

/*----------- Status Filter ------------*/
function renderStatusLegend() {
    const container = document.getElementById('statusLegend');
	container.innerHTML = Object.entries(statusConfig).map(([key, cfg]) => `
		<label class="d-flex align-items-center gap-2">
			<input 
				type="checkbox" 
				value="${key}" 
				${appState.filters.statuses.includes(key) ? 'checked' : ''}
			>
			<span style="color:${cfg.color}; font-weight:bold;">●</span>
			${cfg.label}
		</label>
	`).join('');
	document.getElementById('statusLegend')
		.addEventListener('change', () => {
			const container = document.getElementById('statusLegend');
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
    container.innerHTML = buildSearchableSelect({
        name: 'customerFilter',
        data: [
            { id: '', name: 'All Customers' },
            ...appState.customers
        ],
        placeholder: 'Filter Customers',
        multiple: true
    });
    initSearchableSelects();
    const wrapper = container.querySelector('[data-name="customerFilter"]');
    wrapper.setValues(appState.filters.customers);
    wrapper.addEventListener('change', () => {
        setState(state => {
            state.filters.customers = wrapper.getValues();
        });
    });
}
	
function getFilteredTasks() {
    const customerSelected = appState.filters.customers;
    const hasCustomerFilter = customerSelected.length && !customerSelected.includes('');
    return appState.tasks.filter(t => {
        const matchesCustomer = !hasCustomerFilter ||
            customerSelected.includes(String(t.customer_id));
        const matchesStatus = appState.filters.statuses.includes(t.status_name);
        return matchesCustomer && matchesStatus;
    });
}

/* ---------------- CALENDAR ---------------- */
function getWeekDates(baseDate = new Date()) {
    const start = new Date(baseDate);
    start.setDate(start.getDate() - start.getDay() + 1); // Monday

    return Array.from({ length: 5 }).map((_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
    });
}
function groupTasks(tasks) {
    const now = new Date();
    const weekDates = getWeekDates(appState.ui.currentWeekStart);
    const buckets = {
        pastDue: [],
        days: {}, // Mon-Fri
        saturday: [],
        sunday: []
    };
    weekDates.forEach(d => {
        const key = d.toDateString();
        buckets.days[key] = [];
    });
    tasks.forEach(t => {
        const due = new Date(t.due_date);
        if (due < now && t.status_name !== 'complete') {
            buckets.pastDue.push(t);
            return;
        }
        const day = due.getDay();
        if (day === 6) {
            buckets.saturday.push(t);
        } else if (day === 0) {
            buckets.sunday.push(t);
        } else {
            const key = new Date(due).toDateString();
            if (buckets.days[key]) {
                buckets.days[key].push(t);
            }
        }
    });
    return buckets;
}

function renderBoard() {
    const container = document.getElementById('boardView');
    const filtered = getFilteredTasks();
    const buckets = groupTasks(filtered);
    const weekDates = getWeekDates(appState.ui.currentWeekStart);
    renderWeekLabel(weekDates);
    const columns = [
        renderPastDueColumn(buckets.pastDue),
        ...weekDates.map(d =>
            renderDayColumn(d, buckets.days[d.toDateString()])
        ),
        renderWeekendColumn(buckets.saturday, buckets.sunday)
    ];
    container.innerHTML = columns.join('');
}

function renderWeekLabel(weekDates) {
    document.getElementById('weekLabel').innerText =
        `${weekDates[0].toLocaleDateString()} - ${weekDates[4].toLocaleDateString()}`;
}

function renderPastDueColumn(tasks) {
    return renderColumn('Past Due', tasks);
}

function renderDayColumn(date, tasks) {
    return renderColumn(
        date.toLocaleDateString([], { weekday: 'short' }),
        tasks
    );
}

function renderWeekendColumn(satTasks, sunTasks) {
    return `
        <div class="board-column">
            <div class="board-header">Weekend</div>
            <div class="weekend-split">
                <div class="weekend-half">
                    <strong>Sat</strong>
                    ${satTasks.map(renderTaskCard).join('')}
                </div>
                <div class="weekend-half">
                    <strong>Sun</strong>
                    ${sunTasks.map(renderTaskCard).join('')}
                </div>
            </div>
        </div>
    `;
}

function renderTaskCard(t) {
    return `
        <div class="card mb-2 ${t.status_name === 'complete' ? 'task-complete-card' : ''}"
             onclick="loadTask(${t.id})">
            <strong>${formatTaskTitle(t)}</strong><br>
            <small>${t.customer_name}</small>
        </div>
    `;
}

function renderColumn(title, tasks) {
    const sorted = sortTasks(tasks);
    return `
        <div class="board-column">
            <div class="board-header">${title}</div>
            <div class="board-content">
                ${sorted.map(renderTaskCard).join('')}
            </div>
        </div>
    `;
}

function getMonday(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
}

function changeWeek(offset) {
	setState(state => {
        state.ui.currentWeekStart.setDate(state.ui.currentWeekStart.getDate() + (offset * 7));
    });
    renderBoard();
}

function resetWeek() {
    setState(state => {
        state.ui.currentWeekStart.setDate(getMonday(new Date()));
    });
    renderBoard();
}

function sortTasks(tasks) {
    return [...tasks].sort((a, b) => {
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
	document.getElementById('drawerSteps').innerHTML = 'Loading...';
	openDrawer();
	
    const res = await api_fetch('GET', `/task/${id}`, null);
    const task = res.task;
    const steps = res.steps;
    currentTaskId = id;
    document.getElementById('drawerTitle').innerText = task.name;
    document.getElementById('drawerMeta').innerText =
        `${task.customer_name} • Due ${task.due_date}`;
    let html = '';
    steps.forEach(step => {
        html += `
        <div class="card mb-2 card-row">
            <label>
                <input type="checkbox"
                    ${step.is_completed ? "checked" : ""}
                    onchange="updateStep(${step.id}, this.checked)">
                <strong>${step.title}</strong>
            </label>

            <textarea class="form-control mt-2"
                placeholder="Notes..."
                onblur="updateStep(${step.id}, this.closest('.card').querySelector('input').checked, this.value)">
                ${step.notes || ''}
            </textarea>
        </div>
        `;
    });
    document.getElementById('drawerSteps').innerHTML = html;
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
    const task = appState.tasks.find(t => t.id === currentTaskId);
    if (task) {
        task.status_name = 'complete';
    }
    render();
    closeDrawer();
}

function formatTaskTitle(t) {
    if (!t.due_date) return t.name;
	if (t.status_name == "complete") return t.name;
    const date = new Date(t.due_date);
    const hasTime =
        date.getHours() !== 0 ||
        date.getMinutes() !== 0;

    if (!hasTime) return t.name;
    const time = date.toLocaleTimeString([], {
        hour: 'numeric',
        minute: '2-digit'
    });
    return `${time} - ${t.name}`;
}