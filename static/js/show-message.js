document.addEventListener("DOMContentLoaded", function () {
        const form = document.getElementById("studentRegistrationForm");

        if (form) {
            form.addEventListener("submit", function (e) {
                e.preventDefault(); 

                
                const campos_obligatorios = [
                    { id: "student_name", nombre: "Nombres" },
                    { id: "student_lastname", nombre: "Apellidos" },
                    { id: "student_document_type", nombre: "Tipo de Documento" },
                    { id: "student_document_number", nombre: "Número de Documento" },
                    { id: "student_email", nombre: "Correo Electrónico" },                    
                    { id: "student_phone", nombre: "Teléfono" },                    
                    { id: "student_grade", nombre: "Grado" }
                ];

                let faltantes = [];

               
                for (let campo of campos_obligatorios) {
                    const input = document.getElementById(campo.id);
                    if (!input || !input.value.trim()) {
                        faltantes.push(campo.nombre);
                    }
                }

                
                if (faltantes.length > 0) {
                    showModal(
                       constmensaje = "Debe completar los campos obligatorios:",
                        " " + faltantes.join("\n"),
                        null
                    );
                } else {
                   
                    form.submit();
                }
            });
        }
    });