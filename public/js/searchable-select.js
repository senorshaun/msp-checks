document.querySelectorAll('.searchable-select').forEach(initSearchable);

function initSearchable(wrapper) {
    const input = wrapper.querySelector('.search-input');
    const list = wrapper.querySelector('.search-list');
    const hidden = wrapper.querySelector('input[type="hidden"]');

    input.addEventListener('focus', () => {
        list.style.display = 'block';
    });

    input.addEventListener('input', () => {
        const val = input.value.toLowerCase();

        list.querySelectorAll('.search-item').forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(val) ? '' : 'none';
        });
    });

    list.querySelectorAll('.search-item').forEach(item => {
        item.addEventListener('click', () => {
            input.value = item.textContent;
            hidden.value = item.dataset.value;
            list.style.display = 'none';
        });
    });

    document.addEventListener('click', (e) => {
        if (!wrapper.contains(e.target)) {
            list.style.display = 'none';
        }
    });
}