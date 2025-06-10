document.addEventListener("DOMContentLoaded", function () {
    // Constantes para configuraciones
    const VALIDATIONS = {
        EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        PHONE_REGEX: /^\d{7,}$/,
        DOCUMENT_REGEX: /^\d+$/,
        REQUIRED_FIELDS: [
            { id: "student_name", name: "Nombres" },
            { id: "student_lastname", name: "Apellidos" },
            { id: "student_document_type", name: "Tipo de Documento" },
            { id: "student_document_number", name: "Número de Documento" },
            { id: "student_email", name: "Correo Electrónico" },
            { id: "student_phone", name: "Teléfono" },
            { id: "student_grade", name: "Grado" }
        ]
    };

    const form = document.getElementById("studentRegistrationForm");

    if (form) {
        form.addEventListener("submit", handleFormSubmit);
        setupInputListeners(form);
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        clearPreviousErrors();

        const validationResult = validateForm();
        if (!validationResult.isValid) {
            showError(validationResult.message, validationResult.focusElement);
            return;
        }

        try {
            const uniquenessResult = await validateUniqueness();
            if (!uniquenessResult.isValid) {
                showError(uniquenessResult.message, uniquenessResult.focusElement);
                return;
            }
        } catch (error) {
            showError(error.message, error.focusElement);
            return;
        }

        submitForm();
    }

    function validateForm() {
        // Validar campos obligatorios
        const missingFields = validateRequiredFields();
        if (missingFields.length > 0) {
            const firstMissingField = VALIDATIONS.REQUIRED_FIELDS.find(f =>
                f.name === missingFields[0]
            );

            return {
                isValid: false,
                message: "Debe completar los siguientes campos obligatorios:\n\n• " + missingFields.join("\n• "),
                focusElement: document.getElementById(firstMissingField?.id)
            };
        }

        // Validar email
        const emailValidation = validateEmail();
        if (!emailValidation.isValid) return emailValidation;

        // Validar teléfono
        const phoneValidation = validatePhone();
        if (!phoneValidation.isValid) return phoneValidation;

        // Validar documento
        const documentValidation = validateDocument();
        if (!documentValidation.isValid) return documentValidation;

        return { isValid: true };
    }

    function validateRequiredFields() {
        const missingFields = [];

        VALIDATIONS.REQUIRED_FIELDS.forEach(field => {
            const input = document.getElementById(field.id);
            if (!input?.value.trim()) {
                missingFields.push(field.name);
                input?.classList.add('input-error');
            }
        });

        return missingFields;
    }

    function validateEmail() {
        const emailInput = document.getElementById("student_email");
        const email = emailInput?.value.trim();

        if (email && !VALIDATIONS.EMAIL_REGEX.test(email)) {
            emailInput.classList.add("input-error");
            return {
                isValid: false,
                message: "Por favor ingrese un correo electrónico válido.",
                focusElement: emailInput
            };
        }

        return { isValid: true };
    }

    function validatePhone() {
        const phoneInput = document.getElementById("student_phone");
        const phone = phoneInput?.value.trim();

        if (phone && !VALIDATIONS.PHONE_REGEX.test(phone)) {
            phoneInput.classList.add("input-error");
            return {
                isValid: false,
                message: "Por favor ingrese un número de teléfono válido (mínimo 7 dígitos).",
                focusElement: phoneInput
            };
        }

        return { isValid: true };
    }

    function validateDocument() {
        const docNumberInput = document.getElementById("student_document_number");
        const docNumber = docNumberInput?.value.trim();

        if (docNumber && !VALIDATIONS.DOCUMENT_REGEX.test(docNumber)) {
            docNumberInput.classList.add("input-error");
            return {
                isValid: false,
                message: "El número de documento debe contener solo números.",
                focusElement: docNumberInput
            };
        }

        return { isValid: true };
    }

    async function validateUniqueness() {
        const emailInput = document.getElementById("student_email");
        const docInput = document.getElementById("student_document_number");

        const email = emailInput?.value.trim();
        const docNumber = docInput?.value.trim();

        try {
            const response = await fetch(`http://localhost:5000/verificar?documento=${docNumber}&correo=${email}`);
            const data = await response.json();

            if (data.existeDocumento) {
                return {
                    isValid: false,
                    message: "Número de documento ya registrado.",
                    focusElement: docInput
                };
            }

            if (data.existeCorreo) {
                return {
                    isValid: false,
                    message: "Correo electrónico ya registrado.",
                    focusElement: emailInput
                };
            }

            return { isValid: true };
        } catch (error) {
            console.error("Error al verificar unicidad:", error);
            return {
                isValid: false,
                message: "No se pudo verificar unicidad. Inténtelo más tarde.",
                focusElement: emailInput || docInput
            };
        }
    }

    function clearPreviousErrors() {
        document.querySelectorAll('.input-error').forEach(input => {
            input.classList.remove('input-error');
        });
    }

    function showError(message, focusElement) {
        showModal("Validación requerida", message, null);
        focusElement?.focus();
    }

    function submitForm() {
        const submitButton = form.querySelector("button[type=submit]");

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Enviando...';

            form.submit(); // o usar fetch si prefieres control total

            setTimeout(() => {
                submitButton.disabled = false;
                submitButton.textContent = 'Registrar';
            }, 3000);
        } else {
            form.submit();
        }
    }

    function setupInputListeners(form) {
        form.querySelectorAll('input, select').forEach(input => {
            input.addEventListener('input', function () {
                this.classList.remove('input-error');
            });
        });
    }
});