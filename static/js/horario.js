// =============================================
// CONFIGURACIÓN INICIAL Y VARIABLES GLOBALES
// =============================================

// Verificar si el namespace ya existe para evitar duplicaciones
if (typeof window.horarioApp === 'undefined') {
    window.horarioApp = {
        // Lista de materias con sus colores asociados
        materias: [
            { nombre: "Matemáticas", color: "#667eea" },
            { nombre: "Geometría", color: "#764ba2" },
            { nombre: "Estadística", color: "#f093fb" },
            { nombre: "Tecnología", color: "#4ecdc4" },
            { nombre: "Castellano", color: "#45b7d1" },
            { nombre: "C. Lectora", color: "#96ceb4" },
            { nombre: "Inglés", color: "#ffeaa7" },
            { nombre: "Biología", color: "#55a3ff" },
            { nombre: "Física", color: "#fd79a8" },
            { nombre: "Química", color: "#fdcb6e" },
            { nombre: "Artística", color: "#e17055" },
            { nombre: "Ética", color: "#a29bfe" },
            { nombre: "Religión", color: "#fd7f6e" },
            { nombre: "Cátedra de Paz", color: "#74b9ff" },
            { nombre: "E. Física", color: "#00b894" },
            { nombre: "C. Sociales", color: "#fdaf6e" },
            { nombre: "Historia y Geografía", color: "#e84393" },
            { nombre: "Descanso", color: "#b2bec3" },
            { nombre: "Almuerzo", color: "#ddd6d6" }
        ],

        // Días de la semana laborales
        dias: ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"],

        // Control de horas asignadas
        totalHorasAsignadas: 0,
        TOTAL_HORAS_DISPONIBLES: 45,

        // Contador de selecciones por materia
        seleccionContador: {},

        // Configuración inicial del modal
        modalAction: null
    };
}

// =============================================
// FUNCIONES PRINCIPALES
// =============================================

/**
 * Muestra un modal de confirmación con dos botones (Aceptar/Cancelar)
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje a mostrar
 * @param {function} action - Función a ejecutar al confirmar
 */
function showModal(title, message, action) {
    const modal = document.getElementById("confirmModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");
    const modalCancel = document.getElementById("modalCancel");

    if (!modal || !modalTitle || !modalMessage) {
        console.error("Elementos del modal no encontrados");
        alert(`Error: ${message}`);
        return;
    }

    modalTitle.textContent = title;
    modalMessage.innerHTML = message;
    window.horarioApp.modalAction = action;

    // Asegurar que el botón cancelar esté visible
    if (modalCancel){
        modalCancel.style.display = "block";
        modalCancel.innerHTML = '<i class="fas fa-times"></i><span> Cancelar </span>';
        modalCancel.classList.add('modal-cancel');

    }
    

    // Mostrar el modal
    modal.style.display = "flex";
}

/**
 * Muestra un modal informativo con un solo botón (Aceptar)
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje a mostrar
 */
function showModalSingle(title, message) {
    const modal = document.getElementById("confirmModal");
    const modalTitle = document.getElementById("modalTitle");
    const modalMessage = document.getElementById("modalMessage");
    const modalCancel = document.getElementById("modalCancel");

    if (!modal || !modalTitle || !modalMessage) {
        console.error("Elementos del modal no encontrados");
        alert(`Error: ${message}`);
        return;
    }

    modalTitle.textContent = title;
    modalMessage.innerHTML = message;
    window.horarioApp.modalAction = null;

    // Ocultar botón cancelar
    if (modalCancel) modalCancel.style.display = "none";

    // Mostrar el modal
    modal.style.display = "flex";
}

/**
 * Genera una nueva fila para la tabla de horarios
 * @param {string} horaInicio - Hora de inicio (formato HH:MM)
 * @param {string} horaFin - Hora de fin (formato HH:MM)
 * @returns {HTMLElement} - Elemento tr con la fila generada
 */
