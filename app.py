from flask import Flask, render_template
from auth import auth
from dashboards import dashboards
from secciones import secciones
import os
from flask_session import Session
from middlewares import validar_sesion
from datetime import datetime
import locale

app = Flask(__name__)
app.config.from_object('config.Config')

# Registrar middleware global
app.before_request(validar_sesion)

# Blueprints (módulos de rutas)
app.register_blueprint(auth)
app.register_blueprint(dashboards)
app.register_blueprint(secciones)

# Carpeta para subir fotos
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'static', 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Configuración de sesión segura
app.config['SESSION_TYPE'] = 'filesystem'  
app.config['SESSION_PERMANENT'] = True
app.config['SESSION_USE_SIGNER'] = True  
app.config['PERMANENT_SESSION_LIFETIME'] = 1800 # 30 minutos
Session(app)

# Configuración de locale
try:
    locale.setlocale(locale.LC_TIME, 'es_ES.UTF-8')  # Linux
except Exception:
    locale.setlocale(locale.LC_TIME, 'Spanish_Spain')  # Windows

# Filtro datetimeformat
def datetimeformat(value, format="%d de %B de %Y"):
    if value == "now":
        value = datetime.now()
    return value.strftime(format)

# Filtro to_datetime
def to_datetime(value, format="%Y-%m-%d %H:%M:%S"):
    if value == "now":
        return datetime.now()
    try:
        return datetime.strptime(value, format)
    except:
        return value

# Registrar filtros en Jinja2
app.jinja_env.filters['datetimeformat'] = datetimeformat
app.jinja_env.filters['to_datetime'] = to_datetime



@app.route('/')
def index():
    return render_template('index.html')

    


if __name__ == '__main__':
    app.run(debug=True)