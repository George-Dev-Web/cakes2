# backend/tests/conftest.py
import pytest
import os
import sys

# Add backend directory to path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__) + '/..'))

from app import create_app
from extensions import db
from models.User import User
from models.cake import Cake
from werkzeug.security import generate_password_hash


@pytest.fixture(scope='session')
def app():
    """Create application for testing."""
    # Set environment variables for testing
    os.environ['SECRET_KEY'] = 'test-secret-key'
    os.environ['JWT_SECRET_KEY'] = 'test-jwt-secret-key'
    os.environ['DATABASE_URL'] = 'sqlite:///test.db'
    os.environ['FLASK_ENV'] = 'testing'
    
    app = create_app('testing')
    return app


@pytest.fixture(scope='function')
def client(app):
    """Create test client."""
    return app.test_client()


@pytest.fixture(scope='function')
def db_session(app):
    """Create database session for testing."""
    with app.app_context():
        db.create_all()
        yield db
        db.session.remove()
        db.drop_all()


@pytest.fixture
def sample_user(db_session):
    """Create a sample user for testing."""
    user = User(
        name='Test User',
        email='test@example.com',
        is_admin=False
    )
    user.set_password('TestPass123')
    db_session.session.add(user)
    db_session.session.commit()
    return user


@pytest.fixture
def admin_user(db_session):
    """Create an admin user for testing."""
    admin = User(
        name='Admin User',
        email='admin@example.com',
        is_admin=True
    )
    admin.set_password('AdminPass123')
    db_session.session.add(admin)
    db_session.session.commit()
    return admin


@pytest.fixture
def sample_cake(db_session):
    """Create a sample cake for testing."""
    cake = Cake(
        name='Chocolate Cake',
        description='Delicious chocolate cake',
        price=25.00,
        image_url='https://example.com/chocolate.jpg'
    )
    db_session.session.add(cake)
    db_session.session.commit()
    return cake


@pytest.fixture
def auth_headers(client, sample_user):
    """Get authentication headers for testing."""
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'TestPass123'
    })
    # Extract cookie from response if using cookie-based auth
    cookie = response.headers.get('Set-Cookie', '')
    if cookie:
        return {'Cookie': cookie}
    return {}


@pytest.fixture
def admin_headers(client, admin_user):
    """Get admin authentication headers for testing."""
    response = client.post('/api/auth/login', json={
        'email': 'admin@example.com',
        'password': 'AdminPass123'
    })
    cookie = response.headers.get('Set-Cookie', '')
    if cookie:
        return {'Cookie': cookie}
    return {}
