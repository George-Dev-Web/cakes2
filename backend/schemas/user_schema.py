# backend/schemas/user_schema.py
from marshmallow import Schema, fields, validate, validates, ValidationError
import re


class UserSchema(Schema):
    """Schema for user serialization."""
    id = fields.Int(dump_only=True)
    name = fields.Str(required=True)
    email = fields.Email(required=True)
    phone = fields.Str()
    address = fields.Str()
    is_admin = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)
    updated_at = fields.DateTime(dump_only=True)


class UserRegistrationSchema(Schema):
    """Schema for user registration validation."""
    name = fields.Str(
        required=True,
        validate=validate.Length(min=2, max=100, error="Name must be between 2 and 100 characters")
    )
    email = fields.Email(
        required=True,
        validate=validate.Length(max=100, error="Email is too long")
    )
    password = fields.Str(
        required=True,
        load_only=True,
        validate=validate.Length(min=8, error="Password must be at least 8 characters")
    )
    phone = fields.Str(
        validate=validate.Length(max=20, error="Phone number is too long")
    )
    address = fields.Str()
    
    @validates('password')
    def validate_password_strength(self, value):
        """Validate password strength."""
        if not re.search(r'[A-Z]', value):
            raise ValidationError("Password must contain at least one uppercase letter")
        if not re.search(r'[a-z]', value):
            raise ValidationError("Password must contain at least one lowercase letter")
        if not re.search(r'[0-9]', value):
            raise ValidationError("Password must contain at least one number")


class UserLoginSchema(Schema):
    """Schema for user login validation."""
    email = fields.Email(required=True)
    password = fields.Str(required=True, load_only=True)
