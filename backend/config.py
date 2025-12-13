# # backend/config.py
# import os
# from datetime import timedelta

# class Config:
#     SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-for-cake-website'
#     POSTGRES_URI = 'postgresql://postgres:911Gt3RS@localhost/cake_db'
#     SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or POSTGRES_URI
#     SQLALCHEMY_TRACK_MODIFICATIONS = False
#     JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key'
#     JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)



# backend/config.py
import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-for-cake-website'
    POSTGRES_URI = 'postgresql://postgres:911Gt3RS@localhost/cake_db'
    
    # Database Settings
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or POSTGRES_URI
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT Settings
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key'
    
    # --- START OF NEW COOKIE CONFIGURATION ---
    
    # 1. Instructs Flask-JWT-Extended to look for the token in cookies, not the Authorization header
    # Must be a list, even if only 'cookies' is used.
    JWT_TOKEN_LOCATION = ["cookies"] 

    # 2. Defines the name of the cookie containing the access token
    # This name will appear in the user's browser storage.
    JWT_ACCESS_COOKIE_NAME = "access_token_cookie" 
    
    # 3. THE CRITICAL SECURITY SETTING: Prevents client-side JavaScript from accessing the cookie.
    JWT_COOKIE_HTTPONLY = True 
    
    # 4. REQUIRED FOR PRODUCTION: Ensures the cookie is only sent over HTTPS.
    # Set to False only if you are developing locally without HTTPS (like on localhost).
    JWT_COOKIE_SECURE = os.environ.get('FLASK_ENV') == 'production' 

    # 5. Helps prevent Cross-Site Request Forgery (CSRF). 
    # 'Lax' is a secure default that works well with most web apps.
    JWT_COOKIE_SAMESITE = "Lax" 

    # 6. We no longer need to set a long expiration for the JWT itself. 
    # For security, you often want the token to expire quickly (e.g., 15 minutes) 
    # and use a *Refresh Token* (in a separate, long-lived cookie) to get a new one.
    # If not using refresh tokens, keep your original 24 hours.
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24) 
    
    # --- END OF NEW COOKIE CONFIGURATION ---