# backend/models/order.py
from extensions import db
from datetime import datetime

class Order(db.Model):
    """Customer orders with full customization support."""
    __tablename__ = 'order'
    
    id = db.Column(db.Integer, primary_key=True)
    order_number = db.Column(db.String(50), unique=True, nullable=False)  # e.g., ORD-20260101-001
    
    # User information (nullable for guest orders)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    
    # Customer details (required for all orders)
    customer_name = db.Column(db.String(100), nullable=False)
    customer_email = db.Column(db.String(100), nullable=False)
    customer_phone = db.Column(db.String(20), nullable=False)
    
    # Delivery information
    delivery_address = db.Column(db.Text, nullable=False)
    delivery_date = db.Column(db.DateTime, nullable=False)
    delivery_time = db.Column(db.String(50))  # e.g., "Morning", "Afternoon", "Evening"
    
    # Order details
    subtotal = db.Column(db.Float, nullable=False)
    delivery_fee = db.Column(db.Float, default=0.0)
    tax = db.Column(db.Float, default=0.0)
    discount = db.Column(db.Float, default=0.0)
    total_price = db.Column(db.Float, nullable=False)
    
    # Payment information
    payment_method = db.Column(db.String(50))  # COD, Card, M-Pesa, etc.
    payment_status = db.Column(db.String(20), default='pending')  # pending, paid, failed
    payment_reference = db.Column(db.String(100))  # Transaction ID
    
    # Order status
    status = db.Column(db.String(20), default='pending')  # pending, confirmed, preparing, ready, delivered, cancelled
    
    # Special instructions
    special_instructions = db.Column(db.Text)
    admin_notes = db.Column(db.Text)  # Internal notes for staff
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    confirmed_at = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    
    # Relationships
    user = db.relationship('User', backref='orders')
    items = db.relationship('OrderItem', back_populates='order', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Order {self.order_number} - {self.customer_name}>'


class OrderItem(db.Model):
    """Individual items within an order."""
    __tablename__ = 'order_item'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('order.id'), nullable=False)
    cake_id = db.Column(db.Integer, db.ForeignKey('cake.id'), nullable=True)  # Null for custom cakes
    quantity = db.Column(db.Integer, nullable=False, default=1)
    
    # Customization details
    cake_shape = db.Column(db.String(50))
    cake_size = db.Column(db.String(50))
    cake_layers = db.Column(db.Integer, default=2)
    flavor = db.Column(db.String(100))
    filling = db.Column(db.String(100))
    frosting = db.Column(db.String(100))
    
    # Dietary restrictions
    is_gluten_free = db.Column(db.Boolean, default=False)
    is_vegan = db.Column(db.Boolean, default=False)
    is_sugar_free = db.Column(db.Boolean, default=False)
    is_dairy_free = db.Column(db.Boolean, default=False)
    
    # Toppings and decorations
    toppings = db.Column(db.Text)  # JSON
    decorations = db.Column(db.Text)
    message_on_cake = db.Column(db.String(200))
    
    # Pricing
    base_price = db.Column(db.Float, nullable=False)
    customization_price = db.Column(db.Float, default=0.0)
    unit_price = db.Column(db.Float, nullable=False)  # base + customization
    subtotal = db.Column(db.Float, nullable=False)  # unit_price * quantity
    
    # Special instructions for this item
    notes = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    order = db.relationship('Order', back_populates='items')
    cake = db.relationship('Cake', backref='order_items')
    reference_images = db.relationship('OrderItemImage', back_populates='order_item', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<OrderItem {self.id} - Order: {self.order_id}>'


class OrderItemImage(db.Model):
    """Reference images for custom cake orders."""
    __tablename__ = 'order_item_image'
    
    id = db.Column(db.Integer, primary_key=True)
    order_item_id = db.Column(db.Integer, db.ForeignKey('order_item.id'), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    image_filename = db.Column(db.String(255))
    description = db.Column(db.String(500))
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    order_item = db.relationship('OrderItem', back_populates='reference_images')
    
    def __repr__(self):
        return f'<OrderItemImage {self.id} - OrderItem: {self.order_item_id}>'
