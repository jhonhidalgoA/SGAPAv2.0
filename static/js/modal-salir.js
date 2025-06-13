function showModal(title, message, action) {
        document.getElementById("modalTitle").innerText = title;
        document.getElementById("modalMessage").innerText = message;
        window.modalAction = action;

        const modal = document.getElementById("confirmModal");
        modal.style.display = "flex";
    }
    document.getElementById("modalConfirm").addEventListener("click", function () {
        if (typeof modalAction === 'function') {
            modalAction();
        }
        document.getElementById("confirmModal").style.display = "none";
    });

    document.getElementById("modalCancel").addEventListener("click", function () {
        document.getElementById("confirmModal").style.display = "none";
    });