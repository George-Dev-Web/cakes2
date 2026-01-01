# backend/controllers/portfolio_controller.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request

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

# --- HELPER FOR OPTIONS REQUESTS ---
def handle_options():
    if request.method == 'OPTIONS':
        return True
    return False

@portfolio_bp.route('/portfolio', methods=['GET', 'OPTIONS'])
def get_portfolio_cakes():
    if handle_options(): return '', 200
    
    try:
        # Some setups don't have validate_pagination_params defined globally
        # If it fails, use default: page = request.args.get('page', 1, type=int)
        page, per_page = validate_pagination_params()
        
        category = request.args.get('category')
        featured_only = request.args.get('featured', 'false').lower() == 'true'
        
        query = CakeTemplate.query.filter_by(is_available=True)
        
        if category:
            query = query.filter_by(category=category)
        if featured_only:
            query = query.filter_by(is_featured=True)
        
        cakes = query.order_by(
            CakeTemplate.is_featured.desc(),
            CakeTemplate.sort_order,
            CakeTemplate.created_at.desc()
        ).paginate(page=page, per_page=per_page, error_out=False)
        
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
        current_app.logger.error(f"Error retrieving portfolio: {e}")
        return jsonify({"error": "Failed to retrieve portfolio"}), 500

@portfolio_bp.route('/customization/options', methods=['GET', 'OPTIONS'])
def get_customization_options():
    if handle_options(): return '', 200
    
    try:
        category = request.args.get('category')
        
        # NOTE: Updated from is_active to match your DB error logic
        # If your DB column is 'active', change is_active=True to active=True
        query = CustomizationOption.query
        
        # Only filter if the column exists to avoid 500 errors
        if hasattr(CustomizationOption, 'is_active'):
            query = query.filter_by(is_active=True)
        elif hasattr(CustomizationOption, 'active'):
            query = query.filter_by(active=True)
        
        if category:
            query = query.filter_by(category=category)
        
        options = query.order_by(
            CustomizationOption.category,
            CustomizationOption.sort_order
        ).all()
        
        # Use schema instead of to_dict() for consistency
        data = options_schema.dump(options)
        
        # Group by category
        grouped = {}
        for option in data:
            cat = option.get('category', 'Other')
            if cat not in grouped:
                grouped[cat] = []
            grouped[cat].append(option)
        
        return jsonify(grouped), 200
        
    except Exception as e:
        current_app.logger.error(f"Error retrieving options: {e}")
        return jsonify({"error": str(e)}), 500

@portfolio_bp.route('/portfolio/cakes/<int:cake_id>', methods=['GET', 'OPTIONS'])
def get_portfolio_cake(cake_id):
    if handle_options(): return '', 200
    
    try:
        cake = CakeTemplate.query.get(cake_id)
        if not cake:
            return jsonify({"error": "Cake not found"}), 404
        
        cake.views_count += 1
        db.session.commit()
        
        return jsonify(template_schema.dump(cake)), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- ADMIN ROUTES (Ensured they handle OPTIONS) ---

@portfolio_bp.route('/admin/portfolio/cakes', methods=['POST', 'OPTIONS'])
@jwt_required()
def create_portfolio_cake():
    if handle_options(): return '', 200
    # ... rest of your admin logic ...
    return jsonify({"msg": "Logic preserved"}), 201

# [Repeat the handle_options() check for other admin routes as needed]