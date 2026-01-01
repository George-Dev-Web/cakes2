# backend/utils/exceptions.py
from werkzeug.exceptions import HTTPException


class APIException(HTTPException):
    """Base exception class for API errors."""
    code = 500
    description = "An error occurred"
    
    def __init__(self, message=None, status_code=None, payload=None):
        super().__init__()
        if message is not None:
            self.description = message
        if status_code is not None:
            self.code = status_code
        self.payload = payload
    
    def to_dict(self):
        """Convert exception to dictionary for JSON response."""
        rv = dict(self.payload or ())
        rv['error'] = {
            'message': self.description,
            'code': self.code,
            'type': self.__class__.__name__
        }
        return rv


class ValidationError(APIException):
    """Raised when request validation fails."""
    code = 400
    description = "Validation error"


class AuthenticationError(APIException):
    """Raised when authentication fails."""
    code = 401
    description = "Authentication required"


class AuthorizationError(APIException):
    """Raised when user doesn't have permission."""
    code = 403
    description = "Permission denied"


class ResourceNotFoundError(APIException):
    """Raised when requested resource is not found."""
    code = 404
    description = "Resource not found"


class DatabaseError(APIException):
    """Raised when database operation fails."""
    code = 500
    description = "Database error occurred"
