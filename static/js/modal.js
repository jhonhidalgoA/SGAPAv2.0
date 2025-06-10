let currentAction = null;

    function showModal(title, message, action) {
        document.getElementById("modalTitle").innerText = title;
        document.getElementById("modalMessage").innerText = message;
        currentAction = action;

        const modal = document.getElementById("confirmModal");
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