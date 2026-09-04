# SnackDen — Campus Marketplace

**Live Demo:** https://snackden.duckdns.org/

SnackDen is a campus marketplace designed for students to buy and sell snacks, drinks, and everyday essentials within their college and hostel community.

Students can browse products, create stores, place orders, choose pickup or room delivery, make UPI payments, upload payment proof, chat with sellers, and negotiate prices for individual items.

The project was built around the Amrita campus use case, but the marketplace model can be adapted for other colleges and hostel communities.

---

## What SnackDen Provides

### For Students / Buyers

- Register and login (via College Email or Username)
- Manage basic profile information
- Select academic year and hostel
- Browse products
- Search products
- Filter products by category and hostel
- View product and seller information
- Add products to cart
- Purchase products from multiple sellers
- Choose pickup or room delivery
- View delivery charges
- Place orders
- Make UPI payments
- Upload payment screenshots
- Optionally provide UPI transaction reference
- Track order status
- Chat with the seller for a specific order
- Negotiate the price of individual order items
- Accept or reject seller offers
- Review products and sellers
- Report inappropriate listings

### For Sellers

Students can create their own store and become sellers.

Seller features include:

- Create a store
- Set store information
- Add products
- Upload product images
- Set product price and stock
- Configure pickup and delivery
- Configure delivery charges
- Add UPI payment information
- Upload UPI QR code
- Edit products
- Manage stock
- View incoming orders
- Verify or reject payment proof
- Update order status
- Chat with buyers
- Make item-level price offers
- View seller reviews
- Manage their marketplace activity

### For Administrators

The admin dashboard provides centralized marketplace management through a clean, tabbed interface.

Admins can:

- View users
- Block and unblock users
- Manage products
- Hide and restore products
- Delete products
- View orders
- Manage hostels
- Add new hostels
- Enable or disable hostels
- Correct user hostel information
- View product reports
- Resolve or dismiss reports
- Manage seller strikes
- Monitor seller activity
- Restrict problematic sellers

---

# Core Features

## 1. Campus-Based Marketplace

SnackDen is designed around a college and hostel environment.

Products can be browsed based on:

- Category
- Hostel
- Seller

The marketplace supports students from different academic years and hostels.

Buying is not restricted by hostel or academic year.

Example:

    Buyer
    3rd Year
    Nachiketas Hostel

            ↓

    Seller
    4th Year
    Vyasa Hostel

Students can buy from each other regardless of hostel or academic year.

---

## 2. Hostel Management

A hostel represents a physical campus location.

Academic year and hostel are treated as separate pieces of information.

Example:

    Student
    Year: 3rd Year
    Hostel: Nachiketas Hostel
    Room: 302

Administrators control the hostel list.

Admins can:

- Add hostels
- Assign hostel codes
- Enable or disable hostels
- Correct hostel information

New campus buildings can therefore be added without changing application code.

---

## 3. Academic Year

Students can select their academic year during registration and profile management.

Supported values include:

- 1st Year
- 2nd Year
- 3rd Year
- 4th Year

Academic year is independent from hostel selection.

---

## 4. Product Marketplace

Students can:

- Browse products
- Search products
- Filter products
- View product details
- View seller information
- Add products to cart
- Purchase products

Products contain information such as:

- Product name
- Price
- Description
- Category
- Stock
- Seller
- Hostel
- Pickup availability
- Delivery availability
- Delivery charge
- Product image

---

## 5. Multi-Seller Checkout

A single cart can contain products from different sellers.

During checkout, the backend separates the purchase into seller-specific orders.

    Cart
     ├── Seller A product
     ├── Seller A product
     ├── Seller B product
     └── Seller C product

            ↓

    Seller A Order
    Seller B Order
    Seller C Order

This keeps seller order ownership and payment processing separate.

---

## 6. Pickup and Room Delivery

Sellers can support:

- Pickup
- Delivery

