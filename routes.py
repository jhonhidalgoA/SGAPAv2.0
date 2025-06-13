from flask import (Blueprint, render_template, 
                   request, redirect, url_for, flash, jsonify, json, current_app, app)
from db import get_connection as get_db
from datetime import datetime, timedelta
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash
import os
import re
from flask import current_app
from functools import reduce



secciones = Blueprint('secciones', __name__, url_prefix='/secciones')

ORDEN_DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]
ORDEN_CATEGORIAS = [
    "Menú del día",
    "Menú vegetariano",
    "Menú alternativo",    
    "Complementos"
]


@secciones.route('/matricula', methods=['GET', 'POST'])
def matricula():
    return render_template('secciones/matricula.html')
    

@secciones.route('/registro_docente', methods=['GET', 'POST'])
def registro_docente():
    return render_template('secciones/registro_docente.html')

@secciones.route('/guardar_matricula', methods=['POST'])
def guardar_matricula():
    db = get_db()
    cursor = db.cursor()

    # Campos obligatorios del estudiante
    nombres = request.form.get('student_name')
    apellidos = request.form.get('student_lastname')
    tipo_documento = request.form.get('student_document_type')
    numero_documento = request.form.get('student_document_number')
    email = request.form.get('student_email')

    if not nombres or not apellidos or not tipo_documento or not numero_documento or not email:
        flash("❌ Todos los campos obligatorios deben estar llenos", "danger")
        
        # Enviar campos vacíos para resaltarlos en HTML
        campos_vacios = []
        if not nombres: campos_vacios.append('student_name')
        if not apellidos: campos_vacios.append('student_lastname')
        if not tipo_documento: campos_vacios.append('student_document_type')
        if not numero_documento: campos_vacios.append('student_document_number')
        if not email: campos_vacios.append('student_email')

        return redirect(url_for('secciones.matricula', campos_vacios=','.join(campos_vacios)))
    
    if email and not re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', email):
        flash("❌ El correo electrónico no es válido", "danger")
        return redirect(url_for('secciones.matricula'))


    # Verificar si ya existe el documento
    cursor.execute("SELECT student_id FROM estudiantes WHERE document_number = %s", (numero_documento,))
    estudiante_existente = cursor.fetchone()

    if estudiante_existente:
        flash("⚠️ Este estudiante ya está matriculado", "warning")
        return redirect(url_for('secciones.matricula'))

    # Más datos personales del estudiante
    full_name = f"{nombres} {apellidos}"
    fecha_nacimiento = request.form.get('student_birth_date')
    genero = request.form.get('student_gender')
    lugar_nacimiento = request.form.get('student_birth_place')
    telefono = request.form.get('student_phone')
    email = request.form.get('student_email')
    direccion = request.form.get('student_address')
    barrio = request.form.get('student_neighborhood')
    localidad = request.form.get('student_locality')
    estrato = request.form.get('student_socioeconomic_status')
    zona = request.form.get('student_zone')
    grupo_sanguineo = request.form.get('student_blood_group')
    eps = request.form.get('student_eps')
    discapacidad = 1 if request.form.get('student_disability') == 'Sí' else 0
    tipo_discapacidad = request.form.get('student_disability_type') or None
    toma_medicamentos = 1 if request.form.get('student_takes_medicine') == 'Sí' else 0
    tipo_medicamento = request.form.get('student_medicine_type') or None

    # Fecha de matrícula
    fecha_matricula = request.form.get('registration_date') or datetime.now().date()

    # Subir foto del estudiante
    photo = request.files.get('student_photo')
    photo_filename = None

    if photo and photo.filename != '':
        try:
            photo_filename = secure_filename(photo.filename)
            upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], photo_filename)
            photo.save(upload_path)
        except Exception as e:
            flash(f"❌ Error al guardar la imagen: {str(e)}", "danger")
            return redirect(url_for('secciones.matricula'))
    else:
        flash("⚠️ Debes subir una foto del estudiante", "warning")
        return redirect(url_for('secciones.matricula', campos_vacios='student_photo'))

    # Buscar grade_id desde grados
    grado_ingreso = request.form.get('student_grade')
    cursor.execute("SELECT grade_id FROM grados WHERE name = %s", (grado_ingreso,))
    grado_result = cursor.fetchone()

    if not grado_result:
        flash("⚠️ Grado no encontrado", "warning")
        return redirect(url_for('secciones.matricula'))

    grade_id = grado_result['grade_id']
    grupo = request.form.get('student_group')
    jornada = request.form.get('student_shift')

    # Insertar en tabla estudiantes
    try:
        cursor.execute("""
            INSERT INTO estudiantes (
                full_name, birth_date, gender, birth_place,
                document_type, document_number, phone, email,
                address, neighborhood, locality, socioeconomic_status,
                zone, blood_group, eps, disability,
                disability_type, takes_medicine, medicine_type, photo_path, enrollment_date
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            full_name, fecha_nacimiento, genero, lugar_nacimiento,
            tipo_documento, numero_documento, telefono, email,
            direccion, barrio, localidad, estrato,
            zona, grupo_sanguineo, eps, discapacidad,
            tipo_discapacidad, toma_medicamentos, tipo_medicamento,
            photo_filename, fecha_matricula
        ))
        db.commit()
        student_id = cursor.lastrowid

        # Crear usuario en users
        password_hash = generate_password_hash(numero_documento)
        cursor.execute("""
            INSERT INTO users (
                full_name, role_id, username, password_hash, document_number, email
            ) VALUES (%s, %s, %s, %s, %s, %s)
        """, (full_name, 3, numero_documento, password_hash, numero_documento, email))
        db.commit()
        user_id = cursor.lastrowid

        # Actualizar estudiante con user_id
        cursor.execute("UPDATE estudiantes SET user_id = %s WHERE student_id = %s", (user_id, student_id))
        db.commit()

        # Datos madre
        nombre_madre = request.form.get('mother_name')
        tipo_documento_madre = request.form.get('mother_document_type')
        documento_madre = request.form.get('mother_document_number')
        telefono_madre = request.form.get('mother_phone')
        email_madre = request.form.get('mother_email')
        profesion_madre = request.form.get('mother_profession')
        ocupacion_madre = request.form.get('mother_occupation')
        is_guardian_madre = 1 if request.form.get('mother_is_guardian') else 0

        if nombre_madre and documento_madre:
            cursor.execute("""
                INSERT INTO contactos_familiares (
                    student_id, full_name, document_type, document_number,
                    phone, email, profession, occupation, relationship, is_guardian
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                student_id, nombre_madre, tipo_documento_madre, documento_madre,
                telefono_madre, email_madre, profesion_madre, ocupacion_madre,
                'madre', is_guardian_madre
            ))
            db.commit()
            mother_id = cursor.lastrowid

            # Actualizar guardian_id en estudiantes
            cursor.execute("UPDATE estudiantes SET guardian_id = %s WHERE student_id = %s", (mother_id, student_id))
            db.commit()

        # Datos padre
        nombre_padre = request.form.get('father_name')
        tipo_documento_padre = request.form.get('father_document_type')
        documento_padre = request.form.get('father_document_number')
        telefono_padre = request.form.get('father_phone')
        email_padre = request.form.get('father_email')
        profesion_padre = request.form.get('father_profession')
        ocupacion_padre = request.form.get('father_occupation')
        is_guardian_padre = 1 if request.form.get('father_is_guardian') else 0

        if nombre_padre and documento_padre:
            cursor.execute("""
                INSERT INTO contactos_familiares (
                    student_id, full_name, document_type, document_number,
                    phone, email, profession, occupation, relationship, is_guardian
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                student_id, nombre_padre, tipo_documento_padre, documento_padre,
                telefono_padre, email_padre, profesion_padre, ocupacion_padre,
                'padre', is_guardian_padre
            ))
            db.commit()

        # Insertar en matricula_estudiantes
        cursor.execute("""
            INSERT INTO matricula_estudiantes (
                student_id, grade_id, group_name, shift, academic_year
            ) VALUES (%s, %s, %s, %s, %s)
        """, (student_id, grade_id, grupo, jornada, datetime.now().year))
        db.commit()

        # Mensaje final de éxito
        flash("✅ Estudiante matriculado correctamente", "success")
        return redirect(url_for('secciones.matricula'))

    except Exception as e:
        db.rollback()
        flash(f"❌ Error al guardar: {str(e)}", "danger")
        return redirect(url_for('secciones.matricula'))
    
@secciones.route('/limpiar_datos')
def limpiar_datos():
    db = get_db()
    cursor = db.cursor()

    try:
        # Desactivar restricciones de llaves foráneas
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0;")
        
        cursor.execute("DELETE FROM matricula_estudiantes;")
        cursor.execute("DELETE FROM contactos_familiares;")
        cursor.execute("DELETE FROM users;")
        cursor.execute("DELETE FROM estudiantes;")

        # Reiniciar contadores AUTO_INCREMENT
        cursor.execute("ALTER TABLE estudiantes AUTO_INCREMENT = 1;")
        cursor.execute("ALTER TABLE contactos_familiares AUTO_INCREMENT = 1;")
        cursor.execute("ALTER TABLE users AUTO_INCREMENT = 1;")
        cursor.execute("ALTER TABLE matricula_estudiantes AUTO_INCREMENT = 1;")

        # Reactivar restricciones
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1;")
        db.commit()

        flash("✅ Datos borrados correctamente", "success")
    except Exception as e:
        db.rollback()
        flash(f"❌ Error al limpiar datos: {str(e)}", "danger")
    
    return redirect(url_for('secciones.matricula'))


# Docente registro
@secciones.route('/guardar_docente', methods=['POST'])
def guardar_docente():
    db = get_db()
    cursor = db.cursor()

    try:
        # Obtener datos del formulario
        nombres = request.form.get('teacher_name')
        apellidos = request.form.get('teacher_lastname')
        fecha_registro = request.form.get('registration_date_teacher')
        codigo = request.form.get('codigo_teacher')
        fecha_nacimiento = request.form.get('teacher_birth_date')
        edad = request.form.get('teacher_age')
        genero = request.form.get('teacher_gender')
        lugar_nacimiento = request.form.get('teacher_birth_place')
        tipo_documento = request.form.get('teacher_document_type')
        numero_documento = request.form.get('teacher_document_number')
        telefono = request.form.get('teacher_phone')
        correo = request.form.get('teacher_email')
        profesion = request.form.get('profession')
        area = request.form.get('area')  # ← Debe venir de <select name="area">
        resolucion = request.form.get('resolucion')
        escalafon = request.form.get('scale')  # ← Debe venir de <select name="scale">
        foto = request.files.get('student_photo')

        # Validación: Campos obligatorios
        if not all([nombres, apellidos, tipo_documento, numero_documento, area, escalafon]):
            flash("❌ Todos los campos obligatorios deben estar llenos", "danger")
            return redirect(url_for('secciones.registro_docente'))

        # Validar número de documento (solo números)
        if not numero_documento.isdigit():
            flash("❌ El número de documento debe contener solo números", "danger")
            return redirect(url_for('secciones.registro_docente'))

        # Validar correo electrónico si se proporciona
        if correo and '@' not in correo:
            flash("❌ El correo electrónico no es válido", "danger")
            return redirect(url_for('secciones.registro_docente'))

        # Validar teléfono si se llena
        if telefono and (not telefono.isdigit() or len(telefono) < 7):
            flash("❌ El teléfono debe tener al menos 7 dígitos", "danger")
            return redirect(url_for('secciones.registro_docente'))

        # Verificar si ya existe el docente
        cursor.execute("SELECT teacher_id FROM docentes_datos WHERE document_number = %s", (numero_documento,))
        docente_existe = cursor.fetchone()

        if docente_existe:
            flash("⚠️ Este docente ya está registrado", "warning")
            return redirect(url_for('secciones.registro_docente'))

        # Subir foto del docente
        photo_path = None
        if foto and foto.filename != '':
            filename = secure_filename(foto.filename)
            upload_path = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            foto.save(upload_path)
            photo_path = filename
        else:
            flash("⚠️ Debes subir una foto del docente", "warning")
            return redirect(url_for('secciones.registro_docente'))

        # Generar contraseña hash
        password_hash = generate_password_hash(numero_documento)

        # Insertar en tabla users
        cursor.execute("""
            INSERT INTO users (
                full_name, role_id, username, password_hash, document_number, email
            ) VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            f"{nombres} {apellidos}", 2, numero_documento, password_hash, numero_documento, correo
        ))
        db.commit()
        user_id = cursor.lastrowid

        # Insertar en tabla docente_datos
        cursor.execute("""
            INSERT INTO docentes_datos (
                first_name, last_name, registration_date, code,
                birth_date, age, gender, birth_place,
                document_type, document_number, phone, email,
                profession, subject_area, resolution_number, scale, photo_path, user_id
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (
            nombres, apellidos, fecha_registro, codigo,
            fecha_nacimiento, edad, genero, lugar_nacimiento,
            tipo_documento, numero_documento, telefono, correo,
            profesion, area, resolucion, escalafon, photo_path, user_id
        ))
        db.commit()

        # Mostrar mensaje de éxito
        flash("✅ Docente matriculado correctamente", "success")

    except Exception as e:
        db.rollback()
        print(f"Error al registrar docente: {e}") 
        flash(f"❌ Error al registrar docente: {str(e)}", "danger")

    return redirect(url_for('secciones.registro_docente'))


@secciones.route('/calificaciones', methods=['GET', 'POST'])
def calificaciones():
    return render_template('secciones/calificaciones.html')

@secciones.route('/asistencia', methods=['GET', 'POST'])
def asistencia():
    return render_template('secciones/asistencia.html')

@secciones.route('/reportes', methods=['GET', 'POST'])
def reportes():
    return render_template('secciones/reportes.html')

@secciones.route('/planeacion', methods=['GET', 'POST'])
def planeacion():
    return render_template('secciones/planeacion.html')

@secciones.route('/tareas', methods=['GET', 'POST'])
def tareas():
    return render_template('secciones/tareas.html')

@secciones.route('/horario', methods=['GET', 'POST'])
def horario():
    return render_template('secciones/horario.html')

@secciones.route('/calendario')
def calendario():
    return render_template('secciones/calendario.html')

@secciones.route('/usuarios', methods=['GET', 'POST'])
def usuarios():
    return render_template('secciones/usuarios.html')

@secciones.route('/eventos')
def eventos():
    return render_template('secciones/eventos.html')  

@secciones.route('/circulares')
def circulares():
    return render_template('secciones/circulares.html')  



# 1 junio 2025
@secciones.route('/api/estudiantes/<string:grupo>')
def api_estudiantes(grupo):
    db = get_db()
    cursor = db.cursor()

    try:
        cursor.execute("""
            SELECT 
                e.student_id,
                e.full_name,
                SUBSTRING_INDEX(e.full_name, ' ', 2) AS nombres,
                SUBSTRING_INDEX(e.full_name, ' ', -2) AS apellidos
            FROM matricula_estudiantes m
            JOIN estudiantes e ON m.student_id = e.student_id
            WHERE m.grade_id = %s
              AND m.academic_year = YEAR(CURRENT_DATE)
            ORDER BY apellidos, nombres
        """, (grupo,))
        estudiantes = cursor.fetchall()

        if not estudiantes:
            return jsonify({
                "data": [],
                "message": f"No se encontraron estudiantes para el grupo {grupo}"
            })

        data = [
            {
                "student_id": str(est["student_id"]),
                "nombres": est["nombres"],
                "apellidos": est["apellidos"],
                "full_name": est["full_name"]
            }
            for est in estudiantes
        ]

        return jsonify({"data": data, "success": True})

    except Exception as e:
        print(f"❌ Error al cargar estudiantes: {str(e)}")
        return jsonify({
            "error": "No se pudieron cargar los estudiantes",
            "details": str(e)
        }), 500


# Cargar notas existentes
@secciones.route('/api/cargar-notas')
def cargar_notas():
    grupo = request.args.get('grupo')
    asignatura = request.args.get('asignatura')
    periodo = request.args.get('periodo')

    if not all([grupo, asignatura, periodo]):
        return jsonify({
            "error": "Faltan parámetros: grupo, asignatura y periodo son obligatorios"
        }), 400

    db = get_db()
    cursor = db.cursor()

    try:
        cursor.execute("""
            SELECT * FROM valor_notas 
            WHERE grade_id = %s AND subject_id = %s AND period_id = %s
        """, (grupo, asignatura, periodo))
        notas = cursor.fetchall()

        data = [
            {
                "student_id": str(nota["student_id"]),
                "nota1": str(nota["nota1"]) if nota["nota1"] is not None else "",
                "nota2": str(nota["nota2"]) if nota["nota2"] is not None else "",
                "nota3": str(nota["nota3"]) if nota["nota3"] is not None else "",
                "nota4": str(nota["nota4"]) if nota["nota4"] is not None else "",
                "nota5": str(nota["nota5"]) if nota["nota5"] is not None else "",
                "nota_final": str(nota["nota_final"]) if nota["nota_final"] is not None else ""
            }
            for nota in notas
        ]

        return jsonify({"data": data, "success": True})

    except Exception as e:
        print(f"❌ Error al cargar notas: {str(e)}")
        return jsonify({
            "error": "No se pudieron cargar las notas",
            "details": str(e)
        }), 500


# Endpoint para guardar nuevas notas
@secciones.route('/api/guardar-notas', methods=['POST'])
def guardar_notas():
    data = request.get_json()

    # Validación básica
    if not data or not isinstance(data, dict):
        return jsonify({"error": "Datos inválidos"}), 400

    grupo = data.get('grupo')
    asignatura = data.get('asignatura')
    periodo = data.get('periodo')
    notas_data = data.get('notas', [])

    if not all([grupo, asignatura, periodo]):
        return jsonify({
            "error": "Faltan parámetros: grupo, asignatura y periodo son obligatorios"
        }), 400

    
    db = get_db()
    cursor = db.cursor()

    try:
        # Eliminar todas las notas anteriores 
        cursor.execute("""
            DELETE FROM valor_notas
            WHERE grade_id = %s AND subject_id = %s AND period_id = %s
        """, (grupo, asignatura, periodo))
        db.commit()

        # Insertar nuevas notas
        for nota in notas_data:
            student_id = nota.get("student_id")
            nota1 = nota.get("nota1")
            nota2 = nota.get("nota2")
            nota3 = nota.get("nota3")
            nota4 = nota.get("nota4")
            nota5 = nota.get("nota5")

            cursor.execute("""
                INSERT INTO valor_notas (
                    grade_id,
                    student_id,
                    subject_id,
                    period_id,
                    nota1,
                    nota2,
                    nota3,
                    nota4,
                    nota5
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                grupo, student_id, asignatura, periodo,
                nota1, nota2, nota3, nota4, nota5
            ))

        db.commit()
        return jsonify({
            "message": "Notas guardadas correctamente",
            "success": True
        })

    except Exception as e:
        db.rollback()
        print(f"❌ Error al guardar notas: {str(e)}")
        return jsonify({
            "error": "No se pudieron guardar las notas",
            "details": str(e)
        }), 500
    
 # Menú escolar
 
