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

function initSearchableSelects() {
    document.querySelectorAll('.searchable-select').forEach(initSearchable);
}

function buildSearchableSelect({
    name,
    data,
    placeholder = 'Select...',
    valueField = 'id',
    labelField = 'name',
    multiple = false
}) {
    const itemsHtml = data.map(item => `
		<div class="search-item" data-value="${item[valueField]}">
			${item[labelField]}
		</div>
    `).join('');

    return `
        <div class="searchable-select ${multiple ? 'multi' : ''}" data-name="${name}">
            <input type="text" class="search-input" placeholder="${placeholder}">
            ${
                multiple
                ? `<div class="multi-values"></div>`
                : `<input type="hidden" name="${name}">`
            }

            <div class="search-list">
                ${itemsHtml}
            </div>
        </div>
    `;
}

window.updateInlineField = async function ({
    id,
    btn,
    inputSelector,
    endpoint,
    fieldName = 'name'
}) {
    const container = btn.closest('[data-inline-edit]');
    const input = container.querySelector(inputSelector);
    const status = container.querySelector('.save-status');

    const value = input.value.trim();

    if (!value) {
        if (status) {
            status.textContent = `${fieldName} required`;
            status.style.color = 'red';
        }
        return;
    }

    btn.disabled = true;

    if (status) {
        status.textContent = 'Saving...';
        status.style.color = 'gray';
    }

    try {
        const res = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id,
                [fieldName]: value
            })
        });

        if (!res.ok) throw new Error();

        if (status) {
            status.textContent = 'Saved';
            status.style.color = 'green';
            setTimeout(() => status.textContent = '', 2000);
        }

    } catch (err) {
        if (status) {
            status.textContent = 'Error saving';
            status.style.color = 'red';
        }
    } finally {
        btn.disabled = false;
    }
};

function debounce(fn, delay = 500) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}