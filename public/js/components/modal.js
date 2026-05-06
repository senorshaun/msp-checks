const Modal = (() => {
    let modal, content;

    function init() {
        modal = document.getElementById('globalModal');
        content = document.getElementById('globalModalContent');
		modal.addEventListener('click', (e) => {
			if (e.target === modal) close();
		});
    }

    function open(input, onOpen) {
		content.innerHTML = '';

		let node = null;

		if (typeof input === 'function') {
			node = input();                 // get returned DOM node
		} else if (typeof input === 'string') {
			content.innerHTML = input;
		} else if (input instanceof Node) {
			node = input;
		}
		if (node) {
			content.appendChild(node);
		}
		modal.classList.remove('hidden');

		if (onOpen) {
			requestAnimationFrame(onOpen);
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