def reordenar_menu(menu):
    ordered = {}
    for dia in ORDEN_DIAS:
        if dia in menu:
            ordered[dia] = {}

            # Ordenar categorías dentro del día
            for categoria in ORDEN_CATEGORIAS:
                if categoria in menu[dia]:
                    ordered[dia][categoria] = menu[dia][categoria]
    return ordered

@secciones.route('/guardar-cambios', methods=['POST'])
def guardar_cambios():
    data = request.get_json()

    dia = data['dia']
    categoria = data['categoria']
    original = data['platoOriginal']
    nuevo = data['platoNuevo']

    ruta_json = os.path.join(current_app.static_folder, "data", "menu.json")

    # Leer menú actual
    with open(ruta_json, "r", encoding="utf-8") as f:
        menu = json.load(f)

    encontrado = False
    for i, plato in enumerate(menu[dia][categoria]):
        if plato['nombre'] == original['nombre'] and plato['img'] == original['img']:
            menu[dia][categoria][i] = { "nombre": nuevo['nombre'], "img": nuevo['img'] }
            encontrado = True
            break

    if not encontrado:
        return jsonify({ "success": False, "error": "Plato no encontrado" })

    # Reordenar todo antes de guardar
    menu_ordenado = reordenar_menu(menu)

    # Guardar menú actualizado
    with open(ruta_json, "w", encoding="utf-8") as f:
        json.dump(menu_ordenado, f, indent=4, ensure_ascii=False)

    return jsonify({ "success": True })



