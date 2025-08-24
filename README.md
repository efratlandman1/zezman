# Zezman Business Directory

A comprehensive business directory application with React frontend and Node.js/Express backend, featuring internationalization (i18n), Google Maps integration, user authentication, and business management capabilities.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- MongoDB running on localhost:27017
- Git

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd zezman
   ```

2. **Start the application using the provided script**
   
   **Windows:**
   ```bash
   start.bat
   ```
   
   **Linux/Mac:**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

   The script will automatically:
   - Create environment files from examples
   - Install dependencies
   - Start the backend server on port 5000
   - Start the frontend on port 3000

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api/v1/docs

## 🔧 Manual Setup (Alternative)

### Backend Setup
```bash
cd server
npm install
cp env.example .env
# Edit .env with your configuration
npm start
```

### Frontend Setup
```bash
cd client
npm install
cp env.example .env
# Edit .env with your configuration
npm start
```

## 🐛 Troubleshooting

### Infinite Loading Spinner
If you see an infinite loading spinner on the homepage:

1. **Check if the backend server is running**
   - The server should be running on port 5000
   - Check terminal for any error messages

2. **Check MongoDB connection**
   - Ensure MongoDB is running on localhost:27017
   - Check if the database 'zezman' exists

3. **Check environment variables**
   - Ensure `.env` files exist in both `server/` and `client/` directories
   - Verify required variables are set (see `env.example` files)

4. **Check browser console**
   - Open Developer Tools (F12)
   - Look for network errors or console errors
   - The last network call should not be `manifest.json`

### Common Issues

- **Port 5000 already in use**: Change `PORT` in `server/.env`
- **MongoDB connection failed**: Ensure MongoDB is running and accessible
- **CORS errors**: Check `CORS_ORIGIN` in `server/.env`
- **Missing dependencies**: Run `npm install` in both directories

## 📁 Project Structure

```
zezman/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── redux/         # State management
│   │   ├── services/      # API services
│   │   └── i18n/          # Internationalization
│   └── public/            # Static assets
├── server/                 # Node.js Backend
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   └── middlewares/   # Custom middleware
│   └── logs/              # Application logs
└── docker-compose.yml      # Docker configuration
```

## 🌐 Features

- **Business Directory**: Search and browse businesses
- **User Authentication**: JWT-based auth with Google OAuth
- **Internationalization**: Hebrew (RTL) and English (LTR) support
- **Google Maps Integration**: Location-based services
- **Rating & Reviews**: Business feedback system
- **Admin Panel**: Business approval and management
- **Responsive Design**: Mobile-first approach

## 🔐 Environment Variables

### Required Backend Variables
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT signing secret
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret

### Required Frontend Variables
- `REACT_APP_API_URL`: Backend API URL (defaults to proxy)

## 🚀 Deployment

### Docker Deployment
```bash
docker-compose up -d
```

### Manual Deployment
1. Build frontend: `cd client && npm run build`
2. Start backend: `cd server && npm start`
3. Serve frontend build files with nginx or similar

## 📝 Development

### Code Style
- ESLint configuration included
- Prettier formatting
- TypeScript support (optional)

### Testing
```bash
# Backend tests
cd server && npm test

# Frontend tests
cd client && npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the logs in `server/logs/`
3. Check browser console for errors
4. Ensure all services are running

---

**Note**: This application requires both the frontend and backend to be running simultaneously. The frontend will show a loading spinner indefinitely if it cannot connect to the backend API. 