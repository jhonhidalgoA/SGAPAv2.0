document.addEventListener("DOMContentLoaded", function () {
        // === CONFIGURACIONES Y CONSTANTES ===
        const VALIDATIONS = {
            EMAIL_REGEX: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            PHONE_REGEX: /^\d{9,}$/,
            DOCUMENT_REGEX: /^\d+$/,
            NAME_REGEX: /^[a-zA-ZÁÉÍÓÚáéíóúÑñ\s]+$/, 
            MAX_LENGTHS: {
                teacher_name: 30,
                teacher_lastname: 30,
                teacher_email: 30,
                teacher_phone: 15,
                teacher_document_number: 20
            },
            REQUIRED_FIELDS: [
                { id: "teacher_name", name: "Nombres" },
                { id: "teacher_lastname", name: "Apellidos" },
                { id: "teacher_document_type", name: "Tipo de Documento" },
                { id: "teacher_document_number", name: "Número de Documento" },
                { id: "teacher_email", name: "Correo Electrónico" },
                { id: "teacher_phone", name: "Teléfono" },
                { id: "scale", name: "Escalafón" }
            ]
        };

        const form = document.getElementById("teacherRegistrationForm");
        const registrationDateInput = document.getElementById("registration_date_teacher");
        const birthDateInput = document.getElementById("teacher_birth_date");
        const ageInput = document.getElementById("teacher_age");

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        const todayStr = `${year}-${month}-${day}`;

        // === INICIALIZACIÓN INICIAL ===
        if (registrationDateInput) {
            registrationDateInput.value = todayStr;
            registrationDateInput.max = todayStr;
        }

        if (form) {
            form.addEventListener("submit", handleFormSubmit);
            setupInputListeners(form);
        }

        if (birthDateInput && ageInput) {
            birthDateInput.addEventListener("change", function () {
                const birthDate = this.value;
                const age = calculateAge(birthDate);
                ageInput.value = age > 0 ? age : "";
            });
        }

        // === BLOQUEO DE CARACTERES NO PERMITIDOS EN NOMBRES Y APELLIDOS ===
        const nameInput = document.getElementById("teacher_name");
        const lastnameInput = document.getElementById("teacher_lastname");

        const sanitizeNameInput = function (inputElement) {
            inputElement.addEventListener("input", function () {
                let value = this.value;

                // Bloquear caracteres no permitidos
                let sanitizedValue = value.replace(/[^a-zA-ZÁÉÍÓÚáéíóúÑñ\s]/g, "");
                
                // Limitar longitud máxima
                const maxLength = VALIDATIONS.MAX_LENGTHS[inputElement.id];
                if (maxLength && value.length > maxLength) {
                    sanitizedValue = value.slice(0, maxLength);
                }

                if (value !== sanitizedValue) {
                    this.value = sanitizedValue;
                }
            });
        };

        if (nameInput) {
            sanitizeNameInput(nameInput);
        }

        if (lastnameInput) {
            sanitizeNameInput(lastnameInput);
        }

        // === FUNCIONES PRINCIPALES ===
        function handleFormSubmit(e) {
            e.preventDefault();
            clearPreviousErrors();

            const validationResult = validateForm();
            if (!validationResult.isValid) {
                showError(validationResult.message, validationResult.focusElement);
                return;
            }
            submitForm();
        }

        function validateForm() {
            const missingFields = validateRequiredFields();

            if (missingFields.length > 0) {
                const firstMissingField = VALIDATIONS.REQUIRED_FIELDS.find(f =>
                    f.name === missingFields[0].replace("* ", "")
                );

                return {
                    isValid: false,
                    message: "Debe completar los siguientes campos obligatorios:\n\n" + missingFields.join("\n"),
                    focusElement: document.getElementById(firstMissingField?.id)
                };
            }

            const nameValidation = validateNameFields();
            if (!nameValidation.isValid) return nameValidation;

            const emailValidation = validateEmail();
            if (!emailValidation.isValid) return emailValidation;

            const phoneValidation = validatePhone();
            if (!phoneValidation.isValid) return phoneValidation;

            const documentValidation = validateDocument();
            if (!documentValidation.isValid) return documentValidation;

            return { isValid: true };
        }

        function validateNameFields() {
            const nameInput = document.getElementById("teacher_name");
            const lastnameInput = document.getElementById("teacher_lastname");

            if (nameInput && nameInput.value.trim() && !VALIDATIONS.NAME_REGEX.test(nameInput.value)) {
                nameInput.classList.add("input-error");
                return {
                    isValid: false,
                    message: "Los nombres solo pueden contener letras y espacios.",
                    focusElement: nameInput
                };
            }

            if (lastnameInput && lastnameInput.value.trim() && !VALIDATIONS.NAME_REGEX.test(lastnameInput.value)) {
                lastnameInput.classList.add("input-error");
                return {
                    isValid: false,
                    message: "Los apellidos solo pueden contener letras y espacios.",
                    focusElement: lastnameInput
                };
            }

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
            const emailInput = document.getElementById("teacher_email");
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
            const phoneInput = document.getElementById("teacher_phone");
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
            const docNumberInput = document.getElementById("teacher_document_number");
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

        function clearPreviousErrors() {
            document.querySelectorAll('.input-error').forEach(input => {
                input.classList.remove('input-error');
            });
        }

        function showError(message, focusElement) {
            showModal("Validación requerida", message, function () {
                focusElement?.focus();
            });
        }

        function submitForm() {
            const submitButton = form.querySelector("button[type=submit]");

            if (submitButton) {
                submitButton.disabled = true;
                form.submit();
                setTimeout(() => {
                    submitButton.disabled = false;
                }, 3000);
            } else {
                form.submit();
            }
        }

        function setupInputListeners(formElement) {
            formElement.querySelectorAll("input, select").forEach(input => {
                input.addEventListener("input", function () {
                    this.classList.remove("input-error");
                });
            });
        }

        function calculateAge(birthDate) {
            const today = new Date();
            const birthDateObj = new Date(birthDate);

            if (isNaN(birthDateObj.getTime())) {
                return 0;
            }

            let age = today.getFullYear() - birthDateObj.getFullYear();
            const monthDiff = today.getMonth() - birthDateObj.getMonth();

            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
                age--;
            }

            return age;
        }
    });