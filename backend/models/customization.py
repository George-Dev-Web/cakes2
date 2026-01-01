# backend/models/customization.py
from extensions import db
from datetime import datetime

class CustomizationOption(db.Model):
    """Available customization options for cakes."""
    __tablename__ = 'customization_option'
    
    id = db.Column(db.Integer, primary_key=True)
    category = db.Column(db.String(50), nullable=False)  # shape, size, flavor, filling, frosting, topping
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, default=0.0)  # Additional cost for this option
    image_url = db.Column(db.String(500))
    active = db.Column(db.Boolean, default=True)
    sort_order = db.Column(db.Integer, default=0)  # For display ordering
    
    # Availability flags
    is_vegan_compatible = db.Column(db.Boolean, default=True)
    is_gluten_free_compatible = db.Column(db.Boolean, default=True)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'category': self.category,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'image_url': self.image_url,
            'is_active': self.is_active,
            'is_vegan_compatible': self.is_vegan_compatible,
            'is_gluten_free_compatible': self.is_gluten_free_compatible
        }
    
    def __repr__(self):
        return f'<CustomizationOption {self.category}: {self.name}>'


class CakeTemplate(db.Model):
    """Pre-made cake templates for the portfolio."""
    __tablename__ = 'cake_template'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50))  # Birthday, Wedding, Anniversary, Custom
    
    # Default specifications
    default_shape = db.Column(db.String(50))
    default_size = db.Column(db.String(50))
    default_layers = db.Column(db.Integer, default=2)
    default_flavor = db.Column(db.String(100))
    default_frosting = db.Column(db.String(100))
    
    # Pricing
    base_price = db.Column(db.Float, nullable=False)
    
    # Images
    primary_image_url = db.Column(db.String(500))
    
    # Availability
    is_available = db.Column(db.Boolean, default=True)
    is_featured = db.Column(db.Boolean, default=False)
    
    # Dietary options available
    can_be_vegan = db.Column(db.Boolean, default=False)
    can_be_gluten_free = db.Column(db.Boolean, default=False)
    
    # Display settings
    sort_order = db.Column(db.Integer, default=0)
    views_count = db.Column(db.Integer, default=0)
    orders_count = db.Column(db.Integer, default=0)
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    images = db.relationship('CakeTemplateImage', back_populates='template', cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'default_shape': self.default_shape,
            'default_size': self.default_size,
            'default_layers': self.default_layers,
            'default_flavor': self.default_flavor,
            'default_frosting': self.default_frosting,
            'base_price': self.base_price,
            'primary_image_url': self.primary_image_url,
            'is_available': self.is_available,
            'is_featured': self.is_featured,
            'can_be_vegan': self.can_be_vegan,
            'can_be_gluten_free': self.can_be_gluten_free,
            'images': [img.to_dict() for img in self.images]
        }
    
    def __repr__(self):
        return f'<CakeTemplate {self.name}>'


class CakeTemplateImage(db.Model):
    """Additional images for cake templates (gallery)."""
    __tablename__ = 'cake_template_image'
    
    id = db.Column(db.Integer, primary_key=True)
    template_id = db.Column(db.Integer, db.ForeignKey('cake_template.id'), nullable=False)
    image_url = db.Column(db.String(500), nullable=False)
    caption = db.Column(db.String(200))
    sort_order = db.Column(db.Integer, default=0)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    template = db.relationship('CakeTemplate', back_populates='images')
    
    def to_dict(self):
        return {
            'id': self.id,
            'image_url': self.image_url,
            'caption': self.caption,
            'sort_order': self.sort_order
        }
    
    def __repr__(self):
        return f'<CakeTemplateImage {self.id} - Template: {self.template_id}>'
