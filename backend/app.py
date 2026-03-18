"""
Skin Disease Classification API
Flask backend with Grad-CAM visualization
"""

import os
# Disable oneDNN custom operations to prevent potential hangs on some CPUs
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
# Reduce TensorFlow logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import io
import base64
import logging
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from PIL import Image
import numpy as np

from core.model import SkinDiseaseModel
from core.explain import GradCAM
from core import database

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder="../frontend", static_url_path="")
CORS(app, resources={r"/*": {"origins": "*"}})

# Initialize database
database.init_db()

# Configuration
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = 16 * 1024 * 1024  # 16MB

# Initialize model and Grad-CAM globally
logger.info("Loading skin disease classification model...")
model_handler = SkinDiseaseModel()
gradcam = GradCAM(model_handler)
logger.info("Model loaded successfully!")


def decode_image_from_base64(base64_string: str) -> Image.Image:
    """Decode base64 string to PIL Image."""
    if "," in base64_string:
        base64_string = base64_string.split(",")[1]
    image_data = base64.b64decode(base64_string)
    image = Image.open(io.BytesIO(image_data)).convert("RGB")
    return image


def encode_image_to_base64(image_array: np.ndarray) -> str:
    """Encode numpy array image to base64 string."""
    pil_image = Image.fromarray(np.uint8(image_array))
    buffer = io.BytesIO()
    pil_image.save(buffer, format="JPEG", quality=90)
    buffer.seek(0)
    return "data:image/jpeg;base64," + base64.b64encode(buffer.getvalue()).decode("utf-8")


def run_prediction(image: Image.Image):
    """Run full prediction pipeline on a PIL image."""
    # Preprocess image
    img_array = model_handler.preprocess_image(image)

    # Get predictions
    predictions = model_handler.predict(img_array)
    top_class_idx = int(np.argmax(predictions))
    top_class_name = model_handler.CLASS_NAMES[top_class_idx]
    confidence = float(predictions[top_class_idx] * 100)

    # Build all class probabilities
    all_probs = [
        {
            "class": model_handler.CLASS_NAMES[i],
            "probability": round(float(predictions[i] * 100), 2),
            "description": model_handler.CLASS_DESCRIPTIONS[model_handler.CLASS_NAMES[i]],
        }
        for i in range(len(model_handler.CLASS_NAMES))
    ]
    all_probs.sort(key=lambda x: x["probability"], reverse=True)

    # Generate Grad-CAM heatmap
    heatmap_overlay = gradcam.generate(img_array, image, top_class_idx)
    gradcam_base64 = encode_image_to_base64(heatmap_overlay)

    return {
        "success": True,
        "prediction": {
            "class": top_class_name,
            "confidence": round(confidence, 2),
            "description": model_handler.CLASS_DESCRIPTIONS[top_class_name],
            "severity": model_handler.CLASS_SEVERITY[top_class_name],
            "recommendation": model_handler.CLASS_RECOMMENDATIONS[top_class_name],
        },
        "all_probabilities": all_probs,
        "gradcam_image": gradcam_base64,
    }


@app.route("/")
def index():
    """Serve the frontend."""
    return app.send_static_file("index.html")

@app.route("/js/<path:filename>")
def serve_js(filename):
    """Serve JS files with explicit MIME type."""
    return send_from_directory(app.static_folder + "/js", filename, mimetype="application/javascript")


@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({"status": "healthy", "model_loaded": model_handler.model is not None})


