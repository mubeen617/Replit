# Software Requirements Specification (SRS)

## 1. Introduction
This document outlines the software requirements, database structure, and system architecture for the CRM (Customer Relationship Management) system designed for Vehicle Shipping and Logistics.

## 2. Entity-Relationship (ER) Diagram
The following diagram illustrates the database schema, including entities such as Customers (Tenants), Users, Leads, Quotes, Orders, and Dispatch records, along with their relationships.

```mermaid
erDiagram
    %% Core Tenant Entities
    CUSTOMERS {
        uuid id PK
        string name
        string domain
        string admin_email
        string status
    }
    
    CUSTOMER_USERS {
        uuid id PK
        uuid customer_id FK
        string email
        string role "admin/user/viewer"
        string password
    }

    %% Business Entities
    LEADS {
        uuid id PK
        uuid customer_id FK
        uuid assigned_user_id FK
        string public_id "YYYYMMNNNN"
        string status "lead/quote/order/dispatch"
        string origin
        string destination
        string vehicle_details
        string contact_details
    }

    QUOTES {
        uuid id PK
        uuid lead_id FK
        uuid customer_id FK
        string public_id
        string status "draft/sent/accepted"
        decimal carrier_fees
        decimal broker_fees
        decimal total_tariff
    }

    ORDERS {
        uuid id PK
        uuid quote_id FK
        uuid lead_id FK
        uuid customer_id FK
        string public_id
        string status "pending_signature/signed"
        boolean contract_signed
    }

    DISPATCH {
        uuid id PK
        uuid order_id FK
        uuid lead_id FK
        uuid customer_id FK
        string public_id
        string carrier_name
        string status "assigned/in_transit/delivered"
    }

    %% Relationships
    CUSTOMERS ||--o{ CUSTOMER_USERS : "has staff"
    CUSTOMERS ||--o{ LEADS : "owns"
    CUSTOMER_USERS ||--o{ LEADS : "manages"
    LEADS ||--o{ QUOTES : "generates"
    LEADS ||--|| ORDERS : "becomes"
    LEADS ||--|| DISPATCH : "fulfills"
    QUOTES ||--|| ORDERS : "converts to"
    ORDERS ||--|| DISPATCH : "dispatches"
```

## 3. Use Case Diagram
This section details the interactions between the system actors (Super Admin, Customer Admin, Customer User) and the core modules (Lead, Quote, Order Management).

```mermaid
graph TD
    %% Actors
    Admin((Customer Admin))
    User((Customer User))
    System[CRM System]

    %% Admin Use Cases
    subgraph Admin Functions
        Admin -->|Create/Manage| Staff[Manage Users]
        Admin -->|View| AdminDash[Admin Dashboard]
        Admin -->|Configure| Settings[Org Settings]
    end

    %% User Use Cases
    subgraph Operational Workflow
        User -->|Create| NewLead[New Lead]
        User -->|Import| APILead[Fetch External Leads]
        
        NewLead -->|Assign| Assign[Assign to Self/Others]
        
        Assign -->|Convert| MakeQuote[Generate Quote]
        MakeQuote -->|Send| SendQuote[Email Quote]
        
        SendQuote -->|Client Accepts| ConvertOrder[Convert to Order]
        
        ConvertOrder -->|Send Contract| Contracts[Manage Signatures]
        Contracts -->|Finalize| Dispatch[Dispatch to Carrier]
        
        Dispatch -->|Track| Track[Track Status]
    end

    %% Relationships
    Staff --> User
    Admin -- inherits --> User
```

## 4. Architectural Diagram
The system follows a modern full-stack architecture using a monolithic repository structure with clear separation of concerns between Client and Server.

### Tech Stack
*   **Frontend**: React, Vite, TailwindCSS (UI), Shadcn/Radix (Components).
*   **Backend**: Node.js, Express (API), Passport (Auth), Multer (Uploads).
*   **Database**: PostgreSQL (via Supabase), Drizzle ORM (Data Access).

```mermaid
graph TB
    subgraph Client Layer ["Presentation Layer (Browser)"]
        ReactApp[React Application]
        Router[Wouter Routing]
        UI[Shadcn/Tailwind UI]
        
        ReactApp --> Router
        ReactApp --> UI
    end

    subgraph Server Layer ["Application Layer (Node.js/Express)"]
        API[API Routes]
        Auth[Passport Auth Strategy]
        Validation[Zod Schema Validation]
        Stats[Analytics Engine]
        
        API --> Auth
        API --> Validation
        API --> Stats
    end

    subgraph Data Layer ["Persistence Layer"]
        Drizzle[Drizzle ORM]
        Supabase[(Supabase PostgreSQL)]
        Storage[File Storage/Uploads]
        
        Drizzle --> Supabase
    end

    %% Data Flow
    ReactApp -- HTTP/JSON --> API
    API -- SQL Queries --> Drizzle
    API -- File I/O --> Storage
```

## 5. System Features
### 5.1 Lead Management
*   **Centralized Intake**: Manual entry or API integration for importing leads.
*   **Unified ID**: A generic `public_id` (YYYYMMNNNN) persists across the entire lifecycle (Lead -> Quote -> Order -> Dispatch).
*   **Assignment**: Leads can be assigned to specific users for follow-up.

### 5.2 Financials & Quoting
*   **Tariff Calculation**: Separate tracking for Carrier Fees, Broker Fees, and Total Tariff.
*   **Quote Generation**: Automatic generation of quotes from lead data.
*   **Status Tracking**: Track quotes from Draft -> Sent -> Accepted.

### 5.3 Order Fulfillment
*   **Contract Management**: Digital contract generation and signature tracking.
*   **Dispatching**: Assign carriers, drivers, and truck info to confirmed orders.
*   **Status Updates**: Track shipment form 'Assigned' to 'Delivered'.
