# backend/schemas/cake_schema.py
from marshmallow import Schema, fields, validate


class CakeSchema(Schema):
    """Schema for cake serialization."""
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    description = fields.Str(required=True)
    price = fields.Float(required=True)
    image_url = fields.Str()
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class CakeCreateSchema(Schema):
    """Schema for cake creation validation."""
    name = fields.Str(
        required=True,
        validate=validate.Length(min=3, max=100, error="Name must be between 3 and 100 characters")
    )
    description = fields.Str(
        required=True,
        validate=validate.Length(min=10, max=500, error="Description must be between 10 and 500 characters")
    )
    price = fields.Float(
        required=True,
        validate=validate.Range(min=0.01, error="Price must be greater than 0")
    )
    image_url = fields.Url(
        validate=validate.Length(max=200, error="Image URL is too long")
    )


class CakeUpdateSchema(Schema):
    """Schema for cake update validation (all fields optional)."""
    name = fields.Str(
        validate=validate.Length(min=3, max=100, error="Name must be between 3 and 100 characters")
    )
    description = fields.Str(
        validate=validate.Length(min=10, max=500, error="Description must be between 10 and 500 characters")
    )
    price = fields.Float(
        validate=validate.Range(min=0.01, error="Price must be greater than 0")
    )
    image_url = fields.Url(
        validate=validate.Length(max=200, error="Image URL is too long")
    )
