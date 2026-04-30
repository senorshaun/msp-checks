let currentTaskId = null;

function openDrawer() {
    document.getElementById('taskDrawer').style.right = '0';
}

function closeDrawer() {
    document.getElementById('taskDrawer').style.right = '-520px';
    currentTaskId = null;
}

/* ---------------- TASK LOADING ---------------- */

async function loadTask(id) {
    const res = await axios.get(`/task/${id}`);
    const task = res.data.task;
    const steps = res.data.steps;

    currentTaskId = id;

    document.getElementById('drawerTitle').innerText = task.name;
    document.getElementById('drawerMeta').innerText =
        `${task.customer_name} • Due ${task.due_date}`;

    let html = '';

    steps.forEach(step => {
        html += `
        <div class="card mb-2">
            <label>
                <input type="checkbox"
                    ${step.is_completed ? "checked" : ""}
                    onchange="updateStep(${step.id}, this.checked)">
                <strong>${step.title}</strong>
            </label>

            <textarea class="form-control mt-2"
                placeholder="Notes..."
                onblur="updateStep(${step.id}, ${step.is_completed}, this.value)">
                ${step.notes || ''}
            </textarea>
        </div>
        `;
    });

    document.getElementById('drawerSteps').innerHTML = html;

    openDrawer();
}

/* ---------------- STEP UPDATE ---------------- */

async function updateStep(id, completed, notes = null) {
    await axios.post('/step/update', {
        step_id: id,
        completed,
        notes,
        user_id: 1
    });
}

/* ---------------- TASK COMPLETE ---------------- */

async function completeTask() {
    await axios.post('/task/complete', {
        task_id: currentTaskId,
        user_id: 1
    });

    closeDrawer();
    location.reload();
}