// === Calcular promedio de notas
function calcularPromedio(notas) {
    const notasValidas = notas.filter(n => n !== null && n !== "");
    return notasValidas.length
        ? (notasValidas.reduce((a, b) => a + parseFloat(b), 0) / notasValidas.length).toFixed(1)
        : "";
}

// === Clase de nota para estilo visual
function getClaseNota(nota) {
    const n = parseFloat(nota);
    if (n >= 4.5) return "nota-excelente";
    if (n >= 4.0) return "nota-buena";
    if (n >= 3.0) return "nota-regular";
    return "nota-deficiente";
}

// === Validar rango de nota (1.0 - 5.0)
function validarNota(valor) {
    let numero = valor.replace(/[^0-9.,]/g, "").replace(",", ".");
    const n = parseFloat(numero);

    if (isNaN(n) || numero === "") {
        return { valido: false, valor: "", mensaje: "❌ Valor inválido", fueraDeRango: false };
    } else if (n < 1.0) {
        return { valido: false, valor: n.toFixed(1), mensaje: "⚠️ Nota menor a 1.0", fueraDeRango: true };
    } else if (n > 5.0) {
        return { valido: false, valor: n.toFixed(1), mensaje: "⚠️ Nota mayor a 5.0", fueraDeRango: true };
    } else {
        return { valido: true, valor: n.toFixed(1), mensaje: "", fueraDeRango: false };
    }
}

// === Crear fila de estudiante
function crearFila(estudiante) {
    const tr = document.createElement("tr");
    tr.dataset.id = estudiante.student_id || "";

    tr.innerHTML = `
        <td><input type="text" value="${estudiante.apellidos}" readonly></td>
        <td><input type="text" value="${estudiante.nombres}" readonly></td>
        <td><input class="nota-input" type="number" step="0.1" min="1" max="5" value="${estudiante.nota1 || ""}"></td>
        <td><input class="nota-input" type="number" step="0.1" min="1" max="5" value="${estudiante.nota2 || ""}"></td>
        <td><input class="nota-input" type="number" step="0.1" min="1" max="5" value="${estudiante.nota3 || ""}"></td>
        <td><input class="nota-input" type="number" step="0.1" min="1" max="5" value="${estudiante.nota4 || ""}"></td>
        <td><input class="nota-input" type="number" step="0.1" min="1" max="5" value="${estudiante.nota5 || ""}"></td>
        <td><div class="nota-final ${getClaseNota(calcularPromedio([
                estudiante.nota1, estudiante.nota2, estudiante.nota3, estudiante.nota4, estudiante.nota5
        ]))}">
            ${calcularPromedio([
                estudiante.nota1, estudiante.nota2, estudiante.nota3, estudiante.nota4, estudiante.nota5
            ])}</div>
        </td>
    `;

    return tr;
}

// === Recalcular promedio al editar una nota
function recalcularPromedios(event) {
    const fila = event.target.closest("tr");
    const inputs = fila.querySelectorAll(".nota-input");
    const valores = Array.from(inputs).map(i => i.value.trim());
    const promedio = calcularPromedio(valores);
    const celdaFinal = fila.querySelector(".nota-final");

    if (celdaFinal) {
        celdaFinal.textContent = promedio;
        celdaFinal.className = `nota-final ${getClaseNota(promedio)}`;
    }
}

// === Configurar eventos en cada input de nota
function configurarEventListenersNotas(input) {
    input.addEventListener("input", function () {
        const resultado = validarNota(this.value);
        if (resultado.fueraDeRango) {
            mostrarAlertaPersistente(this, resultado.mensaje, "danger");
            this.classList.add("input-error");
        } else if (!resultado.valido) {
            this.classList.add("input-error");
            this.placeholder = "1.0–5.0";
        } else {
            this.classList.remove("input-error");
        }

        const fila = this.closest("tr");
        const todasNotas = fila.querySelectorAll(".nota-input");
        const valores = Array.from(todasNotas).map(i => i.value);
        const promedio = calcularPromedio(valores);
        const celdaFinal = fila.querySelector(".nota-final");

        if (celdaFinal) {
            celdaFinal.textContent = promedio;
            celdaFinal.className = `nota-final ${getClaseNota(promedio)}`;
        }
    });

    input.addEventListener("blur", function () {
        const resultado = validarNota(this.value);
        if (!resultado.valido) {
            if (!resultado.fueraDeRango) {
                this.value = "";
                this.placeholder = "";
            }
            this.classList.add("input-error");
        } else {
            this.value = resultado.valor;
            this.classList.remove("input-error");
        }
        recalcularPromedios({ target: this });
    });

    input.addEventListener("focus", function () {
        this.select();
    });
}

