# backend/schemas/user_schema.py
from marshmallow import Schema, fields, validate, validates, ValidationError
import re


class UserSchema(Schema):
    """Schema for user serialization."""
    id = fields.Int(dump_only=True)
    username = fields.Str(required=True)
    email = fields.Email(required=True)
    is_admin = fields.Bool(dump_only=True)
    created_at = fields.DateTime(dump_only=True)


class UserRegistrationSchema(Schema):
    """Schema for user registration validation."""
    username = fields.Str(
        required=True,
        validate=[
            validate.Length(min=3, max=50, error="Username must be between 3 and 50 characters"),
            validate.Regexp(
                r'^[a-zA-Z0-9_]+$',
                error="Username can only contain letters, numbers, and underscores"
            )
        ]
    )
    email = fields.Email(
        required=True,
        validate=validate.Length(max=120, error="Email is too long")
    )
    password = fields.Str(
        required=True,
        load_only=True,
        validate=validate.Length(min=8, error="Password must be at least 8 characters")
    )
    
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
