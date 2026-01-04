# from flask import Blueprint, request, jsonify
# from extensions import db
# from models.customization import CustomizationOption
# from marshmallow import Schema, fields

# customization_bp = Blueprint("customizations", __name__, url_prefix="/api")

# class CustomizationOptionSchema(Schema):
#     id = fields.Int(dump_only=True)
#     category = fields.Str(required=True)
#     name = fields.Str(required=True)
#     price = fields.Float(required=True)
#     active = fields.Bool()

# customization_option_schema = CustomizationOptionSchema()
# customization_options_schema = CustomizationOptionSchema(many=True)



# @customization_bp.route("/customizations", methods=["GET"])
# def get_customizations():
#     customizations = CustomizationOption.query.filter_by(active=True).all()
#     result = customization_options_schema.dump(customizations)  # flat array
#     return jsonify(result), 200



# # Admin: Add a new customization
# @customization_bp.route("/admin/customizations", methods=["POST"])
# def add_customization():
#     data = request.get_json()
#     new_item = CustomizationOption(
#         name=data.get("name"),
#         category=data.get("category"),
#         price=data.get("price", 0.0)
#     )
#     db.session.add(new_item)
#     db.session.commit()
#     return jsonify(customization_option_schema.dump(new_item)), 201


# # Admin: Update customization
# @customization_bp.route("/admin/customizations/<int:id>", methods=["PUT"])
# def update_customization(id):
#     data = request.get_json()
#     customization = CustomizationOption.query.get_or_404(id)
#     customization.name = data.get("name", customization.name)
#     customization.category = data.get("category", customization.category)
#     customization.price = data.get("price", customization.price)
#     if 'active' in data:
#         customization.active = data.get("active")
#     db.session.commit()
#     return jsonify(customization_option_schema.dump(customization)), 200


# # Admin: Delete customization
# @customization_bp.route("/admin/customizations/<int:id>", methods=["DELETE"])
# def delete_customization(id):
#     customization = CustomizationOption.query.get_or_404(id)
#     db.session.delete(customization)
#     db.session.commit()
#     return "", 204

from flask import Blueprint, request, jsonify
from extensions import db
from models.customization import CustomizationOption
from marshmallow import Schema, fields

customization_bp = Blueprint("customizations", __name__, url_prefix="/api")

class CustomizationOptionSchema(Schema):
    id = fields.Int(dump_only=True)
    category = fields.Str(required=True)
    name = fields.Str(required=True)
    price = fields.Float(required=True)
    active = fields.Bool()
    description = fields.Str()
    image_url = fields.Str()

customization_option_schema = CustomizationOptionSchema()
customization_options_schema = CustomizationOptionSchema(many=True)


# Get all active customizations, GROUPED BY CATEGORY (Crucial for the frontend)
@customization_bp.route("/customizations", methods=["GET"])
def get_customizations():
    # Fetch all active options
    customizations = CustomizationOption.query.filter_by(active=True).order_by(CustomizationOption.category, CustomizationOption.price).all()
    grouped = {}
    
    # Group the options into a dictionary: { "Category": [option1, option2], ... }
    for c in customizations:
        # Use a sensible display name for the category if needed, otherwise use the category itself
        category_name = c.category 
        if category_name not in grouped:
            grouped[category_name] = []
            
        # Append the serialized option data
        grouped[category_name].append(customization_option_schema.dump(c))
        
    # Convert the grouped dictionary into the array structure the frontend expects:
    # [{"category": "Design", "options": [...]}, ...]
    result_array = [
        {"category": cat, "options": options_list}
        for cat, options_list in grouped.items()
    ]

    # Return the structured array
    return jsonify(result_array), 200

@customization_bp.route("/customizations/categories", methods=["GET"])
def get_unique_categories():
    categories = db.session.query(CustomizationOption.category).distinct().all()
    # Extract just the category strings from the result tuples
    category_names = [c[0] for c in categories]
    return jsonify({"categories": category_names}), 200


# Admin: Add a new customization
@customization_bp.route("/admin/customizations", methods=["POST"])
def add_customization():
    data = request.get_json()
    new_item = CustomizationOption(
        name=data.get("name"),
        category=data.get("category"),
        price=data.get("price", 0.0),
        description=data.get("description"),
        image_url=data.get("image_url")
    )
    db.session.add(new_item)
    db.session.commit()
    return jsonify(customization_option_schema.dump(new_item)), 201


# Admin: Update customization
@customization_bp.route("/admin/customizations/<int:id>", methods=["PUT"])
def update_customization(id):
    data = request.get_json()
    customization = CustomizationOption.query.get_or_404(id)
    
    # Update fields if present in data
    customization.name = data.get("name", customization.name)
    customization.category = data.get("category", customization.category)
    customization.price = data.get("price", customization.price)
    customization.description = data.get("description", customization.description)
    customization.image_url = data.get("image_url", customization.image_url)
    
    if 'active' in data:
        customization.active = data.get("active")
        
    db.session.commit()
    return jsonify(customization_option_schema.dump(customization)), 200


# Admin: Delete customization
@customization_bp.route("/admin/customizations/<int:id>", methods=["DELETE"])
def delete_customization(id):
    customization = CustomizationOption.query.get_or_404(id)
    db.session.delete(customization)
    db.session.commit()
    return "", 204