function generarFila(horaInicio = "07:00", horaFin = "08:00") {
    const fila = document.createElement('tr');

    // Celda para mostrar las horas
    const celdaHora = document.createElement('td');
    celdaHora.className = 'time-container';
    celdaHora.innerHTML = `
        <div class="time" data-time="${horaInicio}">${horaInicio}</div>
        <div class="time" data-time="${horaFin}">${horaFin}</div>
    `;
    fila.appendChild(celdaHora);

    // Celdas para cada día de la semana
    window.horarioApp.dias.forEach(dia => {
        const celdaDia = document.createElement('td');
        const select = document.createElement('select');
        select.className = 'subject-select';
        select.setAttribute('aria-label', `${dia} - ${horaInicio} a ${horaFin}`);

        // Opción por defecto
        const opcionDefault = document.createElement('option');
        opcionDefault.value = "";
        opcionDefault.textContent = "Seleccionar";
        select.appendChild(opcionDefault);

        // Opciones para cada materia
        window.horarioApp.materias.forEach(materia => {
            const opcion = document.createElement('option');
            opcion.value = materia.nombre;
            opcion.textContent = materia.nombre;
            opcion.style.backgroundColor = materia.color;
            opcion.style.color = 'white';
            select.appendChild(opcion);
        });

        celdaDia.appendChild(select);
        fila.appendChild(celdaDia);
    });

    return fila;
}

/**
 * Permite editar las horas haciendo clic sobre ellas
 */
function hacerHorasEditables() {
    document.querySelectorAll('.time').forEach(time => {
        time.addEventListener('click', function () {
            const currentTime = this.dataset.time;
            const input = document.createElement('input');
            input.type = 'time';
            input.value = currentTime;
            input.className = 'time-input';

            this.textContent = '';
            this.appendChild(input);
            input.focus();

            input.addEventListener('blur', function () {
                const newTime = this.value || currentTime;
                if (validarHora(newTime, time)) {
                    time.dataset.time = newTime;
                    time.textContent = newTime;
                } else {
                    time.textContent = currentTime;
                }
            });

            input.addEventListener('keydown', function (e) {
                if (e.key === 'Enter') this.blur();
                if (e.key === 'Escape') time.textContent = currentTime;
            });
        });
    });
}

// =============================================
// FUNCIONES DE VALIDACIÓN
// =============================================

/**
 * Valida que una hora sea correcta
 * @param {string} horaStr - Hora en formato HH:MM
 * @param {HTMLElement} timeElement - Elemento que contiene la hora
 * @returns {boolean} - True si la hora es válida
 */
function validarHora(horaStr, timeElement) {
    const hora = parseTime(horaStr);
    if (!hora || isNaN(hora.getTime())) {
        mostrarMensaje('Formato de hora inválido');
        return false;
    }

    const fila = timeElement.closest('tr');
    const horas = fila.querySelectorAll('.time');

    if (horas.length === 1) {
        const horaInicio = parseTime(horas[0].dataset.time);
        const horaFin = parseTime(horas[1].dataset.time);

        if (horaInicio >= horaFin) {
            mostrarMensaje('La hora de inicio debe ser menor que la hora de fin');
            return false;
        }
    }

    return true;
}

/**
 * Convierte un string de hora en objeto Date
 * @param {string} timeStr - Hora en formato HH:MM
 * @returns {Date} - Objeto Date con la hora
 */
function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}

/**
 * Valida los campos requeridos del formulario
 * @returns {boolean} - True si todos los campos requeridos están completos
 */
function validarCamposRequeridos() {
    let esValido = true;
    const grado = document.getElementById('grados-select');
    const docente = document.getElementById('docente-select');

    // Validar grado
    if (!grado.value) {
        grado.style.borderColor = 'var(--color-error)';
        grado.style.backgroundColor = 'rgba(229, 62, 62, 0.05)';
        esValido = false;
    } else {
        grado.style.borderColor = 'var(--color-success)';
        grado.style.backgroundColor = 'rgba(72, 187, 120, 0.05)';
    }

    // Validar docente
    if (!docente.value) {
        docente.style.borderColor = 'var(--color-error)';
        docente.style.backgroundColor = 'rgba(229, 62, 62, 0.05)';
        esValido = false;
    } else {
        docente.style.borderColor = 'var(--color-success)';
        docente.style.backgroundColor = 'rgba(72, 187, 120, 0.05)';
    }

    return esValido;
}

// =============================================
// FUNCIONES DE ACTUALIZACIÓN DE INTERFAZ
// =============================================

