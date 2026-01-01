# backend/schemas/order_schema.py
from marshmallow import Schema, fields, validate


class OrderItemSchema(Schema):
    """Schema for order items."""
    cake_id = fields.Int(required=True)
    quantity = fields.Int(
        required=True,
        validate=validate.Range(min=1, max=100, error="Quantity must be between 1 and 100")
    )
    customizations = fields.Dict()


class OrderSchema(Schema):
    """Schema for order serialization."""
    id = fields.Int(dump_only=True)
    user_id = fields.Int()
    status = fields.Str()
    total_price = fields.Float()
    customer_name = fields.Str()
    customer_email = fields.Email()
    customer_phone = fields.Str()
    delivery_address = fields.Str()
    delivery_date = fields.DateTime()
    special_instructions = fields.Str()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class OrderCreateSchema(Schema):
    """Schema for order creation validation."""
    items = fields.List(
        fields.Nested(OrderItemSchema),
        required=True,
        validate=validate.Length(min=1, error="Order must contain at least one item")
    )
    customer_name = fields.Str(
        required=True,
        validate=validate.Length(min=2, max=100, error="Name must be between 2 and 100 characters")
    )
    customer_email = fields.Email(required=True)
    customer_phone = fields.Str(
        required=True,
        validate=validate.Regexp(
            r'^\+?[0-9]{10,15}$',
            error="Invalid phone number format"
        )
    )
    delivery_address = fields.Str(
        required=True,
        validate=validate.Length(min=10, max=500, error="Address must be between 10 and 500 characters")
    )
    delivery_date = fields.DateTime(required=True)
    special_instructions = fields.Str(
        validate=validate.Length(max=1000, error="Special instructions are too long")
    )
