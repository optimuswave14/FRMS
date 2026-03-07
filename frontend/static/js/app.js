/* ── Faculty Research Management System — app.js ──────────────────────────── */
const API = "";            // Flask runs on same origin; prefix if needed
let deptChartInst = null;
let fundChartInst = null;

/* ─────────────────────────────── AUTH ──────────────────────────────────── */
async function doLogin() {
  const username = document.getElementById("loginUsername").value.trim();
  const password = document.getElementById("loginPassword").value.trim();
  const errEl = document.getElementById("loginError");
  errEl.classList.add("hidden");

  const res = await fetch(`${API}/api/login`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (res.ok) {
    document.getElementById("loginModal").classList.remove("active");
    document.getElementById("appShell").classList.remove("hidden");
    document.getElementById("adminName").textContent = data.name;
    navigate("dashboard");
  } else {
    errEl.textContent = data.error || "Login failed";
    errEl.classList.remove("hidden");
  }
}

async function doLogout() {
  await fetch(`${API}/api/logout`, { method: "POST" });
  document.getElementById("appShell").classList.add("hidden");
  document.getElementById("loginModal").classList.add("active");
  document.getElementById("loginPassword").value = "";
}

// Enter key on login
document.getElementById("loginPassword").addEventListener("keydown", e => {
  if (e.key === "Enter") doLogin();
});

// Check if already logged in on load
(async () => {
  const res = await fetch(`${API}/api/auth/status`);
  const data = await res.json();
  if (data.logged_in) {
    document.getElementById("loginModal").classList.remove("active");
    document.getElementById("appShell").classList.remove("hidden");
    document.getElementById("adminName").textContent = data.name;
    navigate("dashboard");
  }
})();

/* ─────────────────────────────── NAVIGATION ────────────────────────────── */
function navigate(page) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));

  const el = document.getElementById(`page-${page}`);
  if (el) el.classList.add("active");

  const link = document.querySelector(`.nav-link[onclick*="${page}"]`);
  if (link) link.classList.add("active");

  if (page === "dashboard") loadDashboard();
  if (page === "faculty") loadFaculty();
}

/* ─────────────────────────────── TOAST ─────────────────────────────────── */
function toast(msg, type = "info") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `toast ${type}`;
  t.classList.remove("hidden");
  setTimeout(() => t.classList.add("hidden"), 3000);
}

function showMsg(id, msg, type) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.className = `msg-text ${type}`;
  el.classList.remove("hidden");
}

/* ─────────────────────────────── MODALS ────────────────────────────────── */
function openModal(id) { document.getElementById(id).classList.add("active"); }
function closeModal(id) { document.getElementById(id).classList.remove("active"); }
document.querySelectorAll(".modal-overlay").forEach(m => {
  m.addEventListener("click", e => { if (e.target === m) m.classList.remove("active"); });
});

