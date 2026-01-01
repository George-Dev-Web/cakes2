# backend/utils/validators.py
from functools import wraps
from flask import request
from marshmallow import Schema, ValidationError as MarshmallowValidationError
from .exceptions import ValidationError


def validate_request(schema_class, location='json'):
    """
    Decorator to validate request data using Marshmallow schema.
    
    Args:
        schema_class: Marshmallow schema class to use for validation
        location: Where to get data from ('json', 'args', 'form')
    
    Usage:
        @validate_request(UserSchema)
        def create_user():
            validated_data = request.validated_data
            # ... use validated_data
    """
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            schema = schema_class()
            
            # Get data from appropriate location
            if location == 'json':
                data = request.get_json() or {}
            elif location == 'args':
                data = request.args.to_dict()
            elif location == 'form':
                data = request.form.to_dict()
            else:
                raise ValueError(f"Invalid location: {location}")
            
            # Validate data
            try:
                validated_data = schema.load(data)
                request.validated_data = validated_data
            except MarshmallowValidationError as err:
                raise ValidationError(
                    message="Validation failed",
                    payload={'validation_errors': err.messages}
                )
            
            return f(*args, **kwargs)
        return wrapper
    return decorator


def validate_pagination_params():
    """Validate and extract pagination parameters from request."""
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 20))
        
        if page < 1:
            raise ValidationError("Page must be greater than 0")
        if per_page < 1 or per_page > 100:
            raise ValidationError("Per page must be between 1 and 100")
        
        return page, per_page
    except ValueError:
        raise ValidationError("Invalid pagination parameters")
