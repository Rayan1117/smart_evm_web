💻 Smart EVM Web

A React-based dashboard for managing and monitoring elections in the Smart EVM ecosystem.
Supports both Admin and User roles with real-time vote tracking, configuration control, and result viewing.


🎨 Project Presentation

You can view the Smart EVM presentation design on Canva:
👉 https://www.canva.com/design/DAG_B811Ybg/rPAJ8L_VBC7w5IaCP2MEHA/edit?utm_content=DAG_B811Ybg&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton


🌍 Hosted App

Live URL: https://smart-evm-web.onrender.com

Backend API: https://voting-api-wnlq.onrender.com


⚙️ Tech Stack

React (Create React App)
React Router DOM
Tailwind CSS + PostCSS
Ant Design (UI library)
Socket.IO Client (for real-time updates)


🧠 Key Features

Role-based login (Admin / User)

Secure JWT authentication with token storage in localStorage

Create and manage elections and configurations

Live election status and vote updates via Socket.IO

View and analyze election results

Reset and resume election sessions



🚀 Getting Started

Install dependencies
npm install

Run development server
npm start

Open in browser
http://localhost:3000

Requires Node.js 18+ and npm 9+.



🧭 App Routes

/login – Login page (Admin / User toggle)
/ – Elections dashboard (protected)
/create-election – New election form
/create-config – Create configuration preset
/configs – View all presets
/election-live-stats/:id – Live stats dashboard
/election-result/:id – Election result page



🔗 Integration

Connects directly to the Voting API for authentication, config management, and real-time Socket.IO communication.
👉 https://github.com/Rayan1117/voting_api_public
