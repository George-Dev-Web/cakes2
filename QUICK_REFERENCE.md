# 🚀 Quick Reference Guide - High Priority Upgrades

Quick reference for using the new features in your Cakes2 application.

## 📦 Installation

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your values
mkdir logs
```

## 🔑 Environment Variables (.env)

```env
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@localhost:5432/cake_db
JWT_SECRET_KEY=your-jwt-key
FLASK_ENV=development
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:5173
```

## 🎯 Custom Exceptions

```python
from utils.exceptions import (
    ValidationError,      # 400 - Bad input
    AuthenticationError,  # 401 - Login required
    AuthorizationError,   # 403 - No permission
    ResourceNotFoundError,# 404 - Not found
    DatabaseError         # 500 - DB error
)

# Usage
if not user:
    raise ResourceNotFoundError("User not found")

if not user.is_admin:
    raise AuthorizationError("Admin only")
```

## ✅ Input Validation

### Define Schema
```python
# schemas/product_schema.py
from marshmallow import Schema, fields, validate

class ProductCreateSchema(Schema):
    name = fields.Str(
        required=True,
        validate=validate.Length(min=3, max=100)
    )
    price = fields.Float(
        required=True,
        validate=validate.Range(min=0.01)
    )
    category = fields.Str(
        validate=validate.OneOf(['electronics', 'clothing'])
    )
```

### Use in Controller
```python
from utils.validators import validate_request
from schemas.product_schema import ProductCreateSchema

@app.route('/api/products', methods=['POST'])
@validate_request(ProductCreateSchema)
def create_product():
    data = request.validated_data  # Already validated!
    product = Product(**data)
    db.session.add(product)
    db.session.commit()
    return jsonify(product.to_dict()), 201
```

## 📝 Logging

```python
from flask import current_app

# Different log levels
current_app.logger.debug("Detailed debug info")
current_app.logger.info("Important info", extra={'user_id': 123})
current_app.logger.warning("Something concerning")
current_app.logger.error("Error occurred", exc_info=True)
current_app.logger.critical("Critical issue!")

# With context
current_app.logger.info(
    "Order created",
    extra={
        'order_id': order.id,
        'user_id': user.id,
        'total': order.total
    }
)
```

## 🧪 Testing

### Run Tests
```bash
# All tests
pytest

# With coverage
pytest --cov=. --cov-report=html

# Specific file
pytest tests/test_api/test_auth.py

# Verbose
pytest -v

# Stop on first failure
pytest -x
```

### Write Tests
```python
def test_create_item(client, auth_headers):
    response = client.post(
        '/api/items',
        headers=auth_headers,
        json={'name': 'Test Item', 'price': 10.00}
    )
    assert response.status_code == 201
    data = json.loads(response.data)
    assert data['name'] == 'Test Item'
```

## 🔒 Security Headers

Automatically added to all responses:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

## 📄 Error Response Format

All errors return consistent JSON:
```json
{
  "error": {
    "message": "Resource not found",
    "code": 404,
    "type": "ResourceNotFoundError"
  }
}
```

With validation errors:
```json
{
  "error": {
    "message": "Validation failed",
    "code": 400,
    "type": "ValidationError"
  },
  "validation_errors": {
    "email": ["Not a valid email address"],
    "password": ["Password must be at least 8 characters"]
  }
}
```

## ⚙️ Configuration

```python
from config import config

# Create app with specific config
app = create_app('production')

# Or use environment variable
# FLASK_ENV=production python app.py

# Available configs:
# - development (default)
# - testing
# - production
```

## 📊 Pagination Helper

```python
from utils.validators import validate_pagination_params

@app.route('/api/items')
def get_items():
    page, per_page = validate_pagination_params()
    items = Item.query.paginate(
        page=page,
        per_page=per_page,
        error_out=False
    )
    return jsonify({
        'items': [item.to_dict() for item in items.items],
        'total': items.total,
        'page': page,
        'pages': items.pages
    })
```

## 🔍 Viewing Logs

```bash
# Live tail
tail -f logs/app.log

# Last 100 lines
tail -n 100 logs/app.log

# Search logs
grep "ERROR" logs/app.log

# Pretty print JSON logs (if jq installed)
tail -f logs/app.log | jq
```

## 💡 Common Patterns

### Protected Route
```python
from flask_jwt_extended import jwt_required, get_jwt_identity

@app.route('/api/profile')
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user:
        raise ResourceNotFoundError("User not found")
    return jsonify(user.to_dict())
```

### Admin Only Route
```python
@app.route('/api/admin/users')
@jwt_required()
def get_all_users():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or not user.is_admin:
        raise AuthorizationError("Admin access required")
    
    users = User.query.all()
    return jsonify([u.to_dict() for u in users])
```

### CRUD with Validation
```python
# CREATE
@app.route('/api/items', methods=['POST'])
@jwt_required()
@validate_request(ItemCreateSchema)
def create_item():
    data = request.validated_data
    item = Item(**data)
    db.session.add(item)
    db.session.commit()
    current_app.logger.info(f"Item created: {item.id}")
    return jsonify(item.to_dict()), 201

# READ
@app.route('/api/items/<int:item_id>')
def get_item(item_id):
    item = Item.query.get(item_id)
    if not item:
        raise ResourceNotFoundError(f"Item {item_id} not found")
    return jsonify(item.to_dict())

# UPDATE
@app.route('/api/items/<int:item_id>', methods=['PUT'])
@jwt_required()
@validate_request(ItemUpdateSchema)
def update_item(item_id):
    item = Item.query.get(item_id)
    if not item:
        raise ResourceNotFoundError(f"Item {item_id} not found")
    
    data = request.validated_data
    for key, value in data.items():
        setattr(item, key, value)
    
    db.session.commit()
    current_app.logger.info(f"Item updated: {item.id}")
    return jsonify(item.to_dict())

# DELETE
@app.route('/api/items/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_item(item_id):
    item = Item.query.get(item_id)
    if not item:
        raise ResourceNotFoundError(f"Item {item_id} not found")
    
    db.session.delete(item)
    db.session.commit()
    current_app.logger.info(f"Item deleted: {item_id}")
    return '', 204
```

## 🛠️ Debugging

```python
# Add breakpoint in code
import pdb; pdb.set_trace()

# Or use built-in breakpoint (Python 3.7+)
breakpoint()

# Log variable values
current_app.logger.debug(f"Variable value: {my_var}")
```

## 📊 Generate Secret Keys

```python
import secrets

# Generate SECRET_KEY
print(secrets.token_hex(32))

# Generate JWT_SECRET_KEY (use different key!)
print(secrets.token_hex(32))
```

## ⚡ Performance Tips

1. Use pagination for large datasets
2. Add database indexes for frequently queried fields
3. Use `db.session.bulk_save_objects()` for multiple inserts
4. Log at appropriate levels (use DEBUG in dev, INFO in prod)
5. Monitor log file sizes

---

**Need more help?** Check `UPGRADE_GUIDE.md` for detailed instructions!
