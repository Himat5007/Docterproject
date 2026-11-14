🏥 Clinic & Prescription Management System
A full-stack, secure web application for doctors and clinics to manage patients, prescriptions, and print professional medical scripts.

✨ Features
Admin Panel: Approve users, create/edit accounts, and "Login As" a doctor to fix errors.

Doctor Dashboard: Manage patients, vitals, diagnosis (Dx), and clinical notes.

Smart Medicine Registry: Autocomplete medicine names with auto-fill for Mg and Type to prevent errors.

Patient History: Search by name/ID, filter by date, and re-print past prescriptions.

Professional Print: A4 layout with options for "Blank Paper" (with custom Header/Footer images) or "Pre-printed Paper".

🛠️ Tech Stack
Frontend: React (Vite), Tailwind CSS, Axios, react-to-print

Backend: Node.js, Express, JWT (Auth), Bcrypt.js, Multer

Database: Local JSON files (Lightweight & easy to deploy)

🚀 Quick Start
1. Backend Setup:

bash
cd backend
npm install
node server.js
2. Frontend Setup:

bash
cd frontend
npm install
npm run dev
🔐 Default Admin Login:

Username: 0000

Password: admin123
(Change this immediately after logging in!)

⚠️ Production Note
Currently, data is saved in .json files. For a large-scale cloud deployment, it is recommended to migrate to MongoDB or PostgreSQL. Also, change the JWT_SECRET in server.js before going live.

Author: Mohammad Farooq Himatzai
