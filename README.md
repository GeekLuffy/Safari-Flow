# SafariFlow - Inventory Management System

A modern, feature-rich inventory management system built with React, TypeScript, and MongoDB. InvenHub helps businesses manage their inventory, track sales, analyze performance, and streamline operations.

## 🌟 Features

### 📊 Dashboard
- Real-time overview of store performance
- Key metrics tracking (revenue, profit, profit margin)
- Monthly sales trends visualization
- Quick access to common operations
- Inventory status summary
- Sales by category and channel analytics

### 📦 Inventory Management
- Complete product catalog management
- Low stock alerts and monitoring
- Barcode scanner integration
- Automated reorder capabilities
- Stock level tracking
- Product categorization

### 🤝 Supplier Management
- Supplier database
- Purchase order management
- Automated reordering system
- Supplier performance tracking

### 💰 Billing & Transactions
- Sales transaction recording
- Payment processing with Stripe integration
- Transaction history
- Receipt generation
- Multiple payment methods support

### 📈 Analytics & Reporting
- Sales analytics
- Inventory turnover analysis
- Revenue and profit tracking
- Category-wise performance
- Channel-wise sales analysis

### 👥 User Management
- Role-based access control (Admin, Staff)
- User authentication and authorization
- Customizable user permissions
- User activity tracking

### ⚙️ System Features
- Dark/Light theme support
- Multi-language support
- Real-time updates
- Responsive design
- Modern UI with shadcn/ui
- Secure authentication

## 🛠️ Technology Stack

- **Frontend**:
  - React
  - TypeScript
  - Tailwind CSS
  - shadcn/ui components
  - Framer Motion for animations
  - React Query for data fetching
  - Zustand for state management

- **Backend**:
  - MongoDB for database
  - Express.js server
  - Node.js runtime

- **Authentication & Security**:
  - JWT based authentication
  - Role-based access control
  - Secure password hashing with bcrypt

- **Payment Processing**:
  - Stripe integration
  - Secure payment handling

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- MongoDB instance

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
```

2. Navigate to project directory:
```bash
cd invenhub
```

3. Install dependencies:
```bash
npm install
```

4. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
MONGODB_URI=your_mongodb_connection_string
STRIPE_SECRET_KEY=your_stripe_secret_key
```

5. Initialize the database with sample data:
```bash
npm run init-db
```

6. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## 🔐 Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `STRIPE_SECRET_KEY`: Stripe secret key for payment processing
- `JWT_SECRET`: Secret key for JWT token generation
- `NODE_ENV`: Application environment (development/production)

## 📚 Documentation

For detailed documentation about the project's features and API endpoints, visit our [documentation](https://docs.lovable.dev/).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🌐 Deployment

The project can be deployed using:
- Lovable platform (recommended)
- Custom domain using Netlify
- Other hosting platforms of your choice

For deployment instructions, check our [deployment guide](https://docs.lovable.dev/tips-tricks/custom-domain/).

## 🆘 Support

For support and questions, please:
- Visit our [documentation](https://docs.lovable.dev/)
- Open an issue in the repository
- Contact support at support@lovable.dev
