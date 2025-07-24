const estudiantesData = [
    {
        id: 1,
        nombres: "Juan Carlos",
        apellidos: "Pérez González",
        grado: "10°A",
        documento: "1023456789"
    },
    {
        id: 2,
        nombres: "María Fernanda",
        apellidos: "López Martínez",
        grado: "9°B",
        documento: "1034567890"
    },
    {
        id: 3,
        nombres: "Carlos Andrés",
        apellidos: "Rodríguez Silva",
        grado: "11°A",
        documento: "1045678901"
    },
    {
        id: 4,
        nombres: "Ana Sofía",
        apellidos: "García Herrera",
        grado: "8°C",
        documento: "1056789012"
    },
    {
        id: 5,
        nombres: "Diego Alejandro",
        apellidos: "Morales Castro",
        grado: "10°B",
        documento: "1067890123"
    },
    {
        id: 6,
        nombres: "Valentina",
        apellidos: "Sánchez Torres",
        grado: "9°A",
        documento: "1078901234"
    },
    {
        id: 7,
        nombres: "Santiago",
        apellidos: "Ramírez Vega",
        grado: "11°C",
        documento: "1089012345"
    }
];

let filteredEstudiantes = [...estudiantesData];

// Función para mostrar el modal
function showEditEstudianteModal() {
    const modal = document.getElementById('estudiantesModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Simular carga de datos
    setTimeout(() => {
        loadEstudiantes();
    }, 500);
}

// Función para cerrar el modal
function closeEstudiantesModal() {
    const modal = document.getElementById('estudiantesModal');
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';

    // Limpiar búsqueda
    document.getElementById('searchInput').value = '';
    filteredEstudiantes = [...estudiantesData];
}

// Función para cargar estudiantes en la tabla
function loadEstudiantes() {
    const tbody = document.getElementById('estudiantesTableBody');

    if (filteredEstudiantes.length === 0) {
        tbody.innerHTML = `
                    <tr>
                        <td colspan="5" class="no-results">
                            <div class="no-results-icon">🔍</div>
                            No se encontraron estudiantes
                        </td>
                    </tr>
                `;
        return;
    }

    tbody.innerHTML = filteredEstudiantes.map((estudiante, index) => `
                <tr class="table-row">
                    <td class="table-cell student-number">${index + 1}</td>
                    <td class="table-cell student-name">${estudiante.nombres}</td>
                    <td class="table-cell student-apellidos">${estudiante.apellidos}</td>
                    <td class="table-cell">
                        <span class="student-grade">${estudiante.grado}</span>
                    </td>
                    <td class="table-cell">
                        <button class="edit-btn" onclick="editarEstudiante(${estudiante.id})">
                            Editar
                        </button>
                    </td>
                </tr>
            `).join('');
}

// Función para filtrar estudiantes
function filterEstudiantes() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    filteredEstudiantes = estudiantesData.filter(estudiante =>
        estudiante.nombres.toLowerCase().includes(searchTerm) ||
        estudiante.apellidos.toLowerCase().includes(searchTerm) ||
        estudiante.grado.toLowerCase().includes(searchTerm)
    );

    loadEstudiantes();
}

// Función para editar estudiante
function editarEstudiante(studentId) {
    const estudiante = estudiantesData.find(e => e.id === studentId);
    alert(`Editando estudiante: ${estudiante.nombres} ${estudiante.apellidos}\nDocumento: ${estudiante.documento}\nGrado: ${estudiante.grado}`);

    // Aquí integrarías con tu sistema:
    // window.location.href = `/editar_estudiante/${studentId}`;
    // O abrir otro modal de edición
    // O hacer una petición AJAX para cargar los datos del estudiante
}

// Cerrar modal al hacer click fuera
document.getElementById('estudiantesModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeEstudiantesModal();
    }
});

// Cerrar modal con la tecla Escape
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeEstudiantesModal();
    }
});

// Función para integrar con tu backend (ejemplo)
async function loadEstudiantesFromAPI() {
    try {
        // Reemplaza con tu endpoint real
        const response = await fetch('/api/estudiantes');
        const data = await response.json();

        // Actualizar los datos
        estudiantesData.length = 0;
        estudiantesData.push(...data);
        filteredEstudiantes = [...estudiantesData];

        loadEstudiantes();
    } catch (error) {
        console.error('Error cargando estudiantes:', error);
        document.getElementById('estudiantesTableBody').innerHTML = `
                    <tr>
                        <td colspan="5" class="no-results">
                            <div class="no-results-icon">⚠️</div>
                            Error al cargar los estudiantes
                        </td>
                    </tr>
                `;
    }
}