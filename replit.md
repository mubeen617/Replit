# Overview

This is a full-stack web application built for truck dispatch CRM administration. It's a modern React-based admin dashboard that allows management of customers and their users in a trucking/logistics business context. The application uses a monolithic architecture with a Node.js/Express backend serving both API endpoints and static frontend assets.

The system provides authentication via Replit Auth, customer management capabilities, user management within customer organizations, and a statistics dashboard. It's designed to handle multi-tenant scenarios where each customer organization has its own set of users with different roles and permissions.

**Recent Update (August 20, 2025)**: Added secure password storage for both customers and users. Admin passwords are now required when creating customers, and user passwords are required when creating customer users. All passwords are hashed using bcrypt before storage. This enables future CRM portal authentication where both customer admins and their users can login using their email and password credentials.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript, built using Vite for fast development and optimized production builds
- **Styling**: Tailwind CSS with shadcn/ui component library providing a consistent design system
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for client-side routing with a simple, lightweight approach
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **UI Components**: Radix UI primitives wrapped in custom components for accessibility and consistency

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Replit Auth integration with OpenID Connect for user authentication
- **Session Management**: Express sessions stored in PostgreSQL using connect-pg-simple
- **API Design**: RESTful API endpoints with consistent error handling and logging middleware

## Database Design
The schema includes four main entities:
- **Sessions**: Required table for Replit Auth session storage
- **Users**: Core user table (mandatory for Replit Auth) storing authenticated user profiles
- **Customers**: Organizations/companies that use the trucking services
- **CustomerUsers**: Individual users belonging to customer organizations with role-based access

The database uses PostgreSQL-specific features like UUID generation and JSONB for session data. Foreign key relationships maintain data integrity between customers and their users.

## Authentication & Authorization
- **Provider**: Replit Auth using OpenID Connect protocol for secure authentication
- **Session Storage**: Server-side sessions stored in PostgreSQL with configurable TTL
- **Route Protection**: Middleware-based authentication checks on protected API endpoints
- **User Context**: React hooks provide authentication state throughout the frontend application

# External Dependencies

## Database Services
- **Neon Database**: PostgreSQL hosting service for production database management
- **Drizzle Kit**: Database migration and schema management tooling

## Authentication Services
- **Replit Auth**: Complete authentication solution with OpenID Connect integration
- **Passport.js**: Authentication middleware for handling OAuth flows

## Frontend Libraries
- **shadcn/ui**: Pre-built accessible UI components based on Radix UI primitives
- **Radix UI**: Low-level UI primitives for building accessible design systems
- **TanStack Query**: Server state management with intelligent caching and background updates
- **React Hook Form**: Performant forms library with minimal re-renders
- **Zod**: TypeScript-first schema validation for runtime type checking

## Development Tools
- **Vite**: Fast build tool with hot module replacement for development
- **TypeScript**: Static type checking across the entire application
- **Tailwind CSS**: Utility-first CSS framework for rapid UI development
- **ESBuild**: Fast JavaScript bundler for production builds

## Runtime Services
- **Express.js**: Web application framework for Node.js
- **WebSocket Support**: Real-time communication capabilities for development features
- **CORS Handling**: Cross-origin resource sharing configuration for API access