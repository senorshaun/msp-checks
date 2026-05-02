const Modal = (() => {
    let modal, content;

    function init() {
        modal = document.getElementById('globalModal');
        content = document.getElementById('globalModalContent');
    }

    function open(html) {
        content.innerHTML = html;
        modal.classList.remove('hidden');
    }

    function close() {
        modal.classList.add('hidden');
        content.innerHTML = '';
    }

    return { init, open, close };
})();

window.openModal = Modal.open;
window.closeModal = Modal.close;

document.addEventListener('DOMContentLoaded', Modal.init);