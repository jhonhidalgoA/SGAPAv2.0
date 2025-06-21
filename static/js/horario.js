// Materias con nombre y color asociado
const materias = [
    { nombre: "Matemáticas", color: "#FF5733" },
    { nombre: "Geometría", color: "#FF9800" },
    { nombre: "Estadística", color: "#FF5722" },
    { nombre: "Tecnología", color: "#00BC44" },
    { nombre: "Castellano", color: "#29B6F6" },
    { nombre: "C. Lectora", color: "#4DD0E1" },
    { nombre: "Inglés", color: "#03A9F4" },
    { nombre: "Biología", color: "#4CAF50" },
    { nombre: "Física", color: "#8BC34A" },
    { nombre: "Química", color: "#00E676" },
    { nombre: "Artística", color: "#98B528" },
    { nombre: "Ética", color: "#F06292" },
    { nombre: "Religión", color: "#FF6E40" },
    { nombre: "Cátedra de la Paz", color: "#FFA726" },
    { nombre: "Educación Física", color: "#F44336" },
    { nombre: "Ciencias Sociales", color: "#FFC107" },
    { nombre: "Historia y Geografía", color: "#FF7043" },
    { nombre: "Descanso", color: "#97A085" },
    { nombre: "Almuerzo", color: "#CAC7B1" }
];

// Días de la semana
const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];

// Contador de selecciones por materia
const seleccionContador = {};
let totalHorasAsignadas = 0;

// Inicializar contadores desde la tabla estática
Array.from(document.querySelectorAll('#tablaMaterias tbody tr')).forEach(row => {
    const materia = row.cells[0].textContent.trim();
    const maxAsignaciones = parseInt(row.cells[1].textContent);
    seleccionContador[materia] = { count: 0, max: maxAsignaciones };
});

// Función para parsear hora a objeto Date
function parseTime(timeStr) {
    const [hours, minutes] = timeStr.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
}

// Función para generar una fila de horario
function generarFila(horaInicio = "07:00", horaFin = "08:00") {
    const fila = document.createElement('tr');
    const celdaHora = document.createElement('td');
    celdaHora.className = 'time-container';
    celdaHora.innerHTML = `
        <div class="time" data-time="${horaInicio}">${horaInicio}</div>
        <div class="time" data-time="${horaFin}">${horaFin}</div>
    `;
    fila.appendChild(celdaHora);

    // Celdas de días
    dias.forEach(dia => {
        const celdaDia = document.createElement('td');
        const select = document.createElement('select');
        select.setAttribute('aria-label', dia);

        // Opción por defecto
        const opcionDefault = document.createElement('option');
        opcionDefault.value = "";
        opcionDefault.textContent = "Seleccionar";
        select.appendChild(opcionDefault);

        // Opciones dinámicas
        materias.forEach(materia => {
            const opcion = document.createElement('option');
            opcion.value = materia.nombre;
            opcion.textContent = materia.nombre;
            opcion.style.backgroundColor = materia.color;
            select.appendChild(opcion);
        });

        celdaDia.appendChild(select);
        fila.appendChild(celdaDia);
    });

    return fila;
}

// Hacer las horas editables
function hacerHorasEditables() {
    document.querySelectorAll('.time').forEach(time => {
        time.addEventListener('click', () => {
            const currentTime = time.dataset.time;
            const input = document.createElement('input');
            input.type = 'time';
            input.value = currentTime;
            time.textContent = '';
            time.appendChild(input);
            input.focus();

            input.addEventListener('blur', () => {
                const newTime = input.value || currentTime;
                if (validarHora(newTime, time)) {
                    time.dataset.time = newTime;
                    time.textContent = newTime;
                }
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') input.blur();
            });
        });
    });
}

// Validar que la nueva hora no sea inválida
function validarHora(hora, timeElement) {
    const fila = timeElement.closest('tr');
    const horas = fila.querySelectorAll('.time');
    const horaInicio = horas[0].dataset.time;
    const horaFin = horas[1].dataset.time;

    return true;
}

// Actualiza los colores y estados de los selects
function actualizarSelect(select, materiaSeleccionada) {
    const materiaInfo = materias.find(m => m.nombre === materiaSeleccionada);
    if (materiaInfo) {
        select.style.backgroundColor = materiaInfo.color;
    }

    const contador = seleccionContador[materiaSeleccionada];
    const selects = document.querySelectorAll('select');

    selects.forEach(s => {
        const options = s.options;
        for (let i = 0; i < options.length; i++) {
            if (options[i].value === materiaSeleccionada) {
                options[i].disabled = contador.count >= contador.max;
                options[i].style.backgroundColor = options[i].disabled ? '#FFFFFF' : materiaInfo.color;
            }
        }
    });
}

// Manejador de cambio de selección de materias
document.getElementById('tabla-horario').addEventListener('change', (e) => {
    if (e.target.tagName === 'SELECT') {
        const select = e.target;
        const materiaSeleccionada = select.value;
        const materiaAnterior = select.dataset.materiaAnterior;

        // Restablecer si había una materia anterior
        if (materiaAnterior) {
            seleccionContador[materiaAnterior].count--;
            actualizarSelect(select, materiaAnterior);
            select.dataset.materiaAnterior = "";
            select.style.backgroundColor = "";
            actualizarTotalHoras(-1); // Restar 1 hora
        }

        // Agregar nueva materia
        if (materiaSeleccionada) {
            const contador = seleccionContador[materiaSeleccionada];

            if (contador.count >= contador.max) {
                mostrarError(`Has alcanzado el límite de horas para ${materiaSeleccionada}.`);
                select.value = "";
            } else {
                contador.count++;
                actualizarSelect(select, materiaSeleccionada);
                select.dataset.materiaAnterior = materiaSeleccionada;
                select.style.backgroundColor = materias.find(m => m.nombre === materiaSeleccionada)?.color || "";
                actualizarTotalHoras(1); // Sumar 1 hora
            }
        }
    }
});

// Mostrar mensaje de error temporal
function mostrarError(mensaje) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = mensaje;

    const btnContainer = document.querySelector('.planning__buttons');
    btnContainer.insertAdjacentElement('beforebegin', errorDiv);

    setTimeout(() => errorDiv.remove(), 3000);
}

// Actualizar contador de horas totales
function actualizarTotalHoras(cambio) {
    totalHorasAsignadas += cambio;
    const totalElement = document.getElementById("total-horas");
    if (totalElement) {
        totalElement.textContent = totalHorasAsignadas;
    }
}

// Añadir primera fila al cargar
const tablaHorario = document.getElementById('tabla-horario');
tablaHorario.appendChild(generarFila());
hacerHorasEditables();

// Botón para agregar filas
document.getElementById('agregar-hora').addEventListener('click', () => {
    const ultimaFila = tablaHorario.lastElementChild;
    const ultimaHoraFin = ultimaFila.querySelector('.time:last-child').dataset.time;

    if (parseTime(ultimaHoraFin) >= parseTime("23:59")) {
        mostrarError("No se pueden agregar más horas.");
        return;
    }

    const nuevaFila = generarFila(ultimaHoraFin, "00:00");
    tablaHorario.appendChild(nuevaFila);
    hacerHorasEditables();
});