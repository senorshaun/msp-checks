const Component = (() => {

    function create({ render, mount, state = {} }) {
        let el = null;

        function setState(newState) {
            state = { ...state, ...newState };
            if (el) update();
        }

        function update() {
            const newEl = render(state);
            el.replaceWith(newEl);
            el = newEl;
            mount?.(el, state, setState);
        }

        function init(container) {
            el = render(state);
            container.appendChild(el);
            mount?.(el, state, setState);
        }

        return { init, setState };
    }

    return { create };

})();