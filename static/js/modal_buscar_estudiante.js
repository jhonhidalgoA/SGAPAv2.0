
let estudiantesData = [];
let filteredEstudiantes = [];
let searchTimeout = null;

function showEditEstudianteModal() {        
    
    const modal = document.getElementById('estudiantesModal');
    if (!modal) {
        console.error('❌ Modal no encontrado');
        alert('Error: Modal no encontrado');
        return;
    }
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    loadEstudiantesFromAPI();
}

function closeEstudiantesModal() {
    const modal = document.getElementById('estudiantesModal');
    if (!modal) return;
    
    modal.classList.remove('active');
    document.body.style.overflow = 'auto';
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.value = '';
    }
    
    estudiantesData = [];
    filteredEstudiantes = [];
}


async function loadEstudiantesFromAPI(searchTerm = '') {
    console.log('📡 Cargando estudiantes...', { searchTerm });
    
    const tbody = document.getElementById('estudiantesTableBody');
    if (!tbody) {
        console.error('❌ No se encontró estudiantesTableBody');
        return;
    }
    
    try {        
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="loading">
                    <div class="loading-spinner"></div>
                    Cargando estudiantes...
                </td>
            </tr>
        `;
        
        
        let url = '/secciones/api/estudiantes';
        if (searchTerm && searchTerm.trim()) {
            url += '?search=' + encodeURIComponent(searchTerm.trim());
        }
        
        console.log(' Realizando petición a:', url);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        
        console.log('📊 Status de respuesta:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('❌ Error HTTP:', response.status, errorText);
            throw new Error(`Error HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ Respuesta JSON:', result);
        
        if (result.success) {
            estudiantesData = result.data || [];
            filteredEstudiantes = [...estudiantesData];
            
            console.log(`✅ ${estudiantesData.length} estudiantes cargados`);
            
            if (estudiantesData.length === 0) {
                showNoResultsMessage(
                    searchTerm ? 
                    'No se encontraron estudiantes que coincidan con la búsqueda' : 
                    'No hay estudiantes registrados'
                );
            } else {
                renderEstudiantes();
            }
        } else {
            throw new Error(result.message || 'Error desconocido del servidor');
        }
        
    } catch (error) {        
        showErrorMessage('Error al cargar estudiantes: ' + error.message);
    }
}

function renderEstudiantes() {
    const tbody = document.getElementById('estudiantesTableBody');
    if (!tbody) return;
    
    if (filteredEstudiantes.length === 0) {
        showNoResultsMessage('No se encontraron estudiantes');
        return;
    }
    
    const rows = filteredEstudiantes.map((estudiante, index) => `
        <tr class="table-row" data-student-id="${estudiante.id}">
            <td class="table-cell student-number">${index + 1}</td>
            <td class="table-cell student-name">
                <div class="student-info">
                    <span class="name">${estudiante.nombres || ''}</span>
                    ${estudiante.documento ? `<span class="document">Doc: ${estudiante.documento}</span>` : ''}
                </div>
            </td>
            <td class="table-cell student-apellidos">${estudiante.apellidos || ''}</td>
            <td class="table-cell">
                <span class="student-grade">${estudiante.grado || 'Sin asignar'}</span>                
            </td>
            <td class="table-cell">
                <div class="action-buttons">
                    <button class="edit-btn" onclick="editarEstudiante(${estudiante.id})" title="Editar estudiante">
                        Editar
                    </button>                    
                </div>
            </td>
        </tr>
    `).join('');
    
    tbody.innerHTML = rows;
    console.log('✅ Lista renderizada con', filteredEstudiantes.length, 'estudiantes');
}

function showNoResultsMessage(message) {
    const tbody = document.getElementById('estudiantesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="no-results">
                <div class="no-results-icon">🔍</div>
                <div class="no-results-message">${message}</div>
            </td>
        </tr>
    `;
}

function showErrorMessage(message) {
    const tbody = document.getElementById('estudiantesTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="5" class="no-results error">
                <div class="no-results-icon">⚠️</div>
                <div class="error-message">${message}</div>
                <div style="margin-top: 15px;">
                    <button class="retry-btn" onclick="loadEstudiantesFromAPI()" style="margin-right: 10px;">
                        🔄 Reintentar
                    </button>
                    <button class="retry-btn" onclick="testApiConnection()" style="background: #10b981;">
                        🔧 Test API
                    </button>
                </div>
            </td>
        </tr>
    `;
}

function filterEstudiantes() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const searchTerm = searchInput.value;
    console.log('🔍 Filtrando por:', searchTerm);
    
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    
    searchTimeout = setTimeout(() => {
        loadEstudiantesFromAPI(searchTerm);
    }, 300);
}

