document.addEventListener('DOMContentLoaded', initPage);
let data;
function initPage() {
    data = window.__DATA__ || {
        assignments: [],
        customers: [],
        templates: [],
        schedules: []
    };
	customers = flattenCustomers(customers);
    initAssignmentActions();
}

function initAssignmentActions(data) {
    const createBtn = document.getElementById('createAssignmentBtn');
    if (createBtn) createBtn.addEventListener('click', () => openCreateAssignmentModal(data));
    document.querySelectorAll('.assignment-card').forEach(card => {
        const id = card.dataset.id;
        const assignment = data.assignments.find(a => String(a.id) === String(id));
        if (!assignment) return;
        const editBtn = card.querySelector('.edit-assignment-btn');
        const deleteBtn = card.querySelector('.delete-assignment-btn');
        if (editBtn) editBtn.addEventListener('click', () => openEditAssignmentModal(assignment, data));
        if (deleteBtn) deleteBtn.addEventListener('click', () => deleteAssignment(assignment));
    });
}

function getAssignmentFormFields(data) {
    return [
        {
            name: 'customer_id',
            label: 'Customer',
            type: 'select',
            required: true,
            options: flattenData(data.customers, 'customers').map(c => ({
                label: c.name,
                value: c.id
            }))
        },
        {
            name: 'template_id',
            label: 'Template',
            type: 'select',
            required: true,
            options: data.templates.map(t => ({
                label: t.name,
                value: t.id
            }))
        },
        {
            name: 'schedule_id',
            label: 'Schedule',
            type: 'select',
            required: true,
            options: data.schedules.map(s => ({
                label: s.name,
                value: s.id
            }))
        },
        {
            name: 'group_id',
            label: 'Group',
            type: 'select',
            required: true,
            options: data.groups.map(g => ({
                label: g.name,
                value: g.id
            }))
        }
    ];
}

function openCreateAssignmentModal(data) {
    openFormModal({
        title: 'Create Assignment',
        fields: getAssignmentFormFields(data),
        onSubmit: async (formData) => {
            await fetch('/assignments', {
                formData
            });
            location.reload();
        }
    });
}

function openEditAssignmentModal(assignment, data) {
    openFormModal({
        title: 'Edit Assignment',
        fields: getAssignmentFormFields(data),
        initialValues: assignment,
        onSubmit: async (formData) => {
            await api_fetch('PUT', `/assignments/${assignment.id}`, {
                formData
            });
            location.reload();
        }
    });
}

function deleteAssignment(assignment) {
    openFormModal({
        title: 'Delete Assignment',
        fields: [],
        submitText: 'Delete',
        submitClass: 'btn-danger',
        description: `Are you sure you want to delete this assignment?`,
        onSubmit: async () => {
            await api_fetch('DELETE', `/assignments/${assignment.id}`, null);
            location.reload();
        }
    });
}