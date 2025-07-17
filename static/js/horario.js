if (typeof window.horarioApp === 'undefined') {
    window.horarioApp = {
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

    if (modalCancel) {
        modalCancel.style.display = "block";
        modalCancel.innerHTML = '<i class="fas fa-times"></i><span> Cancelar </span>';
        modalCancel.classList.add('modal-cancel');
    }

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

    if (modalCancel) modalCancel.style.display = "none";

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



/**
 * Valida que una hora sea correcta
 * @param {string} horaStr - Hora en formato HH:MM
 * @param {HTMLElement} timeElement - Elemento que contiene la hora
 * @returns {boolean} - True si la hora es válida
 */
/**
 * Valida que una hora sea correcta y que la hora de inicio sea anterior a la de fin.
 * @param {string} horaStr - Hora en formato HH:MM
 * @param {HTMLElement} timeElement - Elemento que contiene la hora (el que se está editando)
 * @returns {boolean} - True si la hora es válida y el par horaInicio/horaFin es coherente
 */

function validarHora(horaStr, timeElement) {
    const hora = parseTime(horaStr);
    if (!hora || isNaN(hora.getTime())) {
        mostrarMensaje('Formato de hora inválido. Use HH:MM.');
        return false;
    }

    const fila = timeElement.closest('tr');
    // Aseguramos que seleccionamos los dos elementos de tiempo de la fila actual
    const horasEnFila = fila.querySelectorAll('.time');

    // Deben existir exactamente dos elementos de tiempo en cada fila
    if (horasEnFila.length !== 2) {
        console.error("Error: Se esperaban dos elementos de tiempo en la fila, pero se encontraron " + horasEnFila.length);
        mostrarMensaje('Error interno: Problema con la estructura de las horas en la fila.', 'error');
        return false; // Indicamos que algo está mal con la estructura
    }

    const horaInicioElement = horasEnFila[0];
    const horaFinElement = horasEnFila[1];

    let horaInicioActual = parseTime(horaInicioElement.dataset.time);
    let horaFinActual = parseTime(horaFinElement.dataset.time);

    // Si el elemento que se está editando es la hora de inicio
    if (timeElement === horaInicioElement) {
        horaInicioActual = hora; // La nueva hora validada
    } else if (timeElement === horaFinElement) {
        // Si el elemento que se está editando es la hora de fin
        horaFinActual = hora; // La nueva hora validada
    }

    // Validación principal: la hora de inicio debe ser estrictamente menor que la hora de fin
    if (horaInicioActual >= horaFinActual) {
        mostrarMensaje('La hora de inicio debe ser anterior a la hora de fin.', 'error');
        return false;
    }

    return true;
}

/**
 * Convierte un string de hora en objeto Date
 * @param {string} timeStr - Hora en formato HH:MM
 * @returns {Date} - Objeto Date con la hora
 */
function parseTime(timeStr) {
    if (!timeStr) return null; // Manejo de caso para string vacío/nulo
    const [hours, minutes] = timeStr.split(":").map(Number);
    // Validar que hours y minutes sean números válidos después de la conversión
    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        return null;
    }
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}

/**
 * Valida los campos requeridos del formulario
 * @returns {boolean} 
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

function agregarFilaHorario() {
    const tablaHorario = document.getElementById('tabla-horario');
    const filas = tablaHorario.querySelectorAll('tr');

    let horaInicio = "07:00";
    let horaFin = "08:00";

    if (filas.length > 0) {
        const ultimaFila = tablaHorario.lastElementChild;
        const ultimaHoraFin = ultimaFila.querySelector('.time:last-child').dataset.time;

        // Validar límite de hora
        if (parseTime(ultimaHoraFin) >= parseTime("23:59")) {
            mostrarMensaje("No se pueden agregar más horas después de las 23:59");
            return;
        }

        const finTime = parseTime(ultimaHoraFin);
        finTime.setMinutes(finTime.getMinutes() + 60);
        horaInicio = ultimaHoraFin;
        horaFin = finTime.toTimeString().slice(0, 5);
    }

    const nuevaFila = generarFila(horaInicio, horaFin);
    tablaHorario.appendChild(nuevaFila);
    hacerHorasEditables();
}

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

function guardarHorario() {
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
        showModalSingle('', 'No hay horas asignadas para guardar');
        return;
    }

    // OBTENER Y VALIDAR IDs ANTES DE PROCESAR
    const gradoElement = document.getElementById('grados-select');
    const docenteElement = document.getElementById('docente-select');

    if (!gradoElement || !docenteElement) {
        showModalSingle('', 'Error: No se encontraron los elementos de grado o docente');
        return;
    }

    const gradoId = parseInt(gradoElement.value);
    const docenteId = parseInt(docenteElement.value);

    // Validar que los IDs sean números válidos
    if (isNaN(gradoId) || isNaN(docenteId)) {
        showModalSingle('', 'Error: Debe seleccionar un grado y un docente válidos');
        return;
    }

    console.log('IDs obtenidos:', { gradoId, docenteId });

    const horarioData = [];
    const tablaHorario = document.getElementById('tabla-horario');


    const filas = Array.from(tablaHorario.querySelectorAll('tr'));

    console.log(`Total de filas encontradas: ${filas.length}`);

    filas.forEach((fila, index) => {
        console.log(`Procesando fila ${index + 1}:`);

        const celdas = fila.querySelectorAll('td');
        console.log(`Celdas encontradas: ${celdas.length}`);

        // Verificar que hay suficientes celdas
        if (celdas.length < 6) {
            console.error(`Fila ${index + 1} no tiene suficientes celdas`);
            return;
        }

        const tiempos = celdas[0].querySelectorAll('.time[data-time]');
        console.log(`Elementos de tiempo encontrados: ${tiempos.length}`);

        // Verificar que existen ambos elementos de tiempo
        if (tiempos.length < 2) {
            console.error(`Fila ${index + 1} sin horas completas:`, fila);
            return;
        }

        const horaInicio = tiempos[0].dataset.time;
        const horaFin = tiempos[1].dataset.time;

        console.log(`Fila ${index + 1}: ${horaInicio} - ${horaFin}`);

        // Verificar que las horas no estén vacías
        if (!horaInicio || !horaFin) {
            console.error(`Fila ${index + 1} - Horas vacías:`, { horaInicio, horaFin });
            return;
        }

        window.horarioApp.dias.forEach((dia, diaIndex) => {
            const materiaSelect = celdas[diaIndex + 1]?.querySelector('.subject-select');
            const materia = materiaSelect ? materiaSelect.value : '';

            console.log(`  ${dia}: ${materia || 'Sin materia'}`);

            if (materia) {
                const horarioItem = {
                    dia,
                    hora_inicio: horaInicio,
                    hora_fin: horaFin,
                    materia,
                    grado_id: gradoId,
                    docente_id: docenteId
                };

                // Log para debugging
                console.log('Agregando item:', horarioItem);
                horarioData.push(horarioItem);
            }
        });
    });

    console.log('Datos finales a enviar:', horarioData);
    console.log('Primer elemento del array:', horarioData[0]);

    // Verificar que hay datos para enviar
    if (horarioData.length === 0) {
        showModalSingle('', 'No hay materias asignadas para guardar');
        return;
    }

    // Verificar que todos los elementos tienen los campos requeridos
    const elementosIncompletos = horarioData.filter(item =>
        !item.grado_id || !item.docente_id || isNaN(item.grado_id) || isNaN(item.docente_id)
    );

    if (elementosIncompletos.length > 0) {
        console.error('Elementos con datos incompletos:', elementosIncompletos);
        showModalSingle('', 'Error: Hay elementos con datos incompletos');
        return;
    }

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
            showModalSingle('', 'Horario guardado exitosamente');
        })
        .catch(error => {
            console.error('Error al guardar el horario:', error);
            showModalSingle('', 'Error al guardar el horario. Por favor intente nuevamente.');
        });
}


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


    const tablaHorario = document.getElementById('tabla-horario');
    if (tablaHorario) {
        const tbody = tablaHorario.querySelector('tbody') || tablaHorario;
        hacerHorasEditables();
    }
    
    actualizarEstadisticas();
});

document.getElementById('btn-ver-horario').addEventListener('click', function () {
    const gradoSelect = document.getElementById('grados-select');
    const gradoId = gradoSelect.value;

    if (!gradoId) {
        showModalSingle('', 'Por favor seleccione un grado antes de ver el horario.');
        return;
    }

    window.location.href = `/secciones/horario/ver/${gradoId}`;
});


document.addEventListener("DOMContentLoaded", function () {
    // Variables globales
    const gradeModal = document.getElementById("gradeModal");
    const gradesTableBody = document.querySelector("#gradesTable tbody");
    const tablaHorario = document.getElementById("tabla-horario");

    // Datos simulados de grados (opcional si usas API real)
    const gradesData = [
        { id: 6, name: "Sexto" },
        { id: 7, name: "Séptimo" },
        { id: 8, name: "Octavo" },
        { id: 9, name: "Noveno" },
        { id: 10, name: "Décimo" },
        { id: 11, name: "Undécimo" }
    ];

    // Función para abrir el modal
    function openGradeModal() {
        gradeModal.style.display = "block";
        renderGrades();
    }

    // Mover la definición de la función al ámbito global
    function closeGradeModal() {
        const gradeModal = document.getElementById("gradeModal");
        if (gradeModal) {
            gradeModal.style.display = "none";
        }
    }


    // Renderizar la tabla de grados
    function renderGrades() {
        if (!gradesTableBody) {
            console.error("No se encontró el tbody de la tabla de grados");
            return;
        }

        gradesTableBody.innerHTML = "";

        gradesData.forEach((grade, index) => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${grade.name}</td>
                <td>
                    <button class="btn-edit" onclick="handleEdit(${grade.id})">Editar</button>
                    <button class="btn-delete" onclick="handleDelete(${grade.id})">Eliminar</button>
                </td>
            `;
            gradesTableBody.appendChild(row);
        });
    }

    window.handleEdit = function (gradeId) {
        fetch(`/secciones/api/horario/${gradeId}`) // ✅ Ahora apunta a la ruta correcta
            .then(res => {
                if (!res.ok) throw new Error('Error al cargar el horario');
                return res.json();
            })
            .then(horario => {
                cargarHorarioEnTabla(horario);
                closeGradeModal();
            })
            .catch(err => {
                console.error("Error al cargar el horario:", err);
                showModalSingle('Error', 'No se pudo cargar el horario. Verifique la conexión.');
            });
    };

    // Cargar horario en la tabla principal
    function cargarHorarioEnTabla(horario) {
    const tbody = tablaHorario?.querySelector("tbody") || tablaHorario;
    if (!tbody) {
        console.error("No se encontró el tbody de la tabla principal");
        return;
    }

    tbody.innerHTML = ""; // Limpiar tabla antes de cargar

    // Agrupar por horas (inicio-fin)
    const horasAgrupadas = {};

    horario.forEach(hora => {
        const key = `${hora.hora_inicio}-${hora.hora_fin}`;
        if (!horasAgrupadas[key]) {
            horasAgrupadas[key] = {};
        }
        horasAgrupadas[key][hora.dia] = hora.materia;
    });

    Object.keys(horasAgrupadas).forEach(key => {
        const [inicio, fin] = key.split("-");
        const fila = generarFila(inicio, fin);
        const diasMap = horasAgrupadas[key];

        window.horarioApp.dias.forEach(dia => {
            const materia = diasMap[dia];
            const select = fila.querySelector(`td:nth-child(${window.horarioApp.dias.indexOf(dia) + 2}) .subject-select`);

            if (select && materia) {
                const materiaInfo = window.horarioApp.materias.find(m => m.nombre === materia);

                if (materiaInfo) {
                    select.value = materia;
                    select.style.backgroundColor = materiaInfo.color;
                    select.style.color = "#fff";
                    select.dataset.materiaAnterior = materia;

                    // Actualizar contadores
                    if (window.horarioApp.seleccionContador[materia]) {
                        window.horarioApp.seleccionContador[materia].count++;
                        actualizarProgreso(materia);
                    }

                    window.horarioApp.totalHorasAsignadas++;
                }
            }
        });

        tbody.appendChild(fila);
    });

    hacerHorasEditables(); // Volver a habilitar edición de horas
    actualizarEstadisticas();
}

    // Eventos iniciales
    document.querySelector('.btn__edit')?.addEventListener('click', openGradeModal);
    document.querySelector('.modal .close')?.addEventListener('click', closeGradeModal);
    window.addEventListener('click', function (event) {
        if (event.target === gradeModal) {
            closeGradeModal();
        }
    });

    document.getElementById('agregar-hora')?.addEventListener('click', agregarFilaHorario);
    document.querySelector('.btn__delete')?.addEventListener('click', function () {
        showModal('', '¿Estás seguro de que deseas borrar todo el horario?', borrarHorario);
    });
    document.querySelector('.btn__save')?.addEventListener('click', guardarHorario);

    const tablaHorarioElement = document.getElementById('tabla-horario');
    if (tablaHorarioElement) {
        const tbody = tablaHorarioElement.querySelector('tbody') || tablaHorarioElement;
        hacerHorasEditables();
    }

    actualizarEstadisticas();
});

window.handleDelete = function (gradeId) {
    showModal(
        'Eliminar horario',
        '¿Estás seguro de que deseas eliminar todo el horario de este grado?',
        function () {
            fetch(`/secciones/borrar-horario/${gradeId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    showModalSingle('', 'Horario eliminado correctamente');
                    location.reload(); // Recargar página para actualizar vista
                } else {
                    showModalSingle('', 'Error al eliminar el horario: ' + data.error);
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showModalSingle('', 'Hubo un problema al eliminar el horario.');
            });
        }
    );
};