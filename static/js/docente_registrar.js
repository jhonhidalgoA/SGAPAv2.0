document.addEventListener("DOMContentLoaded", function () {
    const VALIDATIONS = {
        NAME_REGEX: /^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/,
        PHONE_REGEX: /^\d{7,15}$/,
        DOCUMENT_REGEX: /^\d+$/,
        EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        REQUIRED_FIELDS: [
            { id: "teacher_name", name: "Nombres" },
            { id: "teacher_lastname", name: "Apellidos" },
            { id: "teacher_document_type", name: "Tipo de Documento" },
            { id: "teacher_document_number", name: "Número de Documento" },
            { id: "teacher_birth_date", name: "Fecha de Nacimiento" },
            { id: "teacher_phone", name: "Teléfono" },
            { id: "teacher_email", name: "Correo Electrónico" },
            { id: "area", name: "Área" },
            { id: "scale", name: "Escalafón" },
            { id: "photo", name: "Foto" }
        ]
    };

    // Establecer fecha de registro actual
    const registrationDateInput = document.getElementById("registration_date_teacher");
    if (registrationDateInput) {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        
        const formattedDate = `${year}-${month}-${day}`;
        registrationDateInput.value = formattedDate;
    }

    // Configurar cálculo automático de edad
    const birthDateInput = document.getElementById("teacher_birth_date");
    const ageInput = document.getElementById("teacher_age");

    if (birthDateInput && ageInput) {
        birthDateInput.addEventListener('change', function() {
            if (this.value) {
                const birthDate = new Date(this.value);
                const today = new Date();
                
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }
                
                ageInput.value = age;
            } else {
                ageInput.value = '';
            }
        });
    }

    // Manejo de mensajes flash
    const flashElements = document.querySelectorAll('.flash-message');
    if (flashElements.length > 0) {
        flashElements.forEach(function (element) {
            const category = element.getAttribute('data-category');
            const message = element.getAttribute('data-message');
            if (category && message) {
                showModal(category, message, null);
            }
            element.remove();
        });
    }

    const form = document.getElementById("teacherRegistrationForm");
    if (!form) return;

    form.addEventListener("submit", function (e) {
        e.preventDefault();
        clearPreviousErrors();
        const validationResult = validateForm();

        if (!validationResult.isValid) {
            showModal("Validación Requerida", validationResult.message, () => {
                if (validationResult.focusElement) validationResult.focusElement.focus();
            });
            return;
        }

        form.submit();
    });

    function validateForm() {
        const missingFields = [];

        VALIDATIONS.REQUIRED_FIELDS.forEach(field => {
            const input = document.getElementById(field.id);
            const value = input ? input.value.trim() : '';

            if (!value) {
                missingFields.push(field.name);
                if (input) input.classList.add("input-error");
                
                // Manejo especial para el campo de foto
                if (field.id === "photo") {
                    const photoLabel = document.querySelector('.photo__label');
                    if (photoLabel) {
                        photoLabel.classList.add("input-error");
                    }
                }
            }
        });

        if (missingFields.length > 0) {
            return {
                isValid: false,
                message: "Debe completar los siguientes campos obligatorios:\n\n" + missingFields.join("\n"),
                focusElement: document.querySelector(".input-error")
            };
        }

        const nameInput = document.getElementById("teacher_name");
        const lastnameInput = document.getElementById("teacher_lastname");

        if (nameInput && !VALIDATIONS.NAME_REGEX.test(nameInput.value.trim())) {
            nameInput.classList.add("input-error");
            return {
                isValid: false,
                message: "Los nombres solo deben contener letras, espacios y acentos.",
                focusElement: nameInput
            };
        }

        if (lastnameInput && !VALIDATIONS.NAME_REGEX.test(lastnameInput.value.trim())) {
            lastnameInput.classList.add("input-error");
            return {
                isValid: false,
                message: "Los apellidos solo deben contener letras, espacios y acentos.",
                focusElement: lastnameInput
            };
        }

        const phoneInput = document.getElementById("teacher_phone");
        if (phoneInput && !VALIDATIONS.PHONE_REGEX.test(phoneInput.value.trim())) {
            phoneInput.classList.add("input-error");
            return {
                isValid: false,
                message: "El teléfono es obligatorio y debe tener entre 7 y 15 dígitos.",
                focusElement: phoneInput
            };
        }

        const docNumberInput = document.getElementById("teacher_document_number");
        if (docNumberInput && !VALIDATIONS.DOCUMENT_REGEX.test(docNumberInput.value.trim())) {
            docNumberInput.classList.add("input-error");
            return {
                isValid: false,
                message: "El número de documento debe contener solo números.",
                focusElement: docNumberInput
            };
        }

        const emailInput = document.getElementById("teacher_email");
        if (emailInput && !VALIDATIONS.EMAIL_REGEX.test(emailInput.value.trim())) {
            emailInput.classList.add("input-error");
            return {
                isValid: false,
                message: "Ingrese un correo electrónico válido.",
                focusElement: emailInput
            };
        }

        const photoInput = document.getElementById("photo");
        const photoLabel = document.querySelector('.photo__label');
        const preview = document.getElementById("photoPreview");
        const file = photoInput?.files[0] || null;

        if (!file) {
            photoInput?.classList.add("input-error");
            photoLabel?.classList.add("input-error");
            preview?.classList.add("input-error");
            return {
                isValid: false,
                message: "Debe seleccionar una foto del docente.",
                focusElement: photoInput
            };
        }

        const validTypes = ["image/jpeg", "image/png", "image/jpg"];
        if (file && !validTypes.includes(file.type)) {
            photoInput.classList.add("input-error");
            photoLabel.classList.add("input-error");
            preview.classList.add("input-error");
            return {
                isValid: false,
                message: "La imagen debe ser en formato JPG, JPEG o PNG.",
                focusElement: photoInput
            };
        }

        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            photoInput.classList.add("input-error");
            photoLabel.classList.add("input-error");
            preview.classList.add("input-error");
            return {
                isValid: false,
                message: "La imagen no puede superar los 2 MB.",
                focusElement: photoInput
            };
        }

        return { isValid: true };
    }

    function clearPreviousErrors() {
        document.querySelectorAll('.input-error').forEach(input => {
            input.classList.remove('input-error');
        });
        const photoLabel = document.querySelector('.photo__label');
        photoLabel?.classList.remove('input-error');
    }

    // Configuración del campo de foto
    const photoInput = document.getElementById("photo");
    const photoLabel = document.querySelector('.photo__label');
    const preview = document.getElementById("photoPreview");

    if (photoInput && preview && photoLabel) {
        photoInput.addEventListener("change", function (event) {
            const file = event.target.files[0];
            
            if (file && file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    preview.style.backgroundImage = "url('" + e.target.result + "')";
                    preview.style.display = "block";
                    
                    // Remover clases de error y añadir clase de imagen cargada
                    photoLabel.classList.remove("input-error");
                    photoLabel.classList.add("has-image");
                };
                reader.readAsDataURL(file);
            } else {
                preview.style.backgroundImage = "";
                preview.style.display = "none";
                
                // Añadir clase de error si es obligatorio
                photoLabel.classList.add("input-error");
                photoLabel.classList.remove("has-image");
            }
        });
    }

    // Validación en tiempo real para campos de texto
    ['teacher_name', 'teacher_lastname'].forEach(function (id) {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener("input", function () {
                this.value = this.value.replace(/[^a-zA-ZÁÉÍÓÚáéíóúÑñ\s]/g, "");
            });
        }
    });

    // Validación en tiempo real para teléfono
    const phoneInput = document.getElementById("teacher_phone");
    if (phoneInput) {
        phoneInput.addEventListener("input", function () {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }

    // Limpiar errores al escribir/seleccionar
    document.querySelectorAll('.registration__form input, .registration__form select').forEach(input => {
        input.addEventListener('input', function () {
            this.classList.remove('input-error');
            
            // Caso especial para el label de la foto
            if (this.id === "photo") {
                const photoLabel = document.querySelector('.photo__label');
                photoLabel?.classList.remove('input-error');
            }
        });
    });

    // Función para mostrar modal (debe coincidir con la de tu HTML)
    function showModal(title, message, action) {
        const modal = document.getElementById("confirmModal");
        const modalTitle = document.getElementById("modalTitle");
        const modalMessage = document.getElementById("modalMessage");

        if (!modal || !modalTitle || !modalMessage) {
            console.error("No se encontró uno o más elementos del modal");
            alert(`Error: ${message}`);
            return;
        }

        modalTitle.innerText = title;
        modalMessage.innerText = message;
        window.modalAction = action;
        modal.style.display = "flex";
    }
});

