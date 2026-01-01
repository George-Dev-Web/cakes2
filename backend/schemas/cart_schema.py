# backend/schemas/cart_schema.py
from marshmallow import Schema, fields, validate, validates_schema, ValidationError

class CartItemImageSchema(Schema):
    """Schema for cart item reference images."""
    id = fields.Int(dump_only=True)
    image_url = fields.Str(required=True)
    image_filename = fields.Str()
    description = fields.Str(validate=validate.Length(max=500))
    uploaded_at = fields.DateTime(dump_only=True)


class CartItemSchema(Schema):
    """Schema for cart items."""
    id = fields.Int(dump_only=True)
    cart_id = fields.Int(dump_only=True)
    cake_id = fields.Int(allow_none=True)
    quantity = fields.Int(required=True, validate=validate.Range(min=1, max=50))
    
    # Customization
    cake_shape = fields.Str(validate=validate.OneOf(['Round', 'Square', 'Rectangle', 'Heart', 'Custom']))
    cake_size = fields.Str(validate=validate.OneOf(['Small', 'Medium', 'Large', 'XL']))
    cake_layers = fields.Int(validate=validate.Range(min=1, max=10))
    flavor = fields.Str(validate=validate.Length(max=100))
    filling = fields.Str(validate=validate.Length(max=100))
    frosting = fields.Str(validate=validate.Length(max=100))
    
    # Dietary
    is_gluten_free = fields.Bool()
    is_vegan = fields.Bool()
    is_sugar_free = fields.Bool()
    is_dairy_free = fields.Bool()
    
    # Decorations
    toppings = fields.Str()  # JSON string
    decorations = fields.Str(validate=validate.Length(max=500))
    message_on_cake = fields.Str(validate=validate.Length(max=200))
    
    # Pricing
    base_price = fields.Float(required=True, validate=validate.Range(min=0.01))
    customization_price = fields.Float()
    
    notes = fields.Str(validate=validate.Length(max=1000))
    
    # Nested
    reference_images = fields.List(fields.Nested(CartItemImageSchema))
    cake = fields.Nested('CakeSchema', only=['id', 'name', 'description', 'image_url'])
    
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class CartItemCreateSchema(Schema):
    """Schema for creating cart items."""
    cake_id = fields.Int(allow_none=True)
    quantity = fields.Int(required=True, validate=validate.Range(min=1, max=50))
    
    # Customization
    cake_shape = fields.Str(validate=validate.OneOf(['Round', 'Square', 'Rectangle', 'Heart', 'Custom']))
    cake_size = fields.Str(required=True, validate=validate.OneOf(['Small', 'Medium', 'Large', 'XL']))
    cake_layers = fields.Int(validate=validate.Range(min=1, max=10))
    flavor = fields.Str(validate=validate.Length(max=100))
    filling = fields.Str(validate=validate.Length(max=100))
    frosting = fields.Str(validate=validate.Length(max=100))
    
    # Dietary
    is_gluten_free = fields.Bool(missing=False)
    is_vegan = fields.Bool(missing=False)
    is_sugar_free = fields.Bool(missing=False)
    is_dairy_free = fields.Bool(missing=False)
    
    # Decorations
    toppings = fields.List(fields.Int())  # List of topping IDs
    decorations = fields.Str(validate=validate.Length(max=500))
    message_on_cake = fields.Str(validate=validate.Length(max=200))
    
    notes = fields.Str(validate=validate.Length(max=1000))
    
    @validates_schema
    def validate_customization(self, data, **kwargs):
        """Ensure either cake_id or full customization is provided."""
        if not data.get('cake_id') and not data.get('cake_size'):
            raise ValidationError('Either cake_id or customization details required')


class CartSchema(Schema):
    """Schema for shopping cart."""
    id = fields.Int(dump_only=True)
    user_id = fields.Int(allow_none=True)
    session_id = fields.Str()
    items = fields.List(fields.Nested(CartItemSchema))
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    
    # Computed fields
    total = fields.Method('get_total')
    item_count = fields.Method('get_item_count')
    
    def get_total(self, obj):
        return obj.get_total()
    
    def get_item_count(self, obj):
        return obj.get_item_count()