For delivery orders, the buyer can provide their room information.

The system keeps public seller information limited while providing the required location information in the appropriate order context.

---

## 7. UPI Payment

SnackDen uses a campus-oriented UPI payment flow.

    Buyer places order
            ↓
    Seller UPI information
            ↓
    Buyer makes payment
            ↓
    Buyer uploads payment screenshot
            ↓
    Seller verifies payment
            ↓
    Order continues

The UPI transaction reference is optional, while payment screenshot proof is required for the payment submission flow.

---

## 8. Order Management

Orders contain information about:

- Buyer
- Seller
- Products
- Quantities
- Prices
- Payment status
- Order status
- Pickup or delivery method
- Relevant location information

Buyers can view their orders and track progress.

Sellers can view incoming orders and update their status.

---

# 9. Buyer-Seller Order Chat

SnackDen includes order-specific buyer-seller chat.

Chat is associated with an order rather than being a completely open messaging system.

    Buyer
       ↓
    Order #25
       ↓
    Chat with Seller
       ↓
    Seller

This allows buyers and sellers to coordinate:

- Pickup location
- Delivery timing
- Order questions
- Payment clarification
- Product-related communication

### Chat Security

The backend verifies that the requesting user actually belongs to the order.

A user cannot simply change an order ID and access another conversation.

Authorization checks protect:

- Buyer access
- Seller access
- Order ownership
- Message creation

---

# 10. Item-Level Price Negotiation

SnackDen supports negotiation at the individual order-item level.

Example:

    Order

    Kurkure       ₹100
    Chocolate      ₹80

    Seller offers:

    Kurkure        ₹75

If the buyer accepts:

    Kurkure        ₹75
    Chocolate      ₹80

Only the negotiated item changes.

The public product price remains unchanged.

    Public Product Price
            ₹100
              |
              | negotiation
              ↓
    Order Item Price
             ₹75

This prevents a private buyer-seller negotiation from changing the marketplace catalog price.

### Negotiation Security

The backend validates:

- Seller ownership of the order
- Buyer ownership of the order
- Correct order item
- Correct seller
- Correct buyer
- Valid offer price
- Correct order ID
- Correct order-item relationship

Negotiation is blocked after the protected payment stage.

Offer acceptance and competing-offer updates are handled transactionally to prevent inconsistent order totals.

---

# 11. Product and Seller Reviews

Users can provide:

- Product reviews
- Seller reviews

This helps students make better decisions when buying from other students.

---

# 12. Product Reporting

Students can report listings that may violate marketplace rules.

Example report reasons:

- Unauthorized item
- Unsafe food
- Misleading listing
- Other inappropriate listing

Reports are sent to the admin moderation system.

Admins can:

- Resolve reports
- Dismiss reports

---

# 13. Seller Moderation

SnackDen includes a seller strike system.

Admins can issue strikes with a reason.

Examples:

- Unauthorized product
- Unsafe item
- Fake listing
- Misleading information

Strike information is stored for moderation history.

After reaching the configured strike limit, the seller can be blocked and their products can be hidden.

---

# 14. User Blocking

Admins can block users when necessary.

A blocked account cannot continue normal protected marketplace operations.

The backend checks the user's current database state instead of blindly trusting an old login token.

Example:

    Seller logs in
          ↓
    JWT issued
          ↓
    Admin blocks seller
          ↓
    Seller makes another protected request
          ↓
    Backend checks current user status
          ↓
    Request rejected

This prevents an old unexpired token from bypassing account restrictions.

---

# 15. Authentication

Authentication uses:

- JWT
- bcrypt
- Express middleware
- MySQL user records

Passwords are stored as secure bcrypt hashes rather than plain text.

The system supports unique **Username** or **College Email** authentication, allowing students to log in quickly without typing their full email every time.

The system supports:
- Buyer
- Seller
- Admin

Protected APIs verify authentication and authorization before performing sensitive operations.

