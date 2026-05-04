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
        const res = await api_fetch('POST', endpoint, {
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

async function api_fetch(method, url, data) {
    if (data?.formData) data = data.formData;
    const options = {
		method,
		redirect: 'follow'
	};
	if (data != null) {
		options.headers = { 'Content-Type': 'application/json' };
		options.body = JSON.stringify(data);
	}
	const res = await fetch(url, options);
    let payload;
    try {
        payload = await res.json();
    } catch (e) {
        throw new Error(`Invalid JSON response (status ${res.status})`);
    }
	if (payload.redirect) {
        window.location.href = payload.redirect;
        return;
    }
    if (!res.ok) {
        throw new Error(payload?.error || `Request failed (${res.status})`);
    }
    if (!payload.success) {
        throw new Error(payload.error || 'API returned success=false');
    }
    return payload.data ?? null;
}