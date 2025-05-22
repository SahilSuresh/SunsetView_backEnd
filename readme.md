# SunsetView.com Backend API

A robust Node.js/Express backend API for the SunsetView.com hotel booking platform, featuring user authentication, hotel management, booking processing, payment integration, and administrative controls.

## 🌟 Overview

This backend API powers the SunsetView.com hotel booking platform, providing comprehensive functionality for:

- **User Management**: Registration, authentication, and profile management
- **Hotel Operations**: CRUD operations for hotel listings with image management
- **Booking System**: Complete reservation processing with payment integration
- **Admin Panel**: Administrative controls and analytics
- **Email Services**: Automated notifications and confirmations
- **Payment Processing**: Secure Stripe integration for transactions

## 🏗️ Architecture

```
Backend Structure:
├── src/
│   ├── middleware/           # Authentication & validation middleware
│   ├── routes/              # API endpoint definitions
│   ├── userModels/          # MongoDB schemas and models
│   ├── services/            # Business logic and external services
│   ├── share/               # Shared types and utilities
│   └── scripts/             # Database utility scripts
├── .env                     # Environment configuration
├── package.json
├── tsconfig.json
└── index.ts                 # Application entry point
```

## 🛠️ Technology Stack

### Core Technologies
- **Node.js** (v18+) - Runtime environment
- **Express.js** - Web application framework
- **TypeScript** - Type-safe JavaScript
- **MongoDB** with **Mongoose** - Database and ODM

### Key Dependencies
- **JWT** - JSON Web Token authentication
- **bcryptjs** - Password hashing
- **Stripe** - Payment processing
- **Cloudinary** - Image storage and management
- **Nodemailer** - Email service
- **Multer** - File upload handling
- **Express Validator** - Input validation
- **CORS** - Cross-origin resource sharing
- **Cookie Parser** - Cookie handling

### Development Tools
- **Nodemon** - Development server auto-restart
- **ts-node** - TypeScript execution
- **ESLint** - Code linting
- **Jest** - Testing framework

## 📋 Prerequisites

Before setting up the backend, ensure you have:

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher)
- **MongoDB** (local installation or MongoDB Atlas account)
- **Git** for version control

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/sunsetview-backend.git
cd sunsetview-backend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
REACT_APP_MONGO_CONNECTION_STRING=mongodb+srv://username:password@cluster.mongodb.net/sunsetview-db

# JWT Configuration
REACT_APP_JWT_SECRET_KEY=your-super-secret-jwt-key-here

# Environment
NODE_ENV=development

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Cloudinary Configuration
REACT_APP_CLOUDINARY_CLOUD_NAME=your-cloudinary-cloud-name
REACT_APP_CLOUDINARY_API_KEY=your-cloudinary-api-key
REACT_APP_CLOUDINARY_API_SECRET=your-cloudinary-api-secret

# Stripe Configuration
REACT_APP_STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key

# Email Configuration (Gmail SMTP)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Admin Configuration
ADMIN_EMAIL=admin@sunsetview.com
ADMIN_PASSWORD=Admin@123456
ADMIN_FIRST_NAME=System
ADMIN_LAST_NAME=Administrator
```

### 4. Start the Application

#### Development Mode
```bash
npm run dev
```

#### Production Mode
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000`

## 🔧 Detailed Configuration

### MongoDB Setup

#### Option 1: MongoDB Atlas (Recommended)
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get connection string from "Connect" → "Connect your application"
4. Replace `REACT_APP_MONGO_CONNECTION_STRING` in `.env`
5. Whitelist your IP address in Network Access

#### Option 2: Local MongoDB
1. Install MongoDB locally
2. Start MongoDB service: `mongod`
3. Use connection string: `mongodb://localhost:27017/sunsetview-db`

