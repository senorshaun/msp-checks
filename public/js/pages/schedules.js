document.addEventListener('DOMContentLoaded', initPage);
let data;
function initPage() {
    data = window.__DATA__ || {
        schedules: []
    };
    initScheduleActions();
}

function initScheduleActions() {
    const createBtn = document.getElementById('createScheduleBtn');
    if (createBtn) createBtn.addEventListener('click', () => openCreateScheduleModal());

    document.querySelectorAll('.schedule-card').forEach(card => {
        const id = card.dataset.id;
        const schedule = data.schedules.find(s => String(s.id) === String(id));
        if (!schedule) return;
        const editBtn = card.querySelector('.edit-schedule-btn');
        const deleteBtn = card.querySelector('.delete-schedule-btn');
        if (editBtn) editBtn.addEventListener('click', () => openEditScheduleModal(schedule));
        if (deleteBtn) deleteBtn.addEventListener('click', () => deleteSchedule(schedule));
    });
}

function getScheduleFormFields() {
    return [
		{ name: 'name', label: 'Name', type: 'text', required: true },
		{ name: 'frequency', label: 'Frequency', type: 'select', options: [{name: 'daily', id: 'daily'}, {name: 'weekly', id: 'weekly'}, {name: 'monthly', id: 'monthly'}, {name: 'yearly', id: 'yearly'}], required: true },
		{ name: 'interval', label: 'Interval', type: 'number', required: true, min: 1, default: 1 },
		{ name: 'day_of_week', label: 'Day of Week', type: 'text', placeholder: 'mon,tue,wed,...', showIf: (data) => data.frequency === 'weekly' },
		{ name: 'day_of_month', label: 'Day of Month', type: 'number', placeholder: 1, showIf: (data) => data.frequency === 'monthly' || data.frequency === 'yearly' },
		{ name: 'month_of_year', label: 'Month of Year', type: 'number', placeholder: 1, showIf: (data) => data.frequency === 'yearly' }
	];
}

function openCreateScheduleModal() {
    openFormModal({
		title: 'Create Schedule',
		fields: getScheduleFormFields(),
		onSubmit: async (formData) => {
			await api_fetch('POST','/schedules', {
				formData
			});
			location.reload();
		}
	});
}

function openEditScheduleModal(schedule) {
    openFormModal({
        title: 'Edit Schedule',
        fields: getScheduleFormFields(),
        initialValues: schedule,
        onSubmit: async (formData) => {
            await api_fetch('PUT', `/schedules/${schedule.id}`, formData);
            location.reload();
        }
    });
}

function deleteSchedule(schedule) {
    openFormModal({
        title: 'Delete Schedule',
        fields: [],
        submitText: 'Delete',
        submitClass: 'btn-danger',
        description: `Are you sure you want to delete "${schedule.name}"?`,
        onSubmit: async () => {
            await api_fetch('DELETE', `/schedules/${schedule.id}`, null);
            location.reload();
        }
    });
}
