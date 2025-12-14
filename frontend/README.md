# Invoice OCR Platform - Frontend

React + TypeScript + Vite frontend for Invoice OCR Platform.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Backend API running on `http://localhost:3000`

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Edit .env if needed
nano .env

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── api/               # API client and endpoints
│   │   └── client.ts      # Axios instance with interceptors
│   ├── components/        # Reusable components
│   │   ├── auth/          # Auth components (login, register)
│   │   ├── invoices/      # Invoice components
│   │   ├── dashboard/     # Dashboard components
│   │   ├── admin/         # Admin components
│   │   └── common/        # Common components (buttons, inputs)
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   ├── contexts/          # React contexts (auth, etc.)
│   ├── utils/             # Utility functions
│   ├── types/             # TypeScript types
│   ├── App.tsx            # Root component
│   ├── main.tsx           # Entry point
│   └── index.css          # Global styles
├── public/                # Static assets
├── index.html             # HTML template
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── .env.example
```

## 🛠 Available Scripts

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run preview   # Preview production build
npm run lint      # Lint code
npm run format    # Format code with Prettier
```

## 🎨 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **TanStack Query** - Server state management
- **React Hook Form** - Form handling
- **Zod** - Schema validation
- **Axios** - HTTP client
- **Recharts** - Data visualization
- **React Hot Toast** - Notifications
- **Lucide React** - Icons

## 🔌 API Integration

The frontend connects to the backend API at `http://localhost:3000/api/v1` by default.

Configure the API URL in `.env`:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

## 📱 Pages to Implement

### Public Pages
- [ ] Login page (`/login`)
- [ ] Register page (`/register`)

### User Pages (Protected)
- [ ] Dashboard (`/dashboard`)
- [ ] Invoice list (`/invoices`)
- [ ] Invoice detail (`/invoices/:id`)
- [ ] Invoice upload (`/invoices/upload`)

### Admin Pages (Protected)
- [ ] Admin dashboard (`/admin`)
- [ ] Invoice review (`/admin/review`)
- [ ] Invoice correction (`/admin/invoices/:id`)

## 🎨 Component Structure

### Example Component Structure
```tsx
// src/components/invoices/InvoiceCard.tsx
interface InvoiceCardProps {
  invoice: Invoice;
  onView: (id: string) => void;
}

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice, onView }) => {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      {/* Component content */}
    </div>
  );
};
```

## 🔐 Authentication

Authentication is handled via JWT tokens stored in `localStorage`.

The API client automatically:
- Adds the token to all requests
- Redirects to login on 401 errors
- Clears the token on logout

## 📚 Documentation

See the main project documentation in `../documentation/` for:
- Frontend Architecture: `../documentation/architecture/FRONTEND_ARCHITECTURE.md`
- API Design: `../documentation/api/API_DESIGN.md`
- Implementation Guide: `../documentation/development/IMPLEMENTATION_GUIDE.md`

## 🧪 Testing

```bash
# TODO: Add testing setup
npm test
```

## 📝 Next Steps

1. Create authentication pages (login, register)
2. Implement protected routes
3. Create dashboard with analytics
4. Build invoice upload component
5. Create invoice list and detail pages
6. Implement admin review panel
7. Add comprehensive tests

See `../documentation/IMPLEMENTATION_CHECKLIST.md` for detailed tasks.

## 🎨 Styling Guidelines

- Use Tailwind CSS utility classes
- Follow mobile-first responsive design
- Use the primary color palette defined in `tailwind.config.js`
- Keep components small and reusable
- Use consistent spacing (4, 8, 16, 24, 32px)

## 🚀 Deployment

Build for production:
```bash
npm run build
```

The build output will be in the `dist/` folder, ready to deploy to:
- AWS S3 + CloudFront
- Vercel
- Netlify
- Any static hosting service

See `../documentation/deployment/DEPLOYMENT.md` for detailed deployment instructions.

