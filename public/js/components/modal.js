const Modal = (() => {
    let modal, content;

    function init() {
        modal = document.getElementById('globalModal');
        content = document.getElementById('globalModalContent');
		content.addEventListener('click', (e) => {
			e.stopPropagation();
		});
		modal.addEventListener('click', (e) => {
			if (e.target === modal) close();
		});
    }

    function open(input, onOpen) {
		content.innerHTML = '';
		if (typeof input === 'function') {
			input = input();
		} else if (typeof input === 'string') {
			content.innerHTML = input;
		} else if (input instanceof Node) {
			content.appendChild(input);
		} else {
			content.innerHTML = input;
		}
		modal.classList.remove('hidden');
		if (onOpen) {
			requestAnimationFrame(() => {
				onOpen();
			});
		}
	}

	function close() {
		modal.classList.add('hidden');
		while (content.firstChild) {
			content.removeChild(content.firstChild);
		}
	}

    return { init, open, close };
})();

window.openModal = Modal.open;
window.closeModal = Modal.close;

document.addEventListener('DOMContentLoaded', Modal.init);