/* ─────────────────────────────── DASHBOARD ─────────────────────────────── */
async function loadDashboard() {
  const res = await fetch(`${API}/api/dashboard`);
  const d = await res.json();

  document.getElementById("statFaculty").textContent  = d.total_faculty;
  document.getElementById("statPubs").textContent     = d.total_publications;
  document.getElementById("statProjects").textContent = d.total_projects;
  document.getElementById("statPatents").textContent  = d.total_patents;

  // Top cited table
  const tbody = document.querySelector("#topCitedTable tbody");
  tbody.innerHTML = d.top_cited.length ? d.top_cited.map((f, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><strong>${f.name}</strong></td>
      <td><span class="tag dept">${f.department}</span></td>
      <td><strong>${f.total_citations}</strong></td>
    </tr>`).join("") : `<tr><td colspan="4" class="empty-state">No data</td></tr>`;

  // Dept chart
  if (deptChartInst) deptChartInst.destroy();
  deptChartInst = new Chart(document.getElementById("deptChart"), {
    type: "doughnut",
    data: {
      labels: d.dept_distribution.map(x => x._id || "Unknown"),
      datasets: [{ data: d.dept_distribution.map(x => x.count), backgroundColor: ["#4f7ef8","#22c55e","#f97316","#a855f7","#ef4444","#06b6d4"] }]
    },
    options: { plugins: { legend: { position: "bottom" } }, maintainAspectRatio: true }
  });

  // Funding chart
  if (fundChartInst) fundChartInst.destroy();
  fundChartInst = new Chart(document.getElementById("fundingChart"), {
    type: "bar",
    data: {
      labels: d.funding_analysis.map(x => x._id || "Unknown"),
      datasets: [{ label: "Total Funding (₹)", data: d.funding_analysis.map(x => x.total), backgroundColor: "#4f7ef8", borderRadius: 6 }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true, ticks: { callback: v => "₹" + (v >= 1e6 ? (v / 1e6).toFixed(1) + "L" : v.toLocaleString()) } } },
      maintainAspectRatio: true
    }
  });
}

/* ─────────────────────────────── FACULTY LIST ───────────────────────────── */
async function loadFaculty() {
  const res = await fetch(`${API}/api/faculty`);
  const faculty = await res.json();
  renderFacultyGrid("facultyGrid", faculty);
}

function renderFacultyGrid(containerId, faculty) {
  const container = document.getElementById(containerId);
  if (!faculty.length) {
    container.innerHTML = `<div class="empty-state" style="grid-column:1/-1">No faculty found.</div>`;
    return;
  }
  container.innerHTML = faculty.map(f => {
    const initials = f.name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("").toUpperCase();
    const interests = (f.research_interests || []).slice(0, 3).map(i => `<span class="tag">${i}</span>`).join("");
    return `
    <div class="faculty-card">
      <div class="fc-header">
        <div class="fc-avatar">${initials}</div>
        <div class="fc-info">
          <h4>${f.name}</h4>
          <p>${f.designation} · ${f.faculty_id}</p>
        </div>
      </div>
      <div class="tags"><span class="tag dept">${f.department}</span>${interests}</div>
      <div class="fc-stats">
        <div class="fc-stat"><span>${(f.publications || []).length || "—"}</span><label>Pubs</label></div>
        <div class="fc-stat"><span>${(f.projects || []).length || "—"}</span><label>Projects</label></div>
        <div class="fc-stat"><span>${(f.patents || []).length || "—"}</span><label>Patents</label></div>
      </div>
      <div class="fc-actions">
        <button class="btn btn-primary btn-sm" onclick="loadProfile('${f.faculty_id}')">View Profile</button>
        <button class="btn btn-ghost btn-sm" onclick="openEditModal('${f.faculty_id}')">Edit</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDelete('${f.faculty_id}', '${f.name}')">Delete</button>
      </div>
    </div>`;
  }).join("");
}

/* ─────────────────────────────── PROFILE ────────────────────────────────── */
async function loadProfile(facultyId) {
  const res = await fetch(`${API}/api/faculty/${facultyId}`);
  if (!res.ok) { toast("Faculty not found", "error"); return; }
  const f = await res.json();
  navigate("profile");
  document.getElementById("profileName").textContent = f.name;

  const initials = f.name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0]).join("").toUpperCase();
  const interests = (f.research_interests || []).map(i => `<span class="tag">${i}</span>`).join("");

  document.getElementById("profileContent").innerHTML = `
    <div class="profile-header">
      <div class="profile-avatar">${initials}</div>
      <div class="profile-info">
        <h2>${f.name}</h2>
        <p>${f.designation} · ${f.department} · <a href="mailto:${f.email}">${f.email}</a></p>
        <p style="color:var(--muted);font-size:12px;margin-top:4px">ID: ${f.faculty_id}</p>
        <div class="tags profile-tags">${interests}</div>
      </div>
      <div class="profile-actions">
        <button class="btn btn-primary" onclick="openPubModal('${f.faculty_id}')">+ Publication</button>
        <button class="btn btn-ghost" onclick="openProjModal('${f.faculty_id}')">+ Project</button>
        <button class="btn btn-ghost" onclick="openPatentModal('${f.faculty_id}')">+ Patent</button>
      </div>
    </div>

    <!-- Publications -->
    <div class="profile-section">
      <div class="profile-section-header">
        <h3>📚 Publications (${(f.publications || []).length})</h3>
      </div>
      ${(f.publications || []).length ? f.publications.map(p => `
        <div class="pub-item">
          <div>
            <div class="item-title">${p.title}</div>
            <div class="item-sub">${p.journal} · ${p.year} · ${p.citation_count} citations ${p.doi ? `· <a href="https://doi.org/${p.doi}" target="_blank">DOI</a>` : ""}</div>
          </div>
          <div class="item-actions">
            <button class="btn btn-danger btn-sm" onclick="deletePub('${f.faculty_id}','${p.pub_id}')">🗑</button>
          </div>
        </div>`).join("") : `<div class="empty-state">No publications yet.</div>`}
    </div>

    <!-- Projects -->
    <div class="profile-section">
      <div class="profile-section-header"><h3>💼 Research Projects (${(f.projects || []).length})</h3></div>
      ${(f.projects || []).length ? f.projects.map(p => `
        <div class="proj-item">
          <div>
            <div class="item-title">${p.project_title}</div>
            <div class="item-sub">${p.funding_agency} · ₹${Number(p.amount).toLocaleString()} · ${p.start_date}${p.end_date ? " → " + p.end_date : ""}</div>
            <div class="tags" style="margin-top:4px"><span class="tag status-${p.status.toLowerCase()}">${p.status}</span></div>
          </div>
          <div class="item-actions">
            <button class="btn btn-danger btn-sm" onclick="deleteProj('${f.faculty_id}','${p.proj_id}')">🗑</button>
          </div>
        </div>`).join("") : `<div class="empty-state">No projects yet.</div>`}
    </div>

    <!-- Patents -->
    <div class="profile-section">
      <div class="profile-section-header"><h3>🏆 Patents (${(f.patents || []).length})</h3></div>
      ${(f.patents || []).length ? f.patents.map(p => `
        <div class="patent-item">
          <div>
            <div class="item-title">${p.patent_title}</div>
            <div class="item-sub">Filed: ${p.filed_year}</div>
            <div class="tags" style="margin-top:4px"><span class="tag patent-${p.status.toLowerCase()}">${p.status}</span></div>
          </div>
          <div class="item-actions">
            <button class="btn btn-danger btn-sm" onclick="deletePatent('${f.faculty_id}','${p.patent_id}')">🗑</button>
          </div>
        </div>`).join("") : `<div class="empty-state">No patents yet.</div>`}
    </div>`;
}

/* ─────────────────────────────── ADD FACULTY ────────────────────────────── */
async function submitAddFaculty() {
  const data = {
    faculty_id: document.getElementById("fId").value.trim(),
    name: document.getElementById("fName").value.trim(),
    email: document.getElementById("fEmail").value.trim(),
    department: document.getElementById("fDept").value.trim(),
    designation: document.getElementById("fDesig").value,
    research_interests: document.getElementById("fInterests").value.split(",").map(s => s.trim()).filter(Boolean)
  };
  const msgEl = document.getElementById("addFacultyMsg");

  const res = await fetch(`${API}/api/addFaculty`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (res.ok) {
    showMsg("addFacultyMsg", "✅ " + json.message, "success");
    ["fId","fName","fEmail","fDept","fInterests"].forEach(id => document.getElementById(id).value = "");
    toast("Faculty added successfully!", "success");
  } else {
    showMsg("addFacultyMsg", "❌ " + (json.error || "Error"), "error");
  }
}

/* ─────────────────────────────── EDIT FACULTY ───────────────────────────── */
async function openEditModal(facultyId) {
  const res = await fetch(`${API}/api/faculty/${facultyId}`);
  const f = await res.json();
  document.getElementById("editFacultyId").value = f.faculty_id;
  document.getElementById("editName").value = f.name;
  document.getElementById("editDept").value = f.department;
  document.getElementById("editEmail").value = f.email;
  document.getElementById("editDesig").value = f.designation;
  document.getElementById("editInterests").value = (f.research_interests || []).join(", ");
  document.getElementById("editMsg").classList.add("hidden");
  openModal("modalEdit");
}

async function submitEdit() {
  const facultyId = document.getElementById("editFacultyId").value;
  const data = {
    name: document.getElementById("editName").value.trim(),
    department: document.getElementById("editDept").value.trim(),
    email: document.getElementById("editEmail").value.trim(),
    designation: document.getElementById("editDesig").value,
    research_interests: document.getElementById("editInterests").value.split(",").map(s => s.trim()).filter(Boolean)
  };
  const res = await fetch(`${API}/api/updateFaculty/${facultyId}`, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data)
  });
  const json = await res.json();
  if (res.ok) {
    toast("Faculty updated!", "success");
    closeModal("modalEdit");
    loadFaculty();
  } else {
    showMsg("editMsg", "❌ " + (json.error || "Error"), "error");
  }
}

/* ─────────────────────────────── DELETE FACULTY ─────────────────────────── */
function confirmDelete(facultyId, name) {
  document.getElementById("confirmTitle").textContent = `Delete "${name}"?`;
  document.getElementById("confirmMsg").textContent = "All publications, projects and patents will be permanently deleted.";
  document.getElementById("confirmBtn").onclick = async () => {
    const res = await fetch(`${API}/api/deleteFaculty/${facultyId}`, { method: "DELETE" });
    const json = await res.json();
    closeModal("modalConfirm");
    if (res.ok) { toast("Faculty deleted.", "success"); loadFaculty(); }
    else toast(json.error || "Error", "error");
  };
  openModal("modalConfirm");
}

/* ─────────────────────────────── PUBLICATIONS ───────────────────────────── */
function openPubModal(facultyId) {
  document.getElementById("pubFacultyId").value = facultyId;
  ["pubTitle","pubJournal","pubYear","pubCitations","pubDoi"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("pubMsg").classList.add("hidden");
  openModal("modalPub");
}

async function submitPublication() {
  const facultyId = document.getElementById("pubFacultyId").value;
  const data = {
    title: document.getElementById("pubTitle").value.trim(),
    journal: document.getElementById("pubJournal").value.trim(),
    year: document.getElementById("pubYear").value,
    citation_count: document.getElementById("pubCitations").value || 0,
    doi: document.getElementById("pubDoi").value.trim()
  };
  const res = await fetch(`${API}/api/addPublication/${facultyId}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
  });
  const json = await res.json();
  if (res.ok) { toast("Publication added!", "success"); closeModal("modalPub"); loadProfile(facultyId); }
  else showMsg("pubMsg", "❌ " + (json.error || "Error"), "error");
}

