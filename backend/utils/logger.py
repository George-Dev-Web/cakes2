# backend/utils/logger.py
import logging
import os
from logging.handlers import RotatingFileHandler
from pythonjsonlogger import jsonlogger
from flask import request, has_request_context
import traceback


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter that adds request context."""
    
    def add_fields(self, log_record, record, message_dict):
        super(CustomJsonFormatter, self).add_fields(log_record, record, message_dict)
        
        # Add timestamp
        log_record['timestamp'] = self.formatTime(record, self.datefmt)
        log_record['level'] = record.levelname
        log_record['logger'] = record.name
        
        # Add request context if available
        if has_request_context():
            log_record['request'] = {
                'method': request.method,
                'path': request.path,
                'ip': request.remote_addr,
                'user_agent': request.user_agent.string
            }
        
        # Add exception info if present
        if record.exc_info:
            log_record['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1]),
                'traceback': traceback.format_exception(*record.exc_info)
            }


def setup_logger(app):
    """Configure application logging with JSON formatter and file rotation."""
    
    # Create logs directory if it doesn't exist
    log_dir = os.path.dirname(app.config['LOG_FILE'])
    if log_dir and not os.path.exists(log_dir):
        os.makedirs(log_dir)
    
    # Set logging level
    log_level = getattr(logging, app.config['LOG_LEVEL'].upper(), logging.INFO)
    app.logger.setLevel(log_level)
    
    # Remove default handlers
    app.logger.handlers.clear()
    
    # Console handler with standard formatting for development
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    console_handler.setFormatter(console_formatter)
    app.logger.addHandler(console_handler)
    
    # File handler with JSON formatting for production
    file_handler = RotatingFileHandler(
        app.config['LOG_FILE'],
        maxBytes=10485760,  # 10MB
        backupCount=10
    )
    file_handler.setLevel(log_level)
    json_formatter = CustomJsonFormatter(
        '%(timestamp)s %(level)s %(name)s %(message)s'
    )
    file_handler.setFormatter(json_formatter)
    app.logger.addHandler(file_handler)
    
    # Log startup
    app.logger.info(
        f"Application started in {app.config['FLASK_ENV']} mode",
        extra={'environment': app.config['FLASK_ENV']}
    )
    
    return app.logger


def get_logger(name):
    """Get a logger instance with the specified name."""
    return logging.getLogger(name)
