const seedComplaints = [
  { id: "CIV-2025-0081", title: "Pothole on 12th Main Road", category: "Road Damage", location: "Indiranagar, 12th Main", reported: "Today, 9:24 AM", priority: "High", status: "In Progress", department: "Public Works", description: "A large pothole is making the road difficult to navigate." },
  { id: "CIV-2025-0080", title: "Garbage piling near park entrance", category: "Garbage", location: "Koramangala, 5th Block", reported: "Today, 8:10 AM", priority: "Medium", status: "Pending", department: "Solid Waste Management", description: "Waste has not been collected near the park entrance." },
  { id: "CIV-2025-0079", title: "Streetlight not working", category: "Streetlight", location: "Jayanagar, 4th Block", reported: "Yesterday", priority: "Medium", status: "In Progress", department: "Electricity Department", description: "Streetlight is out near the corner of the street." },
  { id: "CIV-2025-0078", title: "Water leakage on footpath", category: "Water Leakage", location: "Malleshwaram, 8th Cross", reported: "Yesterday", priority: "High", status: "Pending", department: "Water Supply Board", description: "Water is flowing from a pipe onto the footpath." },
  { id: "CIV-2025-0077", title: "Overflowing public dustbin", category: "Garbage", location: "HSR Layout, Sector 2", reported: "Oct 4, 2025", priority: "Low", status: "Resolved", department: "Solid Waste Management", description: "Public dustbin needed emptying." },
  { id: "CIV-2025-0076", title: "Damaged road sign", category: "Other", location: "Ulsoor, Cambridge Road", reported: "Oct 3, 2025", priority: "Low", status: "Resolved", department: "City Corporation", description: "Roadside sign is damaged." }
];

const icons = {
  road: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m3 19 6-14h6l6 14M8 19l2-5m6 5-2-5M12 8v2m0 4v1"/></svg>',
  garbage: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M10 11v6m4-6v6M5 7l1 13h12l1-13M9 7V4h6v3"/></svg>',
  streetlight: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21V5m-4 16h8M7 5h10l2 5H5l2-5Zm1 9h8"/></svg>',
  water: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3S6 10 6 14a6 6 0 0 0 12 0c0-4-6-11-6-11Z"/><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5"/></svg>',
  other: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5m0-8h.01"/></svg>',
  location: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>'
};

const categoryTypes = {
  "Road Damage": { icon: "road", department: "Public Works" },
  Garbage: { icon: "garbage", department: "Solid Waste Management" },
  Streetlight: { icon: "streetlight", department: "Electricity Department" },
  "Water Leakage": { icon: "water", department: "Water Supply Board" },
  Other: { icon: "other", department: "City Corporation" }
};

function loadComplaints() {
  try {
    const saved = JSON.parse(localStorage.getItem("civicai-complaints") || "[]");
    return Array.isArray(saved) ? [...saved, ...seedComplaints] : [...seedComplaints];
  } catch {
    return [...seedComplaints];
  }
}

let complaints = loadComplaints();
let activeFilter = "All issues";
let toastTimer;
const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const reportModal = $("#reportModal");
const reportForm = $("#reportForm");
const photoInput = $("#photoInput");
const uploadZone = $("#uploadZone");
const photoPreview = $("#photoPreview");
let photoObjectUrl = "";

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
  })[character]);
}

function iconFor(category) {
  const kind = categoryTypes[category]?.icon || "other";
  return `<span class="issue-icon ${kind}">${icons[kind]}</span>`;
}

function rowMarkup(complaint) {
  const priorityClass = complaint.priority.toLowerCase();
  const statusClass = complaint.status === "Resolved" ? "resolved" : complaint.status === "Pending" ? "pending" : "progress";
  return `<tr>
    <td><div class="issue-cell">${iconFor(complaint.category)}<span class="issue-copy"><strong>${escapeHTML(complaint.title)}</strong><small>${escapeHTML(complaint.id)} · ${escapeHTML(complaint.department)}</small></span></div></td>
    <td><span class="location-cell">${icons.location}${escapeHTML(complaint.location)}</span></td>
    <td>${escapeHTML(complaint.reported)}</td>
    <td><span class="priority-badge priority-${priorityClass}">${escapeHTML(complaint.priority)}</span></td>
    <td><span class="status-badge status-${statusClass}">${escapeHTML(complaint.status)}</span></td>
    <td><button class="row-action" data-advance="${escapeHTML(complaint.id)}" aria-label="Update status for ${escapeHTML(complaint.title)}" title="Advance complaint status">···</button></td>
  </tr>`;
}

