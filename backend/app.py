from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
from pymongo import MongoClient, ASCENDING
from bson import ObjectId
from bson.errors import InvalidId
import os
import json
from datetime import datetime
from functools import wraps

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

app = Flask(
    __name__,
    static_folder=os.path.join(BASE_DIR, "../frontend/static"),
    template_folder=os.path.join(BASE_DIR, "../frontend/templates")
)
app.secret_key = os.environ.get("SECRET_KEY", "faculty_research_secret_2024")
CORS(app)

# ─── MongoDB Connection ────────────────────────────────────────────────────────
MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client["faculty_research_db"]
faculty_col = db["faculty"]
admin_col = db["admins"]

# Indexes
faculty_col.create_index("faculty_id", unique=True)
faculty_col.create_index("department")
faculty_col.create_index("research_interests")

# ─── Helpers ──────────────────────────────────────────────────────────────────
def serialize(doc):
    """Convert MongoDB document to JSON-serializable dict."""
    if doc is None:
        return None
    doc["_id"] = str(doc["_id"])
    return doc

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("admin_logged_in"):
            return jsonify({"error": "Unauthorized. Please login."}), 401
        return f(*args, **kwargs)
    return decorated

# ─── Serve Frontend ───────────────────────────────────────────────────────────
@app.route("/")
def index():
    return send_from_directory(app.template_folder, "index.html")

@app.route("/<path:path>")
def serve_files(path):
    template_path = os.path.join(app.template_folder, path)
    static_path = os.path.join(app.static_folder, path)

    if os.path.exists(template_path):
        return send_from_directory(app.template_folder, path)

    if os.path.exists(static_path):
        return send_from_directory(app.static_folder, path)

    return jsonify({"error": "File not found"}), 404

# ─── Auth Routes ──────────────────────────────────────────────────────────────
@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username", "").strip()
    password = data.get("password", "").strip()
    admin = admin_col.find_one({"username": username, "password": password})
    if admin:
        session["admin_logged_in"] = True
        session["admin_name"] = admin.get("name", username)
        return jsonify({"message": "Login successful", "name": session["admin_name"]})
    return jsonify({"error": "Invalid credentials"}), 401

@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})

@app.route("/api/auth/status", methods=["GET"])
def auth_status():
    return jsonify({
        "logged_in": bool(session.get("admin_logged_in")),
        "name": session.get("admin_name", "")
    })

