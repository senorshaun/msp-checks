document.addEventListener('DOMContentLoaded', initPage);
let data;
function initPage() {
    data = window.__DATA__ || {
        templates: []
    };
    initTemplateActions(data);
}

function initTemplateActions(data) {
    document.getElementById('createTemplateBtn')
        ?.addEventListener('click', openCreateTemplateModal);
    document.querySelectorAll('.template-card').forEach(card => {
        const id = card.dataset.id;
        const template = data.templates.find(t => String(t.id) === String(id));
        if (!template) return;
        card.querySelector('.template-open-btn')
            ?.addEventListener('click', () => openTemplateEditor(template));
        card.querySelector('.delete-template-btn')
            ?.addEventListener('click', () => deleteTemplate(template));
    });
}

function getTemplateFields() {
    return [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea' }
    ];
}

function openCreateTemplateModal() {
    openFormModal({
        title: 'Create Template',
        fields: getTemplateFields(),
        onSubmit: async (formData) => {
            await api_fetch('POST', '/templates', formData);
            location.reload();
        }
    });
}

async function openTemplateEditor(template) {
    const res = await api_fetch('GET', `/templates/${template.id}`, null);
    renderTemplateEditor(template, res.steps || []);
}

function renderTemplateEditor(template, steps) {
    const html = `
        <h3 class="mb-2">Edit Template</h3>

        <div class="mb-3">
            <div><strong>${template.name}</strong></div>
            <div class="text-muted small">${template.description || ''}</div>
        </div>

        <div class="d-flex justify-content-between mb-2">
            <div class="d-flex gap-2">
                <button class="btn btn-success btn-sm" id="saveOrderBtn">Save Order</button>
                <button class="btn btn-primary btn-sm" id="addStepBtn">Add Step</button>
            </div>
        </div>

        <div id="stepList" class="d-flex flex-column gap-2">
            ${steps.map(s => renderStepCard(s)).join('')}
        </div>

        <div class="d-flex gap-2 justify-content-end mt-3">
            <button class="btn btn-primary" id="editTemplateBtn">Edit Template</button>
            <button class="btn btn-danger" id="deleteTemplateBtn">Delete</button>
            <button class="btn btn-secondary" onclick="closeModal()">Close</button>
        </div>
    `;
    openModal(html);
    initDragAndDrop();
    bindTemplateEditorEvents(template, steps);
}

function renderStepCard(step) {
    return `
        <div class="card msp-card step-card" draggable="true" data-id="${step.id}">
            <div class="card-body d-flex justify-content-between align-items-center">

                <div>
                    <div class="fw-semibold">${step.title}</div>
                    <div class="text-muted small">${step.description || ''}</div>
                </div>

                <div class="d-flex gap-1">
                    <button class="btn btn-sm btn-primary edit-step">Edit</button>
                    <button class="btn btn-sm btn-outline-danger delete-step">Delete</button>
                </div>

            </div>
        </div>
    `;
}

function bindTemplateEditorEvents(template, steps) {
    document.getElementById('addStepBtn')
        ?.addEventListener('click', () => openCreateStepModal(template));
    document.getElementById('editTemplateBtn')
        ?.addEventListener('click', () => openEditTemplateModal(template));
    document.getElementById('deleteTemplateBtn')
        ?.addEventListener('click', () => deleteTemplate(template));
	document.getElementById('saveOrderBtn')
        ?.addEventListener('click', () => saveStepOrder(template));
    document.querySelectorAll('.step-card').forEach(card => {
        const id = card.dataset.id;
        const step = steps.find(s => String(s.id) === String(id));
        if (!step) return;
        card.querySelector('.edit-step')
            ?.addEventListener('click', () => openEditStepModal(template, step));
        card.querySelector('.delete-step')
            ?.addEventListener('click', () => deleteStep(template, step));
    });
}

function getStepFields() {
    return [
        { name: 'title', label: 'Title', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea' }
    ];
}

function openCreateStepModal(template) {
    openFormModal({
        title: 'Add Step',
        fields: getStepFields(),
        onSubmit: async (formData) => {
            await api_fetch('POST',`/templates/${template.id}/steps`, formData);
            location.reload();
        }
    });
}

function openEditStepModal(template, step) {
    openFormModal({
        title: 'Edit Step',
        fields: getStepFields(),
        initialValues: step,
        onSubmit: async (formData) => {
            await api_fetch('PUT', `/templates/${template.id}/steps/${step.id}`, formData);
            location.reload();
        }
    });
}

function deleteStep(template, step) {
    openFormModal({
        title: 'Delete Step',
        description: `Delete "${step.title}"?`,
        fields: [],
        submitText: 'Delete',
        submitClass: 'btn-danger',
        onSubmit: async () => {
            await api_fetch('DELETE', `/templates/${template.id}/steps/${step.id}`, null);
            location.reload();
        }
    });
}

function saveStepOrder(template) {
    const ids = Array.from(document.querySelectorAll('.step-card'))
        .map(el => el.dataset.id);

    api_fetch('POST', `/templates/${template.id}/steps/reorder`, {
		step_ids: ids
    }).then(() => location.reload());
}

function openEditTemplateModal(template) {
    openFormModal({
        title: 'Edit Template',
        fields: getTemplateFields(),
        initialValues: template,
        onSubmit: async (formData) => {
            await api_fetch('PUT', `/templates/${template.id}`, formData);
            location.reload();
        }
    });
}

function deleteTemplate(template) {
    openFormModal({
        title: 'Delete Template',
        description: `Delete "${template.name}"?`,
        fields: [],
        submitText: 'Delete',
        submitClass: 'btn-danger',
        onSubmit: async () => {
            await api_fetch('DELETE', `/templates/${template.id}`, null);
            location.reload();
        }
    });
}
function initDragAndDrop() {
    const list = document.getElementById('stepList');
    let dragged;
    list.querySelectorAll('.step-card').forEach(item => {
        item.addEventListener('dragstart', () => {
            dragged = item;
            item.classList.add('opacity-50');
        });
        item.addEventListener('dragend', () => {
            dragged = null;
            item.classList.remove('opacity-50');
        });
        item.addEventListener('dragover', e => {
            e.preventDefault();
        });
        item.addEventListener('drop', e => {
            e.preventDefault();
            if (!dragged || dragged === item) return;
            const rect = item.getBoundingClientRect();
            const offset = e.clientY - rect.top;
            if (offset > rect.height / 2) {
                item.after(dragged);
            } else {
                item.before(dragged);
            }
        });
    });
}