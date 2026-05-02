const templates = window.__DATA__.templates || [];
const schedules = window.__DATA__.schedules || [];
const groups = window.__DATA__.groups || [];
const customers = window.__DATA__.customers || [];
const customerId = window.__DATA__.customerId;
document.addEventListener('DOMContentLoaded', init());

function init() {
	initSearchableSelects();
    bindSearchableSelects({
        selector: '.group-select',
        getInitialValue: (el) => el.dataset.currentGroup,
        onChange: (value, el) => {
            updateGroup(el.dataset.assignmentId, value);
        }
    });
	renderCustomerSwitcher();
}

function updateGroup(id,group){
	api_post('/customers/update-group',{
		assignment_id:id,
		group_id:group
	});
}

function renderCustomerSwitcher() {
    const container = document.getElementById('customerSwitcherContainer');
	if (!container) return;
    container.innerHTML = buildSearchableSelect({
        name: 'customerSwitcher',
        data: customers,
        placeholder: 'Jump to Customer...'
    });
    const wrapper = container.querySelector('[data-name="customerSwitcher"]');
    let isInitialized = false;
	wrapper.addEventListener('change', () => {
		if (!isInitialized) return;
		const selected = wrapper.getValues();
		if (!selected || !selected.length) return;
		const id = selected[0];
		if (String(id) !== String(customerId)) {
			window.location.href = `/customers/${id}`;
		}
	});
	setTimeout(() => {
		isInitialized = true;
	}, 0);
}

function openAssignModal() {
    openFormModal({
        title: 'Add Assignment',
        fields: [
            {
                type: 'select',
                name: 'template_id',
                label: 'Template',
                options: templates
            },
            {
                type: 'select',
                name: 'schedule_id',
                label: 'Schedule',
                options: schedules
            },
            {
                type: 'select',
                name: 'group_id',
                label: 'Group',
                options: groups
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

function openCopyModal() {
    openFormModal({
        title: 'Copy Assignments',
        fields: [
            {
                type: 'select',
                name: 'source_customer_id',
                label: 'Source Customer',
                options: customers
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