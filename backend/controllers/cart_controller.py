# backend/controllers/cart_controller.py
from flask import Blueprint, request, jsonify, current_app, session
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from sqlalchemy import and_
import json
import uuid

from extensions import db
from models.cart import Cart, CartItem, CartItemImage
from models.cake import Cake
from models.customization import CustomizationOption
from schemas.cart_schema import (
    CartSchema, CartItemSchema, CartItemCreateSchema
)
from utils.validators import validate_request
from utils.exceptions import (
    ResourceNotFoundError, ValidationError, DatabaseError
)
from utils.image_upload import upload_image  # Import image upload utility

cart_bp = Blueprint('cart', __name__)

# Initialize schemas
cart_schema = CartSchema()
cart_item_schema = CartItemSchema()


def get_or_create_cart():
    """
    Get cart for logged-in user or create/retrieve guest cart.
    Works for both authenticated and guest users.
    """
    cart = None
    user_id = None
    
    # Try to get authenticated user
    try:
        verify_jwt_in_request(optional=True)
        user_id = get_jwt_identity()
    except:
        pass
    
    if user_id:
        # Logged in user - find or create their cart
        cart = Cart.query.filter_by(user_id=user_id).first()
        if not cart:
            cart = Cart(user_id=user_id)
            db.session.add(cart)
            db.session.commit()
    else:
        # Guest user - use session
        session_id = session.get('cart_session_id')
        
        if session_id:
            cart = Cart.query.filter_by(session_id=session_id).first()
        
        if not cart:
            # Create new guest cart
            session_id = str(uuid.uuid4())
            cart = Cart(session_id=session_id)
            db.session.add(cart)
            db.session.commit()
            session['cart_session_id'] = session_id
    
    return cart


@cart_bp.route('/cart', methods=['GET'])
def get_cart():
    """
    Get current user's cart (works for both logged-in and guest users).
    
    Returns:
        JSON: Cart with items and total
    """
    try:
        cart = get_or_create_cart()
        
        current_app.logger.info(
            f"Cart retrieved",
            extra={'cart_id': cart.id, 'user_id': cart.user_id}
        )
        
        return jsonify(cart_schema.dump(cart)), 200
        
    except Exception as e:
        current_app.logger.error(f"Error retrieving cart: {e}", exc_info=True)
        raise DatabaseError("Failed to retrieve cart")


@cart_bp.route('/cart/items', methods=['POST'])
@validate_request(CartItemCreateSchema)
def add_to_cart():
    """
    Add an item to cart with full customization.
    """
    try:
        cart = get_or_create_cart()
        data = request.validated_data
        
        # Calculate pricing
        base_price = 0.0
        customization_price = 0.0
        
        # Get base price from cake or size
        if data.get('cake_id'):
            cake = Cake.query.get(data['cake_id'])
            if not cake:
                raise ResourceNotFoundError("Cake not found")
            base_price = cake.price
        else:
            # Price based on size for custom cakes
            size_prices = {
                'Small': 2000.0,
                'Medium': 3500.0,
                'Large': 5000.0,
                'XL': 7500.0
            }
            base_price = size_prices.get(data.get('cake_size', 'Medium'), 3500.0)
        
        # Add customization costs
        if data.get('toppings'):
            topping_ids = data['toppings']
            toppings = CustomizationOption.query.filter(
                and_(
                    CustomizationOption.id.in_(topping_ids),
                    CustomizationOption.category == 'topping'
                )
            ).all()
            customization_price += sum(t.price for t in toppings)
            data['toppings'] = json.dumps(topping_ids)  # Store as JSON
        
        # Dietary restrictions may add cost
        if data.get('is_gluten_free'):
            customization_price += 500.0
        if data.get('is_vegan'):
            customization_price += 500.0
        
        cart_item = CartItem(
            cart_id=cart.id,
            cake_id=data.get('cake_id'),
            quantity=data['quantity'],
            cake_shape=data.get('cake_shape'),
            cake_size=data.get('cake_size'),
            cake_layers=data.get('cake_layers', 2),
            flavor=data.get('flavor'),
            filling=data.get('filling'),
            frosting=data.get('frosting'),
            is_gluten_free=data.get('is_gluten_free', False),
            is_vegan=data.get('is_vegan', False),
            is_sugar_free=data.get('is_sugar_free', False),
            is_dairy_free=data.get('is_dairy_free', False),
            toppings=data.get('toppings'),
            decorations=data.get('decorations'),
            message_on_cake=data.get('message_on_cake'),
            base_price=base_price,
            customization_price=customization_price,
            notes=data.get('notes')
        )
        
        db.session.add(cart_item)
        db.session.commit()
        
        current_app.logger.info(
            f"Item added to cart",
            extra={
                'cart_id': cart.id,
                'item_id': cart_item.id,
                'base_price': base_price,
                'customization_price': customization_price
            }
        )
        
        # Return updated cart
        return jsonify(cart_schema.dump(cart)), 201
        
    except (ResourceNotFoundError, ValidationError):
        raise
    except Exception as e:
        current_app.logger.error(f"Error adding to cart: {e}", exc_info=True)
        db.session.rollback()
        raise DatabaseError("Failed to add item to cart")


