function buildSearchableSelect({
    name,
    data,
    placeholder = 'Select...',
    valueField = 'id',
    labelField = 'name',
    multiple = false,
    grouped = false
}) {
    const wrapper = document.createElement('div');
    wrapper.className = `searchable-select ${multiple ? 'multi' : ''}`;
    wrapper.dataset.name = name;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'search-input';
    input.placeholder = placeholder;

    wrapper.appendChild(input);

    if (multiple) {
        const multi = document.createElement('div');
        multi.className = 'multi-values';
        wrapper.appendChild(multi);
    } else {
        const hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = name;
        wrapper.appendChild(hidden);
    }

    const list = document.createElement('div');
    list.className = 'search-list';
    list.style.display = 'none';

    if (grouped) {
        const groups = {};

        data.forEach(item => {
            const group = item.group || 'Other';
            if (!groups[group]) groups[group] = [];
            groups[group].push(item);
        });

        Object.entries(groups).forEach(([groupName, items]) => {
            const groupEl = document.createElement('div');
            groupEl.className = 'search-group';

            const label = document.createElement('div');
            label.className = 'search-group-label';
            label.innerText = groupName;

            groupEl.appendChild(label);

            items.forEach(item => {
                const el = document.createElement('div');
                el.className = 'search-item';
                el.dataset.value = item[valueField];
                el.dataset.group = groupName;
                el.innerText = item[labelField];

                groupEl.appendChild(el);
            });

            list.appendChild(groupEl);
        });

    } else {
        data.forEach(item => {
            const el = document.createElement('div');
            el.className = 'search-item';
            el.dataset.value = item[valueField];
            el.innerText = item[labelField];

            list.appendChild(el);
        });
    }

    wrapper.appendChild(list);

    return wrapper;
}

function flattenData(data, level1Name) {
	return data.flatMap(level1 =>
		level1[level1Name].map(level2 => ({
			id: level2.id,
			name: level2.name,
			group: level1.name,
			priority: level1.priority
		}))
	);
}

/* =========================================
   INITIALIZER
========================================= */
(function () {

    window.initSearchableSelect = function (wrapper) {
        if (!wrapper || wrapper.__initialized) return;
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

        // expose for global handler
        wrapper.closeList = closeList;

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
                },
				bubbles: true
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

            remove.addEventListener('click', () => {
                selectedValues = selectedValues.filter(v => v !== value);
                tag.remove();
                updateMultiDisplay();
                emitChange();
            });

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
			const groups = list.querySelectorAll('.search-group');
			groups.forEach(group => {
				const label = group.querySelector('.search-group-label');
				const items = group.querySelectorAll('.search-item');
				let groupHasVisible = false;
				items.forEach(item => {
					const matches =
						item.textContent.toLowerCase().includes(val) ||
						item.dataset.group.toLowerCase().includes(val);

					item.style.display = matches ? 'block' : 'none';

					if (matches) groupHasVisible = true;
				});
				group.style.display = groupHasVisible ? 'block' : 'none';
			});
			highlightedIndex = -1;
			updateHighlight();
		}

        /* ---------------- EVENTS ---------------- */

        input.addEventListener('focus', openList);

        input.addEventListener('input', () => {
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

        /* ---------------- PUBLIC API ---------------- */

        wrapper.getValues = () => {
			if (!isMulti) {
				return hidden?.value ? [hidden.value] : [];
			}
			return [...selectedValues];
		};

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
    };


    /* ---------------- INIT ALL ---------------- */

    window.initSearchableSelects = function () {
        document.querySelectorAll('.searchable-select')
            .forEach(window.initSearchableSelect);
    };

})();

if (!window.__SEARCH_SELECT_GLOBAL__) {
    document.addEventListener('click', (e) => {
        document.querySelectorAll('.searchable-select').forEach(wrapper => {
            if (!wrapper.contains(e.target)) {
                wrapper.closeList?.();
            }
        });
    });

    window.__SEARCH_SELECT_GLOBAL__ = true;
}