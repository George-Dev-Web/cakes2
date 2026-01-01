# backend/models/cart.py
from extensions import db
from datetime import datetime

class Cart(db.Model):
    """Shopping cart for users (both logged in and guest)."""
    __tablename__ = 'cart'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # Null for guest carts
    session_id = db.Column(db.String(255), nullable=True)  # For guest users
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    items = db.relationship('CartItem', back_populates='cart', cascade='all, delete-orphan', lazy='dynamic')
    
    def get_total(self):
        """Calculate total cart value."""
        return sum(item.get_subtotal() for item in self.items)
    
    def get_item_count(self):
        """Get total number of items in cart."""
        return sum(item.quantity for item in self.items)
    
    def __repr__(self):
        return f'<Cart {self.id} - User: {self.user_id or "Guest"}>'


class CartItem(db.Model):
    """Individual items in a cart."""
    __tablename__ = 'cart_item'
    
    id = db.Column(db.Integer, primary_key=True)
    cart_id = db.Column(db.Integer, db.ForeignKey('cart.id'), nullable=False)
    cake_id = db.Column(db.Integer, db.ForeignKey('cake.id'), nullable=True)  # Null for custom cakes
    quantity = db.Column(db.Integer, nullable=False, default=1)
    
    # Customization details (stored as JSON for flexibility)
    cake_shape = db.Column(db.String(50))  # Round, Square, Heart, Custom
    cake_size = db.Column(db.String(50))   # Small, Medium, Large, XL
    cake_layers = db.Column(db.Integer, default=2)
    flavor = db.Column(db.String(100))
    filling = db.Column(db.String(100))
    frosting = db.Column(db.String(100))
    
    # Dietary restrictions
    is_gluten_free = db.Column(db.Boolean, default=False)
    is_vegan = db.Column(db.Boolean, default=False)
    is_sugar_free = db.Column(db.Boolean, default=False)
    is_dairy_free = db.Column(db.Boolean, default=False)
    
    # Toppings and decorations (comma-separated or JSON)
    toppings = db.Column(db.Text)  # JSON list of topping IDs
    decorations = db.Column(db.Text)  # Special decorations
    message_on_cake = db.Column(db.String(200))  # Birthday message, etc.
    
    # Pricing
    base_price = db.Column(db.Float, nullable=False)
    customization_price = db.Column(db.Float, default=0.0)
    
    # Special instructions
    notes = db.Column(db.Text)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    cart = db.relationship('Cart', back_populates='items')
    cake = db.relationship('Cake', backref='cart_items')
    reference_images = db.relationship('CartItemImage', back_populates='cart_item', cascade='all, delete-orphan')
    
    def get_subtotal(self):
        """Calculate subtotal for this cart item."""
        return (self.base_price + self.customization_price) * self.quantity
    
    def __repr__(self):
        return f'<CartItem {self.id} - Cart: {self.cart_id}>'


class CartItemImage(db.Model):
    """Reference images uploaded by users for custom cakes."""
    __tablename__ = 'cart_item_image'
    
    id = db.Column(db.Integer, primary_key=True)
    cart_item_id = db.Column(db.Integer, db.ForeignKey('cart_item.id'), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    image_filename = db.Column(db.String(255))
    description = db.Column(db.String(500))  # User's description of what they want
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    cart_item = db.relationship('CartItem', back_populates='reference_images')
    
    def __repr__(self):
        return f'<CartItemImage {self.id} - Item: {self.cart_item_id}>'
