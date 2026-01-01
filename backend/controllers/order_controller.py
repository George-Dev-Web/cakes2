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


@order_bp.route('/orders', methods=['POST'])
@validate_request(OrderCreateSchema)
def create_order():
    """
    Create order from cart.
    Works for both logged-in and guest users.
    """
    try:
        data = request.validated_data
        user_id = None
        
        # Check if user is logged in
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
        except:
            pass
        
        # Get cart
        cart = Cart.query.get(data['cart_id'])
        if not cart or cart.get_item_count() == 0:
            raise ValidationError("Cart is empty")
        
        # Calculate totals
        subtotal = cart.get_total()
        delivery_fee = 500.0  # KSh 500 standard delivery
        tax = subtotal * 0.16  # 16% VAT for Kenya
        total = subtotal + delivery_fee + tax
        
        # Create order
        order = Order(
            order_number=generate_order_number(),
            user_id=user_id,
            customer_name=data['customer_name'],
            customer_email=data['customer_email'],
            customer_phone=data['customer_phone'],
            delivery_address=data['delivery_address'],
            delivery_date=data['delivery_date'],
            delivery_time=data.get('delivery_time'),
            payment_method=data['payment_method'],
            special_instructions=data.get('special_instructions'),
            subtotal=subtotal,
            delivery_fee=delivery_fee,
            tax=tax,
            total_price=total
        )
        
        db.session.add(order)
        db.session.flush()  # Get order.id
        
        # Convert cart items to order items
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
                is_gluten_free=cart_item.is_gluten_free,
                is_vegan=cart_item.is_vegan,
                is_sugar_free=cart_item.is_sugar_free,
                is_dairy_free=cart_item.is_dairy_free,
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
            db.session.flush()
            
            # Copy reference images
            for img in cart_item.reference_images:
                order_img = OrderItemImage(
                    order_item_id=order_item.id,
                    image_url=img.image_url,
                    image_filename=img.image_filename,
                    description=img.description
                )
                db.session.add(order_img)
        
        # Clear cart
        CartItem.query.filter_by(cart_id=cart.id).delete()
        
        db.session.commit()
        
        current_app.logger.info(
            f"Order created: {order.order_number}",
            extra={'order_id': order.id, 'total': order.total_price}
        )
        
        # Send order confirmation email
        try:
            send_order_confirmation_email(order)
            current_app.logger.info(f"Confirmation email sent for order {order.order_number}")
        except Exception as email_error:
            current_app.logger.error(
                f"Failed to send confirmation email: {email_error}",
                exc_info=True
            )
            # Don't fail the order if email fails
        
        return jsonify(order_schema.dump(order)), 201
        
    except ValidationError:
        raise
    except Exception as e:
        current_app.logger.error(f"Error creating order: {e}", exc_info=True)
        db.session.rollback()
        raise DatabaseError("Failed to create order")


@order_bp.route('/orders', methods=['GET'])
@jwt_required(optional=True)
def get_orders():
    """
    Get user's orders (if logged in) or all orders (if admin).
    """
    try:
        user_id = get_jwt_identity()
        
        if not user_id:
            raise ValidationError("Please log in to view orders")
        
        user = User.query.get(user_id)
        
        if user.is_admin:
            # Admin sees all orders
            orders = Order.query.order_by(Order.created_at.desc()).all()
        else:
            # User sees only their orders
            orders = Order.query.filter_by(user_id=user_id).order_by(
                Order.created_at.desc()
            ).all()
        
        return jsonify(orders_schema.dump(orders)), 200
        
    except Exception as e:
        current_app.logger.error(f"Error retrieving orders: {e}", exc_info=True)
        raise DatabaseError("Failed to retrieve orders")


@order_bp.route('/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    """
    Get specific order details.
    """
    try:
        order = Order.query.get(order_id)
        
        if not order:
            raise ResourceNotFoundError("Order not found")
        
        # Check authorization
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            
            if user_id:
                user = User.query.get(user_id)
                if not user.is_admin and order.user_id != user_id:
                    raise AuthorizationError("Unauthorized to view this order")
        except:
            # Guest user - allow viewing (they have order number from email)
            pass
        
        return jsonify(order_schema.dump(order)), 200
        
    except (ResourceNotFoundError, AuthorizationError):
        raise
    except Exception as e:
        current_app.logger.error(f"Error retrieving order: {e}", exc_info=True)
        raise DatabaseError("Failed to retrieve order")


@order_bp.route('/orders/track/<order_number>', methods=['GET'])
def track_order(order_number):
    """
    Track order by order number (for guest users).
    """
    try:
        order = Order.query.filter_by(order_number=order_number).first()
        
        if not order:
            raise ResourceNotFoundError("Order not found")
        
        return jsonify({
            'order_number': order.order_number,
            'status': order.status,
            'customer_name': order.customer_name,
            'delivery_date': order.delivery_date.isoformat() if order.delivery_date else None,
            'total_price': order.total_price,
            'created_at': order.created_at.isoformat() if order.created_at else None
        }), 200
        
    except ResourceNotFoundError:
        raise
    except Exception as e:
        current_app.logger.error(f"Error tracking order: {e}", exc_info=True)
        raise DatabaseError("Failed to track order")


@order_bp.route('/orders/<int:order_id>/status', methods=['PUT'])
@jwt_required()
@validate_request(OrderUpdateStatusSchema)
def update_order_status(order_id):
    """
    Update order status (admin only).
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user or not user.is_admin:
            raise AuthorizationError("Admin access required")
        
        order = Order.query.get(order_id)
        if not order:
            raise ResourceNotFoundError("Order not found")
        
        data = request.validated_data
        old_status = order.status
        order.status = data['status']
        order.admin_notes = data.get('admin_notes', order.admin_notes)
        
        if data['status'] == 'confirmed' and not order.confirmed_at:
            order.confirmed_at = datetime.utcnow()
        elif data['status'] == 'delivered' and not order.completed_at:
            order.completed_at = datetime.utcnow()
        
        db.session.commit()
        
        current_app.logger.info(
            f"Order status updated: {order_id} -> {data['status']}"
        )
        
        # Send status update email to customer
        if old_status != data['status']:
            try:
                send_order_status_update_email(order)
                current_app.logger.info(
                    f"Status update email sent for order {order.order_number}"
                )
            except Exception as email_error:
                current_app.logger.error(
                    f"Failed to send status update email: {email_error}",
                    exc_info=True
                )
                # Don't fail the status update if email fails
        
        return jsonify(order_schema.dump(order)), 200
        
    except (ResourceNotFoundError, AuthorizationError, ValidationError):
        raise
    except Exception as e:
        current_app.logger.error(f"Error updating order status: {e}", exc_info=True)
        db.session.rollback()
        raise DatabaseError("Failed to update order status")
