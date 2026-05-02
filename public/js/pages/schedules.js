function openCreateScheduleModal() {
    openModal(`
        <h3>Create Schedule</h3>
		
		<div class="form-group">
			<label>Name</label>
			<input class="form-control mb-2" name="name" placeholder="Name">
		</div>

		<div class="form-group">
			<div class="row">
				<div class="col">
					<div class="form-group">
						<label>Frequency</label>
						<select class="form-select" name="frequency">
							<option>daily</option>
							<option>weekly</option>
							<option>monthly</option>
						</select>
					</div>
				</div>
				<div class="col">
					<div class="form-group">
						<label>Interval</label>
						<input class="form-control" name="interval" placeholder="Interval">
					</div>
				</div>
			</div>
			
			<div class="row">
				<div class="col">
					<div class="form-group">
						<label>Day of week</label>
						<input class="form-control" name="day_of_week" placeholder="mon,tue">
					</div>
				</div>
				<div class="col">
					<div class="form-group">
						<label>Day of month</label>
						<input class="form-control" name="day_of_month" placeholder="15">
					</div>
				</div>
			</div>
		</div>
		
		<div class="form-group">
			<label>Start Date</label>
			<input class="form-control" type="date" name="start_date">
		</div>

        <div style="margin-top:10px;">
            <button onclick="submitCreateSchedule()">Save</button>
            <button onclick="closeModal()">Cancel</button>
        </div>
    `);

    initSearchableSelects();
}

async function submitCreateSchedule() {
    const modal = document.getElementById('globalModalContent');
    const name = modal.querySelector('#name').value.trim();
    const frequency = modal.querySelector('#frequency').value.trim();
	const interval = modal.querySelector('#interval').value.trim();
	const day_of_week = modal.querySelector('#day_of_week').value.trim();
	const day_of_month = modal.querySelector('#day_of_month').value.trim();
	const start_date = modal.querySelector('#start_date').value.trim();

    if (!name.trim()) {
        return alert('Name required');
    }

    await api_post(`/schedules/create`, {
		name: name,
		frequency: frequency,
		interval: interval, 
		day_of_week: day_of_week,
		day_of_month: day_of_month,
		start_date: start_date
    });

    location.reload();
}
function openEditScheduleModal(id, name, frequency, interval, day_of_week, day_of_month) {
    openModal(`
        <h3>Edit Schedule</h3>

        <div class="form-group">
			<label>Name</label>
			<input class="form-control mb-2" name="name" placeholder="Name">
		</div>

		<div class="form-group">
			<div class="row">
				<div class="col">
					<div class="form-group">
						<label>Frequency</label>
						<select class="form-select" name="frequency">
							<option>daily</option>
							<option>weekly</option>
							<option>monthly</option>
						</select>
					</div>
				</div>
				<div class="col">
					<div class="form-group">
						<label>Interval</label>
						<input class="form-control" name="interval" placeholder="Interval">
					</div>
				</div>
			</div>
			
			<div class="row">
				<div class="col">
					<div class="form-group">
						<label>Day of week</label>
						<input class="form-control" name="day_of_week" placeholder="mon,tue">
					</div>
				</div>
				<div class="col">
					<div class="form-group">
						<label>Day of month</label>
						<input class="form-control" name="day_of_month" placeholder="15">
					</div>
				</div>
			</div>
		</div>

        <div style="margin-top:10px;">
            <button onclick="submitEditSchedule(${id})">Save</button>
            <button onclick="closeModal()">Cancel</button>
        </div>
    `);

    initSearchableSelects();
}
async function submitEditSchedule(id) {
    const modal = document.getElementById('globalModalContent');
    const name = modal.querySelector('#name').value.trim();
    const frequency = modal.querySelector('#frequency').value.trim();
	const interval = modal.querySelector('#interval').value.trim();
	const day_of_week = modal.querySelector('#day_of_week').value.trim();
	const day_of_month = modal.querySelector('#day_of_month').value.trim();

    if (!name.trim()) {
        return alert('Name required');
    }

    await api_post(`/schedules/update`, {
		id: id,
		name: name,
		frequency: frequency,
		interval: interval, 
		day_of_week: day_of_week,
		day_of_month: day_of_month
    });

    location.reload();
}