function filteredComplaints(query = "") {
  const normalized = query.trim().toLowerCase();
  return complaints.filter(item => {
    const matchesFilter = activeFilter === "All issues" ||
      (activeFilter === "Active" ? item.status !== "Resolved" : item.status === activeFilter);
    const matchesQuery = !normalized || [item.title, item.id, item.category, item.location, item.status, item.department]
      .some(value => value.toLowerCase().includes(normalized));
    return matchesFilter && matchesQuery;
  });
}

function renderTables() {
  const query = $("#searchInput").value;
  const visible = filteredComplaints(query);
  const recent = visible.slice(0, 6);
  $("#complaintRows").innerHTML = recent.map(rowMarkup).join("");
  $("#allComplaintRows").innerHTML = visible.map(rowMarkup).join("");
  $("#emptyState").hidden = recent.length > 0;
  $("#allEmpty").hidden = visible.length > 0;
  $("#showingCount").textContent = String(recent.length);
  $("#allShowing").textContent = String(visible.length);
  $("#totalComplaintsFooter").textContent = String(Math.max(128 + complaints.length - seedComplaints.length, visible.length));
  $("#recentCount").textContent = String(recent.length).padStart(2, "0");
  $("#navComplaintCount").textContent = String(complaints.length).padStart(2, "0");
  const myReports = complaints.filter(item => item.submittedByMe);
  $("#myReportsList").innerHTML = myReports.length
    ? myReports.map(item => `<div class="my-report-card">${iconFor(item.category)}<div class="my-report-main"><strong>${escapeHTML(item.title)}</strong><p>${escapeHTML(item.location)} · ${escapeHTML(item.reported)}</p></div><span class="my-report-id">${escapeHTML(item.id)}</span><span class="status-badge status-${item.status === "Resolved" ? "resolved" : item.status === "Pending" ? "pending" : "progress"}">${escapeHTML(item.status)}</span></div>`).join("")
    : `<div class="my-report-card"><span class="issue-icon road">${icons.road}</span><div class="my-report-main"><strong>No reports just yet</strong><p>When you report an issue, you can track it right here.</p></div></div>`;
  renderStats();
}

function renderStats() {
  const added = complaints.length - seedComplaints.length;
  const pending = complaints.filter(item => item.status === "Pending" || item.status === "In Progress").length;
  const resolved = complaints.filter(item => item.status === "Resolved").length;
  const total = 128 + added;
  const needsAttention = 42 + added;
  const resolvedTotal = 55 + Math.max(0, resolved - 2);
  for (const id of ["totalCount", "donutTotal", "analyticsTotal", "analyticsDonutTotal"]) {
    const element = $(`#${id}`);
    if (element) element.textContent = String(total);
  }
  for (const id of ["pendingCount", "analyticsPending"]) {
    const element = $(`#${id}`);
    if (element) element.textContent = String(added ? Math.max(needsAttention, pending) : needsAttention);
  }
  for (const id of ["resolvedCount", "analyticsResolved"]) {
    const element = $(`#${id}`);
    if (element) element.textContent = String(resolvedTotal);
  }
  const categoryCounts = { "Road Damage": 38, Garbage: 32, Streetlight: 24, "Water Leakage": 19, Other: 15 };
  complaints.filter(item => item.submittedByMe).forEach(item => { categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1; });
  const categoryTargets = { "Road Damage": "roadCount", Garbage: "wasteCount", Streetlight: "lightCount", "Water Leakage": "waterCount", Other: "otherCount" };
  for (const [category, id] of Object.entries(categoryTargets)) $(`#${id}`).textContent = String(categoryCounts[category]);
  const categories = Object.keys(categoryTargets);
  const colors = ["#68877a", "#c78469", "#e8be6a", "#97a9ba", "#c1b5a5"];
  let percentage = 0;
  const gradient = categories.map((category, index) => {
    const nextPercentage = percentage + categoryCounts[category] / total * 100;
    const segment = `${colors[index]} ${percentage}% ${nextPercentage}%`;
    percentage = nextPercentage;
    return segment;
  }).join(", ");
  $$(".donut-chart").forEach(chart => { chart.style.background = `conic-gradient(${gradient})`; });
  $$(".category-legend").forEach(legend => {
    [...legend.querySelectorAll(".legend-row")].forEach((row, index) => {
      const category = categories[index];
      row.querySelector("strong").textContent = String(categoryCounts[category]);
      row.querySelector("small").textContent = `${Math.round(categoryCounts[category] / total * 100)}%`;
    });
  });
}

