const templates = window.__DATA__.templates || [];
const schedules = window.__DATA__.schedules || [];
const groups = window.__DATA__.groups || [];
const customers = window.__DATA__.customers || [];


function openAddAssignmentModal() {
    openModal(`
        <h3>Add Assignment</h3>

		<div class="form-group">
			<label>Template</label>
			${buildSearchableSelect({
				name: 'template_id',
				data: templates,
				placeholder: 'Select Template'
			})}
		</div>

		<div class="form-group">
			<label>Schedule</label>
			${buildSearchableSelect({
				name: 'schedule_id',
				data: schedules,
				placeholder: 'Select Schedule'
			})}
		</div>

		<div class="form-group">
			<label>Group</label>
			${buildSearchableSelect({
				name: 'group_id',
				data: groups,
				placeholder: 'Select Group'
			})}
		</div>
	
		<div class="form-group">	
			<label>Customer</label>
			${buildSearchableSelect({
				name: 'customer_ids',
				data: customers,
				placeholder: 'Select Customer',
				multiple:true
			})}
		</div>

        <div style="margin-top:10px;">
            <button onclick="submitAddAssignment()">Save</button>
            <button onclick="closeModal()">Cancel</button>
        </div>
    `);

    initSearchableSelects();
}

async function submitAddAssignment() {
	const modal = document.getElementbyID('globalModalContent');
    const template = modal.querySelector('[name="template_id"]').value;
    const schedule = modal.querySelector('[name="schedule_id"]').value;
    const group = modal.querySelector('[name="group_id"]').value;
	const wrapper = modal.querySelector('[data-name="customer_ids"]');
	const customers = wrapper.getValues();

    if (!template || !schedule || !group || !customers) {
        return alert('Template, schedule, group and customer required');
    }

    await api_post(`/assignments/create`, {
            template_id: template,
            schedule_id: schedule,
            group_id: group, 
			customer_ids: customers
    });

    location.reload();
}