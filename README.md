# Digital Library Management System (DLMS)

A comprehensive digital library management system with support for physical books and e-books, built with modern web technologies.

## Features

- 📚 Physical and E-book Management
- 👥 User Authentication and Authorization
- 📱 Responsive Web Interface
- 📖 Book Reservations and Tracking
- 📋 Wishlist Management
- 📊 Admin Dashboard and Reports
- 📧 Email Notifications
- 🔄 Automated Due Date Checking
- 📁 Category Management
- ⚙️ System Settings Configuration

## Tech Stack

### Backend
- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication
- Nodemailer for emails
- Cloudinary for file storage
- Node-cron for scheduled tasks

### Frontend
- React 18 with TypeScript
- Vite as build tool
- Material UI & Radix UI components
- TailwindCSS for styling
- React Router for navigation
- Recharts for data visualization
- Framer Motion for animations

## Prerequisites

- Node.js (v16 or higher)
- MongoDB
- npm or yarn
- Cloudinary account (for file storage)
- SMTP server (for emails)

## Installation

1. Clone the repository
```bash
git clone [repository-url]
cd DLMS
```

2. Install backend dependencies
```bash
cd backend
npm install
```

3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

4. Set up environment variables
   - Create `.env` in the backend directory with:
     ```
     MONGODB_URI=your_mongodb_uri
     JWT_SECRET=your_jwt_secret
     CLOUDINARY_CLOUD_NAME=your_cloudinary_name
     CLOUDINARY_API_KEY=your_cloudinary_key
     CLOUDINARY_API_SECRET=your_cloudinary_secret
     SMTP_HOST=your_smtp_host
     SMTP_USER=your_smtp_user
     SMTP_PASS=your_smtp_password
     ```

## Running the Application

1. Start the backend server
```bash
cd backend
npm run dev
```

2. Start the frontend development server
```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173` (frontend) and `http://localhost:3000` (backend API).

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Project Structure

- `backend/` - Express server and API
  - `controllers/` - Request handlers
  - `models/` - Database models
  - `routes/` - API routes
  - `middleware/` - Custom middleware
  - `services/` - Business logic
  - `utils/` - Helper functions

- `frontend/` - React application
  - `src/components/` - Reusable UI components
  - `src/pages/` - Page components
  - `src/services/` - API integration
  - `src/utils/` - Helper functions

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC License

## Acknowledgments

- Material UI for the component library
- Radix UI for accessible components
- TailwindCSS for utility-first styling