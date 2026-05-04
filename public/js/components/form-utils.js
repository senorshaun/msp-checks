function openFormModal({
    title,
    description,
    fields = [],
    initialValues = {},
    onSubmit,
    submitText = 'Save',
    submitClass = 'btn-primary'
}) {
    const formId = 'dynamicForm';

    const html = `
        <h3 class="modal-title mb-2">${title}</h3>

        ${description ? `<div class="text-muted mb-3">${description}</div>` : ''}

        <form id="${formId}" class="modal-content">
            ${fields.map(f => renderFieldWrapper(f, initialValues)).join('')}

            <div class="modal-actions mt-3 d-flex gap-2 justify-content-end">
                <button type="submit" class="btn ${submitClass}">
                    ${submitText}
                </button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">
                    Cancel
                </button>
            </div>
        </form>
    `;

    openModal(html);
    initSearchableSelects();

    const form = document.getElementById(formId);

    applyInitialValues(form, initialValues);

    const state = { ...initialValues };

    bindFieldChangeHandlers(form, state, () => {
        updateFieldVisibility(form, fields, state);
        runValidation(form, fields, state);
    });

    updateFieldVisibility(form, fields, state);
    runValidation(form, fields, state);

    fields.forEach(field => {
        if (field.type === 'button' && field.onClick) {
            const btn = form.querySelector(`[data-name="${field.name}"]`);
            if (btn) {
                btn.addEventListener('click', () => field.onClick(form, state));
            }
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const values = getFormValues(form);
        const valid = runValidation(form, fields, values);

        if (!valid) return;

        if (onSubmit) {
            await onSubmit(values);
        }

        closeModal();
    });
}

function renderFieldWrapper(field, initialValues) {
    return `
        <div class="form-field" data-field="${field.name}">
            ${renderField(field, initialValues)}
            <div class="invalid-feedback d-none" data-error="${field.name}"></div>
        </div>
    `;
}

function renderField(field, initialValues = {}) {
    const value = initialValues[field.name];

    switch (field.type) {
        case 'select':
            return `
                <div class="form-group mb-2">
                    <label>${field.label}</label>
                    ${buildSearchableSelect({
                        name: field.name,
                        data: field.options || [],
                        placeholder: field.placeholder || 'Select...'
                    })}
                </div>
            `;

        case 'text':
            return `
                <div class="form-group mb-2">
                    <label>${field.label}</label>
                    <input 
                        type="text" 
                        name="${field.name}" 
                        class="form-control"
                        value="${value || ''}"
                        placeholder="${field.placeholder || ''}"
                    >
                </div>
            `;

        case 'textarea':
            return `
                <div class="form-group mb-2">
                    <label>${field.label}</label>
                    <textarea 
                        name="${field.name}" 
                        class="form-control"
                    >${value || ''}</textarea>
                </div>
            `;

        case 'number':
            return `
                <div class="form-group mb-2">
                    <label>${field.label}</label>
                    <input 
                        type="number" 
                        name="${field.name}" 
                        class="form-control"
                        value="${value ?? ''}"
                    >
                </div>
            `;

        case 'checkbox':
            return `
                <div class="form-group mb-2 form-check">
                    <input 
                        type="checkbox" 
                        name="${field.name}" 
                        class="form-check-input"
                        ${value ? 'checked' : ''}
                    >
                    <label class="form-check-label">${field.label}</label>
                </div>
            `;

        case 'checkbox-list':
            return `
                <div class="form-group mb-2">
                    <label>${field.label}</label>
                    <div 
                        id="${field.name}" 
                        class="checkbox-list"
                        data-name="${field.name}">
                    </div>
                </div>
            `;

        case 'button':
            return `
                <div class="form-group">
                    <button type="button" class="${field.className || 'btn'}" data-name="${field.name || ''}">
                        ${field.label}
                    </button>
                </div>
            `;

        default:
            return '';
    }
}

function applyInitialValues(form, initialValues) {
    form.querySelectorAll('input, textarea, select').forEach(el => {
        if (!el.name) return;

        const val = initialValues[el.name];
        if (val === undefined) return;

        if (el.type === 'checkbox') {
            el.checked = !!val;
        } else {
            el.value = val;
        }
    });

    form.querySelectorAll('[data-name]').forEach(wrapper => {
        const name = wrapper.dataset.name;
        const val = initialValues[name];

        if (val === undefined) return;

        if (wrapper.setValue) {
            wrapper.setValue(val);
        }
    });
}

function bindFieldChangeHandlers(form, state, onChange) {
    form.addEventListener('input', () => {
        Object.assign(state, getFormValues(form));
        onChange();
    });

    form.addEventListener('change', () => {
        Object.assign(state, getFormValues(form));
        onChange();
    });
}

function updateFieldVisibility(form, fields, state) {
    fields.forEach(field => {
        const wrapper = form.querySelector(`[data-field="${field.name}"]`);
        if (!wrapper) return;

        if (!field.showIf) {
            wrapper.style.display = '';
            return;
        }

        const visible = field.showIf(state);
        wrapper.style.display = visible ? '' : 'none';
    });
}

function runValidation(form, fields, values) {
    let isValid = true;

    fields.forEach(field => {
        const wrapper = form.querySelector(`[data-field="${field.name}"]`);
        const errorEl = form.querySelector(`[data-error="${field.name}"]`);

        if (!wrapper || !errorEl) return;

        if (wrapper.style.display === 'none') {
            errorEl.classList.add('d-none');
            return;
        }

        const value = values[field.name];

        let error = null;

        if (field.required) {
            if (field.type === 'checkbox') {
                if (!value) error = 'Required';
            } else if (!value) {
                error = 'Required';
            }
        }

        if (!error && field.validate) {
            const result = field.validate(value, values);
            if (result !== true) {
                error = result || 'Invalid';
            }
        }

        if (error) {
            isValid = false;
            errorEl.textContent = error;
            errorEl.classList.remove('d-none');

            const input = wrapper.querySelector('input, textarea, select');
            if (input) input.classList.add('is-invalid');
        } else {
            errorEl.classList.add('d-none');

            const input = wrapper.querySelector('input, textarea, select');
            if (input) input.classList.remove('is-invalid');
        }
    });

    return isValid;
}

function getFormValues(form) {
    const values = {};

    form.querySelectorAll('input, textarea, select').forEach(el => {
        if (!el.name) return;

        if (el.type === 'checkbox') {
            values[el.name] = el.checked;
        } else {
            values[el.name] = el.value;
        }
    });

    form.querySelectorAll('[data-name]').forEach(wrapper => {
        if (wrapper.getValues) {
            const vals = wrapper.getValues();
            values[wrapper.dataset.name] = vals[0] || '';
        }
    });

    form.querySelectorAll('.checkbox-list').forEach(container => {
        const name = container.id;

        values[name] = Array.from(
            container.querySelectorAll('input:checked')
        ).map(x => x.value);
    });

    return values;
}

function setCheckboxListOptions(name, items, selected = []) {
    const container = document.getElementById(name);
    if (!container) return;

    if (!items.length) {
        container.innerHTML = `<div class="text-muted">No items</div>`;
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="card mb-2 p-2 d-flex align-items-center gap-2">
            <input 
                type="checkbox" 
                value="${item.value}"
                ${selected.includes(item.value) ? 'checked' : ''}
            >
            <div>
                <strong>${item.label}</strong>
                ${item.subLabel ? `<br><small>${item.subLabel}</small>` : ''}
            </div>
        </div>
    `).join('');
}

window.openModal = function (html) {
    const modal = document.getElementById('globalModal');
    const content = document.getElementById('globalModalContent');

    content.innerHTML = html;
    modal.classList.remove('hidden');
};

window.closeModal = function () {
    document.getElementById('globalModal').classList.add('hidden');
};