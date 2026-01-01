# backend/schemas/cake_schema.py
from marshmallow import Schema, fields, validate


class CakeSchema(Schema):
    """Schema for cake serialization."""
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str()
    base_price = fields.Float(required=True)
    category = fields.Str()
    image_url = fields.Str()
    available = fields.Bool()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class CakeCreateSchema(Schema):
    """Schema for cake creation validation."""
    name = fields.Str(
        required=True,
        validate=validate.Length(min=3, max=100, error="Name must be between 3 and 100 characters")
    )
    description = fields.Str(
        validate=validate.Length(max=500, error="Description is too long")
    )
    base_price = fields.Float(
        required=True,
        validate=validate.Range(min=0.01, error="Price must be greater than 0")
    )
    category = fields.Str(
        validate=validate.OneOf(
            ['chocolate', 'vanilla', 'strawberry', 'custom', 'other'],
            error="Invalid category"
        )
    )
    image_url = fields.Url(
        validate=validate.Length(max=500, error="Image URL is too long")
    )
    available = fields.Bool(missing=True)
