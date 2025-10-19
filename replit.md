# Overview

This is a full-stack web application built for vehicle brokerage CRM administration. It's a modern React-based admin dashboard that allows management of vehicle brokerage companies and their broker agents. The application uses a modern architecture with React frontend connecting directly to Supabase for backend services and database operations.

The system consists of two distinct access paths: a Server Panel accessible only through private development URL for admin management, and a CRM portal with email/password authentication for vehicle brokers. It's designed for vehicle brokers who receive vehicle shipping leads and distribute them to their broker agents to find carriers and arrange vehicle shipments. The system handles multi-tenant scenarios where each vehicle brokerage company has its own set of broker agents with different roles and permissions.

**Recent Update (October 19, 2025)**: Removed Replit Auth from Server Panel for simplified access through private URL. Changes include:
- **Server Panel Access**: Removed authentication layer; accessible only through private development URL
- **Simplified Architecture**: Removed Replit Auth, Passport.js, and session management dependencies
- **Direct Access**: Server panel pages (Dashboard, Customers, Users) now directly accessible
- **CRM Authentication**: Maintained separate email/password authentication for CRM portal users
- **Security**: Server panel protected by Replit's private development URL (only accessible to Repl owner)

**Previous Update (August 28, 2025)**: Successfully completed full CRM functionality with working lead management and quote conversion. Major changes include:
- **Full CRM Functionality**: Complete working lead creation and quote conversion workflow
- **Lead Management**: Auto-generated lead numbers (L-YYYYMM-NNNN format), proper field validation, CRUD operations
- **Quote Conversion**: Working lead-to-quote conversion with automatic user creation when needed
- **Database Operations**: All operations through Supabase with proper snake_case field naming
- **Password Security**: Proper bcrypt hashing for all customer and user passwords
- **Schema Consistency**: Fixed all field naming mismatches between frontend and backend

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
- **Runtime**: Node.js with Express.js framework providing full API layer
- **Database**: Supabase PostgreSQL with secure data access and real-time capabilities
- **Data Access**: Express.js API endpoints connecting to Supabase for all database operations
- **Authentication**: Email/password authentication with bcrypt for CRM portal users only
- **API Layer**: RESTful endpoints for all CRUD operations, lead management, and quote conversion workflows
- **Access Control**: Server panel accessible through private development URL; CRM portal requires login

## Database Design
The schema includes seven main entities:
- **Customers**: Organizations/companies that use the vehicle shipping services
- **CustomerUsers**: Individual users belonging to customer organizations with role-based access and bcrypt-hashed passwords
- **Leads**: Vehicle shipping opportunities with auto-generated lead numbers and comprehensive tracking
- **Quotes**: Generated quotes with pricing and terms from converted leads
- **Orders**: Finalized orders with contract management and signature tracking
- **Dispatch**: Active shipment dispatch records with carrier and driver information

The database uses PostgreSQL-specific features like UUID generation and proper foreign key relationships. Lead numbers follow L-YYYYMM-NNNN format with monthly sequence resets. All tables support vehicle shipping operations with fields like vehicle_type, transport_type, carrier fees, and broker fees.

## Authentication & Authorization
- **Server Panel**: No authentication required; protected by Replit's private development URL (accessible only to Repl owner)
- **CRM Portal**: Email/password authentication with bcrypt password hashing
- **Password Security**: All user passwords hashed using bcrypt with salt rounds of 12
- **Multi-tenant Isolation**: Each customer organization has separate users with role-based access

# External Dependencies

## Database Services
- **Supabase**: Managed PostgreSQL hosting with authentication, real-time features, and REST API
- **Drizzle ORM**: TypeScript-first ORM providing type-safe database schema definitions

## Security Libraries
- **bcryptjs**: Password hashing library for secure CRM user authentication

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