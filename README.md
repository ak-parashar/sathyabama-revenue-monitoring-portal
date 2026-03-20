# Sathyabama Revenue Monitoring Portal

![Sathyabama Institute of Science and Technology Logo](public/sathyabama-logo.png)

A comprehensive, role-based Grants & Revenue Monitoring Dashboard built specifically for the **Sathyabama Institute of Science and Technology**. This platform enables Principal Investigators (PIs), Head of Departments (HODs), and Administrators to seamlessly track project funding, team members, document milestones, and overall financial health for various research grants.

## 🌟 Key Features

* **Role-Based Access Control (RBAC):** Distinct dashboards and permissions for Superadmins, Admins (HODs), Principal Investigators (PIs), Co-PIs, JRFs, and Assistants.
* **Financial Overview:** Real-time tracking of Sanctioned Budgets, Received Funds, Utilized Budgets, and Pending Balances.
* **Document Management:** Securely upload and retrieve Sanction Letters, Release Orders, and Utilization Certificates categorized by project year.
* **Team Management:** Invite and manage Investigators and Manpower (JRF, SRF, RA, Staff) with specific roles and stipend tracking.
* **Activity & Audit Logging:** Maintain a chronological timeline of all activities (documents added, members added, status changes) on a per-project basis.
* **Modern UI/UX:** Fully responsive, premium glassmorphism design with a fully functional Dark/Light theme toggle maintaining the Sathyabama maroon branding.
* **Project Status Management:** Instantly update and track active projects (`On-Going`, `Completed`, `Terminated`).

## 🛠️ Technology Stack

**Frontend:**
* React 18 (Vite)
* TypeScript
* Tailwind CSS
* shadcn/ui (Radix UI)
* Framer Motion (Animations)
* Lucide React (Icons)
* Recharts (Data Visualization)

**Backend:**
* Node.js & Express
* PostgreSQL
* bcryptjs (Authentication)
* multer (File Upload Handling)

## 🚀 Getting Started

### Prerequisites
* Node.js (v18+)
* PostgreSQL (v14+)
* Git

### 1. Database Setup
1. Create a PostgreSQL database (e.g., `sathyabama_grants`).
2. Run the provided SQL schema file to initialize the tables:
   ```bash
   psql -U postgres -d sathyabama_grants -f local_postgres_schema.sql
   ```

### 2. Backend Setup
1. Navigate to the server directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` directory and add your database credentials:
   ```env
   PORT=5000
   POSTGRES_USER=postgres
   POSTGRES_HOST=localhost
   POSTGRES_DB=sathyabama_grants
   POSTGRES_PASSWORD=your_password
   POSTGRES_PORT=5432
   JWT_SECRET=your_jwt_secret_key
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Open a new terminal and navigate to the project root:
   ```bash
   cd sathyabama-grants-hub-main
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite frontend development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to `http://localhost:8080` (or the port specified by Vite).

## 🛡️ Default Roles & Authentication
When initially setting up the database, you can seed a Superadmin user. From the web portal, the Superadmin can create branch Admins (HODs), who can in turn create PIs. 

All authenticated users are directed to customized dashboards based on their role (`/faculty-home`, `/hod-dashboard`, `/admin-dashboard`, etc.).

## 🤝 Contributing
For internal development by the Sathyabama maintenance team. Ensure all new UI components utilize the predefined Tailwind CSS variables for theme consistency across light and dark modes.

## 📝 License
Proprietary software for Sathyabama Institute of Science and Technology. All rights reserved.