/**
 * Muestra un mensaje temporal en la interfaz
 * @param {string} mensaje - Texto del mensaje
 * @param {string} tipo - Tipo de mensaje ('error' o 'success')
 */
function mostrarMensaje(mensaje, tipo = 'error') {
    // Eliminar mensajes anteriores
    document.querySelectorAll('.error-message, .success-message').forEach(el => el.remove());

    const messageDiv = document.createElement('div');
    messageDiv.className = tipo === 'error' ? 'error-message' : 'success-message';
    messageDiv.textContent = mensaje;

    const controls = document.querySelector('.controls');
    if (controls) {
        controls.insertAdjacentElement('afterend', messageDiv);

        // Eliminar el mensaje después de 3 segundos
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 3000);
    } else {
        console.error('No se encontró el elemento para mostrar el mensaje');
    }
}

/**
 * Actualiza la barra de progreso de una materia
 * @param {string} materia - Nombre de la materia a actualizar
 */
function actualizarProgreso(materia) {
    const contador = window.horarioApp.seleccionContador[materia];
    const row = Array.from(document.querySelectorAll('#tablaMaterias tbody tr')).find(
        tr => tr.cells[0].textContent.trim() === materia
    );

    if (row) {
        const badge = row.querySelector('.hours-badge');
        const progressFill = row.querySelector('.progress-fill');
        const porcentaje = (contador.count / contador.max) * 100;

        badge.textContent = `${contador.count}/${contador.max}`;
        progressFill.style.width = `${porcentaje}%`;

        // Cambiar color según el progreso
        if (porcentaje === 100) {
            progressFill.style.background = 'linear-gradient(90deg, #48bb78, #38a169)';
        } else if (porcentaje > 50) {
            progressFill.style.background = 'linear-gradient(90deg, #ed8936, #dd6b20)';
        } else {
            progressFill.style.background = 'linear-gradient(90deg, #667eea, #764ba2)';
        }
    }
}

/**
 * Actualiza las estadísticas generales del horario
 */
function actualizarEstadisticas() {
    const totalElement = document.getElementById("total-horas");
    const restantesElement = document.getElementById("horas-restantes");
    const porcentajeElement = document.getElementById("porcentaje-completado");

    const horasRestantes = window.horarioApp.TOTAL_HORAS_DISPONIBLES - window.horarioApp.totalHorasAsignadas;
    const porcentaje = Math.round((window.horarioApp.totalHorasAsignadas / window.horarioApp.TOTAL_HORAS_DISPONIBLES) * 100);

    if (totalElement) totalElement.textContent = window.horarioApp.totalHorasAsignadas;
    if (restantesElement) restantesElement.textContent = horasRestantes;
    if (porcentajeElement) porcentajeElement.textContent = `${porcentaje}%`;

    // Cambiar colores según el progreso
    if (totalElement && porcentajeElement) {
        if (porcentaje === 100) {
            totalElement.style.color = 'var(--color-success)';
            porcentajeElement.style.color = 'var(--color-success)';
        } else if (porcentaje > 80) {
            totalElement.style.color = 'var(--color-warning)';
            porcentajeElement.style.color = 'var(--color-warning)';
        } else {
            totalElement.style.color = 'var(--color-primary)';
            porcentajeElement.style.color = 'var(--color-primary)';
        }
    }
}

/**
 * Actualiza las opciones disponibles en los selects
 * @param {HTMLSelectElement} select - Elemento select a actualizar
 * @param {string} materiaSeleccionada - Materia seleccionada
 */
function actualizarSelect(select, materiaSeleccionada) {
    // Estilizar el select según la materia seleccionada
    const materiaInfo = window.horarioApp.materias.find(m => m.nombre === materiaSeleccionada);
    if (materiaInfo) {
        select.style.backgroundColor = materiaInfo.color;
        select.style.color = 'white';
        select.style.fontWeight = '600';
    }

    // Actualizar todas las opciones en todos los selects
    document.querySelectorAll('.subject-select').forEach(s => {
        Array.from(s.options).forEach(option => {
            if (option.value) {
                const contador = window.horarioApp.seleccionContador[option.value];
                const isDisabled = contador && contador.count >= contador.max;

                option.disabled = isDisabled;
                option.style.opacity = isDisabled ? '0.5' : '1';
                option.textContent = isDisabled ? `${option.value} (Límite)` : option.value;
            }
        });
    });
}

