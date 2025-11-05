# AI HR Onboarding Frontend

A modern React-based frontend for an AI-driven HR onboarding system with beautiful UI, real-time updates, and seamless user experience.

## 🚀 Features

- **Employee Dashboard** - Track onboarding progress, tasks, and documents
- **HR Dashboard** - Comprehensive analytics, employee tracking, and management
- **AI Chatbot (SUPA)** - Intelligent conversational assistant
- **Document Upload** - Secure PDF document submission with validation
- **Training Module** - Track and submit training certificates
- **Feedback System** - Submit and view onboarding feedback
- **Pre-Onboarding Flow** - Complete pre-onboarding workflow
- **IT Account Management** - HR interface for managing IT accounts
- **Email Account Management** - Configure email accounts for sending
- **Real-time Updates** - Live progress tracking and notifications
- **Responsive Design** - Works on desktop, tablet, and mobile

## 🛠️ Tech Stack

- **React 18.3.1** - UI framework
- **Vite 5.2.0** - Build tool and dev server
- **React Router 6.30.1** - Client-side routing
- **Framer Motion 11.18.2** - Animations
- **Tailwind CSS 3.4.18** - Styling
- **Axios 1.7.0** - HTTP client
- **Recharts 3.3.0** - Data visualization
- **React Icons 5.5.0** - Icon library

## 📁 Project Structure

```
frontend/
├── src/
│   ├── App.jsx              # Main app component with routing
│   ├── Main.jsx             # Layout wrapper
│   ├── index.css            # Global styles
│   │
│   ├── pages/               # Page components
│   │   ├── Dashboard.jsx           # Employee dashboard
│   │   ├── HrDashboard.jsx        # HR dashboard with analytics
│   │   ├── HrLogin.jsx            # HR login page
│   │   ├── PersonalDetails.jsx    # Personal information form
│   │   ├── Training.jsx          # Training module
│   │   ├── Feedback.jsx           # Feedback submission
│   │   ├── PreOnboarding.jsx      # Pre-onboarding flow
│   │   ├── JoiningDay.jsx         # Joining day checklist
│   │   ├── TrackOnboarding.jsx    # HR onboarding tracking
│   │   ├── EmployeeDetails.jsx    # Employee detail view
│   │   ├── ITAccountManagement.jsx # IT account management
│   │   └── DepartmentIntro.jsx    # Department introduction
│   │
│   ├── components/          # Reusable components
│   │   ├── ChatBot.jsx            # AI chatbot interface
│   │   ├── TaskProgress.jsx       # Task progress indicator
│   │   ├── UploadDocs.jsx         # Document upload component
│   │   ├── TrainingCard.jsx       # Training module card
│   │   ├── EmailSetupCard.jsx      # Email setup card
│   │   ├── OrientationSessionCard.jsx # Orientation card
│   │   ├── DepartmentChart.jsx    # Organization chart
│   │   └── LogoNav.jsx            # Logo navigation
│   │
│   ├── utils/               # Utility functions
│   │   ├── taskfetchers.js        # Task fetching logic
│   │   ├── queryTagger.js         # Query tagging
│   │   └── responseMap.js         # Response mapping
│   │
│   ├── assets/              # Static assets
│   │   └── *.png           # Logo images
│   │
│   └── config/             # Configuration
│       └── supa_training.json # Training module config
│
├── public/                  # Public assets
├── index.html              # HTML template
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind configuration
├── postcss.config.js       # PostCSS configuration
├── Package.json            # Dependencies and scripts
└── README.md               # This file
```

## 🛠️ Setup

### Prerequisites

- Node.js 16+ and npm
- Backend API running (see backend README)

### Installation

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```
   
   If you encounter peer dependency conflicts:
   ```bash
   npm install --legacy-peer-deps
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the `frontend/` directory (or copy from `env.example`):
   ```env
   VITE_API_URL=http://localhost:8000
   ```
   
   **⚠️ Important for Deployment:**
   - For production, update `VITE_API_URL` to your production backend URL
   - See [../DEPLOYMENT_KEYS_CHECKLIST.md](../DEPLOYMENT_KEYS_CHECKLIST.md) for deployment guide
   - Never commit `.env` files to version control

