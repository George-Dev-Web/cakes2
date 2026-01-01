# backend/tests/conftest.py
import pytest
from app import create_app
from extensions import db
from models.User import User
from models.cake import Cake
from werkzeug.security import generate_password_hash


@pytest.fixture(scope='session')
def app():
    """Create application for testing."""
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
        username='testuser',
        email='test@example.com',
        password=generate_password_hash('testpassword'),
        is_admin=False
    )
    db_session.session.add(user)
    db_session.session.commit()
    return user


@pytest.fixture
def admin_user(db_session):
    """Create an admin user for testing."""
    admin = User(
        username='admin',
        email='admin@example.com',
        password=generate_password_hash('adminpassword'),
        is_admin=True
    )
    db_session.session.add(admin)
    db_session.session.commit()
    return admin


@pytest.fixture
def sample_cake(db_session):
    """Create a sample cake for testing."""
    cake = Cake(
        name='Chocolate Cake',
        description='Delicious chocolate cake',
        base_price=25.00,
        category='chocolate',
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
        'password': 'testpassword'
    })
    # Extract cookie from response if using cookie-based auth
    return {'Cookie': response.headers.get('Set-Cookie', '')}


@pytest.fixture
def admin_headers(client, admin_user):
    """Get admin authentication headers for testing."""
    response = client.post('/api/auth/login', json={
        'email': 'admin@example.com',
        'password': 'adminpassword'
    })
    return {'Cookie': response.headers.get('Set-Cookie', '')}