### Cloudinary Setup
1. Create account at [Cloudinary](https://cloudinary.com/)
2. Navigate to Dashboard
3. Copy Cloud Name, API Key, and API Secret
4. Update `.env` file with your credentials

### Stripe Setup
1. Create account at [Stripe](https://stripe.com/)
2. Navigate to Developers → API keys
3. Copy test keys (for development)
4. Update `.env` with your keys
5. For production, use live keys

### Gmail SMTP Configuration
1. Enable 2-Factor Authentication on Gmail
2. Generate App Password:
   - Google Account → Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. Use the generated password in `EMAIL_PASSWORD`

## 📂 Project Structure

```
src/
├── middleware/
│   ├── adminAuth.ts         # Admin authorization middleware
│   └── authRegister.ts      # JWT token verification
├── routes/
│   ├── admin.ts            # Admin panel endpoints
│   ├── auth.ts             # Authentication endpoints
│   ├── contact.ts          # Contact form and messages
│   ├── hotels.ts           # Public hotel endpoints
│   ├── my-bookings.ts      # User booking management
│   ├── my-hotels.ts        # Hotel owner management
│   ├── passwordReset.ts    # Password reset functionality
│   └── users.ts            # User management
├── userModels/
│   ├── contactMessage.ts   # Contact message schema
│   ├── hotel.ts           # Hotel and booking schemas
│   └── user.ts            # User schema
├── services/
│   └── emailService.ts    # Email notification service
├── share/
│   └── type.ts            # Shared TypeScript types
├── scripts/               # Database utility scripts
└── index.ts               # Application entry point
```

## 🔑 API Endpoints

### Authentication Routes (`/api/auth`)
```
POST   /login              # User login
GET    /validate-token     # Token validation
POST   /logout             # User logout
```

### User Routes (`/api/users`)
```
POST   /register           # User registration
GET    /user               # Get current user profile
```

### Hotel Routes (`/api/hotels`)
```
GET    /                   # Get all hotels
GET    /search             # Search hotels with filters
GET    /:id                # Get hotel by ID
POST   /:hotelId/bookings/payment-intent  # Create payment intent
POST   /:hotelId/bookings  # Create booking
```

### My Hotels Routes (`/api/my-hotels`) 🔒
```
GET    /                   # Get user's hotels
POST   /                   # Create new hotel
GET    /:id                # Get hotel by ID
PUT    /:id                # Update hotel
DELETE /:id/images         # Delete hotel image
GET    /:id/bookings       # Get hotel bookings
```

### My Bookings Routes (`/api/my-bookings`) 🔒
```
GET    /                   # Get user's bookings
```

### Admin Routes (`/api/admin`) 👑
```
GET    /dashboard          # Dashboard statistics
GET    /users              # Get all users
DELETE /users/:userId      # Delete user
GET    /hotels             # Get all hotels
GET    /hotels/:hotelId    # Get hotel details
DELETE /hotels/:hotelId    # Delete hotel
GET    /bookings           # Get all bookings
```

### Contact Routes (`/api/contact`)
```
POST   /                   # Submit contact form
GET    /                   # Get all messages (Admin)
PATCH  /:messageId/read    # Mark message as read
PATCH  /:messageId/process-cancellation  # Process cancellation
```

### Password Reset Routes (`/api/password`)
```
POST   /forgot-password    # Request password reset
GET    /validate-token/:token  # Validate reset token
POST   /reset-password/:token  # Reset password
```

🔒 = Requires Authentication  
👑 = Requires Admin Privileges

## 🔐 Authentication & Security

### JWT Token Authentication
- **Access Token**: Stored in HTTP-only cookies
- **Expiration**: 2 days
- **Security**: Signed with secret key from environment

### Password Security
- **Hashing**: bcrypt with salt rounds of 8
- **Validation**: Minimum 8 characters, mixed case, numbers, special characters
- **Reset**: Secure token-based password reset

### Admin Authorization
- **Middleware**: `verifyAdmin` checks user admin status
- **Protection**: All admin routes require both authentication and admin privileges

### Input Validation
- **Express Validator**: Server-side validation for all inputs
- **Sanitization**: Input sanitization to prevent injection attacks

## 💳 Payment Processing

### Stripe Integration
```javascript
// Payment Intent Creation
const paymentIntent = await stripeInstance.paymentIntents.create({
  amount: Math.round(bookingTotalCost * 100),
  currency: "gbp",
  metadata: { hotelId, userId, adultCount, childrenCount }
});
```

### Booking Flow
1. **Create Payment Intent**: Pre-authorize payment
2. **Process Payment**: Frontend confirms payment with Stripe
3. **Verify Payment**: Backend verifies payment success
4. **Create Booking**: Save booking to database
5. **Send Confirmation**: Email confirmation to user

## 📧 Email Services

### Email Templates
- **Booking Confirmation**: Detailed booking information
- **Password Reset**: Secure reset link
- **Cancellation Approved**: Cancellation confirmation
- **Cancellation Rejected**: Cancellation denial notice

### Email Configuration
```javascript
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});
```

## 🗄️ Database Models

### User Model
```typescript
{
  _id: ObjectId,
  email: string,
  password: string (hashed),
  firstName: string,
  lastName: string,
  isAdmin: boolean,
  resetPasswordToken?: string,
  resetPasswordExpires?: Date
}
```

### Hotel Model
```typescript
{
  _id: ObjectId,
  userId: string,
  name: string,
  city: string,
  country: string,
  description: string,
  type: string,
  adultCount: number,
  childrenCount: number,
  facilities: string[],
  pricePerNight: number,
  rating: number,
  imageURL: string[],
  lastUpdated: Date,
  bookings: BookingType[]
}
```

### Booking Model (Embedded in Hotel)
```typescript
{
  _id: ObjectId,
  userId: string,
  firstName: string,
  lastName: string,
  email: string,
  adultCount: number,
  childrenCount: number,
  checkIn: Date,
  checkOut: Date,
  bookingTotalCost: number
}
```

### Contact Message Model
```typescript
{
  _id: ObjectId,
  name: string,
  email: string,
  subject: string,
  message: string,
  bookingId?: string,
  isRead: boolean,
  isCancellationRequest: boolean,
  status: 'pending' | 'approved' | 'rejected',
  createdAt: Date,
  updatedAt: Date
}
```

## 🧪 Testing

### Run Tests
```bash
npm test
```

### Test Categories
- Unit tests for middleware
- Integration tests for API endpoints
- Database connection tests
- Payment processing tests

## 📊 Available Scripts

```bash
# Development
npm run dev          # Start development server with nodemon

# Production
npm run build        # Compile TypeScript to JavaScript
npm start           # Start production server

# Database Scripts
npm run init-admin          # Initialize admin user
npm run fix-admin          # Fix admin account issues
npm run create-test-user   # Create test user
npm run reset-passwords    # Reset all passwords

# Testing
npm test            # Run test suite
npm run e2e         # Run end-to-end tests
```

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Use production database URL
3. Set secure JWT secret
4. Use live Stripe keys
5. Configure production email service

### Recommended Platforms
- **Railway**: Easy Node.js deployment
- **Heroku**: Popular platform-as-a-service
- **DigitalOcean**: VPS deployment
- **AWS**: Full cloud infrastructure

### Production Checklist
- [ ] Environment variables configured
- [ ] Database connection secured
- [ ] CORS properly configured
- [ ] HTTPS enabled
- [ ] Error logging implemented
- [ ] Rate limiting enabled
- [ ] Security headers configured

## 🔍 Monitoring & Logging

### Request Logging
```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});
```

### Error Handling
```javascript
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({ message: 'Internal server error' });
});
```

## 🐛 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
**Problem**: `MongooseError: Cannot connect to MongoDB`
**Solutions**:
- Check connection string format
- Verify network access in MongoDB Atlas
- Ensure IP address is whitelisted
- Check database credentials

#### 2. JWT Token Issues
**Problem**: `JsonWebTokenError: invalid token`
**Solutions**:
- Verify JWT secret key is set
- Check token expiration
- Ensure cookie parser middleware is used
- Verify token format

#### 3. Stripe Payment Failures
**Problem**: Payment intent creation fails
**Solutions**:
- Verify Stripe secret key
- Check webhook configuration
- Ensure amount is in cents
- Validate currency code

#### 4. Email Service Issues
**Problem**: Emails not sending
**Solutions**:
- Verify Gmail app password
- Check SMTP settings
- Ensure 2FA is enabled
- Test email configuration

#### 5. Image Upload Problems
**Problem**: Cloudinary upload fails
**Solutions**:
- Verify Cloudinary credentials
- Check file size limits (6MB max)
- Ensure supported image formats
- Test API connectivity

### Debug Mode
Enable detailed logging:
```env
NODE_ENV=development
DEBUG=*
```

### Health Check Endpoint
```javascript
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});
```

## 📚 API Response Formats

### Success Response
```json
{
  "message": "Operation successful",
  "data": {...}
}
```

### Error Response
```json
{
  "message": "Error description",
  "errors": [...]
}
```

### Pagination Response
```json
{
  "data": [...],
  "pagination": {
    "totalHotels": 150,
    "page": 1,
    "pages": 25
  }
}
```

## 🔄 Database Scripts

### Initialize Admin User
```bash
npm run init-admin
```
Creates the initial admin user with credentials from environment variables.

### Reset All Passwords
```bash
npm run reset-passwords
```
Utility script to reset all user passwords (development only).

## 📈 Performance Optimization

### Database Indexing
```javascript
// User email index for fast lookups
userSchema.index({ email: 1 });

// Hotel search indexes
hotelSchema.index({ city: 1, country: 1 });
hotelSchema.index({ rating: -1 });
hotelSchema.index({ pricePerNight: 1 });
```

### Caching Strategies
- MongoDB query result caching
- Static asset caching with Cloudinary
- JWT token caching

### Request Optimization
- Pagination for large datasets
- Field selection to reduce payload
- Aggregation pipelines for complex queries

## 🛡️ Security Best Practices

### Implemented Security Measures
- **CORS Configuration**: Restricts cross-origin requests
- **HTTP-Only Cookies**: Prevents XSS attacks on tokens
- **Password Hashing**: bcrypt for secure password storage
- **Input Validation**: Server-side validation for all inputs
- **Rate Limiting**: Prevents brute force attacks
- **Secure Headers**: Helmet.js for security headers

### Additional Recommendations
- Implement API rate limiting
- Add request logging and monitoring
- Use HTTPS in production
- Regular security audits
- Keep dependencies updated

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-feature`
3. Make changes and test thoroughly
4. Commit changes: `git commit -m "Add new feature"`
5. Push to branch: `git push origin feature/new-feature`
6. Create Pull Request

### Code Standards
- Follow TypeScript best practices
- Use ESLint configuration
- Write meaningful commit messages
- Add tests for new features
- Update documentation

### Testing Guidelines
- Write unit tests for new functions
- Test API endpoints with different scenarios
- Validate error handling
- Test authentication flows

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Shahil Suresh**
- Email: getshahilsuresh38@gmail.com
- GitHub: Shahil Suresh

## 🙏 Acknowledgments

- Express.js community for the robust framework
- MongoDB team for the excellent database solution
- Stripe for secure payment processing
- Cloudinary for image management services
- Nodemailer for email functionality

## 📞 Support

For technical support:
- Create an issue on GitHub
- Email: getshahilsuresh38@gmail.com
- Check the troubleshooting section above

---

## 🔄 Version History

- **v1.0.0** - Initial API implementation with core functionality
- **v1.1.0** - Added admin panel and advanced hotel search
- **v1.2.0** - Implemented payment processing and email notifications
- **v1.3.0** - Enhanced security and added contact management
- **v1.4.0** - Performance optimizations and bug fixes

---

⭐ **Star this repository if you find it helpful!**