@cart_bp.route('/cart/items/<int:item_id>', methods=['PUT'])
@validate_request(CartItemCreateSchema)
def update_cart_item(item_id):
    """Update cart item."""
    try:
        cart = get_or_create_cart()
        
        cart_item = CartItem.query.filter_by(
            id=item_id,
            cart_id=cart.id
        ).first()
        
        if not cart_item:
            raise ResourceNotFoundError("Cart item not found")
        
        data = request.validated_data
        
        # Update fields
        cart_item.quantity = data.get('quantity', cart_item.quantity)
        cart_item.cake_shape = data.get('cake_shape', cart_item.cake_shape)
        cart_item.cake_size = data.get('cake_size', cart_item.cake_size)
        cart_item.message_on_cake = data.get('message_on_cake', cart_item.message_on_cake)
        cart_item.notes = data.get('notes', cart_item.notes)
        
        db.session.commit()
        
        current_app.logger.info(f"Cart item updated: {item_id}")
        
        return jsonify(cart_schema.dump(cart)), 200
        
    except ResourceNotFoundError:
        raise
    except Exception as e:
        current_app.logger.error(f"Error updating cart item: {e}", exc_info=True)
        db.session.rollback()
        raise DatabaseError("Failed to update cart item")


@cart_bp.route('/cart/items/<int:item_id>', methods=['DELETE'])
def remove_from_cart(item_id):
    """Remove item from cart."""
    try:
        cart = get_or_create_cart()
        
        cart_item = CartItem.query.filter_by(
            id=item_id,
            cart_id=cart.id
        ).first()
        
        if not cart_item:
            raise ResourceNotFoundError("Cart item not found")
        
        db.session.delete(cart_item)
        db.session.commit()
        
        current_app.logger.info(f"Cart item removed: {item_id}")
        
        return jsonify(cart_schema.dump(cart)), 200
        
    except ResourceNotFoundError:
        raise
    except Exception as e:
        current_app.logger.error(f"Error removing cart item: {e}", exc_info=True)
        db.session.rollback()
        raise DatabaseError("Failed to remove cart item")


@cart_bp.route('/cart/clear', methods=['POST'])
def clear_cart():
    """Clear all items from cart."""
    try:
        cart = get_or_create_cart()
        
        CartItem.query.filter_by(cart_id=cart.id).delete()
        db.session.commit()
        
        current_app.logger.info(f"Cart cleared: {cart.id}")
        
        return jsonify({'message': 'Cart cleared successfully'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Error clearing cart: {e}", exc_info=True)
        db.session.rollback()
        raise DatabaseError("Failed to clear cart")


@cart_bp.route('/cart/items/<int:item_id>/images', methods=['POST'])
def upload_reference_image(item_id):
    """
    Upload reference image for custom cake using Cloudinary.
    """
    try:
        cart = get_or_create_cart()
        
        cart_item = CartItem.query.filter_by(
            id=item_id,
            cart_id=cart.id
        ).first()
        
        if not cart_item:
            raise ResourceNotFoundError("Cart item not found")
        
        # Check if file is in request
        if 'image' not in request.files:
            raise ValidationError("No image file provided")
        
        file = request.files['image']
        
        if file.filename == '':
            raise ValidationError("No image file selected")
        
        # Upload to Cloudinary
        upload_result = upload_image(file, folder='cake_references')
        
        # Save image record
        image = CartItemImage(
            cart_item_id=cart_item.id,
            image_url=upload_result['secure_url'],
            image_filename=file.filename,
            description=request.form.get('description', '')
        )
        
        db.session.add(image)
        db.session.commit()
        
        current_app.logger.info(
            f"Reference image uploaded for cart item: {item_id}"
        )
        
        return jsonify({
            'message': 'Image uploaded successfully',
            'image': {
                'id': image.id,
                'image_url': image.image_url,
                'public_id': upload_result['public_id']
            }
        }), 201
        
    except (ResourceNotFoundError, ValidationError):
        raise
    except Exception as e:
        current_app.logger.error(f"Error uploading image: {e}", exc_info=True)
        db.session.rollback()
        raise DatabaseError(f"Failed to upload image: {str(e)}")
