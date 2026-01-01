# 🍰 Cakes2 - Full-Stack Cake Ordering Platform

A modern full-stack web application for a custom cake ordering business, built with React and Flask. This platform allows customers to browse cakes, customize orders, and manage their purchases, while providing administrators with comprehensive order and inventory management capabilities.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [Database Management](#-database-management)
- [API Endpoints](#-api-endpoints)
- [Security Features](#-security-features)
- [Recommended Upgrades](#-recommended-upgrades)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

## ✨ Features

### Customer Features
- 🛍️ Browse available cakes with detailed descriptions and pricing
- 🎨 Customize orders (size, flavor, decorations, etc.)
- 🔐 User authentication (registration & login)
- 📦 Order tracking and history
- 📧 Contact form for inquiries
- 🛒 Shopping cart functionality

### Admin Features
- 👨‍💼 Admin dashboard for order management
- 📊 Inventory management (add, edit, delete cakes)
- 🎯 Customization options management
- 👥 User management
- 📈 Order status tracking

## 🛠 Tech Stack

### Frontend
- **Framework:** React 19.1.1
- **Build Tool:** Vite 7.1.2
- **Routing:** React Router DOM 7.8.2
- **HTTP Client:** Axios 1.11.0
- **UI/UX:** React Icons 5.5.0, React Toastify 11.0.5
- **Styling:** CSS with modern responsive design

### Backend
- **Framework:** Flask 3.1.2
- **Database ORM:** SQLAlchemy 2.0.43
- **Database:** PostgreSQL (with psycopg2-binary 2.9.10)
- **Authentication:** Flask-JWT-Extended 4.7.1 (Cookie-based)
- **Database Migrations:** Flask-Migrate 4.1.0 (Alembic 1.16.5)
- **Serialization:** Marshmallow 4.0.1
- **CORS:** Flask-CORS 6.0.1

## 📁 Project Structure

```
cakes2/
├── backend/
│   ├── controllers/          # API route handlers
│   ├── models/              # Database models
│   │   ├── User.py
│   │   ├── cake.py
│   │   ├── order.py
│   │   ├── customization.py
│   │   └── order_customization.py
│   ├── services/            # Business logic layer
│   ├── migrations/          # Database migrations
│   ├── instance/            # Instance-specific files
│   ├── app.py              # Application factory
│   ├── config.py           # Configuration settings
│   ├── extensions.py       # Flask extensions initialization
│   ├── requirements.txt    # Python dependencies
│   ├── seed.py            # Database seeding script
│   └── make_admin.py      # Admin user creation utility
│
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React Context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Utility functions
│   │   ├── assets/        # Static assets
│   │   ├── App.jsx        # Main App component
│   │   └── main.jsx       # Entry point
│   ├── public/            # Public assets
│   ├── package.json
│   └── vite.config.js
│
├── docs/                  # Documentation files
└── tests/                # Test files
```

## 📦 Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (v18.x or higher) - [Download](https://nodejs.org/)
- **Python** (v3.9 or higher) - [Download](https://www.python.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/)
- **Git** - [Download](https://git-scm.com/)
- **pip** (Python package manager) - Usually comes with Python
- **npm** or **yarn** (Node package manager) - Comes with Node.js

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/George-Dev-Web/cakes2.git
cd cakes2
```

### 2. Backend Setup

#### a. Navigate to Backend Directory
```bash
cd backend
```

#### b. Create Virtual Environment
```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### c. Install Python Dependencies
```bash
pip install -r requirements.txt
```

#### d. Set Up PostgreSQL Database

1. Open PostgreSQL command line or pgAdmin
2. Create a new database:
```sql
CREATE DATABASE cake_db;
```

3. Create a PostgreSQL user (if needed):
```sql
CREATE USER postgres WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE cake_db TO postgres;
```

#### e. Configure Environment Variables

Create a `.env` file in the `backend` directory:
```bash
touch .env  # On macOS/Linux
# or create manually on Windows
```

Add the following to `.env`:
```env
SECRET_KEY=your-secret-key-here-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-here-change-in-production
DATABASE_URL=postgresql://postgres:your_password@localhost/cake_db
FLASK_ENV=development
```

#### f. Update Database Configuration

Edit `backend/config.py` and update the `POSTGRES_URI` with your credentials:
```python
POSTGRES_URI = 'postgresql://postgres:your_password@localhost/cake_db'
```

**⚠️ IMPORTANT:** Remove the hardcoded password from `config.py` before deploying to production!

#### g. Initialize Database

```bash
# Initialize migrations (if not already done)
flask db init

# Create migration
flask db migrate -m "Initial migration"

# Apply migration
flask db upgrade
```

#### h. Seed the Database (Optional)

```bash
python seed.py
```

#### i. Create Admin User

```bash
python make_admin.py
```
Follow the prompts to create an admin account.

### 3. Frontend Setup

#### a. Navigate to Frontend Directory
```bash
cd ../frontend
```

#### b. Install Node Dependencies
```bash
npm install
# or
yarn install
```

#### c. Configure API Endpoint

The backend API should be accessible at `http://localhost:5000`. If you change the backend port, update the API base URL in your frontend configuration files (typically in `src/utils/` directory).

## ⚙️ Configuration

### Backend Configuration (`backend/config.py`)

Key configuration options:

- **SECRET_KEY**: Flask secret key for sessions (change in production!)
- **JWT_SECRET_KEY**: Secret key for JWT tokens (change in production!)
- **POSTGRES_URI**: Database connection string (currently hardcoded - should use env vars)
- **SQLALCHEMY_DATABASE_URI**: Full database URL
- **JWT_ACCESS_TOKEN_EXPIRES**: Token expiration time (default: 24 hours)
- **JWT_TOKEN_LOCATION**: Set to `["cookies"]` for cookie-based auth
- **JWT_COOKIE_HTTPONLY**: `True` for security (prevents JS access to cookies)
- **JWT_COOKIE_SECURE**: `True` in production (requires HTTPS)
- **JWT_COOKIE_SAMESITE**: `"Lax"` for CSRF protection
- **JWT_ACCESS_COOKIE_NAME**: `"access_token_cookie"` - cookie name in browser

### CORS Configuration

CORS is configured in `app.py` to allow requests from `http://localhost:5173` (Vite dev server) with credentials support.

### Frontend Configuration

- **Vite Config** (`frontend/vite.config.js`): Development server runs on port 5173
- **API Base URL**: Configure in your API utility files to point to backend

## 🏃 Running the Application

### Development Mode

#### 1. Start Backend Server

```bash
cd backend
# Activate virtual environment first
# On Windows: venv\Scripts\activate
# On macOS/Linux: source venv/bin/activate

python app.py
```
Backend will run on `http://localhost:5000`

#### 2. Start Frontend Development Server

Open a new terminal:
```bash
cd frontend
npm run dev
# or
yarn dev
```
Frontend will run on `http://localhost:5173`

### Production Mode

#### Backend
```bash
cd backend
# Use a production WSGI server like Gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

#### Frontend
```bash
cd frontend
npm run build
# Serve the 'dist' folder with a web server (nginx, Apache, etc.)
```

## 💾 Database Management

### Running Migrations

When you make changes to models:
```bash
cd backend
flask db migrate -m "Description of changes"
flask db upgrade
```

### Reset Database

```bash
flask db downgrade base
flask db upgrade
```

### Backup Database

```bash
pg_dump cake_db > backup.sql
```

### Restore Database

```bash
psql cake_db < backup.sql
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login (sets HTTP-only cookie)
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user (requires auth)

### Cakes
- `GET /api/cakes` - Get all cakes
- `GET /api/cakes/:id` - Get cake by ID
- `POST /api/admin/cakes` - Create cake (admin only)
- `PUT /api/admin/cakes/:id` - Update cake (admin only)
- `DELETE /api/admin/cakes/:id` - Delete cake (admin only)

### Orders
- `GET /api/orders` - Get user orders (requires auth)
- `POST /api/orders` - Create order (requires auth)
- `GET /api/orders/:id` - Get order details (requires auth)
- `GET /api/admin/orders` - Get all orders (admin only)
- `PUT /api/admin/orders/:id` - Update order status (admin only)

### Customization
- `GET /api/customization-options` - Get all customization options
- `POST /api/admin/customization-options` - Create option (admin only)

### Contact
- `POST /api/contact` - Submit contact form

## 🔒 Security Features

1. **JWT Authentication**: Secure token-based authentication with HTTP-only cookies
2. **Password Hashing**: Werkzeug password hashing for user credentials
3. **CORS Protection**: Configured CORS with credentials support for specific origin
4. **CSRF Protection**: SameSite cookie policy set to "Lax"
5. **SQL Injection Protection**: SQLAlchemy ORM with parameterized queries
6. **HttpOnly Cookies**: Prevents JavaScript access to authentication tokens
7. **Secure Cookies**: Enabled in production for HTTPS-only transmission

## 🚀 Recommended Upgrades

### 🔴 High Priority (Security & Stability)

1. **Environment Variables Management**
   - ⚠️ **CRITICAL**: Remove hardcoded password from `config.py`
   - Install `python-dotenv` for better `.env` handling
   - Create `.env.example` template
   - Add `.env` to `.gitignore`
   ```bash
   pip install python-dotenv
   ```
   Update `config.py`:
   ```python
   from dotenv import load_dotenv
   load_dotenv()
   ```

2. **Testing Framework**
   - Add pytest for backend testing
   - Add Vitest for frontend testing
   ```bash
   # Backend
   pip install pytest pytest-flask pytest-cov
   
   # Frontend
   npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
   ```

3. **Input Validation**
   - Add comprehensive request validation
   - Use Marshmallow schemas consistently
   ```bash
   pip install marshmallow-enum
   ```

4. **Logging System**
   - Implement structured logging with log rotation
   - Add request/response logging
   ```bash
   pip install python-json-logger
   ```

5. **Error Handling**
   - Implement global error handlers
   - Add custom exception classes
   - Don't expose stack traces in production

### 🟡 Medium Priority (Features & UX)

6. **API Documentation**
   - Implement Swagger/OpenAPI documentation
   ```bash
   pip install flasgger
   ```

7. **Email Notifications**
   - Implement Flask-Mail for order confirmations
   - Send order status updates
   ```bash
   pip install flask-mail
   ```

8. **Payment Integration**
   - Integrate Stripe or M-Pesa for payments
   ```bash
   pip install stripe
   ```

9. **File Upload Handling**
   - Add proper image upload for cake photos
   - Use cloud storage (AWS S3, Cloudinary)
   ```bash
   pip install boto3  # for AWS S3
   # or
   pip install cloudinary
   ```

10. **Rate Limiting**
    - Protect APIs from abuse and DDoS
    ```bash
    pip install flask-limiter
    ```

11. **Caching**
    - Add Redis for caching frequently accessed data
    - Cache cake listings and customization options
    ```bash
    pip install flask-caching redis
    ```

12. **Search Functionality**
    - Add search for cakes by name, category, flavor
    - Implement filters and sorting

### 🟢 Low Priority (Enhancements)

13. **Real-time Features**
    - Implement WebSockets for order status updates
    - Real-time admin notifications
    ```bash
    pip install flask-socketio
    ```

14. **Progressive Web App (PWA)**
    - Make frontend a PWA with service workers
    - Add offline support and push notifications

15. **Analytics Dashboard**
    - Add Google Analytics
    - Implement custom admin analytics (sales, popular cakes, etc.)

16. **Internationalization (i18n)**
    - Support multiple languages (English, Swahili, etc.)
    ```bash
    npm install react-i18next i18next
    pip install flask-babel
    ```

17. **Social Features**
    - Social media login (Google, Facebook)
    - Share cakes on social media
    ```bash
    pip install authlib
    ```

18. **Delivery Tracking**
    - Integrate with delivery services
    - Real-time delivery tracking

### 🔐 Security Enhancements

19. **Two-Factor Authentication (2FA)**
    - Add 2FA for admin accounts
    ```bash
    pip install pyotp qrcode
    ```

20. **Security Headers**
    - Add security headers (CSP, HSTS, etc.)
    ```bash
    pip install flask-talisman
    ```

21. **Refresh Tokens**
    - Implement refresh token mechanism
    - Shorter access token expiry (15 minutes)
    - Longer refresh token expiry (7 days)

22. **Audit Logging**
    - Track all admin actions
    - Log sensitive operations

23. **API Versioning**
    - Implement proper API versioning (e.g., `/api/v1/`)
    - Maintain backward compatibility

### ⚡ Performance Optimizations

24. **Database Optimization**
    - Add indexes to frequently queried columns
    - Optimize complex queries with proper joins
    - Configure connection pooling

25. **Frontend Optimizations**
    - Implement code splitting and lazy loading
    - Add image optimization and lazy loading
    - Use React.memo for expensive components
    - Implement virtual scrolling for long lists

26. **CDN Integration**
    - Serve static assets via CDN
    - Optimize image delivery

27. **Compression**
    - Enable Gzip compression for API responses
    ```bash
    pip install flask-compress
    ```

28. **Database Query Optimization**
    - Use eager loading to prevent N+1 queries
    - Add database query monitoring

## 🐛 Troubleshooting

### Backend Issues

**Database Connection Error**
```bash
# Check PostgreSQL is running
sudo service postgresql status  # Linux
brew services list  # macOS
# Check Services on Windows

# Verify credentials in config.py match your PostgreSQL setup
```

**Migration Errors**
```bash
# If migrations are corrupted, delete and recreate
rm -rf migrations/
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

**Import Errors**
```bash
# Ensure virtual environment is activated
# Reinstall requirements
pip install -r requirements.txt
```

**Port Already in Use**
```bash
# Change port in app.py
app.run(debug=True, port=5001)

# Or kill the process using port 5000
# Linux/macOS:
lsof -ti:5000 | xargs kill -9
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Frontend Issues

**Module Not Found**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**CORS Errors**
- Verify backend CORS configuration in `app.py`
- Ensure credentials are properly configured: `supports_credentials=True`
- Check that frontend is running on `http://localhost:5173`

**Build Errors**
```bash
# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

**API Connection Issues**
- Verify backend is running on port 5000
- Check API base URL configuration
- Verify axios is configured with `withCredentials: true`

### Database Issues

**Password Authentication Failed**
- Verify PostgreSQL user exists and has correct password
- Check `pg_hba.conf` for authentication method
- Update `config.py` with correct credentials

**Table Does Not Exist**
```bash
# Run migrations
flask db upgrade
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Coding Standards

- Follow PEP 8 for Python code
- Use ESLint for JavaScript/React code
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📝 Best Practices

### Security
- Never commit `.env` files or secrets
- Always use environment variables for sensitive data
- Keep dependencies up to date
- Use HTTPS in production
- Implement rate limiting on all endpoints

### Code Quality
- Write clean, readable code with comments
- Follow DRY (Don't Repeat Yourself) principle
- Use meaningful variable and function names
- Keep functions small and focused

### Git Workflow
- Create feature branches for new work
- Write descriptive commit messages
- Squash commits before merging
- Keep pull requests focused and small

## 📞 Support & Contact

For issues, questions, or contributions:
- Open an issue on [GitHub](https://github.com/George-Dev-Web/cakes2/issues)
- Contact the development team
- Check existing documentation in the `/docs` folder

## 🙏 Acknowledgments

- Flask and React communities
- SQLAlchemy and PostgreSQL documentation
- All contributors and testers
- Open source libraries used in this project

---

**⚠️ Security Warning:** This project contains hardcoded credentials in `config.py`. Before deploying to production:
1. Remove all hardcoded passwords and secrets
2. Use environment variables exclusively
3. Set `JWT_COOKIE_SECURE = True`
4. Use strong, randomly generated secret keys
5. Enable HTTPS/SSL
6. Review and update all security configurations

**💡 Quick Start Reminder:**
```bash
# Backend (Terminal 1)
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python app.py

# Frontend (Terminal 2)
cd frontend
npm run dev
```

Happy coding! 🚀