# ─── Dashboard ────────────────────────────────────────────────────────────────
@app.route("/api/dashboard", methods=["GET"])
def dashboard():
    total_faculty = faculty_col.count_documents({})
    all_faculty = list(faculty_col.find({}, {"publications": 1, "projects": 1, "patents": 1}))

    total_publications = sum(len(f.get("publications", [])) for f in all_faculty)
    total_projects = sum(len(f.get("projects", [])) for f in all_faculty)
    total_patents = sum(len(f.get("patents", [])) for f in all_faculty)

    # Top cited faculty
    pipeline = [
        {"$project": {
            "name": 1, "faculty_id": 1, "department": 1,
            "total_citations": {"$sum": "$publications.citation_count"}
        }},
        {"$sort": {"total_citations": -1}},
        {"$limit": 5}
    ]
    top_cited = [serialize(f) for f in faculty_col.aggregate(pipeline)]

    # Department distribution
    dept_pipeline = [
        {"$group": {"_id": "$department", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    dept_dist = list(faculty_col.aggregate(dept_pipeline))

    # Funding analysis
    funding_pipeline = [
        {"$unwind": "$projects"},
        {"$group": {
            "_id": "$projects.funding_agency",
            "total": {"$sum": "$projects.amount"},
            "count": {"$sum": 1}
        }},
        {"$sort": {"total": -1}},
        {"$limit": 5}
    ]
    funding = list(faculty_col.aggregate(funding_pipeline))

    return jsonify({
        "total_faculty": total_faculty,
        "total_publications": total_publications,
        "total_projects": total_projects,
        "total_patents": total_patents,
        "top_cited": top_cited,
        "dept_distribution": dept_dist,
        "funding_analysis": funding
    })

# ─── Faculty CRUD ─────────────────────────────────────────────────────────────
@app.route("/api/faculty", methods=["GET"])
def get_all_faculty():
    faculty = list(faculty_col.find({}, {"publications": 0, "projects": 0, "patents": 0}))
    return jsonify([serialize(f) for f in faculty])

@app.route("/api/faculty/<faculty_id>", methods=["GET"])
def get_faculty(faculty_id):
    faculty = faculty_col.find_one({"faculty_id": faculty_id})
    if not faculty:
        return jsonify({"error": "Faculty not found"}), 404
    return jsonify(serialize(faculty))

@app.route("/api/addFaculty", methods=["POST"])
@login_required
def add_faculty():
    data = request.json
    required = ["faculty_id", "name", "department", "email", "designation"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"'{field}' is required"}), 400

    if faculty_col.find_one({"faculty_id": data["faculty_id"]}):
        return jsonify({"error": "Faculty ID already exists"}), 409

    if faculty_col.find_one({"email": data["email"]}):
        return jsonify({"error": "Email already registered"}), 409

    doc = {
        "faculty_id": data["faculty_id"].strip(),
        "name": data["name"].strip(),
        "department": data["department"].strip(),
        "email": data["email"].strip().lower(),
        "designation": data["designation"].strip(),
        "research_interests": [r.strip() for r in data.get("research_interests", []) if r.strip()],
        "publications": [],
        "projects": [],
        "patents": [],
        "created_at": datetime.utcnow().isoformat()
    }
    result = faculty_col.insert_one(doc)
    return jsonify({"message": "Faculty added successfully", "id": str(result.inserted_id)}), 201

@app.route("/api/updateFaculty/<faculty_id>", methods=["PUT"])
@login_required
def update_faculty(faculty_id):
    data = request.json
    allowed = ["name", "department", "email", "designation", "research_interests"]
    update_data = {k: v for k, v in data.items() if k in allowed}
    if "research_interests" in update_data:
        update_data["research_interests"] = [r.strip() for r in update_data["research_interests"] if r.strip()]

    result = faculty_col.update_one({"faculty_id": faculty_id}, {"$set": update_data})
    if result.matched_count == 0:
        return jsonify({"error": "Faculty not found"}), 404
    return jsonify({"message": "Faculty updated successfully"})

@app.route("/api/deleteFaculty/<faculty_id>", methods=["DELETE"])
@login_required
def delete_faculty(faculty_id):
    result = faculty_col.delete_one({"faculty_id": faculty_id})
    if result.deleted_count == 0:
        return jsonify({"error": "Faculty not found"}), 404
    return jsonify({"message": "Faculty deleted successfully"})

# ─── Publications ─────────────────────────────────────────────────────────────
@app.route("/api/addPublication/<faculty_id>", methods=["POST"])
@login_required
def add_publication(faculty_id):
    data = request.json
    required = ["title", "journal", "year"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"'{field}' is required"}), 400

    pub = {
        "pub_id": str(ObjectId()),
        "title": data["title"].strip(),
        "journal": data["journal"].strip(),
        "year": int(data["year"]),
        "doi": data.get("doi", "").strip(),
        "citation_count": int(data.get("citation_count", 0))
    }
    result = faculty_col.update_one(
        {"faculty_id": faculty_id},
        {"$push": {"publications": pub}}
    )
    if result.matched_count == 0:
        return jsonify({"error": "Faculty not found"}), 404
    return jsonify({"message": "Publication added", "pub_id": pub["pub_id"]}), 201

@app.route("/api/updatePublication/<faculty_id>/<pub_id>", methods=["PUT"])
@login_required
def update_publication(faculty_id, pub_id):
    data = request.json
    allowed = ["title", "journal", "year", "doi", "citation_count"]
    update_fields = {f"publications.$.{k}": v for k, v in data.items() if k in allowed}

    result = faculty_col.update_one(
        {"faculty_id": faculty_id, "publications.pub_id": pub_id},
        {"$set": update_fields}
    )
    if result.matched_count == 0:
        return jsonify({"error": "Publication not found"}), 404
    return jsonify({"message": "Publication updated"})

@app.route("/api/deletePublication/<faculty_id>/<pub_id>", methods=["DELETE"])
@login_required
def delete_publication(faculty_id, pub_id):
    result = faculty_col.update_one(
        {"faculty_id": faculty_id},
        {"$pull": {"publications": {"pub_id": pub_id}}}
    )
    if result.matched_count == 0:
        return jsonify({"error": "Faculty not found"}), 404
    return jsonify({"message": "Publication deleted"})

# ─── Projects ─────────────────────────────────────────────────────────────────
@app.route("/api/addProject/<faculty_id>", methods=["POST"])
@login_required
def add_project(faculty_id):
    data = request.json
    required = ["project_title", "funding_agency", "amount", "start_date", "status"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"'{field}' is required"}), 400

    project = {
        "proj_id": str(ObjectId()),
        "project_title": data["project_title"].strip(),
        "funding_agency": data["funding_agency"].strip(),
        "amount": float(data["amount"]),
        "start_date": data["start_date"],
        "end_date": data.get("end_date", ""),
        "status": data["status"]
    }
    result = faculty_col.update_one(
        {"faculty_id": faculty_id},
        {"$push": {"projects": project}}
    )
    if result.matched_count == 0:
        return jsonify({"error": "Faculty not found"}), 404
    return jsonify({"message": "Project added", "proj_id": project["proj_id"]}), 201

