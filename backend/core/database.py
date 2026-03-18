import sqlite3
import os
import json
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

DB_PATH = "skin_disease.db"
ADMINS_FILE = "admins.txt"

def get_admin_usernames():
    """Read authorized admin usernames from admins.txt."""
    if not os.path.exists(ADMINS_FILE):
        return []
    with open(ADMINS_FILE, 'r') as f:
        return [line.strip().lower() for line in f if line.strip()]

def sync_user_role(username):
    """Sync a user's role based on admins.txt."""
    admins = get_admin_usernames()
    new_role = 'admin' if username.lower() in admins else 'patient'
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET role = ? WHERE username = ?", (new_role, username.lower()))
    conn.commit()
    conn.close()
    return new_role

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database with required tables."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Users table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        full_name TEXT
    )
    ''')
    
    # Diagnostics table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS diagnostics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        prediction_class TEXT NOT NULL,
        confidence REAL NOT NULL,
        description TEXT,
        severity TEXT,
        recommendation TEXT,
        image_data TEXT,
        gradcam_data TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )
    ''')
    
    # Audit Logs table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS audit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        action TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        details TEXT
    )
    ''')
    
    # Create dummy patient if not exists for testing, but no hardcoded admin
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        cursor.execute("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)",
                       ('patient', 'patient123', 'patient', 'John Doe'))
        
    conn.commit()
    conn.close()
    logger.info("Database initialized successfully")

def save_diagnostic(user_id, result_data, image_b64):
    """Save a diagnostic result to the database."""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    pred = result_data['prediction']
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    cursor.execute('''
    INSERT INTO diagnostics 
    (user_id, timestamp, prediction_class, confidence, description, severity, recommendation, image_data, gradcam_data)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        user_id,
        timestamp,
        pred['class'],
        pred['confidence'],
        pred['description'],
        pred['severity'],
        pred['recommendation'],
        image_b64,
        result_data.get('gradcam_image')
    ))
    
    conn.commit()
    conn.close()
    return cursor.lastrowid

def log_action(user_id, action, details=None):
    """Log an action to the audit_logs table."""
    conn = get_db_connection()
    cursor = conn.cursor()
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    cursor.execute('''
    INSERT INTO audit_logs (user_id, action, timestamp, details)
    VALUES (?, ?, ?, ?)
    ''', (user_id, action, timestamp, details))
    
    conn.commit()
    conn.close()

def get_all_reports():
    """Fetch all diagnostic reports for admin view."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT d.*, u.username as patient_username, u.full_name as patient_name
        FROM diagnostics d
        JOIN users u ON d.user_id = u.id
        ORDER BY d.timestamp DESC
    ''')
    reports = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return reports

def get_all_logs():
    """Fetch all audit logs for admin view."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT l.*, u.username
        FROM audit_logs l
        LEFT JOIN users u ON l.user_id = u.id
        ORDER BY l.timestamp DESC
    ''')
    logs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return logs

def create_user(username, password, full_name):
    """Create a new user in the database with role synced from admins.txt."""
    admins = get_admin_usernames()
    role = 'admin' if username.lower() in admins else 'patient'
    
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO users (username, password, role, full_name) VALUES (?, ?, ?, ?)",
                       (username.lower(), password, role, full_name))
        conn.commit()
        user_id = cursor.lastrowid
        conn.close()
        return user_id
    except sqlite3.IntegrityError:
        conn.close()
        return None

def check_user_exists(username):
    """Check if a username already exists."""
    conn = get_db_connection()
    user = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()
    return user is not None

if __name__ == "__main__":
    init_db()
