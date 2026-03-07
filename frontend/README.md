# AI HR Onboarding — Frontend

React-based frontend for the AI HR Onboarding system. Provides employee onboarding dashboards, HR management interface, AI chatbot (SUPA), and document management.

## Project Structure

```
frontend/
├── src/
│   ├── App.jsx              # Main app with routing
│   ├── main.jsx             # Entry point
│   ├── index.css            # Global styles (Tailwind)
│   │
│   ├── pages/
│   │   ├── Dashboard.jsx           # Employee onboarding dashboard
│   │   ├── HrDashboard.jsx        # HR analytics dashboard
│   │   ├── HrLogin.jsx            # HR login page
│   │   ├── PersonalDetails.jsx    # Personal info form + document upload
│   │   ├── Training.jsx           # Training modules + certificate upload
│   │   ├── Feedback.jsx           # Employee feedback form
│   │   ├── PreOnboarding.jsx      # HR pre-onboarding form
│   │   ├── JoiningDay.jsx         # Joining day checklist
│   │   ├── TrackOnboarding.jsx    # HR onboarding tracking
│   │   ├── EmployeeDetails.jsx    # Employee detail view (HR)
│   │   ├── ITAccountManagement.jsx # IT account management (HR)
│   │   ├── DepartmentIntro.jsx    # Department introduction
│   │   └── PreReview.jsx          # Final review page
│   │
│   ├── components/
│   │   ├── ChatBot.jsx            # SUPA AI chatbot interface
│   │   ├── TaskProgress.jsx       # Task progress indicator
│   │   ├── UploadDocs.jsx         # Document upload component
│   │   ├── TrainingCard.jsx       # Training module card
│   │   ├── EmailSetupCard.jsx     # Email setup card
│   │   ├── OrientationSessionCard.jsx # Orientation card
│   │   ├── DepartmentChart.jsx    # Organization chart
│   │   └── LogoNav.jsx            # Logo/navigation bar
│   │
│   ├── utils/
│   │   ├── apiConfig.js           # API URL config (auto HTTPS conversion)
│   │   ├── taskfetchers.js        # Task data fetching
│   │   ├── queryTagger.js         # Chatbot query tagging
│   │   └── responseMap.js         # Response mapping
│   │
│   ├── config/
│   │   └── supa_training.json     # Training module configuration
│   │
│   └── assets/                    # Logo images
│
├── public/
│   └── company-policy.txt         # Company policy document
│
├── index.html              # HTML template
├── vite.config.js          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── postcss.config.js       # PostCSS configuration
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## Setup

### Prerequisites
- Node.js 16+ and npm
- Backend API running (see `backend/README.md`)

### Installation

```bash
cd frontend
npm install
```

If you encounter peer dependency conflicts:
```bash
npm install --legacy-peer-deps
```

### Environment Variables

Create `.env` in the `frontend/` directory (or copy from `env.example`):

```env
VITE_API_URL=http://localhost:8000
```

For production, use HTTPS:
```env
VITE_API_URL=https://api.your-domain.com
```

**Note:** Vite embeds environment variables at build time. You must rebuild (`npm run build`) after changing `.env`.

### Run (Development)

```bash
npm run dev
```

App available at `http://localhost:5173`

### Build (Production)

```bash
npm run build
```

Output: `dist/` directory with optimized static files. Serve with Nginx or any static file server.

### Preview Production Build

```bash
npm run preview
```

## Dependencies

### Production
| Package | Version | Purpose |
|---------|---------|---------|
| react | 18.3.1 | UI framework |
| react-dom | 18.3.1 | DOM renderer |
| react-router-dom | 6.30.1 | Client-side routing |
| axios | 1.7.0 | HTTP client |
| framer-motion | 11.18.2 | Animations |
| recharts | 3.3.0 | Charts and graphs |
| react-icons | 5.5.0 | Icon library |
| react-toastify | 11.0.5 | Toast notifications |
| xlsx | 0.18.5 | Excel export |
| file-saver | 2.0.5 | File download |
| lucide-react | 0.381.0 | Icons |
| fuse.js | 7.1.0 | Fuzzy search |
| d3 / d3-org-chart | 7.9.0 / 3.1.1 | Organization charts |
| react-markdown | 10.1.0 | Markdown rendering |
| html2canvas | 1.4.1 | HTML to image |

### Development
| Package | Version | Purpose |
|---------|---------|---------|
| vite | 5.2.0 | Build tool & dev server |
| @vitejs/plugin-react | 4.2.1 | Vite React plugin |
| tailwindcss | 3.4.18 | Utility-first CSS |
| postcss | 8.5.6 | CSS processing |
| autoprefixer | 10.4.21 | CSS vendor prefixes |

## Features

### Employee Pages
- **Dashboard** — Progress tracking with circular indicator and task cards
- **Personal Details** — Form for basic info, family details, document numbers + PDF upload (Aadhaar, PAN, Bank, NDA)
- **Joining Day** — Checklist: email setup, orientation, policy acceptance
- **Training** — Three modules (POSH, IT Access, Collaboration) with certificate upload
- **Department Intro** — Department overview and org chart
- **Feedback** — Star rating and comments form
- **Final Review** — Summary of all completed tasks

### HR Pages
- **Login** — Company email + password authentication
- **Dashboard** — Analytics cards, department charts, recent joinees, feedback stats
- **Pre-Onboarding** — Create employee form → sends invitation email
- **Employee Details** — Searchable/filterable table, status toggle, document view/download/print, Excel export
- **IT Account Management** — Create, edit, delete IT accounts
- **Track Onboarding** — Monitor employee onboarding progress

### Components
- **ChatBot (SUPA)** — AI chatbot available on all pages
- **UploadDocs** — PDF upload with validation (type, size ≤ 10MB)
- **TaskProgress** — Visual progress indicator

## API Configuration

The `src/utils/apiConfig.js` utility:
- Reads `VITE_API_URL` from environment
- Strips trailing slashes
- **Auto-converts HTTP → HTTPS** when the page is loaded over HTTPS (except localhost)

This prevents mixed content errors in production without needing to rebuild.

## Production Deployment

### Static Hosting (Nginx)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    root /path/to/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### GitHub Pages
1. Repo Settings → Pages → Source: GitHub Actions
2. Add `VITE_API_URL` as repository secret (must be HTTPS)
3. Push to main — auto-deploys

### After Deployment
- Verify API requests use HTTPS (check Network tab in DevTools)
- Clear browser cache (`Ctrl+Shift+R`) if seeing stale content
- Check console for mixed content warnings

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Blank page | Run `npm run build`, check `dist/` exists, verify Nginx config |
| API connection failed | Check `VITE_API_URL` in `.env`, ensure backend is running |
| Mixed content error | Use HTTPS for `VITE_API_URL`, or rely on auto-conversion in `apiConfig.js` |
| CORS error | Add frontend domain to backend's `allowed_origins` |
| Build fails | Delete `node_modules`, run `npm install --legacy-peer-deps`, try again |
| Stale API URL after rebuild | Vite embeds env vars at build time — rebuild after changing `.env` |
| Peer dependency conflicts | Use `npm install --legacy-peer-deps` |

