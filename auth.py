from flask import Blueprint, render_template, request, redirect, url_for, flash
from db import get_connection
from flask import session

auth = Blueprint('auth', __name__, url_prefix='/auth')

@auth.route('/login')
def login():
    return render_template('/login.html')

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