async function deletePub(facultyId, pubId) {
  const res = await fetch(`${API}/api/deletePublication/${facultyId}/${pubId}`, { method: "DELETE" });
  if (res.ok) { toast("Publication deleted.", "success"); loadProfile(facultyId); }
  else toast("Error deleting publication.", "error");
}

/* ─────────────────────────────── PROJECTS ───────────────────────────────── */
function openProjModal(facultyId) {
  document.getElementById("projFacultyId").value = facultyId;
  ["projTitle","projAgency","projAmount","projStart","projEnd"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("projMsg").classList.add("hidden");
  openModal("modalProj");
}

async function submitProject() {
  const facultyId = document.getElementById("projFacultyId").value;
  const data = {
    project_title: document.getElementById("projTitle").value.trim(),
    funding_agency: document.getElementById("projAgency").value.trim(),
    amount: document.getElementById("projAmount").value,
    start_date: document.getElementById("projStart").value,
    end_date: document.getElementById("projEnd").value,
    status: document.getElementById("projStatus").value
  };
  const res = await fetch(`${API}/api/addProject/${facultyId}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
  });
  const json = await res.json();
  if (res.ok) { toast("Project added!", "success"); closeModal("modalProj"); loadProfile(facultyId); }
  else showMsg("projMsg", "❌ " + (json.error || "Error"), "error");
}

async function deleteProj(facultyId, projId) {
  const res = await fetch(`${API}/api/deleteProject/${facultyId}/${projId}`, { method: "DELETE" });
  if (res.ok) { toast("Project deleted.", "success"); loadProfile(facultyId); }
  else toast("Error deleting project.", "error");
}

/* ─────────────────────────────── PATENTS ────────────────────────────────── */
function openPatentModal(facultyId) {
  document.getElementById("patentFacultyId").value = facultyId;
  ["patentTitle","patentYear"].forEach(id => document.getElementById(id).value = "");
  document.getElementById("patentMsg").classList.add("hidden");
  openModal("modalPatent");
}

async function submitPatent() {
  const facultyId = document.getElementById("patentFacultyId").value;
  const data = {
    patent_title: document.getElementById("patentTitle").value.trim(),
    filed_year: document.getElementById("patentYear").value,
    status: document.getElementById("patentStatus").value
  };
  const res = await fetch(`${API}/api/addPatent/${facultyId}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
  });
  const json = await res.json();
  if (res.ok) { toast("Patent added!", "success"); closeModal("modalPatent"); loadProfile(facultyId); }
  else showMsg("patentMsg", "❌ " + (json.error || "Error"), "error");
}

async function deletePatent(facultyId, patentId) {
  const res = await fetch(`${API}/api/deletePatent/${facultyId}/${patentId}`, { method: "DELETE" });
  if (res.ok) { toast("Patent deleted.", "success"); loadProfile(facultyId); }
  else toast("Error deleting patent.", "error");
}

/* ─────────────────────────────── SEARCH ────────────────────────────────── */
async function doSearch() {
  const params = new URLSearchParams();
  const filterMap = { name: "filterName", department: "filterDept", interest: "filterInterest", pub_year: "filterYear", project_status: "filterStatus", funding_agency: "filterFunding" };
  Object.entries(filterMap).forEach(([key, elId]) => {
    const val = document.getElementById(elId).value.trim();
    if (val) params.append(key, val);
  });
  const res = await fetch(`${API}/api/searchFaculty?${params.toString()}`);
  const results = await res.json();
  renderFacultyGrid("searchResults", results);
}

function clearSearch() {
  ["filterName","filterDept","filterInterest","filterYear","filterStatus","filterFunding"].forEach(id => {
    const el = document.getElementById(id);
    el.value = el.tagName === "SELECT" ? "" : "";
  });
  document.getElementById("searchResults").innerHTML = "";
}
