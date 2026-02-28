from flask import Blueprint, jsonify, request
from models import Alert
from extensions import db

alerts_bp = Blueprint("alerts", __name__)


@alerts_bp.route("/", methods=["GET"])
def get_alerts():
    severity = request.args.get("severity")
    limit    = int(request.args.get("limit", 50))

    query = Alert.query
    if severity:
        query = query.filter_by(severity=severity)
    alerts = query.order_by(Alert.created_at.desc()).limit(limit).all()
    return jsonify([a.to_dict() for a in alerts])


@alerts_bp.route("/unread-count", methods=["GET"])
def unread_count():
    count = Alert.query.filter_by(is_sent=False).count()
    return jsonify({"count": count})


@alerts_bp.route("/<int:alert_id>/mark-sent", methods=["PATCH"])
def mark_sent(alert_id):
    alert = Alert.query.get_or_404(alert_id)
    alert.is_sent = True
    db.session.commit()
    return jsonify(alert.to_dict())


@alerts_bp.route("/clear", methods=["DELETE"])
def clear_alerts():
    Alert.query.delete()
    db.session.commit()
    return jsonify({"message": "All alerts cleared"})
