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

function el(tag, className, text) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (text !== undefined) e.innerText = text;
    return e;
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
    openModal(
		() => renderTemplateEditor(template, res.steps || []),
		() => {
			initDragAndDrop();
			bindTemplateEditorEvents(template, res.steps || []);
		}
    );
}

function renderTemplateEditor(template, steps) {
    const wrapper = el('div');

    // Title
    wrapper.appendChild(el('h3', 'mb-2', 'Edit Template'));

    // Template info
    const info = el('div', 'mb-3');
    info.appendChild(el('div', null, template.name)).classList.add('fw-bold');

    const desc = el('div', 'text-muted small', template.description || '');
    info.appendChild(desc);

    wrapper.appendChild(info);

    // Buttons row
    const actionsRow = el('div', 'd-flex justify-content-between mb-2');

    const leftBtns = el('div', 'd-flex gap-2');

    const saveOrderBtn = el('button', 'btn btn-primary btn-sm', 'Save Order');
    saveOrderBtn.id = 'saveOrderBtn';

    const addStepBtn = el('button', 'btn btn-primary btn-sm', 'Add Step');
    addStepBtn.id = 'addStepBtn';

    leftBtns.appendChild(saveOrderBtn);
    leftBtns.appendChild(addStepBtn);

    actionsRow.appendChild(leftBtns);
    wrapper.appendChild(actionsRow);

    // Step list
    const stepList = el('div', 'd-flex flex-column gap-2');
    stepList.id = 'stepList';

    steps.forEach(step => {
        stepList.appendChild(renderStepCard(step));
    });

    wrapper.appendChild(stepList);

    // Footer buttons
    const footer = el('div', 'd-flex gap-2 justify-content-end mt-3');

    const editBtn = el('button', 'btn btn-primary', 'Edit Template');
    editBtn.id = 'editTemplateBtn';

    const deleteBtn = el('button', 'btn btn-danger', 'Delete');
    deleteBtn.id = 'deleteTemplateBtn';

    const closeBtn = el('button', 'btn btn-secondary', 'Close');
    closeBtn.addEventListener('click', closeModal);

    footer.appendChild(editBtn);
    footer.appendChild(deleteBtn);
    footer.appendChild(closeBtn);

    wrapper.appendChild(footer);

    return wrapper;
}

function renderStepCard(step) {
    const card = el('div', 'card msp-card step-card');
    card.setAttribute('draggable', 'true');
    card.dataset.id = step.id;

    const body = el('div', 'card-body d-flex justify-content-between align-items-center');

    // Left content
    const left = el('div');

    const title = el('div', 'fw-semibold', step.title);
    const desc = el('div', 'text-muted small', step.description || '');

    left.appendChild(title);
    left.appendChild(desc);

    // Right buttons
    const right = el('div', 'd-flex gap-1');

    const editBtn = el('button', 'btn btn-sm btn-primary edit-step', 'Edit');
    const deleteBtn = el('button', 'btn btn-sm btn-outline-danger delete-step', 'Delete');

    right.appendChild(editBtn);
    right.appendChild(deleteBtn);

    body.appendChild(left);
    body.appendChild(right);

    card.appendChild(body);

    return card;
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