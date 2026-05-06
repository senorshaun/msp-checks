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
	let formRef = null;
    openModal(
        () => {
            const wrapper = el('div');

            wrapper.appendChild(el('h3', 'modal-title mb-2', title));

            if (description) {
                wrapper.appendChild(el('div', 'text-muted mb-3', description));
            }

            const form = el('form', 'modal-content');
            form.id = formId;

			formRef = form;
			
            fields.forEach(f => {
                form.appendChild(renderFieldWrapper(f, initialValues));
            });

            const actions = el('div', 'modal-actions mt-3 d-flex gap-2 justify-content-end');

            const submitBtn = el('button', `btn ${submitClass}`, submitText);
            submitBtn.type = 'submit';

            const cancelBtn = el('button', 'btn btn-secondary', 'Cancel');
            cancelBtn.type = 'button';
            cancelBtn.addEventListener('click', closeModal);

            actions.appendChild(submitBtn);
            actions.appendChild(cancelBtn);

            form.appendChild(actions);
            wrapper.appendChild(form);

            return wrapper;
        },
        () => {
            const form = formRef;

			if (!form) {
				console.error('Form not found after modal render');
				return;
			}

			initSearchableSelects();
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

                if (onSubmit) await onSubmit(values);

                closeModal();
            });
        }
    );
}

function renderFieldWrapper(field, initialValues) {
    const wrapper = el('div', 'form-field');
    wrapper.dataset.field = field.name;

    wrapper.appendChild(renderField(field, initialValues));

    const error = el('div', 'invalid-feedback d-none');
    error.dataset.error = field.name;

    wrapper.appendChild(error);

    return wrapper;
}

function renderField(field, initialValues = {}) {
    const value = initialValues[field.name];

    switch (field.type) {
        case 'select': {
			const group = el('div', 'form-group mb-2');
			const id = `field_${field.name}`;
			const label = el('label', null, field.label);
			label.setAttribute('for', id);
			group.appendChild(label);

			const wrapper = document.createElement('div');
			wrapper.innerHTML = '';
			wrapper.appendChild(buildSearchableSelect({
				name: field.name,
				data: field.options || [],
				placeholder: field.placeholder || 'Select...',
				multiple: field.multiple || false,
				grouped: field.grouped || false
			}));

			group.appendChild(wrapper.firstElementChild);
			return group;
		}

        case 'text': {	
			const input = el('input', 'form-control');
			input.name = field.name;
			input.value = value || '';
			input.placeholder = field.placeholder || '';
			input.type = 'text';

			return createLabeledField(field, input);
		}

        case 'textarea': {		
			const textarea = el('textarea', 'form-control');
			textarea.value = value || '';
			return createLabeledField(field, textarea);
		}

		case 'number': {
			const input = el('input', 'form-control');
			input.type = 'number';
			input.value = value ?? '';
			input.placeholder = field.placeholder || '1';
			return createLabeledField(field, input);
		}
			
		case 'date': {
			const input = el('input', 'form-control');
			input.type = 'date';
			input.value = value ?? '';
			input.placeholder = field.placeholder || '';
			return createLabeledField(field, input);
		}

		case 'checkbox': {
			const input = el('input', 'form-check-input');
			input.type = 'checkbox';
			input.checked = !!value;
			return createLabeledField(field, input);
		}

		case 'checkbox-list': {
			const container = el('div', 'checkbox-list');
			container.dataset.name = field.name;
			return createLabeledField(field, container);
		}

		case 'button': {
			const group = el('div', 'form-group');

			const btn = el('button', field.className || 'btn', field.label);
			btn.type = 'button';

			if (field.name) {
				btn.dataset.name = field.name;
			}

			group.appendChild(btn);
			return group;
		}

        default:
			return document.createDocumentFragment();
    }
}

function createLabeledField(field, inputEl) {
    const group = el('div', 'form-group mb-2');
    const id = `field_${field.name}`;

    inputEl.id = id;
	inputEl.name = field.name;

    const label = el('label', null, field.label);
    label.setAttribute('for', id);

    group.appendChild(label);
    group.appendChild(inputEl);

    return group;
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
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }

    if (!items.length) {
        container.appendChild(el('div', 'text-muted', 'No items'));
        return;
    }

    items.forEach(item => {
        const card = el('div', 'card mb-2 p-2 d-flex align-items-center gap-2');

        const checkbox = el('input');
        checkbox.type = 'checkbox';
        checkbox.value = item.value;
        checkbox.checked = selected.includes(item.value);
		checkbox.addEventListener('change', () => {
			container.dispatchEvent(new Event('change', { bubbles: true }));
		});

        const content = el('div');
		
        const id = `${name}_${item.value}`;
		checkbox.id = id;

		const labelEl = el('label');
		labelEl.setAttribute('for', id);
		labelEl.appendChild(el('strong', null, item.label));
		content.appendChild(labelEl);

        if (item.subLabel) {
            content.appendChild(document.createElement('br'));
            content.appendChild(el('small', null, item.subLabel));
        }

        card.appendChild(checkbox);
        card.appendChild(content);

        container.appendChild(card);
    });
}