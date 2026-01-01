from extensions import db
from werkzeug.security import generate_password_hash, check_password_hash
import json

class User(db.Model):
    # FIX: Explicitly set autoincrement=True for PostgreSQL compatibility 
    # to ensure the application uses the database's SEQUENCE when inserting.
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20))
    address = db.Column(db.Text)
    preferences = db.Column(db.Text)  # JSON string for storing user preferences
    is_admin = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), 
                          onupdate=db.func.current_timestamp())
    
    # Relationship with orders
    orders = db.relationship('Order', back_populates='user', lazy=True)
    
    def set_password(self, password):   
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def set_preferences(self, preferences_dict):
        if preferences_dict:
            self.preferences = json.dumps(preferences_dict)
        else:
            self.preferences = None
    
    def get_preferences(self):
        if self.preferences:
            try:
                return json.loads(self.preferences)
            except json.JSONDecodeError:
                return {}
        return {}
    
    def __repr__(self):
        return f'<User {self.email}>'