from flask import Flask, render_template
from auth import auth
from dashboards import dashboards
from secciones import secciones
import os
from flask_session import Session

app = Flask(__name__)
app.config.from_object('config.Config')

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
app.config['PERMANENT_SESSION_LIFETIME'] = 1800  # 30 minutos

# Inicializar Flask-Session
Session(app)



@app.route('/')
def index():
    return render_template('index.html')


if __name__ == '__main__':
    app.run(debug=True)