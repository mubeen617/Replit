# Overview

This is a full-stack web application built for vehicle brokerage CRM administration. It's a modern React-based admin dashboard that allows management of vehicle brokerage companies and their broker agents. The application uses a monolithic architecture with a Node.js/Express backend serving both API endpoints and static frontend assets.

The system provides authentication via Replit Auth for the Server Panel, plus a separate CRM portal with email/password authentication for vehicle brokers. It's designed for vehicle brokers who receive vehicle shipping leads and distribute them to their broker agents to find carriers and arrange vehicle shipments. The system handles multi-tenant scenarios where each vehicle brokerage company has its own set of broker agents with different roles and permissions.

**Recent Update (August 21, 2025)**: Added external API lead fetching system for vehicle shipping leads. The system now includes:
- CRM login page with separate authentication for broker managers and broker agents
- Broker manager dashboard for lead distribution and team management  
- Broker agent dashboard for working vehicle shipping leads and finding carriers
- Role-based interfaces reflecting vehicle brokerage workflow (leads, carriers, commissions)
- External API integration for automatically importing vehicle shipping leads with customer isolation
- All passwords are hashed using bcrypt before storage for security

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