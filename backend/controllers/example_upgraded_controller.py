# backend/controllers/example_upgraded_controller.py
"""
Example controller showing how to use all the new high-priority upgrade features.

This is a reference implementation - copy patterns from here to update your existing controllers.
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.cake import Cake
from models.User import User
from schemas.cake_schema import CakeSchema, CakeCreateSchema
from utils.validators import validate_request, validate_pagination_params
from utils.exceptions import (
    ValidationError,
    AuthenticationError,
    AuthorizationError,
    ResourceNotFoundError,
    DatabaseError
)

# Create blueprint
example_bp = Blueprint('example', __name__)

# Initialize schemas
cake_schema = CakeSchema()
cakes_schema = CakeSchema(many=True)


# ============================================================================
# PUBLIC ENDPOINTS (No authentication required)
# ============================================================================

@example_bp.route('/cakes', methods=['GET'])
def get_all_cakes():
    """
    Get all cakes with pagination.
    
    Query Parameters:
        - page (int): Page number (default: 1)
        - per_page (int): Items per page (default: 20, max: 100)
    
    Returns:
        JSON: List of cakes with pagination info
    
    Example:
        GET /api/cakes?page=1&per_page=10
    """
    try:
        # Validate pagination parameters
        page, per_page = validate_pagination_params()
        
        # Query with pagination
        cakes = Cake.query.filter_by(available=True).paginate(
            page=page,
            per_page=per_page,
            error_out=False
        )
        
        # Log the request
        current_app.logger.info(
            "Cakes retrieved",
            extra={
                'page': page,
                'per_page': per_page,
                'total': cakes.total
            }
        )
        
        return jsonify({
            'cakes': cakes_schema.dump(cakes.items),
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': cakes.total,
                'pages': cakes.pages,
                'has_next': cakes.has_next,
                'has_prev': cakes.has_prev
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error retrieving cakes: {e}", exc_info=True)
        raise DatabaseError("Failed to retrieve cakes")


@example_bp.route('/cakes/<int:cake_id>', methods=['GET'])
def get_cake(cake_id):
    """
    Get a specific cake by ID.
    
    Args:
        cake_id (int): Cake ID
    
    Returns:
        JSON: Cake details
    
    Raises:
        ResourceNotFoundError: If cake doesn't exist
    
    Example:
        GET /api/cakes/1
    """
    cake = Cake.query.get(cake_id)
    
    if not cake:
        current_app.logger.warning(f"Cake not found: {cake_id}")
        raise ResourceNotFoundError(f"Cake with id {cake_id} not found")
    
    current_app.logger.info(f"Cake retrieved: {cake_id}")
    return jsonify(cake_schema.dump(cake)), 200


# ============================================================================
# AUTHENTICATED ENDPOINTS (Require login)
# ============================================================================

@example_bp.route('/cakes/favorites', methods=['POST'])
@jwt_required()
def add_to_favorites():
    """
    Add a cake to user's favorites.
    
    Requires:
        - Authentication (JWT cookie)
    
    Request Body:
        {"cake_id": 1}
    
    Returns:
        JSON: Success message
    
    Example:
        POST /api/cakes/favorites
        Cookie: access_token_cookie=...
        Body: {"cake_id": 1}
    """
    try:
        # Get authenticated user
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            raise AuthenticationError("User not found")
        
        # Get cake_id from request
        data = request.get_json()
        cake_id = data.get('cake_id')
        
        if not cake_id:
            raise ValidationError("cake_id is required")
        
        # Check if cake exists
        cake = Cake.query.get(cake_id)
        if not cake:
            raise ResourceNotFoundError(f"Cake with id {cake_id} not found")
        
        # Add to favorites (implement your logic here)
        # user.favorites.append(cake)
        # db.session.commit()
        
        current_app.logger.info(
            "Cake added to favorites",
            extra={'user_id': user_id, 'cake_id': cake_id}
        )
        
        return jsonify({
            'message': 'Cake added to favorites',
            'cake': cake_schema.dump(cake)
        }), 200
        
    except Exception as e:
        current_app.logger.error(
            f"Error adding to favorites: {e}",
            exc_info=True
        )
        raise


# ============================================================================
# ADMIN-ONLY ENDPOINTS
# ============================================================================

@example_bp.route('/admin/cakes', methods=['POST'])
@jwt_required()
@validate_request(CakeCreateSchema)  # Automatic validation!
def create_cake():
    """
    Create a new cake (Admin only).
    
    Requires:
        - Authentication (JWT cookie)
        - Admin privileges
        - Valid cake data
    
    Request Body:
        {
            "name": "Chocolate Cake",
            "description": "Delicious chocolate cake",
            "base_price": 25.00,
            "category": "chocolate",
            "image_url": "https://example.com/cake.jpg",
            "available": true
        }
    
    Returns:
        JSON: Created cake
    
    Example:
        POST /api/admin/cakes
        Cookie: access_token_cookie=...
        Body: {...}
    """
    try:
        # Get authenticated user
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            raise AuthenticationError("User not found")
        
        # Check admin privileges
        if not user.is_admin:
            current_app.logger.warning(
                f"Unauthorized admin access attempt by user {user_id}"
            )
            raise AuthorizationError("Admin access required")
        
        # Get validated data (already validated by decorator!)
        data = request.validated_data
        
        # Create cake
        cake = Cake(**data)
        db.session.add(cake)
        db.session.commit()
        
        current_app.logger.info(
            "Cake created",
            extra={
                'cake_id': cake.id,
                'admin_id': user_id,
                'cake_name': cake.name
            }
        )
        
        return jsonify({
            'message': 'Cake created successfully',
            'cake': cake_schema.dump(cake)
        }), 201
        
    except (AuthenticationError, AuthorizationError, ValidationError):
        # Re-raise known exceptions
        raise
    except Exception as e:
        current_app.logger.error(
            f"Error creating cake: {e}",
            exc_info=True
        )
        db.session.rollback()
        raise DatabaseError("Failed to create cake")


@example_bp.route('/admin/cakes/<int:cake_id>', methods=['PUT'])
@jwt_required()
@validate_request(CakeCreateSchema)
def update_cake(cake_id):
    """
    Update an existing cake (Admin only).
    
    Args:
        cake_id (int): Cake ID to update
    
    Requires:
        - Authentication
        - Admin privileges
        - Valid cake data
    
    Returns:
        JSON: Updated cake
    """
    try:
        # Check admin
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.is_admin:
            raise AuthorizationError("Admin access required")
        
        # Find cake
        cake = Cake.query.get(cake_id)
        if not cake:
            raise ResourceNotFoundError(f"Cake with id {cake_id} not found")
        
        # Get validated data
        data = request.validated_data
        
        # Update cake
        for key, value in data.items():
            setattr(cake, key, value)
        
        db.session.commit()
        
        current_app.logger.info(
            "Cake updated",
            extra={'cake_id': cake_id, 'admin_id': user_id}
        )
        
        return jsonify({
            'message': 'Cake updated successfully',
            'cake': cake_schema.dump(cake)
        }), 200
        
    except (AuthorizationError, ResourceNotFoundError):
        raise
    except Exception as e:
        current_app.logger.error(f"Error updating cake: {e}", exc_info=True)
        db.session.rollback()
        raise DatabaseError("Failed to update cake")


@example_bp.route('/admin/cakes/<int:cake_id>', methods=['DELETE'])
@jwt_required()
def delete_cake(cake_id):
    """
    Delete a cake (Admin only).
    
    Args:
        cake_id (int): Cake ID to delete
    
    Returns:
        Empty response with 204 status
    """
    try:
        # Check admin
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.is_admin:
            raise AuthorizationError("Admin access required")
        
        # Find cake
        cake = Cake.query.get(cake_id)
        if not cake:
            raise ResourceNotFoundError(f"Cake with id {cake_id} not found")
        
        # Delete cake
        db.session.delete(cake)
        db.session.commit()
        
        current_app.logger.info(
            "Cake deleted",
            extra={'cake_id': cake_id, 'admin_id': user_id}
        )
        
        return '', 204
        
    except (AuthorizationError, ResourceNotFoundError):
        raise
    except Exception as e:
        current_app.logger.error(f"Error deleting cake: {e}", exc_info=True)
        db.session.rollback()
        raise DatabaseError("Failed to delete cake")


# ============================================================================
# ERROR HANDLING EXAMPLES
# ============================================================================

@example_bp.route('/demo/validation-error', methods=['POST'])
def demo_validation_error():
    """Demo endpoint showing validation error."""
    data = request.get_json()
    
    if not data or 'required_field' not in data:
        raise ValidationError(
            "Validation failed",
            payload={'validation_errors': {'required_field': ['This field is required']}}
        )
    
    return jsonify({'message': 'Success'})


@example_bp.route('/demo/not-found', methods=['GET'])
def demo_not_found():
    """Demo endpoint showing 404 error."""
    raise ResourceNotFoundError("This resource doesn't exist")


@example_bp.route('/demo/server-error', methods=['GET'])
def demo_server_error():
    """Demo endpoint showing 500 error."""
    # This will be caught by the global error handler
    raise Exception("Something went wrong!")