// EDITAR ESTUDIANTE (URL CORREGIDA)
async function editarEstudiante(studentId) {
    console.log('✏️ Editando estudiante:', studentId);
    
    if (!studentId || studentId === 0) {
        console.error('❌ ID de estudiante inválido');
        alert('Error: ID de estudiante inválido');
        return;
    }
    
    try {
        const editBtn = document.querySelector(`button[onclick="editarEstudiante(${studentId})"]`);
        let originalText = '';
        
        if (editBtn) {
            originalText = editBtn.innerHTML;
            editBtn.innerHTML = '⏳ Cargando...';
            editBtn.disabled = true;
        }
        
        // CORREGIR URL - Agregar prefijo /secciones
        const response = await fetch('/secciones/api/estudiante/' + studentId);
        const result = await response.json();
        
        if (editBtn) {
            editBtn.innerHTML = originalText;
            editBtn.disabled = false;
        }
        
        if (result.success) {
            console.log('✅ Datos del estudiante obtenidos:', result.data);
            closeEstudiantesModal();
            
            // Redirigir a página de edición
            window.location.href = '/secciones/editar_estudiante/' + studentId;
            
        } else {
            throw new Error(result.message || 'Error al obtener datos del estudiante');
        }
        
    } catch (error) {
        console.error('❌ Error al editar estudiante:', error);
        alert('Error al cargar los datos del estudiante: ' + error.message);
        
        const editBtn = document.querySelector(`button[onclick="editarEstudiante(${studentId})"]`);
        if (editBtn && editBtn.disabled) {
            editBtn.innerHTML = '✏️ Editar';
            editBtn.disabled = false;
        }
    }
}

// VER ESTUDIANTE (URL CORREGIDA)
async function verEstudiante(studentId) {
    console.log('👁️ Viendo detalles del estudiante:', studentId);
    
    if (!studentId || studentId === 0) {
        alert('Error: ID de estudiante inválido');
        return;
    }
    
    try {
        // CORREGIR URL - Agregar prefijo /secciones
        const response = await fetch('/secciones/api/estudiante/' + studentId);
        const result = await response.json();
        
        if (result.success) {
            const estudiante = result.data.estudiante;
            const contactos = result.data.contactos_familiares || [];
            
            let contactosInfo = 'Sin contactos registrados';
            if (contactos.length > 0) {
                contactosInfo = contactos.map(function(contacto) {
                    return contacto.relationship + ': ' + contacto.full_name + ' (' + contacto.document_number + ')';
                }).join('\n');
            }
            
            const info = 
                'INFORMACIÓN DEL ESTUDIANTE\n\n' +
                'Nombre: ' + (estudiante.full_name || 'No registrado') + '\n' +
                'Documento: ' + (estudiante.document_number || 'No registrado') + '\n' +
                'Email: ' + (estudiante.email || 'No registrado') + '\n' +
                'Teléfono: ' + (estudiante.phone || 'No registrado') + '\n' +
                'Grado: ' + (estudiante.grado_nombre || 'Sin asignar') + '\n' +
                'Jornada: ' + (estudiante.shift || 'Sin asignar') + '\n\n' +
                'CONTACTOS FAMILIARES:\n' + contactosInfo;
            
            alert(info);
            
        } else {
            throw new Error(result.message || 'Error al obtener detalles del estudiante');
        }
        
    } catch (error) {
        console.error('❌ Error al ver estudiante:', error);
        alert('Error al cargar los detalles del estudiante: ' + error.message);
    }
}

// TEST API (URL CORREGIDA)
async function testApiConnection() {
    console.log('🔧 Probando conexión con la API...');
    
    try {
        // CORREGIR URL - Agregar prefijo /secciones
        const testResponse = await fetch('/secciones/api/test');
        if (testResponse.ok) {
            const testResult = await testResponse.json();
            console.log('✅ Test API exitoso:', testResult);
            alert('✅ Conexión con API exitosa!');
        } else {
            console.log('❌ Test API falló:', testResponse.status);
            alert('❌ No se puede conectar con la API.');
        }
    } catch (error) {
        console.error('❌ Error en test de API:', error);
        alert('❌ Error de conexión: ' + error.message);
    }
}

// EVENT LISTENERS
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎯 Configurando event listeners del modal');
    
    const modal = document.getElementById('estudiantesModal');
    if (modal) {
        modal.addEventListener('click', function(event) {
            if (event.target === modal) {
                closeEstudiantesModal();
            }
        });
        console.log('✅ Event listener para cerrar modal configurado');
    }
    
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            const modal = document.getElementById('estudiantesModal');
            if (modal && modal.classList.contains('active')) {
                closeEstudiantesModal();
            }
        }
    });
    
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', filterEstudiantes);
        console.log('✅ Event listener para búsqueda configurado');
    }
    
    console.log('🎉 Todos los event listeners configurados');
});

// FUNCIONES GLOBALES
window.showEditEstudianteModal = showEditEstudianteModal;
window.closeEstudiantesModal = closeEstudiantesModal;
window.editarEstudiante = editarEstudiante;
window.verEstudiante = verEstudiante;
window.filterEstudiantes = filterEstudiantes;
window.loadEstudiantesFromAPI = loadEstudiantesFromAPI;
window.testApiConnection = testApiConnection;

console.log('✅ modal_buscar_estudiante.js cargado completamente con URLs corregidas');