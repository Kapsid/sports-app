# WinterSim - Winter Sports Simulation

A fullstack winter sports simulation application built with Node.js/Express backend and Vue.js frontend.

## Features

- User authentication (login/registration)
- Personal simulation worlds for each user
- Each world contains multiple sports
- Six winter sports available:
  - Ski Jumping
  - Biathlon
  - Cross Country Skiing
  - Bobsleigh
  - Skeleton
  - Speed Skating
- Modern light blue/blue themed UI with Font Awesome icons
- SQLite database for data persistence

## App Structure

```
Login/Register -> Dashboard (Worlds List) -> World Dashboard (Sports) -> Sport Page
```

- **Dashboard**: Shows all your simulation worlds. Create, enter, or delete worlds.
- **World Dashboard**: Inside a world, see all available sports as tiles.
- **Sport Page**: Individual sport management (coming soon).

## Tech Stack

### Backend
- Node.js with Express
- SQLite (sql.js - pure JavaScript implementation)
- JWT authentication
- bcryptjs for password hashing

### Frontend
- Vue 3 with Composition API
- Vue Router for navigation
- Pinia for state management
- Vite for build tooling
- Font Awesome icons

## Project Structure

```
wintersim-app/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js          # Database setup and initialization
│   │   ├── middleware/
│   │   │   └── auth.js              # JWT authentication middleware
│   │   ├── routes/
│   │   │   ├── auth.js              # Authentication routes
│   │   │   ├── sports.js            # Sports API routes
│   │   │   └── worlds.js            # Worlds API routes
│   │   └── index.js                 # Express app entry point
│   ├── data/                        # SQLite database storage
│   ├── package.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   │   └── main.css             # Global styles
│   │   ├── router/
│   │   │   └── index.js             # Vue Router configuration
│   │   ├── stores/
│   │   │   ├── auth.js              # Authentication store
│   │   │   ├── sports.js            # Sports store
│   │   │   └── worlds.js            # Worlds store
│   │   ├── views/
│   │   │   ├── LoginView.vue        # Login page
│   │   │   ├── RegisterView.vue     # Registration page
│   │   │   ├── DashboardView.vue    # Worlds list dashboard
│   │   │   ├── WorldDashboardView.vue # Sports inside a world
│   │   │   └── SportView.vue        # Sport detail page
│   │   ├── App.vue
│   │   └── main.js
│   ├── public/
│   │   └── snowflake.svg            # Favicon
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── run.sh                           # Startup script
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Running the Application

1. Clone or navigate to the project directory:
   ```bash
   cd wintersim-app
   ```

2. Run the startup script:
   ```bash
   ./run.sh
   ```

   This will:
   - Install backend dependencies
   - Install frontend dependencies
   - Start the backend API server (port 3001)
   - Start the frontend dev server (port 5173)

3. Open your browser and navigate to:
   ```
   http://localhost:5173
   ```

### Manual Setup

If you prefer to run services separately:

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Routes

| Route | Description |
|-------|-------------|
| `/login` | Login page |
| `/register` | Registration page |
| `/dashboard` | Worlds list (main dashboard) |
| `/world/:id` | World dashboard with sports tiles |
| `/world/:worldId/sport/:sportId` | Sport detail page |

## Database Schema

### Users
- `id` - UUID primary key
- `username` - Unique username
- `email` - Unique email
- `password` - Hashed password
- `created_at` - Timestamp
- `updated_at` - Timestamp

### Sports
- `id` - Unique sport identifier
- `name` - Sport name
- `icon` - Font Awesome icon class
- `description` - Sport description

### Worlds
- `id` - UUID primary key
- `user_id` - Owner user ID (foreign key)
- `name` - World name
- `description` - World description
- `created_at` - Timestamp
- `updated_at` - Timestamp

### World Sports
- Links worlds to enabled sports with per-world settings

### Athletes
- `id` - UUID primary key
- `world_id` - Parent world (foreign key)
- `name` - Athlete name
- `country` - Country code
- `sport_id` - Sport (foreign key)
- `rating` - Athlete rating
- `stats` - JSON statistics

### Competitions
- `id` - UUID primary key
- `world_id` - Parent world (foreign key)
- `sport_id` - Sport (foreign key)
- `name` - Competition name
- `location` - Event location
- `date` - Event date
- `status` - scheduled/in_progress/completed
- `results` - JSON results data

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Sports
- `GET /api/sports` - List all sports
- `GET /api/sports/:id` - Get sport by ID

### Worlds
- `GET /api/worlds` - List user's worlds
- `GET /api/worlds/:id` - Get world details
- `POST /api/worlds` - Create new world
- `PUT /api/worlds/:id` - Update world
- `DELETE /api/worlds/:id` - Delete world

## Environment Variables

Backend `.env` file:
```
PORT=3001
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

## Development

### Adding New Sports

1. Add sport data in `backend/src/config/database.js`
2. Add icon mapping in `frontend/src/views/WorldDashboardView.vue`
3. Add sport data in `frontend/src/views/SportView.vue`

### Styling

The app uses a custom CSS design system with CSS variables defined in `frontend/src/assets/main.css`. The color scheme is based on light blue/ice blue tones.

## License

MIT
