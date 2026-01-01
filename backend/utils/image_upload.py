# backend/utils/image_upload.py
import cloudinary
import cloudinary.uploader
import cloudinary.api
from flask import current_app
import os
from werkzeug.utils import secure_filename
import uuid


def init_cloudinary(app):
    """
    Initialize Cloudinary with app config.
    
    Add to your .env:
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    """
    cloudinary.config(
        cloud_name=app.config.get('CLOUDINARY_CLOUD_NAME'),
        api_key=app.config.get('CLOUDINARY_API_KEY'),
        api_secret=app.config.get('CLOUDINARY_API_SECRET'),
        secure=True
    )


def upload_image_to_cloudinary(file, folder='cakes2'):
    """
    Upload image to Cloudinary.
    
    Args:
        file: File object from request.files
        folder: Cloudinary folder name
    
    Returns:
        dict: Upload result with url, public_id, etc.
    """
    try:
        # Generate unique filename
        unique_filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
        
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            file,
            folder=folder,
            public_id=unique_filename,
            resource_type='auto',
            transformation=[
                {'width': 1200, 'height': 1200, 'crop': 'limit'},
                {'quality': 'auto:good'}
            ]
        )
        
        current_app.logger.info(
            f"Image uploaded to Cloudinary: {result['public_id']}"
        )
        
        return {
            'url': result['secure_url'],
            'public_id': result['public_id'],
            'width': result['width'],
            'height': result['height'],
            'format': result['format']
        }
        
    except Exception as e:
        current_app.logger.error(f"Cloudinary upload error: {e}", exc_info=True)
        raise Exception(f"Failed to upload image: {str(e)}")


def delete_image_from_cloudinary(public_id):
    """
    Delete image from Cloudinary.
    
    Args:
        public_id: Cloudinary public ID
    
    Returns:
        dict: Deletion result
    """
    try:
        result = cloudinary.uploader.destroy(public_id)
        current_app.logger.info(f"Image deleted from Cloudinary: {public_id}")
        return result
    except Exception as e:
        current_app.logger.error(f"Cloudinary delete error: {e}", exc_info=True)
        raise Exception(f"Failed to delete image: {str(e)}")


def get_image_thumbnail_url(url, width=300, height=300):
    """
    Generate thumbnail URL from Cloudinary image URL.
    
    Args:
        url: Original Cloudinary URL
        width: Thumbnail width
        height: Thumbnail height
    
    Returns:
        str: Thumbnail URL
    """
    # Extract public_id from URL
    if 'cloudinary.com' in url:
        parts = url.split('/upload/')
        if len(parts) == 2:
            transformation = f"c_fill,w_{width},h_{height},g_auto"
            return f"{parts[0]}/upload/{transformation}/{parts[1]}"
    return url


# Local file storage fallback (if not using Cloudinary)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}


def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def upload_image_locally(file, upload_folder='uploads/images'):
    """
    Upload image to local server (fallback if not using Cloudinary).
    
    Args:
        file: File object from request.files
        upload_folder: Local folder path
    
    Returns:
        dict: Upload result with url and filename
    """
    if not file or not allowed_file(file.filename):
        raise ValueError("Invalid file type")
    
    # Create upload folder if it doesn't exist
    upload_path = os.path.join(current_app.root_path, upload_folder)
    os.makedirs(upload_path, exist_ok=True)
    
    # Generate unique filename
    filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
    file_path = os.path.join(upload_path, filename)
    
    # Save file
    file.save(file_path)
    
    # Return URL (you'll need to serve this via a route)
    url = f"/uploads/images/{filename}"
    
    current_app.logger.info(f"Image uploaded locally: {filename}")
    
    return {
        'url': url,
        'filename': filename,
        'path': file_path
    }
