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