4. **Start development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173` (or next available port)

5. **Build for production**
   ```bash
   npm run build
   ```
   
   Production build will be in `dist/` directory

## 📦 Key Dependencies

### Production Dependencies
- **react** (^18.3.1) - UI framework
- **react-dom** (^18.3.1) - React DOM renderer
- **react-router-dom** (^6.30.1) - Routing
- **axios** (^1.7.0) - HTTP client
- **framer-motion** (^11.18.2) - Animations
- **recharts** (^3.3.0) - Charts and graphs
- **react-icons** (^5.5.0) - Icon library
- **react-toastify** (^11.0.5) - Toast notifications
- **xlsx** (^0.18.5) - Excel export
- **file-saver** (^2.0.5) - File download

### Development Dependencies
- **vite** (^5.2.0) - Build tool
- **@vitejs/plugin-react** (^4.2.1) - Vite React plugin
- **tailwindcss** (^3.4.18) - CSS framework
- **postcss** (^8.5.6) - CSS processor
- **autoprefixer** (^10.4.21) - CSS autoprefixer

## 🎨 Features Overview

### Employee Dashboard
- View onboarding progress
- Track task completion
- Upload documents (PDF only)
- Submit training certificates
- Chat with SUPA AI assistant
- Submit feedback

### HR Dashboard
- Employee analytics and statistics
- Onboarding tracking
- Department-wise breakdowns
- Export employee data to Excel
- Email account management
- IT account management
- Password reset functionality

### Document Management
- PDF-only uploads
- Document validation (Aadhaar, PAN, Bank)
- Automatic file replacement on re-upload
- Secure document storage

### AI Chatbot (SUPA)
- Context-aware responses
- Policy document retrieval
- Employee status queries
- HR-specific analytics
- Intent detection
- Multi-model support (Mistral, Phi)

## 🔒 Security

- JWT token-based authentication
- Secure API communication
- Client-side validation
- Secure document uploads
- Password hashing on backend
- Environment variables for sensitive configuration
- Never commit `.env` files (use `env.example` as template)

### Deployment Security
- **Before deploying**: Replace all personal keys with organization keys
- Update `VITE_API_URL` to production backend URL
- See [DEPLOYMENT_KEYS_CHECKLIST.md](../DEPLOYMENT_KEYS_CHECKLIST.md) for complete guide

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1920px+)
- Laptop (1024px - 1919px)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 🎯 Key Components

### ChatBot
Intelligent chatbot interface with:
- Real-time messaging
- Context-aware responses
- Markdown support
- Typing indicators

### TaskProgress
Visual progress tracking with:
- Circular progress indicators
- Task completion status
- Real-time updates

### UploadDocs
Document upload with:
- PDF validation
- File size limits
- Progress indicators
- Error handling

## 🚦 Development Workflow

1. **Start backend server** (from backend directory)
   ```bash
   uvicorn app.main:app --reload
   ```

2. **Start frontend server** (from frontend directory)
   ```bash
   npm run dev
   ```

3. **Access application**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:8000`
   - API Docs: `http://localhost:8000/docs`

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process on port 5173 (or change port in vite.config.js)
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:5173 | xargs kill
```

### CORS Issues
- Ensure backend CORS is configured correctly
- Check `VITE_API_URL` in `.env` matches backend URL
- Verify `VITE_API_URL` is set correctly (should not be `undefined`)

### Environment Variables Not Working
- Ensure `.env` file is in `frontend/` directory (not `src/`)
- Restart dev server after changing `.env` file
- Variables must start with `VITE_` to be accessible in frontend
- Check `import.meta.env.VITE_API_URL` in browser console

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Styling Issues
- Ensure Tailwind is properly configured
- Check `tailwind.config.js`
- Verify PostCSS configuration

## 📚 Additional Resources

### Documentation
- **[Backend README](../backend/README.md)** - Backend setup and API documentation
- **[Deployment Keys Checklist](../DEPLOYMENT_KEYS_CHECKLIST.md)** - 🔑 Complete deployment guide
- **[Keys Replacement Summary](../KEYS_REPLACEMENT_SUMMARY.md)** - Quick keys reference
- **[Keys Replacement Table](../KEYS_REPLACEMENT_TABLE.md)** - Keys in table format

### External Resources
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Framer Motion Documentation](https://www.framer.com/motion/)

## 🤝 Contributing

1. Follow React best practices
2. Use Tailwind for styling
3. Maintain component structure
4. Add proper error handling
5. Test on multiple browsers

## 📄 License

MIT License

## 👥 Authors

Sumeru Digitals Frontend Team
