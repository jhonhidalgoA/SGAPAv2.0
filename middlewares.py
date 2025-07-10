# middlewares.py
from flask import request, session, flash, redirect, url_for


# middlewares.py
from flask import request, session, flash, redirect, url_for
from db import get_connection

def validar_sesion():
    # Rutas que queremos proteger
    rutas_protegidas = ['dashboards', 'secciones']

    # Roles que deben pasar la validación
    roles_protegidos = [1, 2]  # 1=admin, 2=docente

    # Detectamos si la ruta actual está en las protegidas
    if any(request.endpoint.startswith(prefix) for prefix in rutas_protegidas):
        # Si el usuario tiene rol de admin o docente → debe iniciar sesión
        if session.get('role_id') in roles_protegidos:
            from db import get_connection
            conn = get_connection()
            cursor = conn.cursor()

            try:
                user_id = session.get('user_id')
                token_sesion = session.get('session_token')

                cursor.execute("SELECT session_token FROM users WHERE user_id = %s", (user_id,))
                resultado = cursor.fetchone()
                token_db = resultado['session_token'] if resultado else None

                if token_db != token_sesion:
                    session.clear()
                    flash("❌ Tu sesión ha expirado o fue terminada", "danger")
                    return redirect(url_for('auth.login'))
            finally:
                cursor.close()
                conn.close()