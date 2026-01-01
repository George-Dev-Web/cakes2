# backend/controllers/order_controller.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from datetime import datetime
import json

from extensions import db
from models.order import Order, OrderItem, OrderItemImage
from models.cart import Cart, CartItem
from models.User import User
from schemas.order_schema import (
    OrderSchema, OrderCreateSchema, OrderUpdateStatusSchema
)
from utils.validators import validate_request
from utils.exceptions import (
    ResourceNotFoundError, ValidationError, DatabaseError, AuthorizationError
)
from utils.email_service import (
    send_order_confirmation_email,
    send_order_status_update_email
)

order_bp = Blueprint('orders', __name__)

order_schema = OrderSchema()
orders_schema = OrderSchema(many=True)

def generate_order_number():
    """Generate unique order number."""
    date_str = datetime.now().strftime('%Y%m%d')
    count = Order.query.filter(
        Order.order_number.like(f'ORD-{date_str}-%')
    ).count()
    return f'ORD-{date_str}-{count + 1:03d}'

# --- CREATE ORDER ---
@order_bp.route('/orders', methods=['POST', 'OPTIONS'])
def create_order():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        # Manually validate for POST
        # If you have a @validate_request decorator, ensure it handles OPTIONS 
        # or call validation manually here.
        data = request.get_json()
        user_id = None
        
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except:
            pass
        
        cart = Cart.query.get(data['cart_id'])
        if not cart or cart.get_item_count() == 0:
            return jsonify({"message": "Cart is empty"}), 400
        
        subtotal = cart.get_total()
        delivery_fee = 500.0
        tax = subtotal * 0.16
        total = subtotal + delivery_fee + tax
        
        order = Order(
            order_number=generate_order_number(),
            user_id=user_id,
            customer_name=data['customer_name'],
            customer_email=data['customer_email'],
            customer_phone=data['customer_phone'],
            delivery_address=data['delivery_address'],
            delivery_date=datetime.fromisoformat(data['delivery_date'].replace('Z', '')),
            delivery_time=data.get('delivery_time'),
            payment_method=data['payment_method'],
            special_instructions=data.get('special_instructions'),
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            tax=tax,
            total_price=total
        )
        
        db.session.add(order)
        db.session.flush()
        
        for cart_item in cart.items:
            order_item = OrderItem(
                order_id=order.id,
                cake_id=cart_item.cake_id,
                quantity=cart_item.quantity,
                cake_shape=cart_item.cake_shape,
                cake_size=cart_item.cake_size,
                cake_layers=cart_item.cake_layers,
                flavor=cart_item.flavor,
                filling=cart_item.filling,
                frosting=cart_item.frosting,
                toppings=cart_item.toppings,
                decorations=cart_item.decorations,
                message_on_cake=cart_item.message_on_cake,
                base_price=cart_item.base_price,
                customization_price=cart_item.customization_price,
                unit_price=cart_item.base_price + cart_item.customization_price,
                subtotal=cart_item.get_subtotal(),
                notes=cart_item.notes
            )
            db.session.add(order_item)
        
        CartItem.query.filter_by(cart_id=cart.id).delete()
        db.session.commit()
        
        try:
            send_order_confirmation_email(order)
        except Exception as e:
            current_app.logger.error(f"Email failed: {e}")
            
        return jsonify(order_schema.dump(order)), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Order Error: {e}")
        return jsonify({"message": str(e)}), 500

# --- GET USER ORDERS (The failing route) ---
@order_bp.route('/orders/my-orders', methods=['GET', 'OPTIONS'])
def get_my_orders():
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        
        user = User.query.get(int(user_id))
        if not user:
            return jsonify({"message": "User not found"}), 404
            
        if user.is_admin:
            orders = Order.query.order_by(Order.created_at.desc()).all()
        else:
            orders = Order.query.filter_by(user_id=user_id).order_by(Order.created_at.desc()).all()
        
        return jsonify(orders_schema.dump(orders)), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 401

# --- GET SINGLE ORDER ---
@order_bp.route('/orders/<int:order_id>', methods=['GET', 'OPTIONS'])
def get_order(order_id):
    if request.method == 'OPTIONS':
        return '', 200
        
    order = Order.query.get(order_id)
    if not order:
        return jsonify({"message": "Order not found"}), 404
    
    return jsonify(order_schema.dump(order)), 200

# --- TRACK ORDER ---
@order_bp.route('/orders/track/<order_number>', methods=['GET', 'OPTIONS'])
def track_order(order_number):
    if request.method == 'OPTIONS':
        return '', 200
        
    order = Order.query.filter_by(order_number=order_number).first()
    if not order:
        return jsonify({"message": "Order not found"}), 404
        
    return jsonify(order_schema.dump(order)), 200

# --- UPDATE STATUS (ADMIN) ---
@order_bp.route('/orders/<int:order_id>/status', methods=['PUT', 'OPTIONS'])
def update_order_status(order_id):
    if request.method == 'OPTIONS':
        return '', 200
        
    try:
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        user = User.query.get(int(user_id))
        
        if not user or not user.is_admin:
            return jsonify({"message": "Admin access required"}), 403
            
        order = Order.query.get(order_id)
        data = request.get_json()
        
        order.status = data.get('status', order.status)
        db.session.commit()
        
        return jsonify(order_schema.dump(order)), 200
    except Exception as e:
        return jsonify({"message": str(e)}), 400