---

# Real-Time Notifications & Polling

To accommodate busy college students without relying on heavy WebSockets or complex Service Worker installations, SnackDen implements a hybrid notification system:

### 1. In-App Silent Polling
When the application is open:
- **Order Polling:** The seller and buyer dashboards silently poll the backend every 30 seconds.
- **Chat Polling:** When a chat modal is open, it polls every 5 seconds for instant negotiation and messaging.
- **Visual Alerts:** Users instantly receive non-intrusive toast notifications (e.g., `🔔 New order received!`) when state changes.

### 2. Offline Email Push Notifications
When the application is closed:
- **Order Alerts:** Sellers receive instant email notifications containing the buyer's name, total amount, and a deep link directly to the order dashboard.
- **Chat Alerts:** Buyers and Sellers receive email notifications showing the exact message text and a "Reply Now" deep link to continue the negotiation.
- Because college students actively check their email on their phones, this mimics a native push notification without requiring a standalone mobile app.

---

# 16. Password Recovery

SnackDen supports password recovery using email OTP verification.

Flow:

    Forgot Password
           ↓
    Enter email
           ↓
    Receive OTP
           ↓
    Verify OTP
           ↓
    Reset password
           ↓
    Login

Security controls include:

- Six-digit OTP
- OTP expiration
- Resend cooldown
- Limited failed attempts
- Single-use reset token
- bcrypt password hashing

The system does not email a plain-text password to users.

---

# 17. Profile Information and Privacy

Users can maintain:

- Name
- Email
- Academic year
- Hostel
- Room number

Room numbers are treated as private information.

Public marketplace listings do not expose seller room numbers unnecessarily.

Location information is provided only where required for order coordination.

---

# 18. Database

The application uses MySQL for persistent application data.

Important production tables include:

- users
- sellers
- products
- cart
- orders
- order_items
- order_messages
- order_offers
- hostels
- product_reviews
- seller_reviews
- reports
- seller_strikes
- password_resets
- db_migrations

The database supports:

- Users
- Sellers
- Products
- Cart
- Orders
- Order items
- Chat
- Negotiation
- Reviews
- Reports
- Hostels
- Seller moderation
- Password recovery

---

# 19. Database Migrations

The backend uses a migration tracking mechanism for production schema changes.

Migrations are recorded so that one-time changes are not repeatedly executed after every application restart.

Example:

    Migration
        ↓
    Execute once
        ↓
    Record migration
        ↓
    Future restart
        ↓
    Migration skipped

This prevents accidental repeated destructive operations.

---

# 20. File Storage

Uploaded files are stored using Amazon S3.

Storage includes:

- Product images
- UPI QR codes
- Payment screenshots

Example structure:

    uploads/
    ├── products/
    ├── upi-qr/
    └── payment-proofs/

S3 is used instead of relying only on the EC2 filesystem, making uploaded files independent of the application container.

---

# 21. Technology Stack

## Frontend

- HTML
- CSS
- Vanilla JavaScript
- Fetch API
- LocalStorage

## Backend

- Node.js
- Express.js
- JWT
- bcrypt
- Multer
- Nodemailer
- AWS SDK

## Database

- MySQL
- Amazon RDS
- mysql2

## Storage

- Amazon S3
- AWS SDK for JavaScript

## Infrastructure

- Amazon EC2
- Amazon ECR
- Amazon RDS
- Amazon S3
- Docker
- Nginx
- DuckDNS
- Let's Encrypt
- Certbot

## Source Control

- Git
- GitHub

---

# 22. Production Architecture

    INTERNET
        |
        v
    snackden.duckdns.org
        |
      HTTPS
        |
        v
      AWS EC2
        |
      Nginx
        |
        +------------------+
        |                  |
        v                  v
    Frontend             /api/
        |                  |
        |                  v
        |               Docker
        |             Node.js/Express
        |                  |
        |            +-----+-----+
        |            |           |
        |            v           v
        |          RDS          S3
        |         MySQL       Storage
        |
        v
      Browser

