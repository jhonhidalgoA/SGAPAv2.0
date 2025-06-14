from flask import (Blueprint, render_template, 
                   request, redirect, url_for, flash, jsonify, json, current_app, request, make_response)
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from io import BytesIO
import datetime
from db import get_connection as get_db
from werkzeug.utils import secure_filename
from werkzeug.security import generate_password_hash
import os
import re
from flask import current_app
from functools import reduce
from utils.consecutivo import obtener_siguiente_consecutivo



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


# Planeacion
@secciones.route('/generar_pdf', methods=['POST'])
def generar_pdf():
    datos = {
        'fecha_inicio': request.form.get('dateStar'),
        'fecha_fin': request.form.get('dateEnd'),
        'periodo': request.form.get('periodo'),
        'grado': request.form.get('grado'),
        'asignatura': request.form.get('asignatura'),
        'tipo': request.form.get('tipo'),
        'estandar': request.form.get('estandar'),
        'dba': request.form.get('dba'),
        'evidencia': request.form.get('evidencia'),
        'competencias': request.form.get('competencias'),
        'objetivos': request.form.get('objetivos'),
        'proyecto_transversal': request.form.get('proyecto_transversal')
    }

    # Validar campos obligatorios
    if not all([datos['fecha_inicio'], datos['fecha_fin'], datos['periodo'], datos['grado'], datos['asignatura']]):
        flash("⚠️ Faltan campos obligatorios", "warning")
        return redirect(url_for('secciones.planeacion'))

    # Obtener siguiente consecutivo
    tipo_documento = 'plan_clase'    

    try:
        consecutivo = obtener_siguiente_consecutivo(tipo_documento)
    except Exception as e:
        flash(f"❌ Error al obtener el consecutivo: {str(e)}", "danger")
        return redirect(url_for('secciones.planeacion'))

    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4,
                            rightMargin=40, leftMargin=40,
                            topMargin=40, bottomMargin=40)
    story = []

    # Estilos
    styles = getSampleStyleSheet()
    styles.add(ParagraphStyle(name='Encabezado', fontSize=12, alignment=1, spaceAfter=10))
    styles.add(ParagraphStyle(name='Titulo', fontSize=16, alignment=1, textColor=colors.darkblue, spaceAfter=20))
    styles.add(ParagraphStyle(name='Seccion', fontSize=12, textColor=colors.black, spaceBefore=14, spaceAfter=6))
    styles.add(ParagraphStyle(name='NormalEspaciado', fontSize=10, spaceAfter=10))

    # Logo (si luego tienes uno, reemplaza esta ruta)
    logo_path = 'static/img/logoColegio.png'
    if os.path.exists(logo_path):
       img = Image(logo_path, width=0.6*inch, height=0.6*inch)
       img.hAlign = 'LEFT'
       story.append(img)

    # Encabezado
    story.append(Paragraph("INSTITUCIÓN EDUCATIVA SGAPA", styles['Encabezado']))
    story.append(Paragraph("Docente: Jhon Fredy Hidalgo", styles['Encabezado']))
    story.append(Paragraph("PLAN DE CLASE", styles['Titulo']))
    story.append(Spacer(1, 12))

    # Información general en dos columnas
    info_data = [
        ['Fecha de Inicio:', datos['fecha_inicio'] or 'No especificada', 'Fecha de Fin:', datos['fecha_fin'] or 'No especificada'],
        ['Grado:', datos['grado'] or 'No especificado', 'Período:', datos['periodo'] or 'No especificado'],
        ['Asignatura:', datos['asignatura'] or 'No especificada', 'Tipo:', datos['tipo'] or 'No especificado']
    ]
    info_table = Table(info_data, colWidths=[1.5*inch, 2.5*inch, 1.5*inch, 2.5*inch])
    info_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.lightgrey),
        ('BACKGROUND', (2, 0), (2, -1), colors.lightgrey),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10)
    ]))
    story.append(info_table)
    story.append(Spacer(1, 14))

    # Secciones de contenido
    def agregar_seccion(titulo, contenido):
        if contenido:
            story.append(Paragraph(titulo, styles['Seccion']))
            story.append(Paragraph(contenido, styles['NormalEspaciado']))

    agregar_seccion("ESTÁNDAR", datos['estandar'])
    agregar_seccion("DBA (Derechos Básicos de Aprendizaje)", datos['dba'])
    agregar_seccion("EVIDENCIAS DE APRENDIZAJE", datos['evidencia'])
    agregar_seccion("COMPETENCIAS", datos['competencias'])
    agregar_seccion("OBJETIVOS", datos['objetivos'])
    agregar_seccion("PROYECTO PEDAGÓGICO TRANSVERSAL", datos['proyecto_transversal'])

    # Fecha de generación
    story.append(Spacer(1, 24))
    fecha_generacion = datetime.datetime.now().strftime("%d/%m/%Y %H:%M")
    story.append(Paragraph(f"Documento generado el: {fecha_generacion}", styles['NormalEspaciado']))

    # Tabla de firmas
    story.append(Spacer(1, 40))
    firma_data = [
        ["____________________________", "____________________________"],
        ["Firma del Docente", "Firma del Coordinador o Rector"]
    ]
    firma_table = Table(firma_data, colWidths=[3*inch, 3*inch])
    firma_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('TOPPADDING', (0, 0), (-1, -1), 10)
    ]))
    story.append(firma_table)

    # Generar PDF
    doc.build(story)
    buffer.seek(0)
    response = make_response(buffer.getvalue())
    response.headers['Content-Type'] = 'application/pdf'
    response.headers['Content-Disposition'] = 'attachment; filename=planificacion_educativa.pdf'
    return response

