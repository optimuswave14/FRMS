"""
Seed script: Populates MongoDB with sample faculty data.
Run once: python seed_data.py
"""
from pymongo import MongoClient
import os

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017/")
client = MongoClient(MONGO_URI)
db = client["faculty_research_db"]
faculty_col = db["faculty"]
admin_col = db["admins"]

faculty_col.create_index("faculty_id", unique=True)

# Admin
admin_col.delete_many({})
admin_col.insert_one({"username": "admin", "password": "admin123", "name": "System Administrator"})
print("✅ Admin seeded")

# Sample faculty
faculty_col.delete_many({})
sample_faculty = [
    {
        "faculty_id": "FAC101",
        "name": "Dr. Ananya Sharma",
        "department": "CSE",
        "email": "ananya.sharma@college.edu",
        "designation": "Professor",
        "research_interests": ["AI", "Machine Learning", "Deep Learning"],
        "publications": [
            {"pub_id": "p1", "title": "Deep Learning for Medical Imaging", "journal": "IEEE", "year": 2024, "doi": "10.1109/dl2024", "citation_count": 45},
            {"pub_id": "p2", "title": "Federated Learning in Healthcare", "journal": "Springer", "year": 2023, "doi": "10.1007/fl2023", "citation_count": 30}
        ],
        "projects": [
            {"proj_id": "pr1", "project_title": "AI-Based Diagnosis System", "funding_agency": "DST", "amount": 750000, "start_date": "2023-01-01", "end_date": "2025-12-31", "status": "Ongoing"},
            {"proj_id": "pr2", "project_title": "ML for Drug Discovery", "funding_agency": "ICMR", "amount": 500000, "start_date": "2021-06-01", "end_date": "2023-06-01", "status": "Completed"}
        ],
        "patents": [
            {"patent_id": "pt1", "patent_title": "Automated Retinal Scan Analyzer", "filed_year": 2022, "status": "Granted"}
        ]
    },
    {
        "faculty_id": "FAC102",
        "name": "Dr. Rajan Mehta",
        "department": "ECE",
        "email": "rajan.mehta@college.edu",
        "designation": "Associate Professor",
        "research_interests": ["IoT", "Embedded Systems", "Wireless Sensor Networks"],
        "publications": [
            {"pub_id": "p3", "title": "Smart Sensor Networks for Agriculture", "journal": "Elsevier", "year": 2023, "doi": "10.1016/ssn2023", "citation_count": 20},
            {"pub_id": "p4", "title": "Low Power IoT Protocols", "journal": "ACM", "year": 2022, "doi": "10.1145/iot2022", "citation_count": 15}
        ],
        "projects": [
            {"proj_id": "pr3", "project_title": "Smart Irrigation System", "funding_agency": "NABARD", "amount": 300000, "start_date": "2023-04-01", "end_date": "2024-12-31", "status": "Ongoing"}
        ],
        "patents": [
            {"patent_id": "pt2", "patent_title": "Solar-Powered IoT Gateway", "filed_year": 2021, "status": "Pending"},
            {"patent_id": "pt3", "patent_title": "Wireless Moisture Sensor Array", "filed_year": 2023, "status": "Filed"}
        ]
    },
    {
        "faculty_id": "FAC103",
        "name": "Dr. Priya Nair",
        "department": "CSE",
        "email": "priya.nair@college.edu",
        "designation": "Assistant Professor",
        "research_interests": ["Cybersecurity", "Blockchain", "Cryptography"],
        "publications": [
            {"pub_id": "p5", "title": "Blockchain-Based Data Integrity", "journal": "IEEE Security", "year": 2024, "doi": "10.1109/bc2024", "citation_count": 35}
        ],
        "projects": [
            {"proj_id": "pr4", "project_title": "Secure Voting System using Blockchain", "funding_agency": "MeitY", "amount": 600000, "start_date": "2022-07-01", "end_date": "2024-06-30", "status": "Completed"}
        ],
        "patents": []
    },
    {
        "faculty_id": "FAC104",
        "name": "Dr. Suresh Kumar",
        "department": "MECH",
        "email": "suresh.kumar@college.edu",
        "designation": "Professor",
        "research_interests": ["Robotics", "Automation", "3D Printing"],
        "publications": [
            {"pub_id": "p6", "title": "Adaptive Robotic Arms for Manufacturing", "journal": "ASME", "year": 2023, "doi": "10.1115/robot2023", "citation_count": 28},
            {"pub_id": "p7", "title": "Topology Optimization in 3D Printing", "journal": "Elsevier", "year": 2022, "doi": "10.1016/3dp2022", "citation_count": 18}
        ],
        "projects": [
            {"proj_id": "pr5", "project_title": "Collaborative Robot for Small Industries", "funding_agency": "DST", "amount": 900000, "start_date": "2023-09-01", "end_date": "2026-08-31", "status": "Ongoing"}
        ],
        "patents": [
            {"patent_id": "pt4", "patent_title": "Modular Robotic Gripper Design", "filed_year": 2023, "status": "Granted"}
        ]
    }
]

faculty_col.insert_many(sample_faculty)
print(f"✅ {len(sample_faculty)} faculty members seeded successfully!")
print("\nLogin credentials: admin / admin123")
