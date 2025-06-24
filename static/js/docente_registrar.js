
const VALIDATIONS = {
    NAME_REGEX: /^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/,
    PHONE_REGEX: /^\d{7,15}$/,
    DOCUMENT_REGEX: /^\d+$/,
    REQUIRED_FIELDS: [
        { id: "teacher_name", name: "Nombres" },
        { id: "teacher_lastname", name: "Apellidos" },
        { id: "teacher_document_type", name: "Tipo de Documento" },
        { id: "teacher_document_number", name: "Número de Documento" },
        { id: "area", name: "Área" },
        { id: "scale", name: "Escalafón" },
        { id: "photo", name: "Foto" }
    ]
};

document.addEventListener("DOMContentLoaded", function () {
  
    const flashElements = document.querySelectorAll('.flash-message');
    if (flashElements.length > 0) {
        flashElements.forEach(function(element) {
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

        const missingFields = validateRequiredFields();
        if (missingFields.length > 0) {
            showError(missingFields.join("\n"));
            return;
        }

        const phoneValidation = validatePhone();
        if (!phoneValidation.isValid) {
            showError(phoneValidation.message, phoneValidation.focusElement);
            return;
        }

        const documentValidation = validateDocument();
        if (!documentValidation.isValid) {
            showError(documentValidation.message, documentValidation.focusElement);
            return;
        }

        const photoValidation = validatePhoto();
        if (!photoValidation.isValid) {
            showError(photoValidation.message, photoValidation.focusElement);
            return;
        }

        
        form.submit();
    });

  
    function validateRequiredFields() {
        const missing = [];
        let firstMissingField = null;

        VALIDATIONS.REQUIRED_FIELDS.forEach(function(field) {
            const input = document.getElementById(field.id);
            const value = input ? input.value.trim() : '';

            if (!value) {
                missing.push(field.name);
                if (input) {
                    input.classList.add("input-error");
                }
                if (!firstMissingField) {
                    firstMissingField = input;
                }
            }
        });

        return missing.length ? missing : [];
    }

    function validatePhone() {
        const phoneInput = document.getElementById("teacher_phone");
        const phone = phoneInput ? phoneInput.value.trim() : '';

        if (phone && phone.length < 7) {
            return {
                isValid: false,
                message: "El teléfono debe tener al menos 7 dígitos.",
                focusElement: phoneInput
            };
        }

        return { isValid: true };
    }

    function validateDocument() {
        const docNumberInput = document.getElementById("teacher_document_number");
        const docNumber = docNumberInput ? docNumberInput.value.trim() : '';

        if (docNumber && !/^\d+$/.test(docNumber)) {
            return {
                isValid: false,
                message: "El número de documento debe contener solo números.",
                focusElement: docNumberInput
            };
        }

        return { isValid: true };
    }

    function validatePhoto() {
        const photoInput = document.getElementById("photo");
        const preview = document.getElementById("photoPreview");
        const file = photoInput ? photoInput.files[0] : null;

        if (!file) {
            if (photoInput) photoInput.classList.add("input-error");
            if (preview) preview.classList.add("input-error");
            return {
                isValid: false,
                message: "Debe seleccionar una foto del docente.",
                focusElement: photoInput
            };
        }

        const validTypes = ["image/jpeg", "image/png", "image/jpg"];
        if (!validTypes.includes(file.type)) {
            photoInput.classList.add("input-error");
            preview.classList.add("input-error");
            return {
                isValid: false,
                message: "El archivo debe ser una imagen en formato JPG, JPEG o PNG.",
                focusElement: photoInput
            };
        }

        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            photoInput.classList.add("input-error");
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
        document.querySelectorAll('.input-error').forEach(function(input) {
            input.classList.remove('input-error');
        });
    }

    function showError(message, focusElement) {
        showModal("Validación requerida", message, function () {
            if (focusElement) focusElement.focus();
        });
    }

 
    const photoInput = document.getElementById("photo");
    const preview = document.getElementById("photoPreview");
    if (photoInput && preview) {
        photoInput.addEventListener("change", function (event) {
            const file = event.target.files[0];
            if (file && file.type.startsWith("image/")) {
                const reader = new FileReader();
                reader.onload = function (e) {
                    preview.style.backgroundImage = "url('" + e.target.result + "')";
                    preview.style.display = "block";
                };
                reader.readAsDataURL(file);
            } else {
                preview.style.backgroundImage = "";
                preview.style.display = "none";
            }
        });
    }

   
    ['teacher_name', 'teacher_lastname'].forEach(function(id) {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener("input", function () {
                this.value = this.value.replace(/[^a-zA-ZÁÉÍÓÚáéíóúÑñ\s]/g, "");
            });
        }
    });

    const phoneInput = document.getElementById("teacher_phone");
    if (phoneInput) {
        phoneInput.addEventListener("input", function () {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
    }
});