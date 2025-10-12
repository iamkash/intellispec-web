# intelliSPEC Authentication System Setup Guide

This guide will help you set up the comprehensive authentication system for your SaaS B2B multitenant application.

## 🏗️ Architecture Overview

The authentication system provides:
- **Multi-tenant architecture** with complete tenant isolation
- **Role-Based Access Control (RBAC)** with fine-grained permissions
- **External customer restrictions** (dashboard-only access)
- **Rate limiting** and account lockout protection
- **Comprehensive audit logging** with IP tracking
- **AI RAG enablement** for document search and analysis
- **Production-ready security** features

## 📋 Prerequisites

1. **Node.js** (v16 or higher)
2. **MongoDB Atlas** account and cluster
3. **npm** or **yarn** package manager
4. Basic knowledge of React and Express.js

## 🚀 Quick Start

### 1. Environment Setup

1. Copy the sample environment file:
   ```bash
   cp env.sample .env
   ```

2. Update `.env` with your MongoDB Atlas connection string:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/intellispec?retryWrites=true&w=majority
   JWT_SECRET=your-super-secret-jwt-key-change-in-production-must-be-at-least-32-characters-long
   ```

### 2. Install Dependencies

```bash
npm install
```

The authentication system includes these additional dependencies:
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT token management
- `express-rate-limit` - Rate limiting
- `mongoose` - MongoDB ODM
- `helmet` - Security headers
- `cors` - Cross-origin resource sharing

### 3. Start the Application

Development mode (separate terminals):
```bash
# Start the backend server
npm run api

