# Overview

This is a full-stack web application built for vehicle brokerage CRM administration. It's a modern React-based admin dashboard that allows management of vehicle brokerage companies and their broker agents. The application uses a modern architecture with React frontend connecting directly to Supabase for backend services and database operations.

The system provides authentication via Replit Auth for the Server Panel, plus a separate CRM portal with email/password authentication for vehicle brokers. It's designed for vehicle brokers who receive vehicle shipping leads and distribute them to their broker agents to find carriers and arrange vehicle shipments. The system handles multi-tenant scenarios where each vehicle brokerage company has its own set of broker agents with different roles and permissions.

**Recent Update (August 28, 2025)**: Successfully completed full CRM functionality with working lead management and quote conversion. Major changes include:
- **Full CRM Functionality**: Complete working lead creation and quote conversion workflow
- **Authentication System**: Dual authentication working (Replit Auth for admin, bcrypt hashed passwords for CRM users)
- **Lead Management**: Auto-generated lead numbers (L-YYYYMM-NNNN format), proper field validation, CRUD operations
- **Quote Conversion**: Working lead-to-quote conversion with automatic user creation when needed
- **Database Operations**: All operations through Supabase with proper snake_case field naming
- **Form Validation**: Frontend forms properly aligned with backend API expectations
- **Password Security**: Proper bcrypt hashing for all customer and user passwords
- **Schema Consistency**: Fixed all field naming mismatches between frontend and backend
- **Error Handling**: Comprehensive error handling and user feedback throughout the application

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
- **Runtime**: Node.js with Express.js framework providing full API layer and session management
- **Database**: Supabase PostgreSQL with secure authentication and real-time capabilities
- **Data Access**: Express.js API endpoints connecting to Supabase for all database operations
- **Authentication**: Replit Auth integration with OpenID Connect for admin panel, plus custom email/password authentication for CRM users
- **Session Management**: Express sessions with PostgreSQL storage for Replit Auth, server-side authentication for CRM users
- **API Layer**: RESTful endpoints for all CRUD operations, lead management, and quote conversion workflows

## Database Design
The schema includes eight main entities:
- **Sessions**: Required table for Replit Auth session storage (JSONB)
- **Users**: Core user table (mandatory for Replit Auth) storing authenticated user profiles
- **Customers**: Organizations/companies that use the vehicle shipping services
- **CustomerUsers**: Individual users belonging to customer organizations with role-based access
- **Leads**: Vehicle shipping opportunities with auto-generated lead numbers and comprehensive tracking
- **Quotes**: Generated quotes with pricing and terms from converted leads
- **Orders**: Finalized orders with contract management and signature tracking
- **Dispatch**: Active shipment dispatch records with carrier and driver information

The database uses PostgreSQL-specific features like UUID generation, JSONB for session data, and proper foreign key relationships. Lead numbers follow L-YYYYMM-NNNN format with monthly sequence resets. All tables support vehicle shipping operations with fields like vehicle_type, transport_type, carrier fees, and broker fees.

## Authentication & Authorization
- **Provider**: Replit Auth using OpenID Connect protocol for secure authentication
- **Session Storage**: Server-side sessions stored in PostgreSQL with configurable TTL
- **Route Protection**: Middleware-based authentication checks on protected API endpoints
- **User Context**: React hooks provide authentication state throughout the frontend application

# External Dependencies

## Database Services
- **Supabase**: Managed PostgreSQL hosting with authentication, real-time features, and REST API
- **Drizzle ORM**: TypeScript-first ORM providing type-safe database schema definitions

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