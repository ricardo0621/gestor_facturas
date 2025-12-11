/**
 * Componente Modal
 */

/**
 * Mostrar modal
 */
export function showModal(title, content) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');

    modalTitle.textContent = title;
    modalBody.innerHTML = content;
    modal.classList.add('active');
}

/**
 * Ocultar modal
 */
export function hideModal() {
    const modal = document.getElementById('modal');
    modal.classList.remove('active');
}

// Event listener para cerrar modal
document.addEventListener('DOMContentLoaded', () => {
    const modalClose = document.getElementById('modalClose');
    const modal = document.getElementById('modal');

    if (modalClose) {
        modalClose.addEventListener('click', hideModal);
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                hideModal();
            }
        });
    }
});
