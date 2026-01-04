# backend/seed.py
import sys
import os
from datetime import datetime, timedelta
import random

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from extensions import db
from models.cake import Cake
from models.User import User
from models.order import Order, OrderItem
from models.customization import CustomizationOption

def create_sample_data():
    app = create_app()
    
    with app.app_context():
        # Clear existing data
        print("Clearing existing data...")
        db.session.query(Order).delete()
        db.session.query(Cake).delete()
        db.session.query(User).delete()
        db.session.query(CustomizationOption).delete() # Clear customization options
        db.session.commit()
        
        # Create sample cakes
        print("Creating sample cakes...")
        cakes = [
            Cake(
                name="Chocolate Dream",
                description="Rich chocolate cake with layers of chocolate mousse and ganache frosting. Topped with chocolate shavings and fresh berries.",
                price=45.00,
                image_url="https://images.unsplash.com/photo-1578985545062-69928b1d9587?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1089&q=80"
            ),
            Cake(
                name="Vanilla Bliss",
                description="Classic vanilla sponge with creamy buttercream frosting and fresh seasonal berries. Light and fluffy with a delicate vanilla flavor.",
                price=40.00,
                image_url="https://images.unsplash.com/photo-1558301197-5eb5f2a06e6f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1169&q=80"
            ),
            Cake(
                name="Red Velvet Elegance",
                description="Traditional red velvet cake with cream cheese frosting. Moist layers with a hint of cocoa, finished with decorative elements.",
                price=50.00,
                image_url="https://images.unsplash.com/photo-1614707267537-b85aaf00c4b7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
            ),
            Cake(
                name="Lemon Delight",
                description="Zesty lemon cake with lemon curd filling and meringue frosting. Refreshing and tangy with a sweet finish.",
                price=42.00,
                image_url="https://images.unsplash.com/photo-1558301185-0c2f2a7b4db8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80"
            ),
            Cake(
                name="Carrot Wonder",
                description="Moist carrot cake with cream cheese frosting and walnut pieces. Spiced with cinnamon and nutmeg for a warm flavor.",
                price=48.00,
                image_url="https://images.unsplash.com/photo-1627873646-08a0bbd48d8c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80"
            ),
            Cake(
                name="Strawberry Shortcake",
                description="Light sponge cake layered with fresh strawberries and whipped cream. A classic summer favorite.",
                price=44.00,
                image_url="https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80"
            ),
            Cake(
                name="Cookies & Cream",
                description="Chocolate cake with crushed cookie pieces and cookies & cream frosting. Topped with chocolate cookie crumbs.",
                price=52.00,
                image_url="https://images.unsplash.com/photo-1577471488278-16cafe3549da?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1171&q=80"
            ),
            Cake(
                name="Tropical Paradise",
                description="Coconut cake with pineapple filling and coconut cream frosting. Topped with toasted coconut and edible flowers.",
                price=55.00,
                image_url="https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
            )
        ]
        
        for cake in cakes:
            db.session.add(cake)
        
        db.session.commit()
        print(f"Created {len(cakes)} sample cakes")

        # Create sample customization options
        print("Creating sample customization options...")
        customization_options = [
            # Cake Sizes
            CustomizationOption(category='size', name='Small', price=2000.0, description='Serves 6-8'),
            CustomizationOption(category='size', name='Medium', price=3500.0, description='Serves 10-14'),
            CustomizationOption(category='size', name='Large', price=5000.0, description='Serves 16-20'),
            CustomizationOption(category='size', name='XL', price=7500.0, description='Serves 22-26'),
            # Dietary Restrictions
            CustomizationOption(category='dietary_restriction', name='Gluten-Free', price=500.0, description='Gluten-free flour blend'),
            CustomizationOption(category='dietary_restriction', name='Vegan', price=500.0, description='Plant-based ingredients'),
        ]

        for option in customization_options:
            db.session.add(option)
        db.session.commit()
        print(f"Created {len(customization_options)} sample customization options")
        
        # Create sample users
        print("Creating sample users...")
        # Update the user creation part of the seed.py script