function saveComplaints() {
  try {
    localStorage.setItem("civicai-complaints", JSON.stringify(complaints.filter(item => item.submittedByMe)));
  } catch {
    showToast("Report created, but it could not be saved on this device.");
  }
}

function showToast(message) {
  $("#toastMessage").textContent = message;
  const toast = $("#toast");
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 3400);
}

function setView(name) {
  const target = $(`#view-${name}`);
  if (!target) return;
  $$(".view-panel").forEach(panel => panel.classList.toggle("active", panel === target));
  $$(".nav-link[data-view]").forEach(button => button.classList.toggle("active", button.dataset.view === name));
  const labels = { overview: "Overview", complaints: "Complaints", analytics: "Analytics", map: "City map", "my-reports": "My reports" };
  $("#breadcrumbCurrent").textContent = labels[name] || "Overview";
  $("#sidebar").classList.remove("open");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openModal() {
  reportModal.classList.add("open");
  reportModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setTimeout(() => $("#issueTitle").focus(), 80);
}

function closeModal() {
  reportModal.classList.remove("open");
  reportModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  $("#reportButton").focus({ preventScroll: true });
}

function classifyIssue(title, description, chosenCategory) {
  if (chosenCategory && chosenCategory !== "auto") return chosenCategory;
  const text = `${title} ${description}`.toLowerCase();
  if (/garbage|rubbish|trash|waste|litter|dump|dustbin/.test(text)) return "Garbage";
  if (/street.?light|lamp.?post|lamp post|dark street|light not/.test(text)) return "Streetlight";
  if (/water|leak|pipe|drain|sewage|flood/.test(text)) return "Water Leakage";
  if (/road|pothole|pothole|crater|pavement|footpath|sidewalk/.test(text)) return "Road Damage";
  return "Other";
}

function detectPriority(title, description, category) {
  const text = `${title} ${description}`.toLowerCase();
  if (/urgent|danger|dangerous|emergency|flood|burst|injur|accident|deep pothole|exposed wire/.test(text)) return "High";
  if (/large|major|overflow|heavy|blocked|leak|pothole|broken|not working|no light/.test(text) ||
      category === "Water Leakage" || category === "Road Damage") return "High";
  if (/small|minor|occasional|one light|loose/.test(text)) return "Low";
  return "Medium";
}

function resetPhoto() {
  if (photoObjectUrl) URL.revokeObjectURL(photoObjectUrl);
  photoObjectUrl = "";
  photoInput.value = "";
  photoPreview.removeAttribute("src");
  photoPreview.hidden = true;
  uploadZone.classList.remove("has-photo");
}

function usePhoto(file) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showToast("Please choose an image file.");
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    showToast("That photo is over 10 MB. Choose a smaller image.");
    return;
  }
  if (photoObjectUrl) URL.revokeObjectURL(photoObjectUrl);
  photoObjectUrl = URL.createObjectURL(file);
  photoPreview.src = photoObjectUrl;
  photoPreview.hidden = false;
  uploadZone.classList.add("has-photo");
  $("#classificationResult").hidden = true;
}

$$(".nav-link[data-view]").forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));
$$("[data-goto]").forEach(button => button.addEventListener("click", () => setView(button.dataset.goto)));
$$("[data-report]").forEach(button => button.addEventListener("click", openModal));
$("#reportButton").addEventListener("click", openModal);
$("#closeModal").addEventListener("click", closeModal);
reportModal.addEventListener("click", event => { if (event.target === reportModal) closeModal(); });
document.addEventListener("keydown", event => { if (event.key === "Escape" && reportModal.classList.contains("open")) closeModal(); });
$("#menuButton").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
$("#searchInput").addEventListener("input", renderTables);
$("[data-all-search]").addEventListener("input", event => {
  const query = event.target.value.toLowerCase().trim();
  const results = complaints.filter(item => [item.title, item.id, item.category, item.location, item.status].some(value => value.toLowerCase().includes(query)));
  $("#allComplaintRows").innerHTML = results.map(rowMarkup).join("");
  $("#allEmpty").hidden = results.length > 0;
  $("#allShowing").textContent = String(results.length);
});