@secciones.route('/editar_menu', methods=['GET', 'POST'])
def editar_menu(): 
    ruta_json = os.path.join(current_app.static_folder, "data", "menu.json")
    with open(ruta_json, "r", encoding="utf-8") as archivo:
        menus = json.load(archivo) 
    menus_ordenados = reordenar_menu(menus)     
    return render_template("secciones/editar_menu.html", menus=menus_ordenados)

@secciones.route("/restaurante")
def restaurante():
    ruta_json = os.path.join(current_app.static_folder, "data", "menu.json")
    with open(ruta_json, "r", encoding="utf-8") as archivo:
        menus = json.load(archivo)
    menus_ordenados = reordenar_menu(menus)
    semana = "09 al 13 de junio"  
    return render_template("secciones/restaurante.html", menus=menus_ordenados, semana=semana)

def cargar_menu():
    ruta_json = os.path.join(current_app.static_folder, "data", "menu.json")
    with open(ruta_json, "r", encoding="utf-8") as f:
        menu = json.load(f)

    return reordenar_menu(menu)

# Calendario
@secciones.route('/obtener-eventos', methods=['GET'])
def obtener_eventos():
    connection = None
    try:
        connection = get_db()  # Ya tienes esta función lista
        with connection.cursor() as cursor:
            sql = "SELECT id, titulo, fecha_inicio, fecha_fin, color FROM eventos_calendario"
            cursor.execute(sql)
            resultados = cursor.fetchall()

            eventos = []
            for row in resultados:
                evento = {
                    'id': row['id'],
                    'title': row['titulo'],
                    'startDate': row['fecha_inicio'].strftime('%Y-%m-%d'),
                    'endDate': row['fecha_fin'].strftime('%Y-%m-%d'),
                    'color': row['color']
                }
                eventos.append(evento)

            return jsonify({'success': True, 'events': eventos})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

    finally:
        if connection:
            connection.close()


