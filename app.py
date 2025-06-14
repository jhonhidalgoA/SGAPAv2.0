from flask import Flask, render_template
from auth import auth
from dashboards import dashboards
from secciones import secciones
import os



app = Flask(__name__)
app.config.from_object('config.Config')


# Blueprints (módulos de rutas)
app.register_blueprint(auth)
app.register_blueprint(dashboards)
app.register_blueprint(secciones)

# Carpeta para subir fotos
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'static', 'uploads')
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)


@app.route('/')
def index():
    return render_template('index.html')


if __name__ == '__main__':
    app.run(debug=True)