// =============================================
// FUNCIONES DE GESTIÓN DEL HORARIO
// =============================================

/**
 * Agrega una nueva fila al horario
 */
function agregarFilaHorario() {
    const tablaHorario = document.getElementById('tabla-horario');
    const ultimaFila = tablaHorario.lastElementChild;
    const ultimaHoraFin = ultimaFila.querySelector('.time:last-child').dataset.time;

    // Validar que no se pase del límite de horas
    if (parseTime(ultimaHoraFin) >= parseTime("23:59")) {
        mostrarMensaje("No se pueden agregar más horas después de las 23:59");
        return;
    }

    // Calcular la siguiente hora automáticamente
    const finTime = parseTime(ultimaHoraFin);
    finTime.setHours(finTime.getHours() + 1);
    const nuevaHoraFin = finTime.toTimeString().slice(0, 5);

    // Agregar la nueva fila
    const nuevaFila = generarFila(ultimaHoraFin, nuevaHoraFin);
    tablaHorario.appendChild(nuevaFila);
    hacerHorasEditables();
}

/**
 * Borra todo el horario y reinicia los contadores
 */
function borrarHorario() {
    // Reiniciar contadores
    Object.keys(window.horarioApp.seleccionContador).forEach(materia => {
        window.horarioApp.seleccionContador[materia].count = 0;
        actualizarProgreso(materia);
    });

    // Reiniciar total de horas
    window.horarioApp.totalHorasAsignadas = 0;
    actualizarEstadisticas();

    // Limpiar todos los selects
    document.querySelectorAll('.subject-select').forEach(select => {
        select.value = "";
        select.style.backgroundColor = "";
        select.style.color = "";
        select.style.fontWeight = "";
        delete select.dataset.materiaAnterior;
    });

    // Actualizar opciones
    document.querySelectorAll('.subject-select').forEach(select => {
        actualizarSelect(select, "");
    });
}

/**
 * Guarda el horario en el servidor
 */
function guardarHorario() {
    // Validar campos requeridos
    if (!validarCamposRequeridos()) {
        const mensajeError = `Por favor complete los siguientes campos obligatorios:<br>
            <div style="margin-top: 10px; text-align: left; padding-left: 20px;">
                • Grado<br>
                • Director de Grupo
            </div>`;
        showModalSingle('', mensajeError);
        return;
    }

    // Validar que haya horas asignadas
    if (window.horarioApp.totalHorasAsignadas === 0) {
        showModalSingle('','No hay horas asignadas para guardar');
        return;
    }

    // Recolectar datos del horario
    const horarioData = [];
    const tablaHorario = document.getElementById('tabla-horario');
    const filas = Array.from(tablaHorario.querySelectorAll('tr')).slice(1);

    filas.forEach(fila => {
        const celdas = fila.querySelectorAll('td');
        const horaInicio = celdas[0].querySelector('.time[data-time]').dataset.time;
        const horaFin = celdas[0].querySelectorAll('.time[data-time]')[1].dataset.time;

        window.horarioApp.dias.forEach((dia, index) => {
            const materiaSelect = celdas[index + 1].querySelector('.subject-select');
            const materia = materiaSelect ? materiaSelect.value : '';

            if (materia) {
                horarioData.push({
                    dia,
                    hora_inicio: horaInicio,
                    hora_fin: horaFin,
                    materia,
                    grado_id: parseInt(document.getElementById('grados-select').value),
                    docente_id: parseInt(document.getElementById('docente-select').value)
                });
            }
        });
    });

    // Enviar datos al servidor
    fetch('/secciones/horario', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(horarioData)
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Error en la respuesta del servidor');
            }
            return response.json();
        })
        .then(data => {
            console.log('Horario guardado:', data);
            mostrarMensaje('Horario guardado exitosamente', 'success');
        })
        .catch(error => {
            console.error('Error al guardar el horario:', error);
            mostrarMensaje('Error al guardar el horario. Por favor intente nuevamente.', 'error');
        });
}

// =============================================
// INICIALIZACIÓN Y EVENT LISTENERS
// =============================================

