# backend/schemas/customization_schema.py
from marshmallow import Schema, fields, validate

class CustomizationOptionSchema(Schema):
    """Schema for customization options."""
    id = fields.Int(dump_only=True)
    category = fields.Str(
        required=True,
        validate=validate.OneOf(['shape', 'size', 'flavor', 'filling', 'frosting', 'topping', 'decoration'])
    )
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    description = fields.Str(validate=validate.Length(max=500))
    price = fields.Float(validate=validate.Range(min=0))
    image_url = fields.Str(validate=validate.URL())
    is_active = fields.Bool()
    sort_order = fields.Int()
    is_vegan_compatible = fields.Bool()
    is_gluten_free_compatible = fields.Bool()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class CustomizationOptionCreateSchema(Schema):
    """Schema for creating customization options."""
    category = fields.Str(
        required=True,
        validate=validate.OneOf(['shape', 'size', 'flavor', 'filling', 'frosting', 'topping', 'decoration'])
    )
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    description = fields.Str(validate=validate.Length(max=500))
    price = fields.Float(required=True, validate=validate.Range(min=0))
    image_url = fields.Str(validate=validate.URL())
    is_active = fields.Bool(missing=True)
    sort_order = fields.Int(missing=0)
    is_vegan_compatible = fields.Bool(missing=True)
    is_gluten_free_compatible = fields.Bool(missing=True)


class CakeTemplateImageSchema(Schema):
    """Schema for cake template images."""
    id = fields.Int(dump_only=True)
    image_url = fields.Str(required=True)
    caption = fields.Str()
    sort_order = fields.Int()


class CakeTemplateSchema(Schema):
    """Schema for cake templates (portfolio)."""
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str(required=True)
    category = fields.Str()
    
    # Default specs
    default_shape = fields.Str()
    default_size = fields.Str()
    default_layers = fields.Int()
    default_flavor = fields.Str()
    default_frosting = fields.Str()
    
    # Pricing
    base_price = fields.Float(required=True)
    
    # Images
    primary_image_url = fields.Str()
    images = fields.List(fields.Nested(CakeTemplateImageSchema))
    
    # Availability
    is_available = fields.Bool()
    is_featured = fields.Bool()
    can_be_vegan = fields.Bool()
    can_be_gluten_free = fields.Bool()
    
    # Stats
    views_count = fields.Int(dump_only=True)
    orders_count = fields.Int(dump_only=True)
    
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class CakeTemplateCreateSchema(Schema):
    """Schema for creating cake templates."""
    name = fields.Str(required=True, validate=validate.Length(min=3, max=150))
    description = fields.Str(required=True, validate=validate.Length(min=10, max=2000))
    category = fields.Str(
        validate=validate.OneOf(['Birthday', 'Wedding', 'Anniversary', 'Corporate', 'Custom', 'Other'])
    )
    
    # Default specs
    default_shape = fields.Str()
    default_size = fields.Str()
    default_layers = fields.Int(validate=validate.Range(min=1, max=10))
    default_flavor = fields.Str()
    default_frosting = fields.Str()
    
    # Pricing
    base_price = fields.Float(required=True, validate=validate.Range(min=0.01))
    
    # Images
    primary_image_url = fields.Str(validate=validate.URL())
    
    # Availability
    is_available = fields.Bool(missing=True)
    is_featured = fields.Bool(missing=False)
    can_be_vegan = fields.Bool(missing=False)
    can_be_gluten_free = fields.Bool(missing=False)
