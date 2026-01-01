# backend/app.py
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from config import config
from extensions import db, migrate, ma, jwt
from utils import setup_logger
from utils.exceptions import APIException

# Import all models for Flask-Migrate
from models.order import Order, OrderItem
from models.options import CustomizationOption # <--- This fixes the error! 
from models.order_customization import OrderCustomization
from models.cake import Cake
from models.User import User


def create_app(config_name=None):
    """Application factory pattern."""
    
    app = Flask(__name__)
    
    # Load configuration
    if config_name is None:
        config_name = os.environ.get('FLASK_ENV', 'development')
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    ma.init_app(app)
    jwt.init_app(app)
    
    # Configure CORS
   # Configure CORS in app.py
    CORS(app, 
     resources={r"/api/*": {"origins": app.config['CORS_ORIGINS']}},
     supports_credentials=True,
     # These two lines are the "Keys to the Kingdom"
     allow_headers=["Content-Type", "Authorization", "X-CSRF-TOKEN"],
     expose_headers=["X-CSRF-TOKEN"]
)
    # Setup logging
    setup_logger(app)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Register request/response hooks
    register_hooks(app)
    
    # Register blueprints
    register_blueprints(app)
    
    return app


def register_blueprints(app):
    """Register all application blueprints."""
    from controllers.cake_controller import cake_bp
    from controllers.order_controller import order_bp
    from controllers.auth_controller import auth_bp
    from controllers.contact_controller import contact_bp
    from controllers.admin_controller import admin_bp
    from controllers.customization_controller import customization_bp
    from controllers.cart_controller import cart_bp
    # from controllers.portfolio_controller import portfolio_bp

    
    app.register_blueprint(cake_bp, url_prefix='/api')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(order_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(contact_bp, url_prefix='/api')
    app.register_blueprint(customization_bp, url_prefix='/api')
    app.register_blueprint(cart_bp, url_prefix='/api')
    # app.register_blueprint(portfolio_bp, url_prefix='/api')
    
    app.logger.info("All blueprints registered successfully")


def register_error_handlers(app):
    """Register error handlers for the application."""
    
    @app.errorhandler(APIException)
    def handle_api_exception(error):
        """Handle custom API exceptions."""
        app.logger.error(
            f"API Exception: {error.description}",
            extra={'status_code': error.code, 'type': error.__class__.__name__}
        )
        response = jsonify(error.to_dict())
        response.status_code = error.code
        return response
    
    @app.errorhandler(400)
    def bad_request(error):
        """Handle 400 Bad Request errors."""
        app.logger.warning(f"Bad request: {error}")
        return jsonify({
            'error': {
                'message': 'Bad request',
                'code': 400,
                'type': 'BadRequest'
            }
        }), 400
    
    @app.errorhandler(401)
    def unauthorized(error):
        """Handle 401 Unauthorized errors."""
        app.logger.warning(f"Unauthorized access attempt")
        return jsonify({
            'error': {
                'message': 'Authentication required',
                'code': 401,
                'type': 'Unauthorized'
            }
        }), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        """Handle 403 Forbidden errors."""
        app.logger.warning(f"Forbidden access attempt")
        return jsonify({
            'error': {
                'message': 'Permission denied',
                'code': 403,
                'type': 'Forbidden'
            }
        }), 403
    
    @app.errorhandler(404)
    def not_found(error):
        """Handle 404 Not Found errors."""
        return jsonify({
            'error': {
                'message': 'Resource not found',
                'code': 404,
                'type': 'NotFound'
            }
        }), 404
    
    @app.errorhandler(405)
    def method_not_allowed(error):
        """Handle 405 Method Not Allowed errors."""
        return jsonify({
            'error': {
                'message': 'Method not allowed',
                'code': 405,
                'type': 'MethodNotAllowed'
            }
        }), 405
    
    @app.errorhandler(500)
    def internal_server_error(error):
        """Handle 500 Internal Server Error."""
        app.logger.error(
            f"Internal server error: {error}",
            exc_info=True
        )
        # Don't expose internal error details in production
        if app.config['DEBUG']:
            message = str(error)
        else:
            message = 'An internal server error occurred'
        
        return jsonify({
            'error': {
                'message': message,
                'code': 500,
                'type': 'InternalServerError'
            }
        }), 500
    
    @app.errorhandler(Exception)
    def handle_unexpected_error(error):
        """Handle unexpected errors."""
        app.logger.critical(
            f"Unexpected error: {error}",
            exc_info=True
        )
        return jsonify({
            'error': {
                'message': 'An unexpected error occurred',
                'code': 500,
                'type': 'UnexpectedError'
            }
        }), 500


def register_hooks(app):
    """Register before/after request hooks."""
    
    @app.before_request
    def log_request_info():
        """Log information about each request."""
        app.logger.debug(
            f"Request started: {request.method} {request.path}",
            extra={
                'method': request.method,
                'path': request.path,
                'ip': request.remote_addr,
                'user_agent': request.user_agent.string
            }
        )
    
    @app.after_request
    def log_response_info(response):
        """Log information about each response."""
        app.logger.debug(
            f"Request completed: {request.method} {request.path} - {response.status_code}",
            extra={
                'method': request.method,
                'path': request.path,
                'status_code': response.status_code
            }
        )
        return response
    
    @app.after_request
    def add_security_headers(response):
        """Add security headers to responses."""
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        return response


# Create app instance for Flask CLI and migrations
app = create_app()

if __name__ == '__main__':
    app.run(
        debug=app.config['DEBUG'],
        host='0.0.0.0',
        port=5000
    )