# Add these additional fields to the sample users

        users = [
            User(
                name="Emma Johnson",
                email="emma@example.com",
                phone="555-123-4567",
                address="123 Main St, Anytown, CA 12345",
                preferences='{"favoriteCakeType": "chocolate", "dietaryRestrictions": "nut-free", "specialOccasions": "Birthday"}'
            ),
            User(
                name="James Wilson",
                email="james@example.com",
                phone="555-234-5678",
                address="456 Oak Ave, Somewhere, NY 67890",
                preferences='{"favoriteCakeType": "red-velvet", "dietaryRestrictions": "dairy-free", "specialOccasions": "Anniversary"}'
            ),
            
        ]
                
        # Set passwords for all users
        for user in users:
            user.set_password("password123")  # Simple password for testing
        
        for user in users:
            db.session.add(user)
        
        db.session.commit()
        print(f"Created {len(users)} sample users")
        
        # Create sample orders
        print("Creating sample orders...")
        statuses = ['pending', 'confirmed', 'completed', 'cancelled']
        special_requests = [
            "Please add 'Happy Birthday' message",
            "Need it by 2 PM",
            "Allergic to nuts, please ensure no cross-contamination",
            "Add extra frosting",
            "Please make it eggless",
            "Delivery instructions: Ring bell twice",
            "Need vegan options",
            "Please include candles",
            ""
        ]
        
        orders = []
        
        # Create orders for each user
        for user in users:
            for i in range(random.randint(2, 5)):  # 2-5 orders per user
                cake = random.choice(cakes)
                quantity = random.randint(1, 3)
                delivery_date = datetime.now().date() + timedelta(days=random.randint(1, 30))
                order_number = f"ORD-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
                
                # Create Order
                order = Order(
                    user_id=user.id,
                    order_number=order_number,
                    customer_name=user.name,
                    customer_email=user.email,
                    customer_phone=f"555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
                    delivery_address="Random Address",
                    delivery_date=delivery_date,
                    delivery_time=random.choice(['Morning', 'Afternoon', 'Evening']),
                    payment_method=random.choice(['Cash on Delivery', 'M-Pesa']),
                    status=random.choice(statuses),
                    special_instructions=random.choice(special_requests),
                    created_at=datetime.now() - timedelta(days=random.randint(1, 90)),
                    subtotal=0.0, # Will be calculated
                    total_price=0.0 # Will be calculated
                )
                db.session.add(order)
                db.session.flush() # Assign an ID to the order before creating items

                # Create OrderItem
                order_item_base_price = cake.price # Assuming cake.price is the base for order item
                order_item_unit_price = order_item_base_price # No customizations for seed data yet
                order_item_subtotal = order_item_unit_price * quantity

                order_item = OrderItem(
                    order_id=order.id,
                    cake_id=cake.id,
                    quantity=quantity,
                    base_price=order_item_base_price,
                    customization_price=0.0,
                    unit_price=order_item_unit_price,
                    subtotal=order_item_subtotal,
                    cake_shape=random.choice(['Round', 'Square']),
                    cake_size=random.choice(['Small', 'Medium', 'Large']),
                    flavor=random.choice(['Vanilla', 'Chocolate', 'Red Velvet']),
                    frosting=random.choice(['Buttercream', 'Cream Cheese']),
                    message_on_cake=random.choice(["Happy Birthday!", "Congratulations!", ""]),
                    notes=random.choice(special_requests)
                )
                db.session.add(order_item)
                
                order.subtotal += order_item_subtotal
                order.total_price += order_item_subtotal # For simplicity, total_price = subtotal for seed

                orders.append(order)
        
        # Add some guest orders (without user_id)
        for i in range(10):
            cake = random.choice(cakes)
            quantity = random.randint(1, 2)
            delivery_date = datetime.now().date() + timedelta(days=random.randint(1, 30))
            order_number = f"ORD-{datetime.now().strftime('%Y%m%d')}-{random.randint(1000, 9999)}"
            
            customer_names = ["Olivia Davis", "William Taylor", "Ava Anderson", "Benjamin Thomas", "Mia Jackson"]
            
            # Create Order
            order = Order(
                user_id=None,
                order_number=order_number,
                customer_name=random.choice(customer_names),
                customer_email=f"customer{random.randint(100, 999)}@example.com",
                customer_phone=f"555-{random.randint(100, 999)}-{random.randint(1000, 9999)}",
                delivery_address="Guest Address",
                delivery_date=delivery_date,
                delivery_time=random.choice(['Morning', 'Afternoon', 'Evening']),
                payment_method=random.choice(['Cash on Delivery', 'M-Pesa']),
                status=random.choice(statuses),
                special_instructions=random.choice(special_requests),
                created_at=datetime.now() - timedelta(days=random.randint(1, 90)),
                subtotal=0.0, # Will be calculated
                total_price=0.0 # Will be calculated
            )
            db.session.add(order)
            db.session.flush() # Assign an ID to the order before creating items

            # Create OrderItem
            order_item_base_price = cake.price
            order_item_unit_price = order_item_base_price
            order_item_subtotal = order_item_unit_price * quantity

            order_item = OrderItem(
                order_id=order.id,
                cake_id=cake.id,
                quantity=quantity,
                base_price=order_item_base_price,
                customization_price=0.0,
                unit_price=order_item_unit_price,
                subtotal=order_item_subtotal,
                cake_shape=random.choice(['Round', 'Square']),
                cake_size=random.choice(['Small', 'Medium', 'Large']),
                flavor=random.choice(['Vanilla', 'Chocolate', 'Red Velvet']),
                frosting=random.choice(['Buttercream', 'Cream Cheese']),
                message_on_cake=random.choice(["Happy Birthday!", "Congratulations!", ""]),
                notes=random.choice(special_requests)
            )
            db.session.add(order_item)

            order.subtotal += order_item_subtotal
            order.total_price += order_item_subtotal # For simplicity, total_price = subtotal for seed

            orders.append(order)
        
        db.session.commit()
        print(f"Created {len(orders)} sample orders")
        
        print("Seed data created successfully!")
        
        # Print login information for testing
        print("\n=== Test User Login Information ===")
        for user in users:
            print(f"Email: {user.email}, Password: password123")
        
        print("\nYou can now log in with any of these accounts to test the application.")

if __name__ == "__main__":
    create_sample_data()