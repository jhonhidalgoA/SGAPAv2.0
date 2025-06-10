const materias = [
    { nombre: "Matemáticas", color: "#FF5733" }, // Rojo vivo
    { nombre: "Geometría", color: "#FF9800" }, // Naranja vivo
    { nombre: "Estadística", color: "#FF5722" }, // Rojo anaranjado
    { nombre: "Tecnología", color: "#00BC44" }, // Verde esmeralda            
    { nombre: "Castellano", color: "#29B6F6" }, // Azul brillante
    { nombre: "C. Lectora", color: "#4DD0E1" }, // Turquesa claro
    { nombre: "Inglés", color: "#03A9F4" }, // Azul cielo
    { nombre: "Biología", color: "#4CAF50" }, // Verde vivo
    { nombre: "Física", color: "#8BC34A" }, // Verde lima
    { nombre: "Química", color: "#00E676" }, // Verde neón
    { nombre: "Artística", color: "#98B528" },
    { nombre: "Ética", color: "#F06292" }, // Rosa pastel
    { nombre: "Religión", color: "#FF6E40" }, // Coral claro
    { nombre: "Cátedra de la Paz", color: "#FFA726" }, // Naranja cálido
    { nombre: "Educación Física", color: "#F44336" }, // Rojo intenso
    { nombre: "Ciencias Sociales", color: "#FFC107" }, // Amarillo vibrante
    { nombre: "Historia y Geografía", color: "#FF7043" }, // Naranja claro
    { nombre: "Descanso", color: "#97A085" },
    { nombre: "Almuerzo", color: "#CAC7B1" }
];

const dias = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"];
const seleccionContador = {};

// Inicializar el contador

Array.from(document.querySelectorAll('#tablaMaterias tbody tr')).forEach(row => {
    const materia = row.cells[0].textContent.trim();
    const maxAsignaciones = parseInt(row.cells[1].textContent);
    seleccionContador[materia] = { count: 0, max: maxAsignaciones };
});

// Función para generar una fila de la tabla

function generarFila(horaInicio = "07:00", horaFin = "08:00") {
    const fila = document.createElement('tr');           
    const celdaHora = document.createElement('td');
    celdaHora.className = 'time-container';
    celdaHora.innerHTML = `
<div class="time" data-time="${horaInicio}">${horaInicio}</div>
<div class="time" data-time="${horaFin}">${horaFin}</div>
`;
    fila.appendChild(celdaHora);

    // Celdas de días (Lunes a Viernes)
    dias.forEach(dia => {
        const celdaDia = document.createElement('td');
        const select = document.createElement('select');
        select.setAttribute('aria-label', dia);

        // Opción por defecto
        const opcionDefault = document.createElement('option');
        opcionDefault.value = "";
        opcionDefault.textContent = "Seleccionar";
        select.appendChild(opcionDefault);

        // Opciones de materias
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

// Función para hacer las horas editables

function hacerHorasEditables() {
    const times = document.querySelectorAll('.time');

    times.forEach(time => {
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
                if (e.key === 'Enter') {
                    input.blur();
                }
            });
        });
    });
}

// Función para validar las horas

function validarHora(hora, timeElement) {
    const fila = timeElement.closest('tr');
    const horas = fila.querySelectorAll('.time');
    const horaInicio = horas[0].dataset.time;
    const horaFin = horas[1].dataset.time;
    return true;
}

// Función para mostrar errores en la interfaz

function mostrarError(mensaje) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = mensaje;

    const btnContainer = document.querySelector('.btn');
    btnContainer.insertAdjacentElement('beforebegin', errorDiv);

    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Función para actualizar el select y aplicar el color

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



document.getElementById('tabla-horario').addEventListener('change', (e) => {
    if (e.target.tagName === 'SELECT') {
        const select = e.target;
        const materiaSeleccionada = select.value;
        const materiaAnterior = select.dataset.materiaAnterior;

        if (materiaAnterior) {
            seleccionContador[materiaAnterior].count--;
            actualizarSelect(select, materiaAnterior);
            select.dataset.materiaAnterior = "";
            select.style.backgroundColor = "";
        }

        if (materiaSeleccionada) {
            const contador = seleccionContador[materiaSeleccionada];

            if (contador.count >= contador.max) {
                mostrarError(`Has alcanzado el límite de horas para ${materiaSeleccionada}.`);
                select.value = "";
            } else {
                contador.count++;
                actualizarSelect(select, materiaSeleccionada);
                select.dataset.materiaAnterior = materiaSeleccionada;
            }
        }
    }
});

function mostrarError(mensaje) {
    const btnContainer = document.querySelector('.btn');
    const existingError = document.querySelector('.error-message');

    if (existingError) {
        existingError.remove();
    }

    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = mensaje;

    btnContainer.insertAdjacentElement('beforebegin', errorDiv);

    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Agregar la primera fila al cargar la página
document.getElementById('tabla-horario').appendChild(generarFila());
hacerHorasEditables();

// Función para agregar una nueva fila
document.getElementById('agregar-hora').addEventListener('click', () => {
    const tabla = document.getElementById('tabla-horario');
    const ultimaFila = tabla.lastElementChild;
    const ultimaHoraFin = ultimaFila.querySelector('.time:last-child').dataset.time;

    if (ultimaHoraFin >= "23:59") {
        mostrarError("No se pueden agregar más horas.");
        return;
    }

    tabla.appendChild(generarFila(ultimaHoraFin, "00:00"));
    hacerHorasEditables();
});