# Faculty Research Management System

A full stack web application for managing faculty research profiles, publications, projects, and patents built with Flask, MongoDB, and HTML/CSS/JS

---

## Project structure

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

## Tech Stack

| Layer     | Technology           |
|-----------|----------------------|
| Backend   | Python 3.10+, Flask  |
| Database  | MongoDB (NoSQL)      |
| Frontend  | HTML5, CSS3, JS(ES6+) |
| Charts    | Chart.js             |
| DB Driver | pymongo              |

---

## Setup & Installation
---
### 1. Set up a virtual environment

```bash
# Create virtualenv
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
```

---

### 2. Install python dependencies

```bash
pip install -r backend/requirements.txt
```

---

### 3. Configure environment variables

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

### 4. Start MongoDB

**Local MongoDB:**
```bash
# Windows — start from Services or:
net start MongoDB
```

**MongoDB Atlas:**  
Update `MONGO_URI` in your `.env` with your Atlas connection string.

---

### 5. Seed sample data (Optional but recommended)

```bash
cd backend
python seed_data.py
```

This inserts 4 sample faculty members and creates the default admin account.

---

### 6. Run the application

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

Change the password in production by updating the `admins` collection in MongoDB.

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
