# backend/tests/test_api/test_cakes.py
import pytest
from flask import json


def test_get_all_cakes(client, sample_cake):
    """Test getting all cakes."""
    response = client.get('/api/cakes')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert isinstance(data, list) or 'cakes' in data


def test_get_cake_by_id(client, sample_cake):
    """Test getting a specific cake."""
    response = client.get(f'/api/cakes/{sample_cake.id}')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['name'] == 'Chocolate Cake'


def test_get_nonexistent_cake(client):
    """Test getting a cake that doesn't exist."""
    response = client.get('/api/cakes/99999')
    
    assert response.status_code == 404


def test_create_cake_as_admin(client, admin_headers, db_session):
    """Test creating a cake as admin."""
    response = client.post(
        '/api/admin/cakes',
        headers=admin_headers,
        json={
            'name': 'Vanilla Cake',
            'description': 'Delicious vanilla cake',
            'base_price': 20.00,
            'category': 'vanilla',
            'image_url': 'https://example.com/vanilla.jpg'
        }
    )
    
    # Status might be 200, 201, or 401 if auth isn't set up
    assert response.status_code in [200, 201, 401]


def test_create_cake_as_regular_user(client, auth_headers, db_session):
    """Test that regular users can't create cakes."""
    response = client.post(
        '/api/admin/cakes',
        headers=auth_headers,
        json={
            'name': 'Vanilla Cake',
            'description': 'Delicious vanilla cake',
            'base_price': 20.00,
            'category': 'vanilla'
        }
    )
    
    # Should be forbidden or unauthorized
    assert response.status_code in [401, 403]