@secciones.route('/planeacion', methods=['GET', 'POST'])
def planeacion():
    db = get_db()
    cursor = db.cursor()
    tipo_documento = 'plan_clase'

    try:
        cursor.execute("""
            SELECT MAX(consecutivo) AS max_consecutivo 
            FROM pdf_consecutivos 
            WHERE tipo_documento = %s
        """, (tipo_documento,))
        
        resultado = cursor.fetchone()

        if resultado is None:
            ultimo_consecutivo = '00000'
        else:
            if isinstance(resultado, dict):
                valor = resultado.get('max_consecutivo')
            else:
                valor = resultado[0] if len(resultado) > 0 else None
            
            if valor is None:
                ultimo_consecutivo = '00000'
            else:
                ultimo_consecutivo = str(valor).zfill(5)

        return render_template('secciones/planeacion.html', ultimo_consecutivo=ultimo_consecutivo)

    except Exception as e:
        print(f"❌ Error al cargar consecutivo: {str(e)}")
        return render_template('secciones/planeacion.html', ultimo_consecutivo='00000')

    finally:
        cursor.close()
        db.close()

@secciones.route('/ver-consecutivos')
def ver_consecutivos():
    db = get_db()
    cursor = db.cursor()

    try:
        cursor.execute("SELECT * FROM pdf_consecutivos ORDER BY fecha_generacion DESC")
        registros = cursor.fetchall()
        
        return render_template('secciones/consecutivos.html', registros=registros)
    
    except Exception as e:
        flash(f"❌ Error al cargar consecutivos: {str(e)}", "danger")
        return redirect(url_for('secciones.index'))
    
    finally:
        cursor.close()
        db.close()

@secciones.route('/eliminar-consecutivo/<int:id>')
def eliminar_consecutivo(id):
    db = get_db()
    cursor = db.cursor()

    try:
        cursor.execute("DELETE FROM pdf_consecutivos WHERE id = %s", (id,))
        db.commit()
        flash("🗑️ Registro eliminado correctamente", "success")
    
    except Exception as e:
        db.rollback()
        flash(f"❌ No se pudo eliminar: {str(e)}", "danger")
    
    finally:
        cursor.close()
        db.close()
    
    return redirect(url_for('secciones.ver_consecutivos'))

@secciones.route('/editar-consecutivo/<int:id>', methods=['GET', 'POST'])
def editar_consecutivo(id):
    db = get_db()
    cursor = db.cursor()

    if request.method == 'POST':
        nuevo_consecutivo = request.form.get('consecutivo')
        tipo_documento = request.form.get('tipo_documento')

        if not nuevo_consecutivo.isdigit() or not tipo_documento:
            flash("⚠️ Datos inválidos", "warning")
            return redirect(url_for('secciones.editar_consecutivo', id=id))

        try:
            cursor.execute("""
                UPDATE pdf_consecutivos 
                SET consecutivo = %s, tipo_documento = %s 
                WHERE id = %s
            """, (nuevo_consecutivo, tipo_documento, id))
            db.commit()
            flash("✏️ Consecutivo actualizado", "success")
            return redirect(url_for('secciones.ver_consecutivos'))
        
        except Exception as e:
            db.rollback()
            flash(f"❌ Error al actualizar: {str(e)}", "danger")
            return redirect(url_for('secciones.ver_consecutivos'))

    try:
        cursor.execute("SELECT * FROM pdf_consecutivos WHERE id = %s", (id,))
        registro = cursor.fetchone()
        return render_template('secciones/editar_consecutivo.html', registro=registro)
    
    except Exception as e:
        flash(f"❌ Error al cargar datos: {str(e)}", "danger")
        return redirect(url_for('secciones.ver_consecutivos'))
    
    finally:
        cursor.close()
        db.close()