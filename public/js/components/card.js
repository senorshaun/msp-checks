function renderCard({ 
    title, 
    subtitle, 
    meta, 
    actions, 
    onClick,
    className = '' 
}) {
    return `
        <div class="card mb-2 d-flex justify-content-between align-items-center ${className}"
            ${onClick ? `onclick="${onClick}"` : ''}>
            
            <div>
                ${title ? `<strong>${title}</strong><br>` : ''}
                ${subtitle ? `<small>${subtitle}</small><br>` : ''}
                ${meta ? `<span class="text-muted">${meta}</span>` : ''}
            </div>

            ${actions ? `<div>${actions}</div>` : ''}
        </div>
    `;
}