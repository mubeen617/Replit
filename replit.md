# Overview

This is a full-stack web application built for vehicle brokerage CRM administration. It's a modern React-based admin dashboard that allows management of vehicle brokerage companies and their broker agents. The application uses a modern architecture with React frontend connecting directly to Supabase for backend services and database operations.

The system provides authentication via Replit Auth for the Server Panel, plus a separate CRM portal with email/password authentication for vehicle brokers. It's designed for vehicle brokers who receive vehicle shipping leads and distribute them to their broker agents to find carriers and arrange vehicle shipments. The system handles multi-tenant scenarios where each vehicle brokerage company has its own set of broker agents with different roles and permissions.

**Recent Update (August 26, 2025)**: Successfully migrated from Express.js + PostgreSQL to Supabase backend and database. Major architectural changes include:
- **Backend Migration**: Replaced Express.js API layer with direct Supabase client connections
- **Database Migration**: Migrated from Neon PostgreSQL to Supabase PostgreSQL with real-time capabilities
- **Enhanced Performance**: Direct database connections eliminate API layer overhead
- **Real-time Features**: Built-in support for live updates on lead assignments and status changes
- **Scalability**: Leverages Supabase's edge network for better global performance
- **Security**: Row Level Security (RLS) policies for multi-tenant data isolation
- Complete vehicle brokerage CRM functionality maintained: leads, quotes, customer management
- Auto-generated lead numbers with format L-YYYYMM-NNNN and monthly sequence reset
- Zipcode auto-fill functionality for pickup/dropoff locations using zippopotam.us API
- Lead-to-quote conversion workflow with proper status management and cache invalidation

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
- **Runtime**: Node.js with Express.js framework for session management and Replit Auth
- **Database**: Supabase PostgreSQL with real-time capabilities and Row Level Security (RLS)
- **Data Access**: Direct Supabase client connections for frontend, service role for backend operations
- **Authentication**: Replit Auth integration with OpenID Connect for admin panel, plus custom email/password for CRM users
- **Session Management**: Express sessions for Replit Auth, Supabase auth for CRM users
- **Real-time Features**: Built-in Supabase subscriptions for live lead updates and notifications

## Database Design
The schema includes four main entities:
- **Sessions**: Required table for Replit Auth session storage
- **Users**: Core user table (mandatory for Replit Auth) storing authenticated user profiles
- **Customers**: Organizations/companies that use the trucking services
- **CustomerUsers**: Individual users belonging to customer organizations with role-based access

The database uses PostgreSQL-specific features like UUID generation and JSONB for session data. Foreign key relationships maintain data integrity between customers and their users. The leads table now uses vehicle_type (sedan, SUV, truck) and transport_type (open, enclosed) fields to support vehicle shipping operations.

## Authentication & Authorization
- **Provider**: Replit Auth using OpenID Connect protocol for secure authentication
- **Session Storage**: Server-side sessions stored in PostgreSQL with configurable TTL
- **Route Protection**: Middleware-based authentication checks on protected API endpoints
- **User Context**: React hooks provide authentication state throughout the frontend application

# External Dependencies

## Database Services
- **Supabase**: PostgreSQL hosting with real-time capabilities, authentication, and edge network
- **Supabase Client Libraries**: TypeScript SDK for frontend and backend database operations

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