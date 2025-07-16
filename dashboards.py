from flask import Blueprint, session, render_template
from flask import redirect, url_for, flash
from datetime import datetime
import locale
from auth import login_required, role_required
from db import get_connection as get_db
import pymysql

dashboards = Blueprint('dashboards', __name__)

try:
    locale.setlocale(locale.LC_TIME, 'es_ES.UTF-8')  
except locale.Error:
    locale.setlocale(locale.LC_TIME, 'Spanish_Spain.1252')

@dashboards.route('/dashboard_administrador')
@login_required
@role_required(1)
def dashboard_administrador():
    nombre = session.get('nombre', 'Usuario')
    cargo = session.get('cargo', 'Administrador')  
    fecha_actual = datetime.now().strftime('%A, %d de %B de %Y').capitalize()   
    return render_template('administrador.html', nombre=nombre, cargo=cargo, fecha_actual=fecha_actual)

@dashboards.route('/docente')
@login_required
@role_required(2)
def docente():
    nombre = session.get('nombre', 'Usuario')
    cargo = session.get('cargo', 'docenter') 
    fecha_actual = datetime.now().strftime('%A, %d de %B de %Y').capitalize()   
    return render_template('docente.html', nombre=nombre, cargo=cargo, fecha_actual=fecha_actual)

@dashboards.route('/dashboard_estudiante')
@login_required
@role_required(4)
def dashboard_estudiante():
    nombre = session.get('nombre', 'Usuario')
    cargo = session.get('cargo', 'Estudiante')    
    fecha_actual = datetime.now().strftime('%A, %d de %B de %Y').capitalize()    
    return render_template('estudiante.html',nombre=nombre, cargo=cargo,fecha_actual=fecha_actual)

@dashboards.route('/estudiante/mi-horario')
@login_required
@role_required(4)
def mi_horario():
    print("=== DEBUG: Entrando a mi_horario ===")
    user_id = session.get('user_id')
    print(f"User ID: {user_id}")

    db = None
    cursor = None

    try:
        db = get_db()
        cursor = db.cursor(pymysql.cursors.DictCursor)
        
        query = """
            SELECT m.grade_id
            FROM matricula_estudiantes m
            JOIN estudiantes e ON m.student_id = e.student_id
            WHERE e.user_id = %s
        """
        cursor.execute(query, (user_id,))
        result = cursor.fetchone()

        print(f"Resultado de la consulta: {result}")

        if not result or not result['grade_id']:
            flash('No se encontró información de grado para este estudiante', 'error')
            return redirect(url_for('dashboards.dashboard_estudiante'))

        grade_id = result['grade_id']
        print(f"Grade ID encontrado: {grade_id}")
        
        cursor.execute("SELECT COUNT(*) AS count FROM horarios WHERE grade_id = %s", (grade_id,))
        count_result = cursor.fetchone()
        print(f"Número de horarios encontrados: {count_result['count']}")

        if count_result['count'] == 0:
            flash(f'No hay horario configurado para el grado {grade_id}', 'warning')
            return redirect(url_for('dashboards.dashboard_estudiante'))

        print(f"Redirigiendo a ver_horario con grado_id: {grade_id}")
        return redirect(url_for('secciones.ver_horario', grado_id=grade_id))

    except Exception as e:
        print(f"ERROR en mi_horario: {e}")
        flash('Error al cargar el horario', 'error')
        return redirect(url_for('dashboards.dashboard_estudiante'))
    finally:
        if cursor:
            cursor.close()
        if db:
            db.close()


@dashboards.route('/dashboard_padre')
@login_required
@role_required(3)
def dashboard_padre():
    nombre = session.get('nombre', 'Usuario')
    cargo = session.get('cargo', 'Padre') 
    fecha_actual = datetime.now().strftime('%A, %d de %B de %Y').capitalize()   
    return render_template('padre_familia.html', nombre=nombre, cargo=cargo, fecha_actual=fecha_actual)      