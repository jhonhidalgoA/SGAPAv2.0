from flask import Blueprint, render_template, request, redirect, url_for, flash
from db import get_connection
from flask import session
from werkzeug.security import check_password_hash
from werkzeug.security import generate_password_hash, check_password_hash
from functools import wraps
import secrets

auth = Blueprint('auth', __name__, url_prefix='/auth')



@auth.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')

        conn = get_connection()
        cursor = conn.cursor()

        try:
            cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
            user = cursor.fetchone()

            if not user:
                flash("Usuario no encontrado", "danger")
                return redirect(url_for('auth.login'))

            if not check_password_hash(user['password_hash'], password):
                flash("Contraseña incorrecta", "danger")
                return redirect(url_for('auth.login'))

            # Limpiar sesión previa
            session.clear()          
           

            token = generate_session_token()

            # Actualizar token en la base de datos
            cursor.execute("UPDATE users SET session_token = %s WHERE user_id = %s", (token, user['user_id']))
            conn.commit()

            # Guardar datos en sesión
            session['loggedin'] = True
            session['user_id'] = user['user_id']
            session['full_name'] = user['full_name']
            session['role_id'] = user['role_id']
            session['session_token'] = token
            session.permanent = True  # Esto activa la expiración de 30 minutos

            # Redirigir según rol
            role_id = user['role_id']
            if role_id == 1:
                return redirect(url_for('dashboards.dashboard_administrador'))
            elif role_id == 2:
                return redirect(url_for('dashboards.docente'))
            elif role_id == 3:
                return redirect(url_for('dashboards.dashboard_padre'))
            elif role_id == 4:
                return redirect(url_for('dashboards.dashboard_estudiante'))
            else:
                flash("Rol desconocido", "warning")
                return redirect(url_for('auth.login'))

        except Exception as e:
            conn.rollback()
            flash(f"Error al iniciar sesión: {str(e)}", "danger")
            return redirect(url_for('auth.login'))

        finally:
            cursor.close()
            conn.close()

    return render_template('login.html')


@auth.route('/contrasena')
def contrasena():
    return render_template('/contrasena.html')


@auth.route('/enviar-correo', methods=['GET', 'POST'])
def enviar_correo():
    if request.method == 'POST':
        email = request.form.get('username')  

        if not email:
            flash('Por favor, ingresa tu correo electrónico.', 'error')
            return redirect(url_for('auth.contrasena'))

        # Conectar a la base de datos
        conn = get_connection()
        try:
            with conn.cursor() as cursor:
                # Buscar si existe un usuario con ese correo
                sql = "SELECT * FROM users WHERE email = %s"
                cursor.execute(sql, (email,))
                user = cursor.fetchone()

                if user:
                    # Aquí puedes continuar con enviar token por correo
                    flash('Hemos encontrado tu cuenta. Sigue las instrucciones para restablecer tu contraseña.', 'success')
                    # Enviar correo o redirigir a otra página
                    return redirect(url_for('auth.restablecer_contrasena', email=email))
                else:
                    flash('No se encontró ninguna cuenta con ese correo.', 'error')
        finally:
            conn.close()

    return redirect(url_for('auth.contrasena'))


@auth.route('/logout')
def logout():    
    session.clear()
    return render_template('/index.html')


@auth.route('/crear-admin-temporal')
def crear_admin_temporal():
    conn = get_connection()
    cursor = conn.cursor()

    # Generar contraseña hash
    hashed = generate_password_hash("admin123")

    try:
        cursor.execute("""
            INSERT INTO users (
                full_name, username, password_hash, document_number, role_id, email
            ) VALUES (%s, %s, %s, %s, %s, %s)
        """, ("Admin Temporal", "admin123", hashed, 1000000002, 1, "temp@admin.com"))

        conn.commit()
        return "✅ Admin creado: admin123 / admin123"
    except Exception as e:
        conn.rollback()
        return f"❌ Error al crear admin: {str(e)}"
    finally:
        conn.close()

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'loggedin' not in session:
            flash("Por favor, inicia sesión primero", "danger")
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function


def role_required(role_id):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if session.get('role_id') != role_id:
                flash("❌ No tienes permiso para acceder a esta página", "danger")
                return redirect(url_for('auth.login'))
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def generate_session_token():
    return secrets.token_hex(32) 