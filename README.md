# CareerTrack – Job Application Tracker

CareerTrack is a full-stack web application that helps users organize and track their job applications in one place.

It provides a dashboard to monitor application progress, manage application details, search and filter opportunities, and keep track of important deadlines.

## Features

- **Dashboard:** View job application statistics and application status summaries.
- **Application Management:** Add, edit, and delete job applications.
- **Status Tracking:** Track applications through Applied, Assessment, Interview, Selected, and Rejected statuses.
- **Search Applications:** Find applications using the available search functionality.
- **Filter Applications:** Filter applications according to their status.
- **Deadline Tracking:** View upcoming and overdue application deadlines.
- **Persistent Storage:** Store application records using the FastAPI backend and a local JSON file.
- **REST API:** Manage application records through FastAPI endpoints.
- **Responsive Interface:** Use a dashboard-style interface built with React and CSS.

## Technologies Used

### Frontend
- React
- JavaScript
- HTML
- CSS
- Vite

### Backend
- Python
- FastAPI
- Pydantic
- Uvicorn

### Data Storage
- JSON file-based storage

### Development Tools
- Visual Studio Code
- Git
- GitHub
- npm

## Project Structure

```text
job-application-tracker/
├── backend/
│   └── main.py
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── .gitignore
├── README.md
└── dashboard.png
```

---

## Application Screenshots

### Dashboard

![CareerTrack Dashboard](dashboard.png)

## Getting Started

Follow these steps to run CareerTrack on your local computer.

### Prerequisites

Make sure you have installed:
- Python
- Node.js and npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/pgnanadha-prog/CareerTrack-Job-Application-Tracker.git
cd CareerTrack-Job-Application-Tracker
```

### 2. Start the Backend

Open a terminal in the project directory and navigate to the backend folder:

```bash
cd backend
```

Install the required Python packages according to your backend dependency file, if provided.

Start the FastAPI server:

```bash
uvicorn main:app --reload
```

The backend API will be available at:

```text
http://127.0.0.1:8000
```

To explore the API endpoints, open:

```text
http://127.0.0.1:8000/docs
```

### 3. Start the Frontend

Open a **second terminal** in the project directory and navigate to the frontend folder:

```bash
cd frontend
```

Install the frontend dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in the terminal, usually:

```text
http://localhost:5173
```

## Future Improvements

- Add user authentication.
- Introduce advanced application analytics.
- Improve the dashboard with additional visualizations.
- Add notifications for upcoming application deadlines.
- Explore database integration for persistent storage.

## Author

**Gnanadha Satyalakshmi Devi**

GitHub: [pgnanadha-prog](https://github.com/pgnanadha-prog)