# backend/tests/test_api/test_auth.py
import pytest
from flask import json


def test_register_user(client, db_session):
    """Test user registration."""
    response = client.post('/api/auth/register', json={
        'username': 'newuser',
        'email': 'newuser@example.com',
        'password': 'password123'
    })
    
    assert response.status_code in [200, 201]
    data = json.loads(response.data)
    assert 'user' in data or 'message' in data


def test_register_duplicate_email(client, sample_user):
    """Test registration with duplicate email."""
    response = client.post('/api/auth/register', json={
        'username': 'anotheruser',
        'email': 'test@example.com',  # Same as sample_user
        'password': 'password123'
    })
    
    assert response.status_code == 400 or response.status_code == 409


def test_login_success(client, sample_user):
    """Test successful login."""
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'testpassword'
    })
    
    assert response.status_code == 200
    # Check for cookie in response
    assert 'Set-Cookie' in response.headers


def test_login_invalid_credentials(client, sample_user):
    """Test login with invalid credentials."""
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com',
        'password': 'wrongpassword'
    })
    
    assert response.status_code == 401


def test_login_missing_fields(client):
    """Test login with missing fields."""
    response = client.post('/api/auth/login', json={
        'email': 'test@example.com'
    })
    
    assert response.status_code in [400, 422]