# Start the React frontend
npm start
```

Production mode:
```bash
# Build and start
npm run build
npm run api
```

### 4. Initialize Database

The system will automatically:
- Connect to MongoDB Atlas
- Create necessary indexes
- Set up default roles when tenants are created

## 🔐 Authentication Flow

### 1. Tenant Discovery
- User enters email address
- System discovers tenant from user's email
- Displays tenant-specific branding (if configured)

### 2. Login Process
- User provides email and password
- System validates credentials
- Rate limiting protects against brute force attacks
- Account lockout after 5 failed attempts (30-minute cooldown)
- JWT token generated upon successful authentication

### 3. Authorization
- Every request validated with JWT token
- RBAC system checks user permissions
- External customers restricted to dashboard routes only
- Tenant isolation enforced at data level

## 👥 User Management

### Default Roles

The system creates these default roles for each tenant:

1. **Super Admin** (`*` permissions)
   - Full system access
   - Can manage all tenants (system-wide)

2. **Admin** (tenant-scoped)
   - User and role management
   - Dashboard and reports access
   - Settings configuration

3. **Internal User**
   - Dashboard and reports access
   - Own profile management

4. **External Customer** (restricted)
   - Dashboard access only
   - Limited to dashboard routes

### Creating Users

```javascript
// Example: Create a new user via API
POST /api/auth/register
{
  "userId": "john.doe",
  "email": "john.doe@company.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "roleIds": ["role_id_here"]
}
```

### Role Management

```javascript
// Example: Create custom role
const role = await createRole(tenantId, 'Custom Role', [
  'dashboard.read',
  'reports.read',
  'user.read_own'
], {
  description: 'Custom role for specific needs',
  isExternalCustomer: false
});
```

## 🛡️ Security Features

### Rate Limiting
- **Global**: 1000 requests per 15 minutes per IP
- **Login**: 10 attempts per 15 minutes per IP+tenant
- **Progressive delays** on repeated attempts

### Account Security
- **Password hashing** with bcrypt (12 salt rounds)
- **Account lockout** after 5 failed attempts
- **JWT tokens** with 24-hour expiration
- **Automatic token refresh** (23-hour interval)

### Audit Logging
All authentication events are logged with:
- Tenant slug and user ID
- IP address and geolocation
- User agent and device fingerprinting
- Security risk assessment
- Anomaly detection

### Content Security
- **XSS protection** with input sanitization
- **CSRF protection** with SameSite cookies
- **SQL injection** prevention with MongoDB
- **Security headers** via Helmet.js

## 🏢 Multi-Tenant Architecture

### Tenant Isolation
- **Database level**: Tenant ID in all queries
- **API level**: Middleware ensures tenant scoping
- **UI level**: User can only see own tenant data

### External Customer Restrictions
External customers are limited to:
- `/dashboard` and `/dashboard/*` routes
- Profile management
- Basic auth endpoints

Attempting to access other routes returns:
```json
{
  "error": "Access denied for external customers",
  "code": "EXTERNAL_CUSTOMER_RESTRICTED",
  "allowedRoutes": ["/dashboard", "/dashboard/*"]
}
```

## 🤖 AI RAG Integration

### Document Management
The system supports AI-enabled document search:
- **Vector embeddings** for semantic search
- **Tenant-scoped** document access
- **Role-based** document permissions
- **Configurable embedding models**

### Usage Example
```javascript
// Search RAG documents
GET /api/rag/search?q=safety protocols
Authorization: Bearer <token>

// Response includes tenant-scoped results
{
  "documents": [
    {
      "title": "Safety Protocol v2.1",
      "relevanceScore": 0.95,
      "excerpt": "...",
      "accessLevel": "internal"
    }
  ]
}
```

## 📊 Monitoring and Analytics

### Authentication Logs
Access comprehensive logs via:
```javascript
// Get authentication analytics
GET /api/auth/analytics?period=30d
Authorization: Bearer <token>

// Response includes:
{
  "totalLogins": 1250,
  "failedAttempts": 45,
  "uniqueUsers": 89,
  "suspiciousActivity": 3,
  "topCountries": [...],
  "riskBreakdown": {...}
}
```

### Security Alerts
The system automatically detects:
- Multiple failed login attempts
- Unusual geographic locations
- Suspicious user agents
- Rate limit violations
- Privilege escalation attempts

## 🔧 Customization

### Custom Permissions
Add new permissions to the registry:
```javascript
// In src/services/rbac.ts
PERMISSIONS['custom.action'] = {
  description: 'Custom action permission',
  resource: 'custom',
  action: 'action',
  category: 'custom',
  riskLevel: 'medium'
};
```

### Custom Branding
Configure tenant-specific branding:
```javascript
const tenant = await Tenant.findByIdAndUpdate(tenantId, {
  'settings.customBranding': {
    logo: 'https://company.com/logo.png',
    primaryColor: '#1890ff',
    companyName: 'ACME Corp'
  }
});
```

### Login Metadata
Customize the login screen via metadata:
```javascript
const customLoginMetadata = {
  title: "Welcome to ACME Portal",
  subtitle: "Enter your credentials to access your workspace",
  branding: {
    logo: "/assets/acme-logo.png",
    primaryColor: "#1890ff",
    companyName: "ACME Corp"
  },
  fields: [
    {
      id: "email",
      type: "email",
      label: "Email Address",
      required: true,
      validation: {
        pattern: "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"
      }
    }
  ]
};
```

## 🧪 Testing

### Unit Tests
```bash
# Run authentication tests
npm test -- --testPathPattern=auth

# Run RBAC tests
npm test -- --testPathPattern=rbac

# Run integration tests
npm test -- --testPathPattern=integration
```

### Manual Testing
1. **Login Flow**: Test with valid/invalid credentials
2. **Rate Limiting**: Make repeated failed attempts
3. **Permission Check**: Access protected routes
4. **Tenant Isolation**: Verify data separation
5. **External Customer**: Test route restrictions

## 🚀 Production Deployment

### Environment Variables
Set these in production:
```env
NODE_ENV=production
JWT_SECRET=<64-character-random-string>
MONGODB_URI=<production-mongodb-atlas-uri>
FRONTEND_URL=https://your-domain.com
```

### Security Checklist
- [ ] Strong JWT secret (64+ characters)
- [ ] HTTPS enabled
- [ ] MongoDB Atlas IP whitelist configured
- [ ] Environment variables secured
- [ ] Rate limiting configured
- [ ] Monitoring and alerting set up
- [ ] Backup strategy implemented

### Database Indexes
Critical indexes are automatically created:
- User email/tenant lookups
- Authentication logs by tenant/time
- Permission queries
- RAG document search

## 🔍 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   ```
   Error: Failed to connect to MongoDB Atlas
   ```
   - Check connection string format
   - Verify IP whitelist in MongoDB Atlas
   - Confirm username/password

2. **JWT Token Invalid**
   ```
   Error: Invalid token
   ```
   - Check JWT_SECRET consistency
   - Verify token hasn't expired
   - Clear localStorage and login again

3. **Permission Denied**
   ```
   Error: Insufficient permissions
   ```
   - Check user's assigned roles
   - Verify role permissions
   - Confirm tenant isolation

4. **Rate Limit Exceeded**
   ```
   Error: Too many login attempts
   ```
   - Wait for rate limit window to reset
   - Check IP-based restrictions
   - Review rate limit configuration

### Debug Mode
Enable debug logging:
```env
DEBUG_AUTH=true
DEBUG_RBAC=true
DEBUG_LOGGING=true
```

## 📚 API Reference

### Authentication Endpoints

#### POST /api/auth/login
Login with email and password.
```json
{
  "email": "user@company.com",
  "password": "password123",
  "tenantSlug": "optional"
}
```

#### POST /api/auth/logout
Logout current user.
```json
Authorization: Bearer <token>
```

#### GET /api/auth/me
Get current user profile.
```json
Authorization: Bearer <token>
```

#### POST /api/auth/refresh
Refresh JWT token.
```json
Authorization: Bearer <token>
```

#### POST /api/auth/forgot-password
Request password reset.
```json
{
  "email": "user@company.com"
}
```

### Protected Route Examples

#### GET /api/dashboard
Access dashboard (requires `dashboard.read` permission).

#### GET /api/admin/users
User management (requires `user.read` or `admin` permission).

#### GET /api/rag/search
AI RAG search (requires `rag.read` permission).

## 🆘 Support

For questions or issues:
1. Check this documentation
2. Review the troubleshooting section
3. Check application logs
4. Verify environment configuration
5. Test with minimal setup

## 📄 License

This authentication system is part of the intelliSPEC platform. Please refer to your licensing agreement for usage terms.
