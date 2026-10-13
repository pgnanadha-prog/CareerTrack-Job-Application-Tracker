# CareerTrack – Job Application Tracker

CareerTrack is a full-stack web application that helps users organize and track their job applications in one place.

The application provides a dashboard to monitor application statuses, manage deadlines, and keep track of job opportunities.

## Features

- Dashboard displaying total applications, interviews, and offers
- Add new job applications
- Edit existing application details
- Delete applications
- Search applications by company, role, or notes
- Filter applications by status
- Track application deadlines
- Receive deadline reminders
- Save application data using a JSON file
- REST API built with FastAPI

## Tech Stack

### Frontend
- React
- Vite
- JavaScript
- CSS

### Backend
- Python
- FastAPI
- REST API

### Data Storage
- JSON file

## Project Structure

```text
job-application-tracker/
├── backend/
│   ├── main.py
│   └── applications.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md