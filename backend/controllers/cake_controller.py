# backend/controllers/cake_controller.py
from flask import Blueprint, jsonify, request, current_app
from extensions import db
from models.cake import Cake
from schemas.cake_schema import CakeSchema, CakeCreateSchema, CakeUpdateSchema
from utils.exceptions import ResourceNotFoundError, ValidationError, DatabaseError
from utils.validators import validate_request, validate_pagination_params

cake_bp = Blueprint('cakes', __name__)

# Initialize schemas
cake_schema = CakeSchema()
cakes_schema = CakeSchema(many=True)


@cake_bp.route('/cakes', methods=['GET'])
def get_cakes():
    """Get all cakes with optional pagination."""
    try:
        # Check if pagination is requested
        if 'page' in request.args or 'per_page' in request.args:
            page, per_page = validate_pagination_params()
            
            cakes_paginated = Cake.query.paginate(
                page=page,
                per_page=per_page,
                error_out=False
            )
            
            current_app.logger.info(
                f"Cakes retrieved with pagination",
                extra={'page': page, 'per_page': per_page, 'total': cakes_paginated.total}
            )
            
            return jsonify({
                'cakes': cakes_schema.dump(cakes_paginated.items),
                'pagination': {
                    'page': page,
                    'per_page': per_page,
                    'total': cakes_paginated.total,
                    'pages': cakes_paginated.pages
                }
            }), 200
        else:
            # Return all cakes without pagination
            cakes = Cake.query.all()
            current_app.logger.info(f"Retrieved {len(cakes)} cakes")
            return jsonify(cakes_schema.dump(cakes)), 200
            
    except Exception as e:
        current_app.logger.error(f"Error retrieving cakes: {e}", exc_info=True)
        raise DatabaseError("Failed to retrieve cakes")


@cake_bp.route('/cakes/<int:id>', methods=['GET'])
def get_cake(id):
    """Get a specific cake by ID."""
    cake = Cake.query.get(id)
    
    if not cake:
        current_app.logger.warning(f"Cake not found: {id}")
        raise ResourceNotFoundError(f"Cake with id {id} not found")
    
    current_app.logger.info(f"Cake retrieved: {id}")
    return jsonify(cake_schema.dump(cake)), 200


@cake_bp.route('/cakes', methods=['POST'])
@validate_request(CakeCreateSchema)
def create_cake():
    """Create a new cake (temporary - should be admin-only later)."""
    try:
        data = request.validated_data
        
        new_cake = Cake(
            name=data['name'],
            description=data['description'],
            price=data['price'],
            image_url=data.get('image_url')
        )
        
        db.session.add(new_cake)
        db.session.commit()
        
        current_app.logger.info(
            f"Cake created: {new_cake.id}",
            extra={'cake_id': new_cake.id, 'name': new_cake.name}
        )
        
        return jsonify(cake_schema.dump(new_cake)), 201
        
    except Exception as e:
        current_app.logger.error(f"Error creating cake: {e}", exc_info=True)
        db.session.rollback()
        raise DatabaseError("Failed to create cake")


@cake_bp.route('/cakes/<int:id>', methods=['PUT'])
@validate_request(CakeUpdateSchema)
def update_cake(id):
    """Update an existing cake."""
    try:
        cake = Cake.query.get(id)
        
        if not cake:
            raise ResourceNotFoundError(f"Cake with id {id} not found")
        
        data = request.validated_data
        
        # Update only provided fields
        for key, value in data.items():
            if hasattr(cake, key):
                setattr(cake, key, value)
        
        db.session.commit()
        
        current_app.logger.info(
            f"Cake updated: {id}",
            extra={'cake_id': id}
        )
        
        return jsonify(cake_schema.dump(cake)), 200
        
    except ResourceNotFoundError:
        raise
    except Exception as e:
        current_app.logger.error(f"Error updating cake: {e}", exc_info=True)
        db.session.rollback()
        raise DatabaseError("Failed to update cake")


@cake_bp.route('/cakes/<int:id>', methods=['DELETE'])
def delete_cake(id):
    """Delete a cake."""
    try:
        cake = Cake.query.get(id)
        
        if not cake:
            raise ResourceNotFoundError(f"Cake with id {id} not found")
        
        db.session.delete(cake)
        db.session.commit()
        
        current_app.logger.info(
            f"Cake deleted: {id}",
            extra={'cake_id': id}
        )
        
        return '', 204
        
    except ResourceNotFoundError:
        raise
    except Exception as e:
        current_app.logger.error(f"Error deleting cake: {e}", exc_info=True)
        db.session.rollback()
        raise DatabaseError("Failed to delete cake")
