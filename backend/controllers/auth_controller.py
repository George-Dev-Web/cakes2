from flask import Blueprint, request, jsonify, make_response # 👈 ADD make_response
from flask_jwt_extended import (
    create_access_token, 
    jwt_required, 
    get_jwt_identity,
    set_access_cookies,   # 👈 ADD this
    unset_jwt_cookies     # 👈 ADD this
)
from extensions import db
from models.User import User
from marshmallow import Schema, fields, validate, EXCLUDE
import json

auth_bp = Blueprint('auth', __name__)

# Marshmallow schemas (No change needed here)
class UserSchema(Schema):
    class Meta:
        unknown = EXCLUDE
    
    id = fields.Int(dump_only=True)
    name = fields.Str()
    email = fields.Str()
    phone = fields.Str()
    address = fields.Str()
    preferences = fields.Method("get_preferences_dict")
    is_admin = fields.Boolean()
    created_at = fields.DateTime(dump_only=True)
    
    def get_preferences_dict(self, obj):
        if hasattr(obj, 'get_preferences'):
            return obj.get_preferences()
        return {}

user_schema = UserSchema()

class LoginSchema(Schema):
    class Meta:
        unknown = EXCLUDE
    
    email = fields.Str(required=True)
    password = fields.Str(required=True)

login_schema = LoginSchema()

class RegisterSchema(Schema):
    class Meta:
        unknown = EXCLUDE
    
    name = fields.Str(required=True)
    email = fields.Str(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6))
    phone = fields.Str(allow_none=True)
    address = fields.Str(allow_none=True)
    preferences = fields.Dict(allow_none=True)

register_schema = RegisterSchema()

# --- 1. MODIFIED REGISTER ENDPOINT ---
@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        errors = register_schema.validate(data)
        if errors:
            return jsonify({'message': 'Validation error', 'errors': errors}), 400
        
        # Check if user already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'message': 'User already exists'}), 409
        
        # Create new user
        new_user = User(
            name=data['name'],
            email=data['email'],
            phone=data.get('phone'),
            address=data.get('address')
        )
        new_user.set_password(data['password'])
        
        # Set preferences if provided
        if 'preferences' in data:
            new_user.set_preferences(data['preferences'])
        
        db.session.add(new_user)
        db.session.commit()
        
        # 1. Generate access token with string identity (Using user ID)
        access_token = create_access_token(identity=str(new_user.id))
        
        # 2. Create the JSON response body
        response_body = {
            'message': 'Registration successful',
            'user': user_schema.dump(new_user) # Frontend needs this data
        }
        
        # 3. Create a Flask response object from the JSON body (Status 201 Created)
        response = make_response(jsonify(response_body), 201)
        
        # 4. CRITICAL STEP: Set the access token as an HTTP-only cookie
        set_access_cookies(response, access_token)
        
        return response # Return the response with the cookie attached
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in register: {str(e)}")
        return jsonify({'message': 'Internal server error'}), 500

# --- 2. MODIFIED LOGIN ENDPOINT ---
@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        errors = login_schema.validate(data)
        if errors:
            return jsonify({'message': 'Validation error', 'errors': errors}), 400
        
        # Find user by email
        user = User.query.filter_by(email=data['email']).first()
        if not user or not user.check_password(data['password']):
            return jsonify({'message': 'Invalid credentials'}), 401
        
        # 1. Generate access token with string identity (Using user ID)
        access_token = create_access_token(identity=str(user.id))
        
        # 2. Create the JSON response body
        response_body = {
            'message': 'Login successful',
            'user': user_schema.dump(user) # Frontend needs this data
        }
        
        # 3. Create a Flask response object from the JSON body (Status 200 OK)
        response = make_response(jsonify(response_body), 200)
        
        # 4. CRITICAL STEP: Set the access token as an HTTP-only cookie
        set_access_cookies(response, access_token)
        
        return response # Return the response with the cookie attached
        
    except Exception as e:
        print(f"Error in login: {str(e)}")
        return jsonify({'message': 'Internal server error'}), 500

# --- 3. NEW LOGOUT ENDPOINT ---
@auth_bp.route('/logout', methods=['POST'])
# @jwt_required(optional=True) # Optional is safe for logout
def logout():
    # 1. Create a response object
    response = make_response(jsonify({'message': 'Logout successful'}), 200)
    
    # 2. CRITICAL STEP: Instruct the browser to delete the cookie
    unset_jwt_cookies(response)
    
    return response

# --- 4. Protected Endpoints (No Change Needed, they now read the cookie automatically) ---
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    try:
        user_id = get_jwt_identity()
        # Convert back to integer for database query
        user = User.query.get(int(user_id))
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        return jsonify(user_schema.dump(user))
        
    except Exception as e:
        print(f"Error in get_current_user: {str(e)}")
        return jsonify({'message': 'Internal server error'}), 500

@auth_bp.route('/profile', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_profile():
    if request.method == 'OPTIONS':
        return jsonify({'status': 'ok'}), 200
    
    try:
        user_id = get_jwt_identity()
        # Convert back to integer for database query
        user = User.query.get(int(user_id))
        if not user:
            return jsonify({'message': 'User not found'}), 404
        
        data = request.get_json()
        
        if 'name' in data:
            user.name = data['name']
        if 'phone' in data:
            user.phone = data['phone']
        if 'address' in data:
            user.address = data['address']
        if 'preferences' in data:
            user.set_preferences(data['preferences'])
        
        db.session.commit()
        
        return jsonify(user_schema.dump(user))
        
    except Exception as e:
        db.session.rollback()
        print(f"Error in update_profile: {str(e)}")
        return jsonify({'message': 'Internal server error'}), 500