// === Alertas persistentes
var alertasPersistentes = new Map();

function mostrarAlertaPersistente(input, mensaje, tipo = "danger") {
    const inputId = input.dataset.inputId || Math.random().toString(36).substr(2, 9);
    input.dataset.inputId = inputId;
    alertasPersistentes.set(inputId, { mensaje, tipo });
    const alertaDiv = document.getElementById("alerta");
    if (!alertaDiv) return;
    alertaDiv.textContent = mensaje;
    alertaDiv.className = `alerta ${tipo}`;
    alertaDiv.classList.remove("ocultar");
    alertaDiv.style.display = "block";
}

function ocultarAlertaPersistente(input) {
    const inputId = input.dataset.inputId;
    if (inputId && alertasPersistentes.has(inputId)) {
        alertasPersistentes.delete(inputId);
        if (alertasPersistentes.size === 0) {
            const alertaDiv = document.getElementById("alerta");
            if (alertaDiv) {
                alertaDiv.classList.add("ocultar");
                setTimeout(() => {
                    alertaDiv.style.display = "none";
                }, 300);
            }
        }
    }
}

// === Navegación por teclado entre celdas
document.addEventListener("DOMContentLoaded", () => {
    document.addEventListener("keydown", function (e) {
        const active = document.activeElement;
        if (active && active.classList.contains("nota-input")) {
            const fila = active.closest("tr");
            const colIndex = Array.from(fila.querySelectorAll(".nota-input")).indexOf(active);
            const rowIndex = Array.from(containerTabla.children).indexOf(fila);
            let siguiente = null;

            switch (e.key) {
                case "ArrowRight":
                    siguiente = fila.querySelectorAll(".nota-input")[colIndex + 1];
                    break;
                case "ArrowLeft":
                    siguiente = fila.querySelectorAll(".nota-input")[colIndex - 1];
                    break;
                case "ArrowDown":
                    siguiente = containerTabla.children[rowIndex + 1]?.querySelectorAll(".nota-input")[colIndex];
                    break;
                case "ArrowUp":
                    siguiente = containerTabla.children[rowIndex - 1]?.querySelectorAll(".nota-input")[colIndex];
                    break;
                case "Enter":
                    e.preventDefault();
                    siguiente = containerTabla.children[rowIndex + 1]?.querySelectorAll(".nota-input")[colIndex];
                    break;
                case "Tab":
                    e.preventDefault();
                    const todosInputs = document.querySelectorAll(".nota-input");
                    const currentIndex = Array.from(todosInputs).indexOf(active);
                    const siguienteIndex = e.shiftKey ? currentIndex - 1 : currentIndex + 1;
                    siguiente = todosInputs[siguienteIndex % todosInputs.length];
                    break;
            }

            if (siguiente) {
                siguiente.focus();
                siguiente.select();
                e.preventDefault();
            }
        }
    });
});

