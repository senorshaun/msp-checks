function createCard({ title, subtitle, actions = [], body = '' }) {
    const el = document.createElement('div');
    el.className = 'card msp-card';

    el.innerHTML = `
        <div class="card-body d-flex justify-content-between align-items-center">
            <div>
                <div class="fw-semibold">${title}</div>
                <div class="text-muted small">${subtitle || ''}</div>
            </div>
            <div class="d-flex gap-2 card-actions"></div>
        </div>
        ${body}
    `;

    const actionsContainer = el.querySelector('.card-actions');
    actions.forEach(a => actionsContainer.appendChild(a));

    return el;
}