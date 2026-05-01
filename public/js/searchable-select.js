(function () {

    function initSearchableSelect(wrapper) {
        if (wrapper.__initialized) return;
        wrapper.__initialized = true;

        const input = wrapper.querySelector('.search-input');
        const list = wrapper.querySelector('.search-list');
        const hidden = wrapper.querySelector('input[type="hidden"]');
        const multiContainer = wrapper.querySelector('.multi-values');

        const isMulti = wrapper.classList.contains('multi');

        let selectedValues = [];
        let highlightedIndex = -1;

        /* ---------------- HELPERS ---------------- */

        function getItems() {
            return Array.from(list.querySelectorAll('.search-item'));
        }

        function openList() {
            list.style.display = 'block';
        }

        function closeList() {
            list.style.display = 'none';
            highlightedIndex = -1;
            updateHighlight();
        }

        function updateHighlight() {
            const items = getItems();
            items.forEach((item, i) => {
                item.classList.toggle('highlighted', i === highlightedIndex);
            });
        }

        function emitChange() {
            wrapper.dispatchEvent(new CustomEvent('change', {
                detail: {
                    value: isMulti ? [...selectedValues] : hidden?.value || null
                }
            }));
        }

        function setSingle(value, label) {
            if (hidden) hidden.value = value;
            input.value = label;
            closeList();
            emitChange();
        }

        function updateMultiDisplay() {
            input.value = selectedValues.length
                ? `${selectedValues.length} selected`
                : '';
        }

        function addMulti(value, label) {
            if (selectedValues.includes(value)) return;

            selectedValues.push(value);

            const tag = document.createElement('span');
            tag.className = 'multi-tag';
            tag.dataset.value = value;
            tag.innerText = label;

            const remove = document.createElement('button');
            remove.type = 'button';
            remove.innerText = '×';

            remove.onclick = () => {
                selectedValues = selectedValues.filter(v => v !== value);
                tag.remove();
                updateMultiDisplay();
                emitChange();
            };

            tag.appendChild(remove);
            multiContainer.appendChild(tag);

            updateMultiDisplay();
            emitChange();
        }

        function clearMulti() {
            selectedValues = [];
            multiContainer.innerHTML = '';
            updateMultiDisplay();
            emitChange();
        }

        function filterList() {
            const val = input.value.toLowerCase();

            getItems().forEach(item => {
                item.style.display =
                    item.textContent.toLowerCase().includes(val)
                        ? 'block'
                        : 'none';
            });

            highlightedIndex = -1;
            updateHighlight();
        }

        /* ---------------- EVENTS ---------------- */

        input.addEventListener('focus', openList);

        input.addEventListener('input', () => {
            if (!isMulti) {
                if (hidden) hidden.value = '';
            }
            filterList();
            openList();
        });

        input.addEventListener('keydown', (e) => {
            const items = getItems().filter(i => i.style.display !== 'none');

            if (!items.length) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                highlightedIndex = (highlightedIndex + 1) % items.length;
                updateHighlight();
            }

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                highlightedIndex =
                    (highlightedIndex - 1 + items.length) % items.length;
                updateHighlight();
            }

            if (e.key === 'Enter') {
                e.preventDefault();
                if (highlightedIndex >= 0) {
                    items[highlightedIndex].click();
                }
            }

            if (e.key === 'Escape') {
                closeList();
                input.blur();
            }

            if (isMulti && e.key === 'Backspace' && !input.value) {
                // remove last tag
                const last = multiContainer.lastElementChild;
                if (last) {
                    const val = last.dataset.value;
                    selectedValues = selectedValues.filter(v => v !== val);
                    last.remove();
                    updateMultiDisplay();
                    emitChange();
                }
            }
        });

        list.addEventListener('click', (e) => {
            const item = e.target.closest('.search-item');
            if (!item) return;

            const value = item.dataset.value;
            const label = item.textContent.trim();

            if (isMulti) {
                if (value === '') {
                    clearMulti();
                    return;
                }

                addMulti(value, label);
                input.value = '';
                filterList();
                openList();
            } else {
                setSingle(value, label);
            }
        });

        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) {
                closeList();
            }
        });

        /* ---------------- PUBLIC API ---------------- */

        wrapper.getValue = () => hidden?.value || null;
        wrapper.getValues = () => [...selectedValues];

        wrapper.setValue = (value) => {
            const item = getItems().find(i => i.dataset.value == value);
            if (item) setSingle(value, item.textContent.trim());
        };

        wrapper.setValues = (values) => {
            if (!isMulti) return;
            clearMulti();
            values.forEach(v => {
                const item = getItems().find(i => i.dataset.value == v);
                if (item) addMulti(v, item.textContent.trim());
            });
        };
    }

    /* ---------------- INIT ALL ---------------- */

    window.initSearchableSelects = function () {
        document.querySelectorAll('.searchable-select')
            .forEach(initSearchableSelect);
    };

})();