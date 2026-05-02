document.addEventListener('DOMContentLoaded', initPage);

function initPage() {
    const data = window.__DATA__;
    initCustomerSwitcher(data);
    initGroupSelects(data);
    initAssignmentActions(data);
}

function initCustomerSwitcher(data) {
    const container = document.getElementById('customerSwitcherContainer');

    container.innerHTML = buildSearchableSelect({
        name: 'customerSwitcher',
        data: data.customers,
        placeholder: 'Switch customer...'
    });

    const wrapper = container.querySelector('.searchable-select');
    initSearchableSelect(wrapper);
    wrapper.setValue(data.customer.id);
    wrapper.addEventListener('change', (e) => {
        const id = e.detail.value;
        if (id) {
            window.location.href = `/customers/${id}`;
        }
    });
}

function initGroupSelects(data) {
    document.querySelectorAll('.group-select').forEach(el => {

        const assignmentId = el.dataset.assignmentId;
        const currentGroup = el.dataset.currentGroup;
        el.innerHTML = buildSearchableSelect({
            name: `group_${assignmentId}`,
            data: data.groups,
            placeholder: 'Select group...'
        });
        const wrapper = el.querySelector('.searchable-select');
        initSearchableSelect(wrapper);
        if (currentGroup) {
            wrapper.setValue(currentGroup);
        }
        wrapper.addEventListener('change', async (e) => {
            const groupId = e.detail.value;
            await updateAssignmentGroup(assignmentId, groupId);
            updateGroupLabel(el, groupId, data.groups);
        });
    });
}

async function updateAssignmentGroup(assignmentId, groupId) {
    await api_post(`/assignments/${assignmentId}/group`, {
        group_id: groupId
    });
}

function updateGroupLabel(container, groupId, groups) {
    const card = container.closest('.assignment-card');
    if (!card) return;

    const label = card.querySelector('.group-name');
    if (!label) return;

    const selected = groups.find(g => g.id == groupId);
    label.textContent = selected ? selected.name : 'Unassigned';
}

function initAssignmentActions(data) {
    const addBtn = document.getElementById('addAssignmentBtn');
    if (addBtn) {
        addBtn.addEventListener('click', () => openAssignModal(data));
    }
	const copyBtn = document.getElementById('copyAssignmentBtn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => openCopyModal(data));
    }
    document.querySelectorAll('.delete-assignment').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            if (!confirm('Remove this assignment?')) return;
            await fetch(`/assignments/${id}`, {
                method: 'DELETE'
            });
            removeAssignmentFromUI(id);
        });
    });
}

function removeAssignmentFromUI(id) {
    const el = document.querySelector(`.assignment-card[data-id="${id}"]`);
    if (el) el.remove();
}

function openAssignModal(data) {
    openFormModal({
        title: 'Add Assignment',
        fields: [
            {
                type: 'select',
                name: 'template_id',
                label: 'Template',
                options: data.templates
            },
            {
                type: 'select',
                name: 'schedule_id',
                label: 'Schedule',
                options: data.schedules
            },
            {
                type: 'select',
                name: 'group_id',
                label: 'Group',
                options: data.groups
            }
        ],
        onSubmit: async (values) => {
            if (!values.template_id || !values.schedule_id || !values.group_id) {
                return alert('All fields required');
            }

            await api_post(`/customers/${customerId}/add-assignment`, values);
            location.reload();
        }
    });
}

function openCopyModal(data) {
    openFormModal({
        title: 'Copy Assignments',
        fields: [
            {
                type: 'select',
                name: 'source_customer_id',
                label: 'Source Customer',
                options: data.customers
            },
            {
                type: 'button',
                label: 'Load Assignments',
                className: 'btn btn-primary',
                onClick: async () => {
                    const sourceId = getNameValue('source_customer_id');
                    if (!sourceId) return alert('Select a customer');
                    const res = await api_get(`/customers/${sourceId}/assignments/json`);
                    setCheckboxListOptions('assignment_ids', res.map(a => ({
                        value: a.id,
                        label: a.template_name,
                        subLabel: a.schedule_name
                    })));
                }
            },
            {
                type: 'checkbox-list',
                name: 'assignment_ids',
                label: 'Assignments'
            }
        ],
        onSubmit: async (values) => {
            if (!values.source_customer_id) return alert('Select a source customer');
            if (!values.assignment_ids.length) return alert('No assignments selected');
            await api_post(`/customers/${customerId}/copy-assignments`, {
                source_customer_id: values.source_customer_id,
                assignment_ids: values.assignment_ids
            });
            location.reload();
        }
    });
}
