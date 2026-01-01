# 🛒 E-Commerce Features Implementation Guide

This guide covers implementing the full e-commerce features for your cake ordering system.

## ✅ What's Already Implemented

### Database Models
- ✅ `Cart` and `CartItem` - Shopping cart with customization
- ✅ `CartItemImage` - Reference image uploads
- ✅ `Order` and `OrderItem` - Complete order management
- ✅ `OrderItemImage` - Order reference images
- ✅ `CustomizationOption` - Admin-managed options
- ✅ `CakeTemplate` - Portfolio pre-made cakes
- ✅ `CakeTemplateImage` - Cake galleries

### Validation Schemas
- ✅ Cart schemas with full validation
- ✅ Order creation and status schemas
- ✅ Customization option schemas
- ✅ Cake template schemas

### Controllers
- ✅ Cart controller (full CRUD with guest support)

## 📋 Implementation Steps

### Step 1: Run Database Migrations

```bash
cd backend

# Create migration
flask db migrate -m "Add e-commerce models"

# Review the migration file in migrations/versions/
# Then apply it
flask db upgrade
```

### Step 2: Update app.py to Register New Blueprints

Add to `backend/app.py`:

```python
def register_blueprints(app):
    """Register all application blueprints."""
    from controllers.cake_controller import cake_bp
    from controllers.order_controller import order_bp
    from controllers.auth_controller import auth_bp
    from controllers.contact_controller import contact_bp
    from controllers.admin_controller import admin_bp
    from controllers.customization_controller import customization_bp
    from controllers.cart_controller import cart_bp  # NEW
    from controllers.portfolio_controller import portfolio_bp  # NEW
    
    app.register_blueprint(cake_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(order_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(contact_bp, url_prefix='/api')
    app.register_blueprint(customization_bp, url_prefix='/api')
    app.register_blueprint(cart_bp, url_prefix='/api')  # NEW
    app.register_blueprint(portfolio_bp, url_prefix='/api')  # NEW
```

### Step 3: Create Order Controller

Create `backend/controllers/order_controller.py`:

```python
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
    ResourceNotFoundError, ValidationError, DatabaseError
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
            subtotal=cart.get_total(),
            delivery_fee=5.0,  # Fixed or calculate based on location
            tax=cart.get_total() * 0.16,  # 16% VAT
            total_price=cart.get_total() + 5.0 + (cart.get_total() * 0.16)
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
        
        # TODO: Send email confirmation
        
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
                    raise ValidationError("Unauthorized to view this order")
        except:
            # Guest user can view by order number in email
            pass
        
        return jsonify(order_schema.dump(order)), 200
        
    except (ResourceNotFoundError, ValidationError):
        raise
    except Exception as e:
        current_app.logger.error(f"Error retrieving order: {e}", exc_info=True)
        raise DatabaseError("Failed to retrieve order")


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
            raise ValidationError("Admin access required")
        
        order = Order.query.get(order_id)
        if not order:
            raise ResourceNotFoundError("Order not found")
        
        data = request.validated_data
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
        
        # TODO: Send status update email to customer
        
        return jsonify(order_schema.dump(order)), 200
        
    except (ResourceNotFoundError, ValidationError):
        raise
    except Exception as e:
        current_app.logger.error(f"Error updating order status: {e}", exc_info=True)
        db.session.rollback()
        raise DatabaseError("Failed to update order status")
```

### Step 4: Create Portfolio Controller

Create `backend/controllers/portfolio_controller.py`:

```python
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
```

## 🎨 Frontend Implementation

Now update your frontend pages. The implementation guide continues in `FRONTEND_GUIDE.md`...

---

**Next Steps:**
1. Run migrations
2. Register blueprints
3. Test cart API endpoints
4. Implement frontend pages
5. Add file upload for images
