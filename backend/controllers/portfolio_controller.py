# backend/controllers/portfolio_controller.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from extensions import db
from models.customization import CakeTemplate, CakeTemplateImage, CustomizationOption
from models.User import User
from schemas.customization_schema import (
    CakeTemplateSchema, CakeTemplateCreateSchema,
    CustomizationOptionSchema, CustomizationOptionCreateSchema
)
from utils.validators import validate_request, validate_pagination_params
from utils.exceptions import (
    ResourceNotFoundError, ValidationError, AuthorizationError, DatabaseError
)

portfolio_bp = Blueprint('portfolio', __name__)

template_schema = CakeTemplateSchema()
templates_schema = CakeTemplateSchema(many=True)
option_schema = CustomizationOptionSchema()
options_schema = CustomizationOptionSchema(many=True)


@portfolio_bp.route('/portfolio/cakes', methods=['GET'])
def get_portfolio_cakes():
    """
    Get all cake templates for portfolio page.
    Supports filtering and pagination.
    """
    try:
        page, per_page = validate_pagination_params()
        
        # Get query parameters
        category = request.args.get('category')
        featured_only = request.args.get('featured', 'false').lower() == 'true'
        
        # Build query
        query = CakeTemplate.query.filter_by(is_available=True)
        
        if category:
            query = query.filter_by(category=category)
        
        if featured_only:
            query = query.filter_by(is_featured=True)
        
        # Paginate
        cakes = query.order_by(
            CakeTemplate.is_featured.desc(),
            CakeTemplate.sort_order,
            CakeTemplate.created_at.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
        current_app.logger.info(f"Portfolio cakes retrieved: {cakes.total} total")
        
        return jsonify({
            'cakes': templates_schema.dump(cakes.items),
            'pagination': {
                'page': page,
                'per_page': per_page,
                'total': cakes.total,
                'pages': cakes.pages
            }
        }), 200
        
    except Exception as e:
        current_app.logger.error(f"Error retrieving portfolio: {e}", exc_info=True)
        raise DatabaseError("Failed to retrieve portfolio cakes")


@portfolio_bp.route('/portfolio/cakes/<int:cake_id>', methods=['GET'])
def get_portfolio_cake(cake_id):
    """
    Get specific cake template with all details.
    """
    try:
        cake = CakeTemplate.query.get(cake_id)
        
        if not cake:
            raise ResourceNotFoundError("Cake not found")
        
        # Increment view count
        cake.views_count += 1
        db.session.commit()
        
        return jsonify(template_schema.dump(cake)), 200
        
    except ResourceNotFoundError:
        raise
    except Exception as e:
        current_app.logger.error(f"Error retrieving cake: {e}", exc_info=True)
        raise DatabaseError("Failed to retrieve cake")


@portfolio_bp.route('/customization/options', methods=['GET'])
def get_customization_options():
    """
    Get all available customization options grouped by category.
    """
    try:
        category = request.args.get('category')
        
        query = CustomizationOption.query.filter_by(is_active=True)
        
        if category:
            query = query.filter_by(category=category)
        
        options = query.order_by(
            CustomizationOption.category,
            CustomizationOption.sort_order
        ).all()
        
        # Group by category
        grouped = {}
        for option in options:
            if option.category not in grouped:
                grouped[option.category] = []
            grouped[option.category].append(option.to_dict())
        
        return jsonify(grouped), 200
        
    except Exception as e:
        current_app.logger.error(f"Error retrieving options: {e}", exc_info=True)
        raise DatabaseError("Failed to retrieve customization options")


# Admin routes
@portfolio_bp.route('/admin/portfolio/cakes', methods=['POST'])
@jwt_required()
@validate_request(CakeTemplateCreateSchema)
def create_portfolio_cake():
    """
    Create new cake template (admin only).
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.is_admin:
            raise AuthorizationError("Admin access required")
        
        data = request.validated_data
        
        cake = CakeTemplate(**data)
        db.session.add(cake)
        db.session.commit()
        
        current_app.logger.info(f"Portfolio cake created: {cake.id}")
        
        return jsonify(template_schema.dump(cake)), 201
        
    except (AuthorizationError, ValidationError):
        raise
    except Exception as e:
        current_app.logger.error(f"Error creating cake: {e}", exc_info=True)
        db.session.rollback()
        raise DatabaseError("Failed to create cake")


@portfolio_bp.route('/admin/portfolio/cakes/<int:cake_id>', methods=['PUT'])
@jwt_required()
@validate_request(CakeTemplateCreateSchema)
def update_portfolio_cake(cake_id):
    """
    Update cake template (admin only).
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.is_admin:
            raise AuthorizationError("Admin access required")
        
        cake = CakeTemplate.query.get(cake_id)
        if not cake:
            raise ResourceNotFoundError("Cake template not found")
        
        data = request.validated_data
        
        for key, value in data.items():
            setattr(cake, key, value)
        
        db.session.commit()
        
        current_app.logger.info(f"Portfolio cake updated: {cake_id}")
        
        return jsonify(template_schema.dump(cake)), 200
        
    except (AuthorizationError, ResourceNotFoundError, ValidationError):
        raise
    except Exception as e:
        current_app.logger.error(f"Error updating cake: {e}", exc_info=True)
        db.session.rollback()
        raise DatabaseError("Failed to update cake")


@portfolio_bp.route('/admin/portfolio/cakes/<int:cake_id>', methods=['DELETE'])
@jwt_required()
def delete_portfolio_cake(cake_id):
    """
    Delete cake template (admin only).
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.is_admin:
            raise AuthorizationError("Admin access required")
        
        cake = CakeTemplate.query.get(cake_id)
        if not cake:
            raise ResourceNotFoundError("Cake template not found")
        
        db.session.delete(cake)
        db.session.commit()
        
        current_app.logger.info(f"Portfolio cake deleted: {cake_id}")
        
        return '', 204
        
    except (AuthorizationError, ResourceNotFoundError):
        raise
    except Exception as e:
        current_app.logger.error(f"Error deleting cake: {e}", exc_info=True)
        db.session.rollback()
        raise DatabaseError("Failed to delete cake")


@portfolio_bp.route('/admin/customization/options', methods=['GET'])
@jwt_required()
def get_all_customization_options():
    """
    Get all customization options including inactive (admin only).
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.is_admin:
            raise AuthorizationError("Admin access required")
        
        options = CustomizationOption.query.order_by(
            CustomizationOption.category,
            CustomizationOption.sort_order
        ).all()
        
        # Group by category
        grouped = {}
        for option in options:
            if option.category not in grouped:
                grouped[option.category] = []
            grouped[option.category].append(option.to_dict())
        
        return jsonify(grouped), 200
        
    except AuthorizationError:
        raise
    except Exception as e:
        current_app.logger.error(f"Error retrieving options: {e}", exc_info=True)
        raise DatabaseError("Failed to retrieve customization options")


@portfolio_bp.route('/admin/customization/options', methods=['POST'])
@jwt_required()
@validate_request(CustomizationOptionCreateSchema)
def create_customization_option():
    """
    Create new customization option (admin only).
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.is_admin:
            raise AuthorizationError("Admin access required")
        
        data = request.validated_data
        
        option = CustomizationOption(**data)
        db.session.add(option)
        db.session.commit()
        
        current_app.logger.info(f"Customization option created: {option.id}")
        
        return jsonify(option_schema.dump(option)), 201
        
    except (AuthorizationError, ValidationError):
        raise
    except Exception as e:
        current_app.logger.error(f"Error creating option: {e}", exc_info=True)
        db.session.rollback()
        raise DatabaseError("Failed to create customization option")


@portfolio_bp.route('/admin/customization/options/<int:option_id>', methods=['PUT'])
@jwt_required()
@validate_request(CustomizationOptionCreateSchema)
def update_customization_option(option_id):
    """
    Update customization option (admin only).
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.is_admin:
            raise AuthorizationError("Admin access required")
        
        option = CustomizationOption.query.get(option_id)
        if not option:
            raise ResourceNotFoundError("Customization option not found")
        
        data = request.validated_data
        
        for key, value in data.items():
            setattr(option, key, value)
        
        db.session.commit()
        
        current_app.logger.info(f"Customization option updated: {option_id}")
        
        return jsonify(option_schema.dump(option)), 200
        
    except (AuthorizationError, ResourceNotFoundError, ValidationError):
        raise
    except Exception as e:
        current_app.logger.error(f"Error updating option: {e}", exc_info=True)
        db.session.rollback()
        raise DatabaseError("Failed to update customization option")


@portfolio_bp.route('/admin/customization/options/<int:option_id>', methods=['DELETE'])
@jwt_required()
def delete_customization_option(option_id):
    """
    Delete customization option (admin only).
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.is_admin:
            raise AuthorizationError("Admin access required")
        
        option = CustomizationOption.query.get(option_id)
        if not option:
            raise ResourceNotFoundError("Customization option not found")
        
        db.session.delete(option)
        db.session.commit()
        
        current_app.logger.info(f"Customization option deleted: {option_id}")
        
        return '', 204
        
    except (AuthorizationError, ResourceNotFoundError):
        raise
    except Exception as e:
        current_app.logger.error(f"Error deleting option: {e}", exc_info=True)
        db.session.rollback()
        raise DatabaseError("Failed to delete customization option")