Nginx acts as the public reverse proxy.

The Node.js application runs inside Docker.

MySQL runs on Amazon RDS.

Uploaded files are stored in Amazon S3.

---

# 23. AWS Deployment

The backend is containerized using Docker.

Deployment flow:

    Local Development
           ↓
         Git
           ↓
      Docker Build
           ↓
      Amazon ECR
           ↓
          EC2
           ↓
      Docker Container
           ↓
         Nginx
           ↓
    Public HTTPS Website

The production backend image is stored in Amazon ECR.

The EC2 instance pulls the required image and runs the application using the production environment configuration.

---

# 24. AWS Security

The application uses an EC2 IAM role for AWS service access rather than storing AWS access keys inside the application.

The EC2 role allows the server to access required AWS services such as S3.

Production secrets are kept outside the Docker image and source repository.

Sensitive information such as:

- Database passwords
- JWT secrets
- AWS credentials
- SMTP credentials
- SSH private keys

is not committed to GitHub.

---

# 25. HTTPS and Domain

The production application is available through:

https://snackden.duckdns.org/

DuckDNS provides the domain.

Let's Encrypt provides the SSL/TLS certificate.

Certbot manages certificate renewal.

Users access the marketplace through HTTPS rather than directly accessing the application server port.

---

# 26. Nginx

Nginx provides the public entry point to the application.

High-level routing:

    /
        → Frontend

    /api/
        → Node.js backend

    /uploads/
        → Node.js / S3 file retrieval

This keeps the Node.js application behind Nginx rather than exposing the application port directly to the public internet.

---

# 27. Docker

The backend runs inside a Docker container.

Docker provides:

- Consistent runtime environment
- Dependency isolation
- Easier deployment
- Reproducible builds
- Application restart support

The production container uses a restart policy so the application can recover after an unexpected container or host restart.

---

# 28. Testing

The project includes backend syntax validation and a dedicated security/privacy regression suite.

Security testing covers:

- Order chat isolation
- Buyer authorization
- Seller authorization
- Wrong-order attacks
- Wrong-item attacks
- Offer validation
- Payment-state negotiation lock
- Multi-item negotiation
- Room-number privacy
- Offer ownership
- Order ownership

Latest security regression result:

    11/11 PASSED

Additional checks:

- Backend syntax checks
- git diff --check
- Docker secret scan
- Production API HTTP 200
- Production website HTTP 200
- Database connection
- Nginx configuration
- Production deployment

All passed.

No production test data is intentionally left behind by the regression suite.

---

# 29. Security Design

Important security principles used in the application:

### Authentication

Protected operations require valid authentication.

### Authorization

Authentication alone is not enough. The backend verifies whether the authenticated user is actually allowed to perform the requested operation.

### Order ownership

Users cannot access arbitrary orders by changing an order ID.

### Item ownership

Offers must belong to the correct order and order item.

### Seller authorization

Sellers cannot create or manipulate offers for another seller's order.

### Buyer authorization

Buyers cannot manipulate another buyer's order or offers.

### Payment protection

Negotiation is locked after the protected payment stage.

### Catalog protection

Negotiated order prices do not modify public product prices.

### Privacy

Sensitive room information is not unnecessarily exposed publicly.

---

# 30. Project Structure

    .
    ├── Frontend/
    │   ├── index.html
    │   ├── login.html
    │   ├── register.html
    │   ├── product.html
    │   ├── store.html
    │   ├── seller.html
    │   ├── orders.html
    │   ├── checkout.html
    │   ├── admin.html
    │   ├── app.js
    │   ├── api.js
    │   ├── auth.js
    │   ├── product.js
    │   ├── store.js
    │   ├── seller.js
    │   ├── orders.js
    │   ├── checkout.js
    │   ├── admin.js
    │   └── style.css
    │
    ├── Backend/
    │   ├── config/
    │   ├── controllers/
    │   ├── models/
    │   ├── routes/
    │   ├── middleware/
    │   ├── scripts/
    │   ├── schema.sql
    │   └── server.js
    │
    ├── Dockerfile
    ├── package.json
    ├── package-lock.json
    └── README.md

