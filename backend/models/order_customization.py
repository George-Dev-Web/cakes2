from extensions import db # Import db for Flask-SQLAlchemy models
from sqlalchemy.orm import relationship

class OrderCustomization(db.Model): # Use db.Model instead of Base
    __tablename__ = "order_customization"

    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey("order.id"), nullable=False)
    # FIX: Reference the correct table name 'customization_options'
    customization_option_id = db.Column(db.Integer, db.ForeignKey("customization_options.id"), nullable=False)

    # Relationships
    order = relationship("Order", back_populates="customizations")
    option = relationship("models.options.CustomizationOption")