// === Cargar estudiantes y notas
async function cargarDatos() {
    if (!validarCampos()) return;

    const grupo = document.getElementById("grados-select").value;
    const asignatura = document.getElementById("asignatura-select").value;
    const periodo = document.getElementById("periodos-select").value;
    const btnCargar = document.getElementById("btn-cargar");

    btnCargar.innerHTML = '<i class="material-symbols-outlined spin">refresh</i> Cargando...';
    btnCargar.disabled = true;

    try {
        // Cargar estudiantes del grupo
        const resEstudiantes = await fetch(`/secciones/api/estudiantes/${grupo}`);
        if (!resEstudiantes.ok) throw new Error("No se encontraron estudiantes");
        const dataEstudiantes = await resEstudiantes.json();

        // Cargar notas existentes
        const resNotas = await fetch(`/secciones/api/cargar-notas?grupo=${grupo}&asignatura=${asignatura}&periodo=${periodo}`);
        const dataNotas = resNotas.ok ? await resNotas.json() : { data: [] };

        // Combinar datos por student_id
        const datosCombinados = dataEstudiantes.data.map(est => {
            const notaEncontrada = dataNotas.data.find(n => n.student_id === parseInt(est.student_id)) || {};
            return {
                ...est,
                nota1: notaEncontrada.nota1 || "",
                nota2: notaEncontrada.nota2 || "",
                nota3: notaEncontrada.nota3 || "",
                nota4: notaEncontrada.nota4 || "",
                nota5: notaEncontrada.nota5 || ""
            };
        });

        // Limpiar tabla
        containerTabla.innerHTML = "";

        // Rellenar tabla
        datosCombinados.forEach(est => {
            const fila = crearFila(est);
            containerTabla.appendChild(fila);
            fila.querySelectorAll(".nota-input").forEach(configurarEventListenersNotas);
        });

        mostrarAlerta("✅ Datos cargados correctamente", "success");

    } catch (error) {
        console.error("❌ Error al cargar datos:", error);
        mostrarAlerta(error.message || "Error al cargar los datos", "danger");
    } finally {
        btnCargar.innerHTML = 'Cargar <i class="material-symbols-outlined">add</i>';
        btnCargar.disabled = false;
    }
}

// === Guardar notas
async function guardarNotas() {
    if (!validarCampos()) return;

    const grupo = document.getElementById("grados-select").value;
    const asignatura = document.getElementById("asignatura-select").value;
    const periodo = document.getElementById("periodos-select").value;
    const filas = document.querySelectorAll("#tabla-cuerpo tr");

    if (filas.length === 0) {
        mostrarAlerta("⚠️ No hay estudiantes cargados", "danger");
        return;
    }

    const notasData = [];
    filas.forEach(fila => {
        const celdas = fila.querySelectorAll("td");
        if (celdas.length < 8) return;

        const student_id = fila.dataset.id;
        const apellidos = celdas[0].querySelector("input")?.value.trim() || "";
        const nombres = celdas[1].querySelector("input")?.value.trim() || "";
        const nota1 = celdas[2].querySelector("input")?.value.trim() || "";
        const nota2 = celdas[3].querySelector("input")?.value.trim() || "";
        const nota3 = celdas[4].querySelector("input")?.value.trim() || "";
        const nota4 = celdas[5].querySelector("input")?.value.trim() || "";
        const nota5 = celdas[6].querySelector("input")?.value.trim() || "";
        const nota_final = celdas[7].querySelector(".nota-final")?.textContent.trim() || "";

        if ([nota1, nota2, nota3, nota4, nota5].some(nota => nota !== "")) {
            notasData.push({
                student_id,
                apellidos,
                nombres,
                nota1,
                nota2,
                nota3,
                nota4,
                nota5,
                nota_final
            });
        }
    });

    if (notasData.length === 0) {
        mostrarAlerta("⚠️ No hay estudiantes con notas para guardar", "danger");
        return;
    }

    try {
        const response = await fetch("/secciones/api/guardar-notas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ grupo, asignatura, periodo, notas: notasData })
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Error al guardar las notas");

        mostrarAlerta("✅ Notas guardadas correctamente", "success");
    } catch (error) {
        mostrarAlerta(`❌ ${error.message}`, "danger");
    }
}

// === Eventos de botones
document.addEventListener("DOMContentLoaded", function () {
    const btnCargar = document.getElementById("btn-cargar");
    const btnGuardar = document.getElementById("btn-guardar");

    if (btnCargar) {
        btnCargar.addEventListener("click", cargarDatos);
    }

    if (btnGuardar) {
        btnGuardar.addEventListener("click", guardarNotas);
    }
});