---

# 31. Running Locally

## Prerequisites

- Node.js 20+
- MySQL 8+
- AWS S3 bucket
- AWS credentials with the required S3 permissions

## Backend Setup

    cd Backend
    cp .env.example .env
    npm ci

Configure the environment variables in `.env`:

    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=your-password
    DB_NAME=ecommerce_db
    JWT_SECRET=use-a-long-random-secret
    PORT=3000

    AWS_REGION=ap-south-1
    S3_BUCKET=your-bucket-name

    AWS_ACCESS_KEY_ID=your-access-key
    AWS_SECRET_ACCESS_KEY=your-secret-key

Optional email configuration:

    SMTP_HOST=smtp.example.com
    SMTP_PORT=587
    SMTP_USER=your-username
    SMTP_PASS=your-password
    SMTP_FROM="SnackDen <noreply@example.com>"

Create the database and apply the required schema.

Start the backend:

    node server.js

The API will run at:

    http://localhost:3000

The frontend can then be served using a local development web server.

---

# 32. Environment Security

Never commit real credentials to GitHub.

Do not commit:

- `.env`
- `.pem`
- `.key`
- AWS access keys
- AWS secret keys
- Database passwords
- JWT secrets
- SMTP passwords

Use `.env.example` only for placeholder configuration.

In production, secrets are supplied separately through the server environment.

---

# 33. Git and Releases

The project is maintained using Git and GitHub.

Recent major releases include:

    862df8a
    Add secure order chat and item-level negotiation

    0759fa2
    Refactor marketplace UI and improve chat authentication

The latest production release contains the UI/UX improvements together with the secure chat and negotiation functionality.

---

# 34. Production Status

The current production deployment has been verified for:

- Frontend
- HTTPS
- Nginx
- Docker
- Node.js backend
- RDS MySQL
- Amazon S3
- Amazon ECR
- Authentication
- Buyer flow
- Seller flow
- Admin flow
- Orders
- Payment proof
- Order chat
- Item negotiation
- Hostel system
- Moderation
- Password recovery
- Security regression

Security regression result:

    11/11 PASSED

Production URL:

https://snackden.duckdns.org/

---

# 35. Future Improvements

Possible future improvements include:

- Automated CI/CD pipeline
- CloudWatch monitoring and alerts
- Advanced marketplace analytics
- Custom domain
- Node.js 22 upgrade
- Improved notification system
- Additional payment integrations
- More advanced seller analytics
- Campus-wide deployment for multiple colleges

These are future improvements and are not required for the current marketplace to operate.

---

# 36. Project Status

SnackDen is currently a live, deployed campus marketplace supporting:

    Students
       ↓
    Registration / Login
       ↓
    Hostel + Academic Year
       ↓
    Browse Marketplace
       ↓
    Products
       ↓
    Cart
       ↓
    Multi-Seller Checkout
       ↓
    Pickup / Delivery
       ↓
    UPI Payment
       ↓
    Payment Verification
       ↓
    Order Tracking
       ↓
    Buyer-Seller Chat
       ↓
    Item-Level Negotiation
       ↓
    Reviews / Reports
       ↓
    Admin Moderation

The project is deployed on AWS using Docker, ECR, EC2, RDS, S3, Nginx, DuckDNS, and Let's Encrypt.

## Live Application

https://snackden.duckdns.org/

## Project Goal

The goal of SnackDen is to provide a simple, secure, and convenient marketplace for students to buy and sell everyday products within their campus community.
