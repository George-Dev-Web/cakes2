# backend/utils/email_service.py
from flask_mail import Mail, Message
from flask import current_app, render_template_string
from threading import Thread

mail = Mail()


def send_async_email(app, msg):
    """Send email asynchronously."""
    with app.app_context():
        try:
            mail.send(msg)
        except Exception as e:
            current_app.logger.error(f"Error sending email: {e}", exc_info=True)


def send_email(subject, recipients, text_body, html_body=None):
    """
    Send email with optional HTML body.
    
    Args:
        subject: Email subject
        recipients: List of recipient email addresses
        text_body: Plain text email body
        html_body: Optional HTML email body
    """
    msg = Message(
        subject=subject,
        recipients=recipients,
        sender=current_app.config['MAIL_USERNAME']
    )
    msg.body = text_body
    if html_body:
        msg.html = html_body
    
    # Send asynchronously
    Thread(
        target=send_async_email,
        args=(current_app._get_current_object(), msg)
    ).start()


def send_order_confirmation_email(order):
    """
    Send order confirmation email to customer.
    
    Args:
        order: Order object
    """
    subject = f"Order Confirmation - {order.order_number}"
    
    # Plain text version
    text_body = f"""
Dear {order.customer_name},

Thank you for your order!

Order Number: {order.order_number}
Order Date: {order.created_at.strftime('%B %d, %Y')}
Total Amount: KSh {order.total_price:,.2f}

Delivery Details:
Address: {order.delivery_address}
Date: {order.delivery_date.strftime('%B %d, %Y')}
Time: {order.delivery_time or 'As scheduled'}

Order Summary:
"""
    
    for item in order.items:
        cake_name = item.cake.name if item.cake else "Custom Cake"
        text_body += f"\n- {cake_name} ({item.cake_size}, {item.quantity}x) - KSh {item.subtotal:,.2f}"
        if item.message_on_cake:
            text_body += f"\n  Message: {item.message_on_cake}"
    
    text_body += f"""

Subtotal: KSh {order.subtotal:,.2f}
Delivery Fee: KSh {order.delivery_fee:,.2f}
Tax (16%): KSh {order.tax:,.2f}
Total: KSh {order.total_price:,.2f}

Payment Method: {order.payment_method}

{"Special Instructions: " + order.special_instructions if order.special_instructions else ""}

You can track your order here:
{current_app.config.get('FRONTEND_URL', 'http://localhost:5173')}/track/{order.order_number}

If you have any questions, please contact us.

Best regards,
Cakes2 Team
"""
    
    # HTML version
    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #ff6b9d; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
        .content {{ background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }}
        .order-details {{ background: white; padding: 15px; margin: 10px 0; border-radius: 5px; }}
        .item {{ padding: 10px 0; border-bottom: 1px solid #eee; }}
        .total {{ font-size: 1.2em; font-weight: bold; margin-top: 10px; }}
        .button {{ display: inline-block; padding: 12px 24px; background: #ff6b9d; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }}
        .footer {{ text-align: center; padding: 20px; color: #777; font-size: 0.9em; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎂 Order Confirmation</h1>
        </div>
        <div class="content">
            <h2>Thank you, {order.customer_name}!</h2>
            <p>Your order has been received and is being processed.</p>
            
            <div class="order-details">
                <p><strong>Order Number:</strong> {order.order_number}</p>
                <p><strong>Order Date:</strong> {order.created_at.strftime('%B %d, %Y at %I:%M %p')}</p>
                <p><strong>Delivery Date:</strong> {order.delivery_date.strftime('%B %d, %Y')}</p>
                <p><strong>Delivery Address:</strong> {order.delivery_address}</p>
            </div>
            
            <h3>Order Items:</h3>
"""
    
    for item in order.items:
        cake_name = item.cake.name if item.cake else "Custom Cake"
        html_body += f"""
            <div class="item">
                <strong>{cake_name}</strong> ({item.cake_size}, {item.quantity}x)<br>
                <small>Price: KSh {item.subtotal:,.2f}</small>
                {f'<br><small>Message: {item.message_on_cake}</small>' if item.message_on_cake else ''}
            </div>
"""
    
    html_body += f"""
            <div class="order-details" style="margin-top: 20px;">
                <p>Subtotal: KSh {order.subtotal:,.2f}</p>
                <p>Delivery Fee: KSh {order.delivery_fee:,.2f}</p>
                <p>Tax (16%): KSh {order.tax:,.2f}</p>
                <p class="total">Total: KSh {order.total_price:,.2f}</p>
                <p><strong>Payment Method:</strong> {order.payment_method}</p>
            </div>
            
            <center>
                <a href="{current_app.config.get('FRONTEND_URL', 'http://localhost:5173')}/track/{order.order_number}" class="button">Track Your Order</a>
            </center>
            
            <p>If you have any questions, please don't hesitate to contact us.</p>
        </div>
        <div class="footer">
            <p>Thank you for choosing Cakes2!</p>
            <p>This is an automated email. Please do not reply.</p>
        </div>
    </div>
</body>
</html>
"""
    
    send_email(subject, [order.customer_email], text_body, html_body)
    current_app.logger.info(f"Order confirmation email sent to {order.customer_email}")


def send_order_status_update_email(order):
    """
    Send order status update email to customer.
    
    Args:
        order: Order object
    """
    status_messages = {
        'confirmed': 'Your order has been confirmed!',
        'preparing': 'Your cake is being prepared!',
        'ready': 'Your order is ready for delivery/pickup!',
        'delivered': 'Your order has been delivered!',
        'cancelled': 'Your order has been cancelled.'
    }
    
    subject = f"Order {order.order_number} - {status_messages.get(order.status, 'Status Update')}"
    
    text_body = f"""
Dear {order.customer_name},

{status_messages.get(order.status, 'Your order status has been updated.')}

Order Number: {order.order_number}
Current Status: {order.status.upper()}

Delivery Date: {order.delivery_date.strftime('%B %d, %Y')}
Delivery Address: {order.delivery_address}

Track your order: {current_app.config.get('FRONTEND_URL', 'http://localhost:5173')}/track/{order.order_number}

Thank you for your patience!

Best regards,
Cakes2 Team
"""
    
    html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: #ff6b9d; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
        .content {{ background: #f9f9f9; padding: 20px; border: 1px solid #ddd; }}
        .status-badge {{ display: inline-block; padding: 10px 20px; background: #4CAF50; color: white; border-radius: 20px; font-weight: bold; }}
        .button {{ display: inline-block; padding: 12px 24px; background: #ff6b9d; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📦 Order Status Update</h1>
        </div>
        <div class="content">
            <h2>Hi {order.customer_name},</h2>
            <p>{status_messages.get(order.status, 'Your order status has been updated.')}</p>
            
            <center>
                <div class="status-badge">{order.status.upper()}</div>
            </center>
            
            <p><strong>Order Number:</strong> {order.order_number}</p>
            <p><strong>Delivery Date:</strong> {order.delivery_date.strftime('%B %d, %Y')}</p>
            
            <center>
                <a href="{current_app.config.get('FRONTEND_URL', 'http://localhost:5173')}/track/{order.order_number}" class="button">Track Your Order</a>
            </center>
        </div>
    </div>
</body>
</html>
"""
    
    send_email(subject, [order.customer_email], text_body, html_body)
    current_app.logger.info(f"Status update email sent to {order.customer_email}")
