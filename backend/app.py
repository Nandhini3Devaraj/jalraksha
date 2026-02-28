from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv

load_dotenv()

def create_app():
    app = Flask(__name__)
    CORS(app, origins=["http://localhost:3000", "http://localhost:5173"])

    basedir = os.path.abspath(os.path.dirname(__file__))
    app.config["SQLALCHEMY_DATABASE_URI"] = (
        os.getenv("DATABASE_URL") or
        f"sqlite:///{os.path.join(basedir, 'instance', 'jalraksha.db')}"
    )
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "jalraksha-secret-key-2024")

    from extensions import db
    db.init_app(app)

    from routes.dashboard import dashboard_bp
    from routes.disease import disease_bp
    from routes.chatbot import chatbot_bp
    from routes.alerts import alerts_bp
    from routes.reports import reports_bp

    app.register_blueprint(dashboard_bp, url_prefix="/api/dashboard")
    app.register_blueprint(disease_bp,   url_prefix="/api/disease")
    app.register_blueprint(chatbot_bp,   url_prefix="/api/chatbot")
    app.register_blueprint(alerts_bp,    url_prefix="/api/alerts")
    app.register_blueprint(reports_bp,   url_prefix="/api/reports")

    with app.app_context():
        db.create_all()
        from seed_data import seed_if_empty
        seed_if_empty()

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, port=5000)
