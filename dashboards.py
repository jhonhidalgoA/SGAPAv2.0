from flask import Blueprint, session, render_template
from datetime import datetime
import locale
from auth import login_required, role_required


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
    return render_template('estudiante.html', nombre=nombre, cargo=cargo, fecha_actual=fecha_actual)  

@dashboards.route('/dashboard_padre')
@login_required
@role_required(3)
def dashboard_padre():
    nombre = session.get('nombre', 'Usuario')
    cargo = session.get('cargo', 'Padre') 
    fecha_actual = datetime.now().strftime('%A, %d de %B de %Y').capitalize()   
    return render_template('padre_familia.html', nombre=nombre, cargo=cargo, fecha_actual=fecha_actual)      