from extensions import db

class CustomizationOption(db.Model):
    __tablename__ = 'customization_options'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False) # e.g., "Fondant Flowers"
    category = db.Column(db.String(50)) # e.g., "Toppings", "Base", "Filling"
    price = db.Column(db.Float, default=0.0)
    is_available = db.Column(db.Boolean, default=True)

    def __repr__(self):
        return f'<CustomizationOption {self.name}>'