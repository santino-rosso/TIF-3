from flask import Flask
from routes.receta_routes import receta_bp

app = Flask(__name__)

app.register_blueprint(receta_bp, url_prefix='/api')

if __name__ == "__main__":
    app.run(debug=True)