document.addEventListener("DOMContentLoaded", function () {
    // Inicializar contadores de materias
    if (Object.keys(window.horarioApp.seleccionContador).length === 0) {
        const subjectRows = document.querySelectorAll('#tablaMaterias tbody tr');
        subjectRows.forEach(row => {
            const materia = row.cells[0].textContent.trim();
            const maxAsignaciones = parseInt(row.cells[1].querySelector('.hours-badge').textContent.split('/')[1]);
            window.horarioApp.seleccionContador[materia] = { count: 0, max: maxAsignaciones };
        });
    }

    // Configurar eventos del modal
    const modalConfirm = document.getElementById("modalConfirm");
    const modalCancel = document.getElementById("modalCancel");

    if (modalConfirm) {
        modalConfirm.addEventListener("click", function () {
            if (typeof window.horarioApp.modalAction === 'function') {
                window.horarioApp.modalAction();
            }
            document.getElementById("confirmModal").style.display = "none";
        });
    }

    if (modalCancel) {
        modalCancel.addEventListener("click", function () {
            document.getElementById("confirmModal").style.display = "none";
        });
    }

    // Manejar parámetros de URL para campos vacíos
    const urlParams = new URLSearchParams(window.location.search);
    const camposVacios = urlParams.get('campos_vacios');

    if (camposVacios) {
        const listaCampos = camposVacios.split(',');
        listaCampos.forEach(id => {
            const input = document.getElementById(id);
            if (input) input.classList.add('input-error');
        });
    }

    // Limpiar errores al escribir en los inputs
    document.querySelectorAll('.registration__form input, .registration__form select').forEach(input => {
        input.addEventListener('input', function () {
            this.classList.remove('input-error');
        });
    });

    // Event listener para cambios en los selects de materias
    document.getElementById('tabla-horario').addEventListener('change', function (e) {
        if (e.target.classList.contains('subject-select')) {
            const select = e.target;
            const materiaSeleccionada = select.value;
            const materiaAnterior = select.dataset.materiaAnterior;

            // Restar de la materia anterior si existe
            if (materiaAnterior) {
                window.horarioApp.seleccionContador[materiaAnterior].count--;
                actualizarProgreso(materiaAnterior);
                select.dataset.materiaAnterior = "";
                select.style.backgroundColor = "";
                select.style.color = "";
                select.style.fontWeight = "";
                window.horarioApp.totalHorasAsignadas--;
            }

            // Sumar a la nueva materia si se seleccionó una
            if (materiaSeleccionada) {
                const contador = window.horarioApp.seleccionContador[materiaSeleccionada];

                if (contador.count >= contador.max) {
                    mostrarMensaje(`Has alcanzado el límite de horas para ${materiaSeleccionada}`);
                    select.value = "";
                } else {
                    contador.count++;
                    actualizarProgreso(materiaSeleccionada);
                    actualizarSelect(select, materiaSeleccionada);
                    select.dataset.materiaAnterior = materiaSeleccionada;
                    window.horarioApp.totalHorasAsignadas++;
                }
            }

            actualizarEstadisticas();
        }
    });

    // Botón para agregar nueva fila
    document.getElementById('agregar-hora').addEventListener('click', agregarFilaHorario);

    // Botón para borrar horario
    document.querySelector('.btn__delete').addEventListener('click', function () {
        showModal('', '¿Estás seguro de que deseas borrar todo el horario?', borrarHorario);
    });

    // Botón para guardar horario
    document.querySelector('.btn__save').addEventListener('click', guardarHorario);

    // Botón para imprimir
    document.querySelector('.btn-primary:last-child').addEventListener('click', function () {
        window.print();
    });

    // Inicializar tabla con una fila por defecto
    // Limpiar completamente y recrear
    const tablaHorario = document.getElementById('tabla-horario');
    if (tablaHorario) {
        // Obtener solo el tbody
        const tbody = tablaHorario.querySelector('tbody') || tablaHorario;

        // Limpiar todo el contenido del tbody
        tbody.innerHTML = '';

        // Agregar solo una fila
        tbody.appendChild(generarFila());
        hacerHorasEditables();
    }

    // Inicializar estadísticas
    actualizarEstadisticas();
});

// Función para cerrar sesión
function confirmLogout() {
    window.location.href = "{{ url_for('auth.logout') }}";
}