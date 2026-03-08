# 🎓 Faculty Research Management System (FRMS)

A full-stack web application for managing faculty research profiles, publications, projects, and patents — built with **Flask**, **MongoDB**, and vanilla **HTML/CSS/JS**.

---

## 📁 Project Structure

```
faculty-research-system/
├── backend/
│   ├── app.py              # Flask app — all API routes
│   ├── seed_data.py        # Seed MongoDB with sample data
│   └── requirements.txt    # Python dependencies
├── frontend/
│   ├── static/
│   │   ├── css/style.css   # All styling
│   │   └── js/app.js       # Frontend logic (Fetch API)
│   └── templates/
│       └── index.html      # Single Page Application shell
├── .env.example            # Environment variable template
├── .gitignore
└── README.md
```

---

## ⚙️ Tech Stack

| Layer     | Technology           |
|-----------|----------------------|
| Backend   | Python 3.10+, Flask  |
| Database  | MongoDB (NoSQL)      |
| Frontend  | HTML5, CSS3, JS (ES6+) |
| Charts    | Chart.js             |
| DB Driver | pymongo              |

---

## Setup & Installation

### Prerequisites
- Python 3.10 or newer
- MongoDB Community Server (local) **or** MongoDB Atlas (cloud)
- pip
- Git

---

### Step 1 — Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/faculty-research-system.git
cd faculty-research-system
```

---

### Step 2 — Set Up a Virtual Environment

```bash
# Create virtualenv
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
```

---

### Step 3 — Install Python Dependencies

```bash
pip install -r backend/requirements.txt
```

---

### Step 4 — Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env`:
```
MONGO_URI=mongodb://localhost:27017/     
# OR for Atlas:
# MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/
SECRET_KEY=your_random_secret_key_here
```

---

### Step 5 — Start MongoDB

**Local MongoDB:**
```bash
# Windows — start from Services or:
net start MongoDB
```

**MongoDB Atlas:**  
Update `MONGO_URI` in your `.env` with your Atlas connection string.

---

### Step 6 — Seed Sample Data (Optional but Recommended)

```bash
cd backend
python seed_data.py
```

This inserts 4 sample faculty members and creates the default admin account.

---

### Step 7 — Run the Application

```bash
cd backend
python app.py
```

Open your browser and go to: **http://localhost:5000**

---

## Default Login

| Username | Password |
|----------|----------|
| `admin`  | `admin123` |

> ⚠️ Change the password in production by updating the `admins` collection in MongoDB.

---

## API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/login` | Admin login |
| POST | `/api/logout` | Logout |
| GET | `/api/auth/status` | Check session |

### Faculty
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/faculty` | List all faculty |
| GET | `/api/faculty/<faculty_id>` | Get faculty profile |
| POST | `/api/addFaculty` | Add new faculty |
| PUT | `/api/updateFaculty/<faculty_id>` | Update faculty |
| DELETE | `/api/deleteFaculty/<faculty_id>` | Delete faculty |

### Publications
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/addPublication/<faculty_id>` | Add publication |
| PUT | `/api/updatePublication/<faculty_id>/<pub_id>` | Update publication |
| DELETE | `/api/deletePublication/<faculty_id>/<pub_id>` | Delete publication |

### Projects & Patents
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/addProject/<faculty_id>` | Add project |
| DELETE | `/api/deleteProject/<faculty_id>/<proj_id>` | Delete project |
| POST | `/api/addPatent/<faculty_id>` | Add patent |
| DELETE | `/api/deletePatent/<faculty_id>/<patent_id>` | Delete patent |

### Search
| Method | Endpoint | Query Params |
|--------|----------|--------------|
| GET | `/api/searchFaculty` | `name`, `department`, `interest`, `pub_year`, `project_status`, `funding_agency` |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Stats + analytics |

---

## MongoDB Atlas Setup (Cloud)

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) and create a free account
2. Create a new **Cluster** (free M0 tier works fine)
3. Under **Database Access**, create a user with read/write permissions
4. Under **Network Access**, add your IP (or `0.0.0.0/0` for development)
5. Click **Connect → Drivers** and copy the connection string
6. Paste it into your `.env` file as `MONGO_URI`

---

## Key MongoDB Queries Used

```python
# Find faculty by department
collection.find({"department": "CSE"})

# Find by research interest
collection.find({"research_interests": {"$regex": "AI", "$options": "i"}})

# Top cited faculty (aggregation pipeline)
collection.aggregate([
    {"$project": {"name": 1, "total_citations": {"$sum": "$publications.citation_count"}}},
    {"$sort": {"total_citations": -1}},
    {"$limit": 5}
])

# Add embedded document
collection.update_one({"faculty_id": "FAC101"}, {"$push": {"publications": {...}}})

# Remove embedded document
collection.update_one({"faculty_id": "FAC101"}, {"$pull": {"publications": {"pub_id": "p1"}}})
```

---

## Features Implemented

- [x] Admin login / session management
- [x] Dashboard with live stats & charts
- [x] Add / Edit / Delete faculty
- [x] Add / Delete publications, projects, patents
- [x] Faculty profile page with embedded records
- [x] Multi-field search & filter
- [x] Top-cited faculty analytics
- [x] Funding agency analysis
- [x] Department distribution chart
- [x] Data validation & error handling
- [x] MongoDB indexing (faculty_id, department, research_interests)
- [x] Responsive design

---

## Author

Built as a NoSQL database project using Flask + MongoDB.
