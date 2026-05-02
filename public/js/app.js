/* ---------------- MODAL CONTROL ---------------- */
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
        const res = await api_post(endpoint, {
                id,
                [fieldName]: value
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

async function api_post(url, data) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!res.ok) throw new Error('API POST error');
    return res.json();
}

async function api_get(url) {
    const res = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) throw new Error('API GET error');
    return res.json();
}

function getNameValue(name) {
    const wrapper = document.querySelector(`[name="${name}"]`);
    return wrapper?.getValues?.()[0];
}