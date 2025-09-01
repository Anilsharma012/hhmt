# Overview

Posttrr is a full-stack classifieds marketplace application built with a modern tech stack. The platform follows an OLX-style marketplace flow, allowing users to buy and sell items across various categories. It features a Progressive Web App (PWA) architecture with offline capabilities, user authentication, listing management, and administrative controls.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and builds
- **Styling**: Tailwind CSS with shadcn/ui component library for consistent UI patterns
- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **PWA Features**: Service worker implementation with offline caching and app installation capabilities
- **Design System**: Facebook-inspired blue color palette with mobile-first responsive design

## Backend Architecture
- **Runtime**: Node.js with Express.js and TypeScript
- **Database**: MongoDB Atlas with Mongoose ODM for data modeling
- **Authentication**: JWT tokens stored as HTTP-only cookies for session management
- **Validation**: Zod schemas for runtime type validation and API data validation
- **API Design**: RESTful API structure with organized controller/route separation
- **Middleware**: Custom authentication middleware with role-based access control

## Data Storage Design
- **Primary Database**: MongoDB Atlas cloud database
- **Schema Design**: Document-based data models for Users, Listings, Categories, Chat threads, and Packages
- **Image Storage**: Cloudinary integration for image uploads with local fallback support
- **Session Management**: Cookie-based authentication with JWT tokens

## Authentication & Authorization
- **Authentication Methods**: Email/password login and Google OAuth integration
- **Session Management**: JWT tokens stored in HTTP-only cookies with 7-day expiration
- **Role-Based Access**: User roles (user, admin) with middleware enforcement
- **Security Features**: Password hashing with bcrypt, secure cookie settings

## Key Features & Components
- **Marketplace Features**: Category browsing, listing creation/editing, search and filtering, favorites system
- **Admin Dashboard**: User management, listing moderation, analytics, and content management
- **Real-time Features**: Chat system for buyer-seller communication (planned)
- **Subscription System**: Premium listing packages with dynamic pricing based on categories and locations

# External Dependencies

## Database Services
- **MongoDB Atlas**: Primary database hosting with connection string authentication
- **Connection**: Direct MongoDB connection using Mongoose ODM with connection pooling

## Image & File Storage
- **Cloudinary**: Primary image hosting and optimization service for listing photos
- **Fallback**: Local base64 encoding as backup for image storage

## UI & Component Libraries
- **Radix UI**: Headless component primitives for accessibility and customization
- **shadcn/ui**: Pre-built component library built on Radix UI and Tailwind CSS
- **Lucide React**: Icon library for consistent iconography

## Development & Build Tools
- **Vite**: Frontend build tool and development server
- **Drizzle Kit**: Database schema management and migrations (configured for PostgreSQL but using MongoDB)
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast JavaScript bundling for production builds

## Authentication & Security
- **bcrypt**: Password hashing library
- **jsonwebtoken**: JWT token generation and verification
- **cookie-parser**: HTTP cookie parsing middleware

## Additional Integrations
- **Google Fonts**: Web font loading for Inter font family
- **Font Awesome**: Icon library for category and UI icons
- **Replit Integration**: Development environment specific tooling and error handling