@app.route("/api/deleteProject/<faculty_id>/<proj_id>", methods=["DELETE"])
@login_required
def delete_project(faculty_id, proj_id):
    result = faculty_col.update_one(
        {"faculty_id": faculty_id},
        {"$pull": {"projects": {"proj_id": proj_id}}}
    )
    if result.matched_count == 0:
        return jsonify({"error": "Faculty not found"}), 404
    return jsonify({"message": "Project deleted"})

# ─── Patents ──────────────────────────────────────────────────────────────────
@app.route("/api/addPatent/<faculty_id>", methods=["POST"])
@login_required
def add_patent(faculty_id):
    data = request.json
    required = ["patent_title", "filed_year", "status"]
    for field in required:
        if not data.get(field):
            return jsonify({"error": f"'{field}' is required"}), 400

    patent = {
        "patent_id": str(ObjectId()),
        "patent_title": data["patent_title"].strip(),
        "filed_year": int(data["filed_year"]),
        "status": data["status"]
    }
    result = faculty_col.update_one(
        {"faculty_id": faculty_id},
        {"$push": {"patents": patent}}
    )
    if result.matched_count == 0:
        return jsonify({"error": "Faculty not found"}), 404
    return jsonify({"message": "Patent added", "patent_id": patent["patent_id"]}), 201

@app.route("/api/deletePatent/<faculty_id>/<patent_id>", methods=["DELETE"])
@login_required
def delete_patent(faculty_id, patent_id):
    result = faculty_col.update_one(
        {"faculty_id": faculty_id},
        {"$pull": {"patents": {"patent_id": patent_id}}}
    )
    if result.matched_count == 0:
        return jsonify({"error": "Faculty not found"}), 404
    return jsonify({"message": "Patent deleted"})

# ─── Search ───────────────────────────────────────────────────────────────────
@app.route("/api/searchFaculty", methods=["GET"])
def search_faculty():
    query = {}
    department = request.args.get("department")
    interest = request.args.get("interest")
    pub_year = request.args.get("pub_year")
    project_status = request.args.get("project_status")
    funding_agency = request.args.get("funding_agency")
    name = request.args.get("name")

    if department:
        query["department"] = {"$regex": department, "$options": "i"}
    if interest:
        query["research_interests"] = {"$regex": interest, "$options": "i"}
    if name:
        query["name"] = {"$regex": name, "$options": "i"}
    if pub_year:
        query["publications.year"] = int(pub_year)
    if project_status:
        query["projects.status"] = project_status
    if funding_agency:
        query["projects.funding_agency"] = {"$regex": funding_agency, "$options": "i"}

    results = list(faculty_col.find(query))
    return jsonify([serialize(f) for f in results])

# ─── Seed Admin ───────────────────────────────────────────────────────────────
def seed_admin():
    if admin_col.count_documents({}) == 0:
        admin_col.insert_one({
            "username": "admin",
            "password": "admin123",
            "name": "System Administrator"
        })
        print("✅ Default admin created: admin / admin123")

if __name__ == "__main__":
    seed_admin()
    app.run(host="127.0.0.1", port=5000, debug=True, use_reloader=False)