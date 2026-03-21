# Local Development Setup Guide

Follow these steps to set up the project on your machine.

## 1. Prerequisites
- **Node.js**: Install the latest LTS version.
- **PostgreSQL**: Install PostgreSQL (v14 or later).
- **Git**: Ensure Git is installed.

## 2. Database Setup
1. Open your PostgreSQL terminal (psql) or a tool like pgAdmin.
2. Create a new database named `grants_hub`:
   ```sql
   CREATE DATABASE grants_hub;
   ```
3. Run the schema script located in the root of the project:
   ```bash
   psql -d grants_hub -f local_postgres_schema.sql
   ```
   *(This will create all tables and add a default admin user)*.

## 3. Server Configuration
1. Navigate to the `server/` directory.
2. Copy the `.env.example` (or use the one provided) and ensure it has your local database credentials:
   ```env
   PORT=5000
   DB_USER=your_postgres_user
   DB_PASSWORD=your_postgres_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=grants_hub
   JWT_SECRET=your_super_secret_key
   ```
3. Install dependencies and start the server:
   ```bash
   npm install
   npm run dev
   ```

## 4. Frontend Setup
1. Navigate to the root directory.
2. Install dependencies and start the development server:
   ```bash
   npm install
   npm run dev
   ```
3. The app should now be running at `http://localhost:5173`.

## 5. Login Credentials
You can use the following default account to log in:
- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Role**: Superadmin
