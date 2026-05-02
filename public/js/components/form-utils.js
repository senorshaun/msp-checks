function openFormModal({ title, fields, onSubmit }) {
    const formId = 'dynamicForm';
    const html = `
        <h3 class="modal-title">${title}</h3>
        <form id="${formId}" class="modal-content">
            ${fields.map(renderField).join('')}

            <div class="modal-actions mt-3">
                <button type="submit" class="btn btn-primary">Save</button>
                <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
            </div>
        </form>
    `;

    openModal(html);
    initSearchableSelects();

    const form = document.getElementById(formId);
	fields.forEach(field => {
        if (field.type === 'button' && field.onClick) {
            const btn = form.querySelector(`[data-name="${field.name}"]`);
            if (btn) {
                btn.addEventListener('click', field.onClick);
            }
        }
    });
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const values = getFormValues(form);
        await onSubmit(values);
    });
}

function renderField(field) {
	switch(field.type) {
		case 'select':
			return `
				<div class="form-group mb-2">
					<label>${field.label}</label>
					${buildSearchableSelect({
						name: field.name,
						data: field.options,
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
						placeholder="${field.placeholder || ''}"
					>
				</div>
			`;
		case 'checkbox-list':
			return `
				<div class="form-group mb-2">
					<label>${field.label}</label>
					<div 
						id="${field.name}" 
						class="checkbox-list">
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

function getFormValues(form) {
    const values = {};
    form.querySelectorAll('input, textarea, select').forEach(el => {
        if (el.name) {
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

function setCheckboxListOptions(name, items) {
    const container = document.getElementById(name);
    if (!container) return;

    if (!items.length) {
        container.innerHTML = `<div class="text-muted">No items</div>`;
        return;
    }

    container.innerHTML = items.map(item => `
        <div class="card mb-2 d-flex align-items-center gap-2">
            <input type="checkbox" value="${item.value}">
            <div>
                <strong>${item.label}</strong>
                ${item.subLabel ? `<br><small>${item.subLabel}</small>` : ''}
            </div>
        </div>
    `).join('');
}

/* ---------------- MODAL CONTROL ---------------- */
window.openModal = function (html) {
    const modal = document.getElementById('globalModal');
    const content = document.getElementById('globalModalContent');

    content.innerHTML = html;
    modal.classList.remove('hidden');
};

window.closeModal = function () {
    document.getElementById('globalModal').classList.add('hidden');
};