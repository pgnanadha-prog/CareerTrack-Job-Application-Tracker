import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://127.0.0.1:8000";
const STORAGE_KEY = "jobApplications";

const emptyForm = {
  company: "",
  role: "",
  date: "",
  deadline: "",
  status: "Applied",
  notes: "",
};

const statuses = [
  "Applied",
  "Assessment",
  "Interview",
  "Selected",
  "Rejected",
];

const statusColors = {
  Applied: "#64748b",
  Assessment: "#8b5cf6",
  Interview: "#2563eb",
  Selected: "#16a34a",
  Rejected: "#dc2626",
};

function App() {
  const [applications, setApplications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [formData, setFormData] = useState({ ...emptyForm });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Load applications from FastAPI.
  useEffect(() => {
    async function loadApplications() {
      try {
        setError("");

        const response = await fetch(`${API_URL}/applications`);

        if (!response.ok) {
          throw new Error("Could not load applications.");
        }

        const data = await response.json();
        let loadedApplications = data.applications || [];

        // Migrate old browser data if the database is empty.
        if (loadedApplications.length === 0) {
          let savedApplications = [];

          try {
            const saved = localStorage.getItem(STORAGE_KEY);
            const parsed = saved ? JSON.parse(saved) : [];

            if (Array.isArray(parsed)) {
              savedApplications = parsed;
            }
          } catch (storageError) {
            console.error("Could not read browser backup:", storageError);
          }

          if (savedApplications.length > 0) {
            const migratedApplications = [];

            for (const application of savedApplications) {
              const {
                id,
                appliedDate,
                ...applicationData
              } = application;

              const migrationResponse = await fetch(
                `${API_URL}/applications`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({
                    ...applicationData,
                    date:
                      applicationData.date || appliedDate || "",
                    deadline: applicationData.deadline || "",
                    status: applicationData.status || "Applied",
                    notes: applicationData.notes || "",
                  }),
                }
              );

              if (!migrationResponse.ok) {
                throw new Error(
                  "Could not migrate saved applications."
                );
              }

              const result = await migrationResponse.json();
              migratedApplications.push(result.application);
            }

            loadedApplications = migratedApplications;
          }
        }

        setApplications(loadedApplications);

        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(loadedApplications)
        );
      } catch (err) {
        console.error("Loading error:", err);
        setError(
          "Unable to connect to the backend. Make sure FastAPI is running at http://127.0.0.1:8000."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadApplications();
  }, []);

  // Update application state and browser backup.
  function updateApplications(updatedApplications) {
    setApplications(updatedApplications);

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedApplications)
      );
    } catch (storageError) {
      console.error("Could not update browser backup:", storageError);
    }
  }

  // Handle form inputs.
  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  // Open a blank application form.
  function handleAddClick() {
    setFormData({ ...emptyForm });
    setEditingId(null);
    setError("");
    setShowForm(true);
  }

  // Add or edit an application.
  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    try {
      const isEditing = editingId !== null;

      const url = isEditing
        ? `${API_URL}/applications/${editingId}`
        : `${API_URL}/applications`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || "Could not save the application."
        );
      }

      const savedApplication = result.application;

      const updatedApplications = isEditing
        ? applications.map((application) =>
            application.id === editingId
              ? savedApplication
              : application
          )
        : [...applications, savedApplication];

      updateApplications(updatedApplications);

      setFormData({ ...emptyForm });
      setEditingId(null);
      setShowForm(false);
    } catch (err) {
      console.error("Save error:", err);
      setError(err.message || "Could not save the application.");
    }
  }

  // Open an application for editing.
  function handleEdit(application) {
    setFormData({
      company: application.company || "",
      role: application.role || "",
      date: application.date || application.appliedDate || "",
      deadline: application.deadline || "",
      status: application.status || "Applied",
      notes: application.notes || "",
    });

    setEditingId(application.id);
    setError("");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // Cancel the form.
  function handleCancel() {
    setShowForm(false);
    setEditingId(null);
    setFormData({ ...emptyForm });
  }

  // Delete an application.
  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this application?"
    );

    if (!confirmed) return;

    setError("");

    try {
      const response = await fetch(
        `${API_URL}/applications/${id}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail || "Could not delete the application."
        );
      }

      const updatedApplications = applications.filter(
        (application) => application.id !== id
      );

      updateApplications(updatedApplications);

      if (editingId === id) {
        handleCancel();
      }
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.message || "Could not delete the application.");
    }
  }

  // Search and status filtering.
  const filteredApplications = applications.filter(
    (application) => {
      const search = searchTerm.toLowerCase().trim();

      const company = (application.company || "").toLowerCase();
      const role = (application.role || "").toLowerCase();
      const notes = (application.notes || "").toLowerCase();

      const matchesSearch =
        company.includes(search) ||
        role.includes(search) ||
        notes.includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        application.status === statusFilter;

      return matchesSearch && matchesStatus;
    }
  );

  // Dashboard statistics.
  const totalApplications = applications.length;

  const interviews = applications.filter(
    (application) => application.status === "Interview"
  ).length;

  const offers = applications.filter(
    (application) => application.status === "Selected"
  ).length;

  // Application status chart.
  const statusCounts = statuses.map((status) => ({
    status,
    count: applications.filter(
      (application) => application.status === status
    ).length,
  }));

  const maxStatusCount = Math.max(
    1,
    ...statusCounts.map((item) => item.count)
  );

  // Today's local date in YYYY-MM-DD format.
  const now = new Date();

  const todayString = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");

  // Calculate the date three days from today.
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const threeDaysString = [
    threeDaysFromNow.getFullYear(),
    String(threeDaysFromNow.getMonth() + 1).padStart(2, "0"),
    String(threeDaysFromNow.getDate()).padStart(2, "0"),
  ].join("-");

  // Exclude applications that are completed or rejected.
  const activeApplications = applications.filter(
    (application) =>
      application.status !== "Selected" &&
      application.status !== "Rejected"
  );

  // Deadlines today or later.
  const upcomingDeadlines = activeApplications
    .filter(
      (application) =>
        application.deadline &&
        application.deadline >= todayString
    )
    .sort((a, b) =>
      a.deadline.localeCompare(b.deadline)
    );

  // Past deadlines.
  const overdueDeadlines = activeApplications
    .filter(
      (application) =>
        application.deadline &&
        application.deadline < todayString
    )
    .sort((a, b) =>
      a.deadline.localeCompare(b.deadline)
    );

  // Urgent reminders: today through three days from today.
  const urgentDeadlines = upcomingDeadlines.filter(
    (application) => application.deadline <= threeDaysString
  );

  const deadlinesDueToday = urgentDeadlines.filter(
    (application) => application.deadline === todayString
  );

  const deadlinesDueSoon = urgentDeadlines.filter(
    (application) => application.deadline > todayString
  );

  if (isLoading) {
    return (
      <div className="app">
        <main className="main-content">
          <h1>CareerTrack</h1>
          <p>Loading your job applications...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <h2 className="logo">CareerTrack</h2>

        <nav>
          <a href="#dashboard" className="nav-link active">
            Dashboard
          </a>

          <a href="#applications" className="nav-link">
            My Applications
          </a>

          <a href="#deadlines" className="nav-link">
            Deadlines
          </a>
        </nav>

        <p className="sidebar-footer">Plan your career.</p>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <div>
            <h1>Job Application Tracker</h1>
            <p>Keep track of your career opportunities.</p>
          </div>

          <button
            className="add-button"
            onClick={handleAddClick}
          >
            + Add Application
          </button>
        </header>

        {/* Error message */}
        {error && (
          <div className="error-message" role="alert">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => setError("")}
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Dashboard Statistics */}
        <section className="stats" id="dashboard">
          <div className="stat-card">
            <p>Total Applications</p>
            <h2>{totalApplications}</h2>
          </div>

          <div className="stat-card">
            <p>Interviews</p>
            <h2>{interviews}</h2>
          </div>

          <div className="stat-card">
            <p>Offers</p>
            <h2>{offers}</h2>
          </div>
        </section>

        {/* Status Chart */}
        <section className="chart-card">
          <div className="section-heading">
            <h2>Application Status Overview</h2>
            <span>All applications</span>
          </div>

          <div className="status-chart">
            {statusCounts.map(({ status, count }) => (
              <div className="chart-row" key={status}>
                <div className="chart-label">
                  <span>{status}</span>
                  <strong>{count}</strong>
                </div>

                <div
                  className="chart-track"
                  role="progressbar"
                  aria-label={`${status} applications`}
                  aria-valuemin={0}
                  aria-valuemax={maxStatusCount}
                  aria-valuenow={count}
                >
                  <div
                    className="chart-bar"
                    style={{
                      width: `${(count / maxStatusCount) * 100}%`,
                      backgroundColor: statusColors[status],
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Deadline Tracking */}
        <section className="deadline-section" id="deadlines">
          {/* Urgent Deadline Reminders */}
          {urgentDeadlines.length > 0 && (
            <div className="reminder-panel">
              <div className="reminder-header">
                <span className="reminder-icon">🔔</span>

                <div>
                  <h3>Deadline Reminders</h3>
                  <p>
                    {urgentDeadlines.length} application
                    {urgentDeadlines.length === 1 ? "" : "s"} need
                    {urgentDeadlines.length === 1 ? "s" : ""} your attention
                  </p>
                </div>
              </div>

              {deadlinesDueToday.length > 0 && (
                <div className="reminder-group">
                  <h4>🔴 Due Today</h4>

                  {deadlinesDueToday.map((application) => (
                    <div
                      className="reminder-item"
                      key={application.id}
                    >
                      <div>
                        <strong>{application.company}</strong>
                        <p>{application.role}</p>
                      </div>

                      <button
                        type="button"
                        className="add-button"
                        onClick={() => handleEdit(application)}
                      >
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {deadlinesDueSoon.length > 0 && (
                <div className="reminder-group">
                  <h4>🟡 Due Within 3 Days</h4>

                  {deadlinesDueSoon.map((application) => (
                    <div
                      className="reminder-item"
                      key={application.id}
                    >
                      <div>
                        <strong>{application.company}</strong>
                        <p>{application.role}</p>
                      </div>

                      <div className="reminder-due-date">
                        <span>{application.deadline}</span>

                        <button
                          type="button"
                          className="add-button"
                          onClick={() => handleEdit(application)}
                        >
                          Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="section-heading">
            <h2>Application Deadlines</h2>
            <span>
              {upcomingDeadlines.length} upcoming ·{" "}
              {overdueDeadlines.length} overdue
            </span>
          </div>

          {/* Deadline Summary */}
          <div className="deadline-summary">
            <div className="deadline-stat upcoming-stat">
              <p>Upcoming Deadlines</p>
              <h3>{upcomingDeadlines.length}</h3>
            </div>

            <div className="deadline-stat overdue-stat">
              <p>Overdue Deadlines</p>
              <h3>{overdueDeadlines.length}</h3>
            </div>
          </div>

          {/* Upcoming Applications */}
          <h3 className="deadline-subheading">
            Upcoming Applications
          </h3>

          {upcomingDeadlines.length > 0 ? (
            <div className="deadline-list">
              {upcomingDeadlines.map((application) => (
                <div
                  className="deadline-item"
                  key={application.id}
                >
                  <div className="deadline-company">
                    <strong>{application.company}</strong>
                    <p>{application.role}</p>
                  </div>

                  <div className="deadline-date">
                    <span>
                      {application.deadline === todayString
                        ? "Due today"
                        : "Due"}
                    </span>
                    <strong>{application.deadline}</strong>
                  </div>

                  <button
                    type="button"
                    className="add-button"
                    onClick={() => handleEdit(application)}
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="deadline-empty">
              No upcoming deadlines. You're all caught up!
            </p>
          )}

          {/* Overdue Applications */}
          {overdueDeadlines.length > 0 && (
            <>
              <h3 className="deadline-subheading overdue-heading">
                Overdue Applications
              </h3>

              <div className="deadline-list">
                {overdueDeadlines.map((application) => (
                  <div
                    className="deadline-item overdue-item"
                    key={application.id}
                  >
                    <div className="deadline-company">
                      <strong>{application.company}</strong>
                      <p>{application.role}</p>
                    </div>

                    <div className="deadline-date">
                      <span>Overdue</span>
                      <strong>{application.deadline}</strong>
                    </div>

                    <button
                      type="button"
                      className="add-button"
                      onClick={() => handleEdit(application)}
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Add or Edit Application Form */}
        {showForm && (
          <section className="form-card">
            <h2>
              {editingId !== null
                ? "Edit Job Application"
                : "Add a Job Application"}
            </h2>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="company"
                placeholder="Company name"
                value={formData.company}
                onChange={handleChange}
                required
              />

              <input
                type="text"
                name="role"
                placeholder="Job role"
                value={formData.role}
                onChange={handleChange}
                required
              />

              <label>
                Applied Date
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </label>

              <label>
                Application Deadline
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                />
              </label>

              <label>
                Status
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  {statuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Notes
                <textarea
                  name="notes"
                  placeholder="Interview date or assessment details"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                />
              </label>

              <button type="submit" className="add-button">
                {editingId !== null
                  ? "Save Changes"
                  : "Save Application"}
              </button>

              <button
                type="button"
                className="delete-button"
                onClick={handleCancel}
              >
                Cancel
              </button>
            </form>
          </section>
        )}

        {/* Applications Table */}
        <section
          className="applications-section"
          id="applications"
        >
          <div className="section-heading">
            <h2>My Applications</h2>
            <span>
              {filteredApplications.length} applications shown
            </span>
          </div>

          {/* Search and Filter */}
          <div className="application-controls">
            <input
              type="text"
              placeholder="Search company, role, or notes..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(event.target.value)
              }
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value)
              }
            >
              <option value="All">All Statuses</option>

              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {/* Applications Table */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Job Role</th>
                  <th>Applied Date</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Notes</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredApplications.length > 0 ? (
                  filteredApplications.map((application) => (
                    <tr key={application.id}>
                      <td>{application.company}</td>
                      <td>{application.role}</td>

                      <td>
                        {application.date ||
                          application.appliedDate ||
                          "—"}
                      </td>

                      <td>{application.deadline || "—"}</td>

                      <td>
                        <span
                          className={`status ${(application.status || "Applied").toLowerCase()}`}
                        >
                          {application.status || "Applied"}
                        </span>
                      </td>

                      <td>{application.notes || "—"}</td>

                      <td>
                        <button
                          type="button"
                          className="add-button"
                          onClick={() => handleEdit(application)}
                        >
                          Edit
                        </button>{" "}

                        <button
                          type="button"
                          className="delete-button"
                          onClick={() =>
                            handleDelete(application.id)
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7">
                      No applications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;