@app.route("/login", methods=["POST"])
def login():
    """Login using the database users."""
    try:
        data = request.get_json()
        if not data or "username" not in data or "password" not in data:
            return jsonify({"success": False, "error": "Missing credentials"}), 400
        
        conn = database.get_db_connection()
        user = conn.execute("SELECT * FROM users WHERE username = ? AND password = ?", 
                           (data["username"], data["password"])).fetchone()
        conn.close()

        if user:
            # Sync role with admins.txt on login
            new_role = database.sync_user_role(data["username"])
            user_data = dict(user)
            user_data['role'] = new_role
            # Don't send password back
            user_data.pop('password')
            
            database.log_action(user_data['id'], "login", f"User {data['username']} logged in as {new_role}")
            return jsonify({"success": True, "message": "Login successful", "user": user_data})
        else:
            database.log_action(None, "login_failed", f"Failed login attempt for username: {data['username']}")
            return jsonify({"success": False, "error": "Invalid username or password"}), 401
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/signup", methods=["POST"])
def signup():
    """Register a new user."""
    try:
        data = request.get_json()
        if not data or "username" not in data or "password" not in data:
            return jsonify({"success": False, "error": "Missing credentials"}), 400
        
        username = data["username"].strip().lower()
        password = data["password"]
        full_name = data.get("full_name", username)

        if database.check_user_exists(username):
            return jsonify({"success": False, "error": "Username already exists"}), 409
        
        user_id = database.create_user(username, password, full_name)
        if user_id:
            database.log_action(user_id, "signup", f"New user {username} registered")
            return jsonify({"success": True, "message": "Global medical account created successfully", "user_id": user_id})
        else:
            return jsonify({"success": False, "error": "Failed to create user account"}), 500
            
    except Exception as e:
        logger.error(f"Signup error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/predict", methods=["POST"])
def predict():
    """Predict skin disease from uploaded image file and save to DB."""
    try:
        user_id = request.form.get("user_id")
        if not user_id:
             return jsonify({"success": False, "error": "User ID required"}), 400

        if "file" not in request.files:
            return jsonify({"success": False, "error": "No file provided"}), 400

        file = request.files["file"]
        if file.filename == "":
            return jsonify({"success": False, "error": "No file selected"}), 400

        # Save uploaded file
        filename = os.path.basename(file.filename)
        save_path = os.path.join(app.config["UPLOAD_FOLDER"], filename)
        file.save(save_path)
        
        image = Image.open(save_path).convert("RGB")
        result = run_prediction(image)
        
        # Save to database
        # Convert original image to base64 for storage
        with open(save_path, "rb") as img_file:
            img_b64 = "data:image/jpeg;base64," + base64.b64encode(img_file.read()).decode('utf-8')
        
        database.save_diagnostic(user_id, result, img_b64)
        database.log_action(user_id, "prediction", f"Diagnostic run for user {user_id}: {result['prediction']['class']}")
        
        return jsonify(result)

    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/predict-base64", methods=["POST"])
def predict_base64():
    """Predict skin disease from base64 encoded image and save to DB."""
    try:
        data = request.get_json()
        if not data or "image" not in data or "user_id" not in data:
            return jsonify({"success": False, "error": "Missing image or user_id"}), 400

        image = decode_image_from_base64(data["image"])
        result = run_prediction(image)
        
        # Save to database
        database.save_diagnostic(data["user_id"], result, data["image"])
        database.log_action(data["user_id"], "prediction_live", f"Live diagnostic run for user {data['user_id']}: {result['prediction']['class']}")

        return jsonify(result)

    except Exception as e:
        logger.error(f"Base64 prediction error: {str(e)}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/admin/reports", methods=["GET"])
def admin_reports():
    """Admin endpoint to fetch all diagnostic reports."""
    try:
        reports = database.get_all_reports()
        return jsonify({"success": True, "reports": reports})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/admin/logs", methods=["GET"])
def admin_logs():
    """Admin endpoint to fetch all system logs."""
    try:
        logs = database.get_all_logs()
        return jsonify({"success": True, "logs": logs})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/classes", methods=["GET"])
def get_classes():
    """Return available disease classes and their descriptions."""
    classes = [
        {
            "name": name,
            "description": model_handler.CLASS_DESCRIPTIONS[name],
            "severity": model_handler.CLASS_SEVERITY[name],
        }
        for name in model_handler.CLASS_NAMES
    ]
    return jsonify({"classes": classes})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
