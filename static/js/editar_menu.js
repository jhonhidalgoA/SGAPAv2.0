document.addEventListener("DOMContentLoaded", function () {
        const platos = document.querySelectorAll(".menu-item");

        platos.forEach(plato => {
            plato.addEventListener("click", function () {
                const nombre = plato.querySelector("span").textContent.trim();
                const imgSrc = plato.querySelector("img").getAttribute("src");
                const imgNombre = imgSrc.substring(imgSrc.lastIndexOf('/') + 1);

                const categoriaDiv = plato.closest(".menu-card");
                const categoriaTitulo = categoriaDiv.querySelector(".sub__title").textContent.trim();
                const dia = categoriaDiv.closest(".right__card").querySelector("h1").textContent.trim();

                document.getElementById("nombre").value = nombre;
                document.getElementById("imagen").value = imgNombre;

                document.getElementById("diaActual").value = dia;
                document.getElementById("categoriaActual").value = categoriaTitulo;

                document.getElementById("platoOriginalNombre").value = nombre;
                document.getElementById("platoOriginalImg").value = imgNombre;

                document.getElementById("editarModal").style.display = "block";
            });
        });
    });

    document.getElementById("editarForm").addEventListener("submit", function (e) {
        e.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const imagen = document.getElementById("imagen").value.trim();
        const dia = document.getElementById("diaActual").value;
        const categoria = document.getElementById("categoriaActual").value;
        const originalNombre = document.getElementById("platoOriginalNombre").value;
        const originalImg = document.getElementById("platoOriginalImg").value;

        fetch("{{ url_for('secciones.guardar_cambios') }}", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                dia,
                categoria,
                platoOriginal: { nombre: originalNombre, img: originalImg },
                platoNuevo: { nombre, img: imagen }
            })
        })
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    showModal("Éxito", "Plato actualizado correctamente", function () {
                        location.reload();
                    });
                } else {
                    showModal("Error", "No se pudo actualizar el plato", null);
                }
            })
            .catch(err => {
                showModal("Error", "Hubo un problema al guardar los cambios", null);
            });
    });

    function cerrarModal() {
        document.getElementById("editarModal").style.display = "none";
    }

    window.onclick = function (event) {
        const modal = document.getElementById("editarModal");
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }