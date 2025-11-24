Pre-Order & Queue-Free Restaurant Management App

<!-- Optional: Replace with a screenshot or banner of your app -->

A full-stack digital ordering solution designed to eliminate customer wait times and streamline kitchen operations for restaurants. Developed as an entrepreneurial project for Sagar's Cafe.

🚀 Project Overview

This project addresses the operational inefficiencies faced by local cafes during peak hours. By digitizing the ordering process, we allow customers to browse a virtual menu, place orders, and track their status in real-time before even arriving at the restaurant.

The solution consists of three integrated components:

Customer App (React Native): A cross-platform mobile app for browsing, ordering, and tracking.

Admin Dashboard (React): A web portal for staff to manage the menu, view live orders, and update statuses.

Backend API (Node.js): A secure, centralized server managing data, authentication, and real-time communication.

✨ Key Features

📱 Customer App

Virtual Menu: Browse dishes with images, prices, and categories.

User Accounts: Secure registration and login.

Cart Management: Add/remove items and view order summaries.

Real-Time Tracking: Live status updates (Preparing, Ready) pushed instantly via WebSockets.

Notifications: In-app vibration and alerts for status changes.

💻 Admin Dashboard

Live Order Management: View incoming orders instantly without refreshing.

Status Updates: Update order status (Pending -> Preparing -> Ready -> Completed) with one click.

Menu Management (CRUD): Add, edit, and delete menu items securely.

Daily Statistics: View total revenue, completed orders, and cancelled orders for the day.

⚙️ Backend & Infrastructure

Secure API: RESTful endpoints protected by JWT authentication.

Real-Time Engine: Socket.io integration for bi-directional communication.

Persistent Database: Cloud-hosted PostgreSQL database for reliable data storage.

Live Deployment: Fully deployed on Render (Backend/DB) and Netlify (Frontend).

🛠️ Tech Stack

Component

Technology

Frontend (Mobile)

React Native, Expo, React Navigation

Frontend (Web)

React.js, Axios

Backend

Node.js, Express.js

Database

PostgreSQL

Real-Time

Socket.io

Authentication

JSON Web Tokens (JWT), bcryptjs

Deployment

Render (Backend), Netlify (Admin), EAS (Mobile)

🏗️ System Architecture

The application follows a 3-tier architecture:

Presentation Tier: React Native App & React Admin Dashboard.

Application Tier: Node.js/Express Server.

Data Tier: PostgreSQL Database.

<!-- You can upload your flowchart image here -->

🚀 Getting Started

Prerequisites

Node.js installed on your machine.

PostgreSQL installed locally (for local development).

Expo Go app on your phone (for testing the mobile app).

Installation

Clone the repository:

git clone [https://github.com/madhanmatthew/5th_sem_project.git](https://github.com/madhanmatthew/5th_sem_project.git)
cd 5th_sem_project


Setup Backend:

cd backend
npm install
Create a .env file with your DATABASE_URL
node index.js


Setup Admin Dashboard:

cd ../admin-dashboard
npm install
npm start


Setup Customer App:

cd ../customer-app
npm install
npx expo start


👥 Team Members

Madhan Matthew S - Backend & Admin Dashboard Lead

Manoj Sasikumar - Mobile App & Frontend Lead

Mourya Reddy V - Research & Documentation
