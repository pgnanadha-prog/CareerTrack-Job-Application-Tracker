from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json
from pathlib import Path

app = FastAPI(
    title="CareerTrack API",
    description="API for managing job applications",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = Path(__file__).parent / "applications.json"


class Application(BaseModel):
    company: str
    role: str
    date: str
    deadline: Optional[str] = ""
    status: str = "Applied"
    notes: Optional[str] = ""


def load_applications():
    if not DATA_FILE.exists():
        return []

    try:
        with open(DATA_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)
            return data if isinstance(data, list) else []
    except (json.JSONDecodeError, OSError):
        return []


def save_applications(applications):
    with open(DATA_FILE, "w", encoding="utf-8") as file:
        json.dump(applications, file, indent=4)


applications = load_applications()


def get_next_id():
    if not applications:
        return 1

    return max(item["id"] for item in applications) + 1


@app.get("/")
def home():
    return {"message": "Welcome to CareerTrack API!"}


@app.get("/applications")
def get_applications():
    return {
        "message": "Applications retrieved successfully!",
        "applications": applications,
    }


@app.post("/applications", status_code=201)
def add_application(application: Application):
    new_application = application.model_dump()
    new_application["id"] = get_next_id()

    applications.append(new_application)
    save_applications(applications)

    return {
        "message": "Application added successfully!",
        "application": new_application,
    }


@app.put("/applications/{application_id}")
def update_application(
    application_id: int,
    updated_application: Application,
):
    for index, application in enumerate(applications):
        if application["id"] == application_id:
            updated_data = updated_application.model_dump()
            updated_data["id"] = application_id

            applications[index] = updated_data
            save_applications(applications)

            return {
                "message": "Application updated successfully!",
                "application": updated_data,
            }

    raise HTTPException(
        status_code=404,
        detail="Application not found.",
    )


@app.delete("/applications/{application_id}")
def delete_application(application_id: int):
    for index, application in enumerate(applications):
        if application["id"] == application_id:
            deleted_application = applications.pop(index)
            save_applications(applications)

            return {
                "message": "Application deleted successfully!",
                "application": deleted_application,
            }

    raise HTTPException(
        status_code=404,
        detail="Application not found.",
    )