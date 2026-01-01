# backend/controllers/upload_controller.py
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from utils.image_upload import upload_image_to_cloudinary, upload_image_locally, allowed_file
from utils.exceptions import ValidationError

upload_bp = Blueprint('upload', __name__)


@upload_bp.route('/upload/image', methods=['POST'])
def upload_image():
    """
    Upload image to Cloudinary or local storage.
    
    Form Data:
        file: Image file
        folder: Optional folder name (default: 'cakes2')
    
    Returns:
        JSON: Upload result with URL
    """
    try:
        # Check if file is present
        if 'file' not in request.files:
            raise ValidationError("No file provided")
        
        file = request.files['file']
        
        if file.filename == '':
            raise ValidationError("No file selected")
        
        if not allowed_file(file.filename):
            raise ValidationError(
                "Invalid file type. Allowed: png, jpg, jpeg, gif, webp"
            )
        
        # Get folder from form data
        folder = request.form.get('folder', 'cakes2')
        
        # Try Cloudinary first, fallback to local
        try:
            result = upload_image_to_cloudinary(file, folder)
            current_app.logger.info("Image uploaded to Cloudinary")
        except:
            # Fallback to local storage
            result = upload_image_locally(file)
            current_app.logger.info("Image uploaded locally (Cloudinary not configured)")
        
        return jsonify({
            'message': 'Image uploaded successfully',
            'url': result['url'],
            'public_id': result.get('public_id'),
            'filename': result.get('filename')
        }), 201
        
    except ValidationError:
        raise
    except Exception as e:
        current_app.logger.error(f"Upload error: {e}", exc_info=True)
        raise ValidationError(f"Failed to upload image: {str(e)}")


@upload_bp.route('/upload/multiple', methods=['POST'])
def upload_multiple_images():
    """
    Upload multiple images at once.
    
    Form Data:
        files[]: Multiple image files
        folder: Optional folder name
    
    Returns:
        JSON: List of upload results
    """
    try:
        # Check if files are present
        if 'files[]' not in request.files:
            raise ValidationError("No files provided")
        
        files = request.files.getlist('files[]')
        
        if not files:
            raise ValidationError("No files selected")
        
        folder = request.form.get('folder', 'cakes2')
        
        results = []
        errors = []
        
        for file in files:
            try:
                if file.filename == '' or not allowed_file(file.filename):
                    errors.append({
                        'filename': file.filename,
                        'error': 'Invalid file'
                    })
                    continue
                
                # Try Cloudinary first
                try:
                    result = upload_image_to_cloudinary(file, folder)
                except:
                    result = upload_image_locally(file)
                
                results.append({
                    'filename': file.filename,
                    'url': result['url'],
                    'public_id': result.get('public_id')
                })
                
            except Exception as e:
                errors.append({
                    'filename': file.filename,
                    'error': str(e)
                })
        
        return jsonify({
            'message': f'Uploaded {len(results)} of {len(files)} files',
            'results': results,
            'errors': errors if errors else None
        }), 201
        
    except ValidationError:
        raise
    except Exception as e:
        current_app.logger.error(f"Multiple upload error: {e}", exc_info=True)
        raise ValidationError(f"Failed to upload images: {str(e)}")