$("#filterButton").addEventListener("click", () => {
  const existing = $(".filter-menu");
  if (existing) { existing.remove(); return; }
  const menu = document.createElement("div");
  menu.className = "filter-menu";
  menu.innerHTML = ["All issues", "Active", "Pending", "In Progress", "Resolved"].map(label =>
    `<button type="button" class="${label === activeFilter ? "selected" : ""}">${label}</button>`).join("");
  $("#filterButton").style.position = "relative";
  $("#filterButton").append(menu);
  menu.addEventListener("click", event => {
    const option = event.target.closest("button");
    if (!option) return;
    activeFilter = option.textContent;
    $("#filterLabel").textContent = activeFilter;
    menu.remove();
    renderTables();
  });
  document.addEventListener("click", function closeFilter(event) {
    if (!$("#filterButton").contains(event.target)) {
      menu.remove();
      document.removeEventListener("click", closeFilter);
    }
  }, { once: true });
});

document.addEventListener("click", event => {
  const action = event.target.closest("[data-advance]");
  if (!action) return;
  const item = complaints.find(complaint => complaint.id === action.dataset.advance);
  if (!item) return;
  item.status = item.status === "Pending" ? "In Progress" : item.status === "In Progress" ? "Resolved" : "Pending";
  saveComplaints();
  renderTables();
  showToast(`${item.id} moved to ${item.status}.`);
});

photoInput.addEventListener("change", () => usePhoto(photoInput.files[0]));
for (const eventName of ["dragenter", "dragover"]) {
  uploadZone.addEventListener(eventName, event => { event.preventDefault(); uploadZone.classList.add("dragging"); });
}
for (const eventName of ["dragleave", "drop"]) {
  uploadZone.addEventListener(eventName, event => { event.preventDefault(); uploadZone.classList.remove("dragging"); });
}
uploadZone.addEventListener("drop", event => usePhoto(event.dataTransfer.files[0]));

$("#locateButton").addEventListener("click", () => {
  const button = $("#locateButton");
  if (!navigator.geolocation) { showToast("Location detection is not supported by this browser."); return; }
  button.disabled = true;
  navigator.geolocation.getCurrentPosition(position => {
    const { latitude, longitude } = position.coords;
    $("#issueLocation").value = `Near me (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
    button.disabled = false;
    showToast("Your location has been added to the report.");
  }, error => {
    button.disabled = false;
    const messages = {
      1: "Location permission was denied. Enter your address instead.",
      2: "Your location is unavailable. Enter your address instead.",
      3: "Location timed out. Try again or enter your address."
    };
    showToast(messages[error.code] || "Unable to detect location. Enter your address instead.");
  }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
});

reportForm.addEventListener("submit", event => {
  event.preventDefault();
  const title = $("#issueTitle").value.trim();
  const location = $("#issueLocation").value.trim();
  const description = $("#issueDescription").value.trim();
  if (!title || !location) { showToast("Add an issue and its location to continue."); return; }
  const category = classifyIssue(title, description, $("#issueCategory").value);
  const priority = detectPriority(title, description, category);
  const department = categoryTypes[category].department;
  const numericId = Math.max(81, ...complaints.map(item => Number(item.id.split("-").pop()) || 0)) + 1;
  const complaint = {
    id: `CIV-2025-${String(numericId).padStart(4, "0")}`,
    title,
    category,
    location,
    reported: "Just now",
    priority,
    status: "Pending",
    department,
    description,
    submittedByMe: true
  };
  complaints.unshift(complaint);
  saveComplaints();
  renderTables();
  resetPhoto();
  reportForm.reset();
  closeModal();
  setView("my-reports");
  showToast(`Report ${complaint.id} submitted · ${category} · ${priority} priority.`);
});

$("#categoryPeriod").addEventListener("click", event => {
  const button = event.currentTarget;
  const isMonth = button.textContent.includes("month");
  button.innerHTML = isMonth ? 'This week <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>' : 'This month <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5"/></svg>';
  showToast(isMonth ? "Showing this week’s demo overview." : "Showing this month’s demo overview.");
});

renderTables();
