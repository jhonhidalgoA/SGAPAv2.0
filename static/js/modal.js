function showModal(title, message, action) {
    document.getElementById("modalTitle").innerText = title;
    document.getElementById("modalMessage").innerText = message;
    currentAction = action;
    const modal = document.getElementById("confirmModal");
    modal.style.display = "flex";
    modal.className = "modal";

    // Agregar clase según título
    if (title.includes("Éxito") || title.includes("Exito")) {
        modal.classList.add("modal-success");
    } else if (title.includes("Error") || title.includes("error")) {
        modal.classList.add("modal-danger");
    } else if (title.includes("Advertencia") || title.includes("advertencia")) {
        modal.classList.add("modal-warning");
    }

    modalTitle.innerText = title;
    modalMessage.innerText = message;
    window.modalAction = action;
    modal.style.display = "flex";

}

document.getElementById("modalConfirm").addEventListener("click", function () {
    if (typeof currentAction === 'function') {
        currentAction();
    }
    document.getElementById("confirmModal").style.display = "none";
});

document.getElementById("modalCancel").addEventListener("click", function () {
    document.getElementById("confirmModal").style.display = "none";
});

document.getElementById("modalCloseBtn").addEventListener("click", function () {
    document.getElementById("confirmModal").style.display = "none";
});


window.addEventListener("click", function (e) {
    const modal = document.getElementById("confirmModal");
    if (e.target === modal) {
        modal.style.display = "none";
    }
});