@secciones.route('/guardar-evento', methods=['POST'])
def guardar_evento():
    data = request.get_json()
    evento_id = data.get('id')
    title = data.get('title')
    start_date = data.get('startDate')
    end_date = data.get('endDate')
    color = data.get('color')

    if not all([title, start_date, end_date, color]):
        return jsonify({
            'success': False,
            'error': 'Faltan campos obligatorios'
        }), 400

    connection = None
    try:
        connection = get_db()
        with connection.cursor() as cursor:
            sql = """
                INSERT INTO eventos_calendario (id, titulo, fecha_inicio, fecha_fin, color)
                VALUES (%s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    titulo = VALUES(titulo),
                    fecha_inicio = VALUES(fecha_inicio),
                    fecha_fin = VALUES(fecha_fin),
                    color = VALUES(color)
            """
            cursor.execute(sql, (evento_id, title, start_date, end_date, color))
        connection.commit()
        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

    finally:
        if connection:
            connection.close()


@secciones.route('/eliminar-evento', methods=['POST'])
def eliminar_evento():
    data = request.get_json()
    evento_id = data.get('id')

    if not evento_id:
        return jsonify({
            'success': False,
            'error': 'ID del evento no proporcionado'
        }), 400

    connection = None
    try:
        connection = get_db()
        with connection.cursor() as cursor:
            sql = "DELETE FROM eventos_calendario WHERE id = %s"
            cursor.execute(sql, (evento_id,))
        connection.commit()
        return jsonify({'success': True})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

    finally:
        if connection:
            connection.close()

@secciones.route('/ver-eventos', methods=['GET'])
def ver_eventos():
    connection = None
    try:
        connection = get_db()
        with connection.cursor() as cursor:
            sql = "SELECT id, titulo, fecha_inicio, fecha_fin, color FROM eventos_calendario"
            cursor.execute(sql)
            resultados = cursor.fetchall()

            eventos = []
            for row in resultados:
                evento = {
                    'id': row['id'],
                    'title': row['titulo'],
                    'start': row['fecha_inicio'].strftime('%Y-%m-%d'),
                    'end': row['fecha_fin'].strftime('%Y-%m-%d'),
                    'color': row['color']
                }
                eventos.append(evento)

            return jsonify({'success': True, 'events': eventos})

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

    finally:
        if connection:
            connection.close()

@secciones.route('/ver-calendario')
def ver_calendario():
    return render_template('secciones/calendario_ver.html')
