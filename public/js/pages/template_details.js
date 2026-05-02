/* ---------------- ADD STEP ---------------- */
async function addStep() {
    const input = document.getElementById('newStepTitle');
    const title = input.value.trim();

    if (!title) return alert('Step title required');

    const res = await api_post(`/templates/<%= template.id %>/steps/create`, {
        title
    });

    if (!res.ok) {
        return alert('Error creating step');
    }

    const data = await res.json();

    appendStepToDOM(data.step);

    input.value = '';
}

function appendStepToDOM(step) {
    const el = document.createElement('div');

    el.className = 'card mb-2 d-flex flex-row justify-content-between align-items-center';
    el.setAttribute('data-id', step.id);
    el.setAttribute('data-inline-edit', '');

    el.innerHTML = `
        <div class="d-flex align-items-center gap-2">
            <span class="handle" style="cursor:grab;">☰</span>

            <input class="form-control step-title"
                   value="${step.title}">
            <span class="save-status text-muted"></span>
        </div>

        <button class="btn btn-sm btn-danger">
            Delete
        </button>
    `;

    // attach events
    const input = el.querySelector('.step-title');
    const deleteBtn = el.querySelector('button');

    attachStepInputHandlers(input, step.id);
    deleteBtn.onclick = () => deleteStep(step.id, deleteBtn);

    document.getElementById('stepsList').appendChild(el);
}

/* ---------------- DELETE STEP ---------------- */
async function deleteStep(id, btn) {
    const row = btn.closest('[data-id]');

    row.style.opacity = 0.5;

    try {
        const res = await api_post('/templates/steps/delete', {
            step_id: id
        });

        if (!res.ok) throw new Error();

        row.remove();

    } catch {
        row.style.opacity = 1;
        alert('Failed to delete step');
    }
}

/* ---------------- REORDER ---------------- */
const el = document.getElementById('stepsList');

new Sortable(el, {
    animation: 150,
    handle: '.handle',
    ghostClass: 'dragging',

    onStart: () => {
        document.querySelectorAll('.step-title')
            .forEach(i => i.disabled = true);
    },

    onEnd: async function () {
        document.querySelectorAll('.step-title')
            .forEach(i => i.disabled = false);

        const orderedIds = [...el.children].map(x =>
            x.getAttribute('data-id')
        );

        await api_post(`/templates/<%= template.id %>/steps/reorder`, {
			orderedIds
        });
    }
});

/* ---------------- UPDATE STEP ---------------- */
function attachStepInputHandlers(input, id) {
    const container = input.closest('[data-inline-edit]');
    const status = container.querySelector('.save-status');

    let lastSavedValue = input.value;

    const save = debounce(async () => {
        const value = input.value.trim();

        if (!value) {
            status.textContent = 'Required';
            status.style.color = 'red';
            return;
        }

        status.textContent = 'Saving...';
        status.style.color = 'gray';

        try {
            const res = await api_post('/templates/steps/update', {
				step_id: id,
				title: value
            });

            if (!res.ok) throw new Error();

            lastSavedValue = value;

            status.textContent = 'Saved';
            status.style.color = 'green';

            setTimeout(() => status.textContent = '', 1500);

        } catch {
            status.textContent = 'Error';
            status.style.color = 'red';
        }
    }, 500);

    input.addEventListener('input', () => {
        if (input.value !== lastSavedValue) {
            status.textContent = 'Unsaved';
            status.style.color = 'orange';
            save();
        }
    });
}

document.querySelectorAll('.step-title').forEach(input => {
    const id = input.closest('[data-id]').getAttribute('data-id');
    attachStepInputHandlers(input, id);
});