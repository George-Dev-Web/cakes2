# backend/schemas/order_schema.py
from marshmallow import Schema, fields, validate, validates_schema, ValidationError
from datetime import datetime, timedelta

class OrderItemImageSchema(Schema):
    """Schema for order item reference images."""
    id = fields.Int(dump_only=True)
    image_url = fields.Str(required=True)
    description = fields.Str()


class OrderItemSchema(Schema):
    """Schema for order items."""
    id = fields.Int(dump_only=True)
    cake_id = fields.Int(allow_none=True)
    quantity = fields.Int(required=True)
    
    # Customization details
    cake_shape = fields.Str()
    cake_size = fields.Str()
    cake_layers = fields.Int()
    flavor = fields.Str()
    filling = fields.Str()
    frosting = fields.Str()
    
    # Dietary
    is_gluten_free = fields.Bool()
    is_vegan = fields.Bool()
    is_sugar_free = fields.Bool()
    is_dairy_free = fields.Bool()
    
    # Decorations
    toppings = fields.Str()
    decorations = fields.Str()
    message_on_cake = fields.Str()
    
    # Pricing
    base_price = fields.Float()
    customization_price = fields.Float()
    unit_price = fields.Float()
    subtotal = fields.Float()
    
    notes = fields.Str()
    
    # Nested
    reference_images = fields.List(fields.Nested(OrderItemImageSchema))
    cake = fields.Nested('CakeSchema', only=['id', 'name', 'description', 'image_url'])


class OrderSchema(Schema):
    """Schema for orders."""
    id = fields.Int(dump_only=True)
    order_number = fields.Str(dump_only=True)
    
    # Customer details
    customer_name = fields.Str(required=True)
    customer_email = fields.Email(required=True)
    customer_phone = fields.Str(required=True)
    
    # Delivery
    delivery_address = fields.Str(required=True)
    delivery_date = fields.DateTime(required=True)
    delivery_time = fields.Str()
    
    # Pricing
    subtotal = fields.Float(dump_only=True)
    delivery_fee = fields.Float()
    tax = fields.Float()
    discount = fields.Float()
    total_price = fields.Float(dump_only=True)
    
    # Payment
    payment_method = fields.Str()
    payment_status = fields.Str(dump_only=True)
    payment_reference = fields.Str()
    
    # Status
    status = fields.Str(dump_only=True)
    
    # Notes
    special_instructions = fields.Str(validate=validate.Length(max=2000))
    admin_notes = fields.Str()
    
    # Items
    items = fields.List(fields.Nested(OrderItemSchema))
    
    # Timestamps
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)
    confirmed_at = fields.DateTime(dump_only=True)
    completed_at = fields.DateTime(dump_only=True)


class OrderCreateSchema(Schema):
    """Schema for creating orders."""
    # Customer details (autofill if logged in, or manual entry)
    customer_name = fields.Str(
        required=True,
        validate=validate.Length(min=2, max=100)
    )
    customer_email = fields.Email(required=True)
    customer_phone = fields.Str(
        required=True,
        validate=validate.Regexp(r'^\+?[0-9]{10,15}$', error='Invalid phone number')
    )
    
    # Delivery details
    delivery_address = fields.Str(
        required=True,
        validate=validate.Length(min=10, max=500)
    )
    delivery_date = fields.DateTime(required=True)
    delivery_time = fields.Str(
        validate=validate.OneOf(['Morning', 'Afternoon', 'Evening', 'Specific Time'])
    )
    
    # Optional fields
    special_instructions = fields.Str(validate=validate.Length(max=2000))
    payment_method = fields.Str(
        required=True,
        validate=validate.OneOf(['Cash on Delivery', 'M-Pesa', 'Card', 'Bank Transfer'])
    )
    
    # Items from cart
    cart_id = fields.Int(required=True)
    
    @validates_schema
    def validate_delivery_date(self, data, **kwargs):
        """Ensure delivery date is at least 48 hours from now."""
        delivery_date = data.get('delivery_date')
        if delivery_date:
            min_date = datetime.now() + timedelta(hours=48)
            if delivery_date < min_date:
                raise ValidationError(
                    'Delivery date must be at least 48 hours from now',
                    field_name='delivery_date'
                )


class OrderUpdateStatusSchema(Schema):
    """Schema for updating order status (admin only)."""
    status = fields.Str(
        required=True,
        validate=validate.OneOf(['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'])
    )
    admin_notes = fields.Str(validate=validate.Length(max=1000))
