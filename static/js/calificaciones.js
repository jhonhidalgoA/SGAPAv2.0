const container = document.querySelector('#example');
    const alertaDiv = document.getElementById('alerta');
    let hot = null;

    function mostrarAlerta(mensaje, tipo = 'error') {
        alertaDiv.textContent = mensaje;
        alertaDiv.className = `alerta ${tipo}`;
        alertaDiv.style.display = 'block';
        alertaDiv.classList.remove('ocultar');

        setTimeout(() => {
            alertaDiv.classList.add('ocultar');
            setTimeout(() => alertaDiv.style.display = 'none', 300);
        }, 3000);
    }

    function validarCampos() {
        const grado = document.getElementById('grados-select').value;
        const asignatura = document.getElementById('asignatura-select').value;
        const periodo = document.getElementById('periodos-select').value;

        if (!grado) {
            mostrarAlerta('Debe seleccionar un Grupo');
            return false;
        }

        if (!asignatura) {
            mostrarAlerta('Debe seleccionar una Asignatura');
            return false;
        }

        if (!periodo) {
            mostrarAlerta('Debe seleccionar un Periodo');
            return false;
        }

        return true;
    }

    function crearTabla(data) {
        data.sort((a, b) => a.apellidos.localeCompare(b.apellidos));

        const tabla = data.map(est => [
            est.apellidos,
            est.nombres,
            est.nota1 || '',
            est.nota2 || '',
            est.nota3 || '',
            est.nota4 || '',
            est.nota5 || '',
            est.nota_final || ''
        ]);

        if (hot) {
            hot.destroy();
        }

        hot = new Handsontable(container, {
            data: tabla,
            sourceData: data,
            colHeaders: ['Apellidos', 'Nombres', 'Nota 1', 'Nota 2', 'Nota 3', 'Nota 4', 'Nota 5', 'Nota Final'],
            rowHeaders: false,
            colWidths: [200, 200, 80, 80, 80, 80, 80, 100],
            stretchH: 'all',
            columns: [
                { readOnly: true },
                { readOnly: true },
                {
                    type: 'numeric',
                    validator: function (value, callback) {
                        if (value === null || value === '' || (value >= 0 && value <= 100)) {
                            callback(true);
                        } else {
                            callback(false);
                        }
                    }
                },
                {
                    type: 'numeric',
                    validator: function (value, callback) {
                        if (value === null || value === '' || (value >= 0 && value <= 100)) {
                            callback(true);
                        } else {
                            callback(false);
                        }
                    }
                },
                {
                    type: 'numeric',
                    validator: function (value, callback) {
                        if (value === null || value === '' || (value >= 0 && value <= 100)) {
                            callback(true);
                        } else {
                            callback(false);
                        }
                    }
                },
                {
                    type: 'numeric',
                    validator: function (value, callback) {
                        if (value === null || value === '' || (value >= 0 && value <= 100)) {
                            callback(true);
                        } else {
                            callback(false);
                        }
                    }
                },
                {
                    type: 'numeric',
                    validator: function (value, callback) {
                        if (value === null || value === '' || (value >= 0 && value <= 100)) {
                            callback(true);
                        } else {
                            callback(false);
                        }
                    }
                },
                {
                    readOnly: true,
                    renderer: function (instance, td, row, col, prop, value) {
                        Handsontable.renderers.NumericRenderer.apply(this, arguments);
                        td.style.fontWeight = 'bold';
                        td.style.background = '#f5f5f5';
                    }
                }
            ],
            cells: function (row, col) {
                const cellProperties = {};
                if (col === 0 || col === 1) {
                    cellProperties.className = 'ht-left nombre-apellido';
                } else if (col === 7) {
                    cellProperties.className = 'htCenter htBold nota-final';
                }
                return cellProperties;
            },
            afterChange: function (changes, source) {
                if (source === 'edit') {
                    changes.forEach(([row, prop, oldVal, newVal]) => {
                        if (prop !== 7) {
                            const fila = hot.getDataAtRow(row);
                            const notasValidas = fila.slice(2, 7)
                                .map(n => parseFloat(n))
                                .filter(n => !isNaN(n));
                            const promedio = notasValidas.length > 0
                                ? notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length
                                : 0;
                            hot.setDataAtCell(row, 7, promedio.toFixed(2), 'promedio');
                        }
                    });
                }
            },
            licenseKey: 'non-commercial-and-evaluation'
        });
    }

    async function cargarDatos() {
        if (!validarCampos()) return;

        const grupo = document.getElementById('grados-select').value;
        const asignatura = document.getElementById('asignatura-select').value;
        const periodo = document.getElementById('periodos-select').value;

        try {
            const btnCargar = document.getElementById('btn-cargar');
            btnCargar.innerHTML = '<i class="material-symbols-outlined spin">refresh</i> Cargando...';
            btnCargar.disabled = true;

            // Cargar estudiantes
            const resEstudiantes = await fetch(`/secciones/api/estudiantes/${grupo}`);
            if (!resEstudiantes.ok) {
                throw new Error(await resEstudiantes.text() || 'Error al cargar estudiantes');
            }
            const dataEstudiantes = await resEstudiantes.json();

            // Cargar notas existentes
            const resNotas = await fetch(`/secciones/api/cargar-notas?grupo=${grupo}&asignatura=${asignatura}&periodo=${periodo}`);
            const dataNotas = resNotas.ok ? await resNotas.json() : { data: [] };

            // Combinar datos
            const estudiantesConNotas = dataEstudiantes.data.map(est => {
                const notas = dataNotas.data.find(n => n.student_id === est.student_id) || {};
                return {
                    ...est,
                    nota1: notas.nota1 !== undefined ? notas.nota1 : '',
                    nota2: notas.nota2 !== undefined ? notas.nota2 : '',
                    nota3: notas.nota3 !== undefined ? notas.nota3 : '',
                    nota4: notas.nota4 !== undefined ? notas.nota4 : '',
                    nota5: notas.nota5 !== undefined ? notas.nota5 : '',
                    nota_final: notas.nota_final !== undefined ? notas.nota_final : ''
                };
            });

            if (estudiantesConNotas.length === 0) {
                throw new Error('No se encontraron estudiantes para este grupo');
            }

            crearTabla(estudiantesConNotas);

        } catch (error) {
            console.error('Error:', error);
            mostrarAlerta(error.message || 'Error al cargar datos');
        } finally {
            const btnCargar = document.getElementById('btn-cargar');
            btnCargar.innerHTML = 'Cargar <i class="material-symbols-outlined">add</i>';
            btnCargar.disabled = false;
        }
    }

    async function guardarNotas() {
        if (!validarCampos()) return;

        const grupo = document.getElementById('grados-select').value;
        const asignatura = document.getElementById('asignatura-select').value;
        const periodo = document.getElementById('periodos-select').value;

        if (!hot) {
            mostrarAlerta('No hay datos para guardar.');
            return;
        }

        
        const notasData = [];
        

        const btnGuardar = document.getElementById('btn-guardar');       
        btnGuardar.disabled = true;

        try {
            const response = await fetch('/secciones/api/guardar-notas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    grupo: grupo,
                    asignatura: asignatura,
                    periodo: periodo,
                    notas: notasData
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.details || 'Error al guardar las notas');
            }

            mostrarAlerta('Notas guardadas correctamente', 'success');

        } catch (error) {
            console.error('Error al guardar notas:', error);
            mostrarAlerta(error.message || 'Error al guardar las notas');
        } finally {
            btnGuardar.innerHTML = 'Guardar<i class="material-symbols-outlined">save</i>';
            btnGuardar.disabled = false;
        }
    }

    
    document.getElementById('btn-cargar').addEventListener('click', cargarDatos);
    document.getElementById('btn-guardar').addEventListener('click', guardarNotas);