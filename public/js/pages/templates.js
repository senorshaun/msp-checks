function openCreateTemplateModal() {
    openModal(`
        <h3>Create Assignment</h3>
		<div class="form-group">
			<input class="form-control" name="name" placeholder="New Template">
			<div style="margin-top:10px;">
				<button onclick="submitCreateTemplate()">Create</button>
				<button onclick="closeModal()">Cancel</button>
			</div>
		</div>
    `);
	initSearchableSelects();
}

async function submitCreateTemplate() {
    const name = document.querySelector('[name="name"]').value;

    if (!name.trim()) {
        return alert('Name is required');
    }

    await api_post(`/templates/create`, {
        name: name
    });

    location.reload();
}