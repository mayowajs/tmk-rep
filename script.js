// ── Typing animation ──────────────────────────────────────────
const roles = [
  "Frontend & Backend Developer",
  "AI Trainer",
  "Graphics Designer",
  "Social Media Marketer",
  "Comic Creator",
  "UI/UX Designer",
];
let ri = 0, ci = 0, deleting = false;
const tagline = document.getElementById("typedTagline");

function type() {
  const current = roles[ri];
  tagline.textContent = deleting ? current.slice(0, ci--) : current.slice(0, ci++);
  if (!deleting && ci > current.length) { deleting = true; setTimeout(type, 1200); return; }
  if (deleting && ci < 0) { deleting = false; ri = (ri + 1) % roles.length; }
  setTimeout(type, deleting ? 50 : 80);
}
type();

// ── Year ──────────────────────────────────────────────────────
document.getElementById("year").textContent = new Date().getFullYear();

// ── Mobile menu ───────────────────────────────────────────────
function toggleMenu() {
  document.getElementById("mobileMenu").classList.toggle("open");
}

// ── Projects data ─────────────────────────────────────────────
const DEFAULT_PROJECTS = [];

function getProjects() {
  const stored = localStorage.getItem("tmk_projects");
  return stored ? JSON.parse(stored) : DEFAULT_PROJECTS;
}
function saveProjects(projects) {
  localStorage.setItem("tmk_projects", JSON.stringify(projects));
}

// ── Render project cards ──────────────────────────────────────
function renderProjects() {
  const grid = document.getElementById("projectsGrid");
  const projects = getProjects();
  if (!projects.length) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;text-align:center;padding:3rem;background:var(--card);border-radius:var(--radius);border:1px dashed var(--border);color:var(--muted)">
        <i class="fas fa-folder-open" style="font-size:2.5rem;display:block;margin-bottom:.8rem;color:var(--border)"></i>
        <p>No projects yet. Click <strong style="color:var(--red2)">Add New Project</strong> below to add yours.</p>
      </div>`;
    return;
  }
  grid.innerHTML = projects.map(p => {
    const avg = avgRating(p.reviews);
    const stars = renderStars(avg);
    const thumb = p.image
      ? `<img src="${p.image}" alt="${p.title}" />`
      : `<i class="${p.icon || 'fas fa-folder'}"></i>`;
    return `
      <div class="project-card" onclick="openModal(${p.id})">
        <div class="project-thumb">${thumb}</div>
        <div class="project-info">
          <span class="project-tag">${p.category}</span>
          <h3>${p.title}</h3>
          <p>${p.desc}</p>
          <div class="project-footer">
            <span class="stars">${stars}</span>
            <span class="review-count">${p.reviews.length} review${p.reviews.length !== 1 ? "s" : ""}</span>
            <span class="open-badge">View →</span>
          </div>
        </div>
      </div>`;
  }).join("");
}
renderProjects();

function avgRating(reviews) {
  if (!reviews.length) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}
function renderStars(avg) {
  return [1,2,3,4,5].map(i =>
    `<span style="color:${i <= Math.round(avg) ? '#f59e0b' : '#333'}">★</span>`
  ).join("");
}

// ── Add project ───────────────────────────────────────────────
function toggleAddForm() {
  document.getElementById("addForm").classList.toggle("open");
}

function addProject() {
  const title = document.getElementById("projTitle").value.trim();
  const desc = document.getElementById("projDesc").value.trim();
  if (!title || !desc) { alert("Title and description are required."); return; }
  const techRaw = document.getElementById("projTech").value.trim();
  const tech = techRaw ? techRaw.split(",").map(t => t.trim()).filter(Boolean) : [];
  const projects = getProjects();
  projects.push({
    id: Date.now(),
    title,
    category: document.getElementById("projCategory").value.trim() || "Project",
    desc,
    details: document.getElementById("projDetails").value.trim() || desc,
    tech,
    link: document.getElementById("projLink").value.trim(),
    image: document.getElementById("projImage").value.trim(),
    icon: "fas fa-folder-open",
    reviews: []
  });
  saveProjects(projects);
  renderProjects();
  toggleAddForm();
  ["projTitle","projCategory","projDesc","projDetails","projTech","projLink","projImage"].forEach(id => {
    document.getElementById(id).value = "";
  });
}

// ── Modal ─────────────────────────────────────────────────────
let activeProjectId = null;
let selectedRating = 0;

function openModal(id) {
  const projects = getProjects();
  const p = projects.find(x => x.id === id);
  if (!p) return;
  activeProjectId = id;
  selectedRating = 0;
  updateStarInput(0);

  const modalImg = document.getElementById("modalImg");
  if (p.image) { modalImg.src = p.image; modalImg.style.display = "block"; }
  else { modalImg.style.display = "none"; }

  document.getElementById("modalTag").textContent = p.category;
  document.getElementById("modalTitle").textContent = p.title;
  document.getElementById("modalDesc").textContent = p.desc;

  // "Open Project" button — opens project.html with the project id
  const openBtn = document.getElementById("modalOpenBtn");
  openBtn.href = `project.html?id=${p.id}`;

  // "Live Demo" button — only show if there's an external link
  const liveLink = document.getElementById("modalLink");
  if (p.link) { liveLink.href = p.link; liveLink.classList.remove("hidden"); }
  else { liveLink.classList.add("hidden"); }

  renderReviews(p.reviews);
  document.getElementById("reviewName").value = "";
  document.getElementById("reviewText").value = "";
  document.getElementById("modalOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal(e) {
  if (e && e.target !== document.getElementById("modalOverlay") && e.type === "click") return;
  document.getElementById("modalOverlay").classList.remove("open");
  document.body.style.overflow = "";
}

function renderReviews(reviews) {
  const list = document.getElementById("reviewsList");
  if (!reviews.length) {
    list.innerHTML = `<p class="no-reviews">No reviews yet. Be the first!</p>`;
    return;
  }
  list.innerHTML = reviews.map(r => `
    <div class="review-item">
      <div class="r-header">
        <span class="r-name">${r.name}</span>
        <span class="r-stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span>
      </div>
      <p class="r-text">${r.text}</p>
    </div>`).join("");
}

// ── Star rating ───────────────────────────────────────────────
function setRating(val) {
  selectedRating = val;
  updateStarInput(val);
}
function updateStarInput(val) {
  document.querySelectorAll("#starInput span").forEach((s, i) => {
    s.classList.toggle("active", i < val);
  });
}

// ── Submit review ─────────────────────────────────────────────
function submitReview() {
  const name = document.getElementById("reviewName").value.trim() || "Anonymous";
  const text = document.getElementById("reviewText").value.trim();
  if (!text) { alert("Please write a review."); return; }
  if (!selectedRating) { alert("Please select a star rating."); return; }

  const projects = getProjects();
  const p = projects.find(x => x.id === activeProjectId);
  if (!p) return;
  p.reviews.push({ name, rating: selectedRating, text, date: new Date().toLocaleDateString() });
  saveProjects(projects);
  renderReviews(p.reviews);
  renderProjects();
  document.getElementById("reviewName").value = "";
  document.getElementById("reviewText").value = "";
  selectedRating = 0;
  updateStarInput(0);
}

// ── Contact form ──────────────────────────────────────────────
function sendMessage(e) {
  e.preventDefault();
  const form = e.target;
  const data = new FormData(form);
  const success = document.getElementById("formSuccess");
  const btn = form.querySelector("button[type=submit]");

  btn.disabled = true;
  btn.textContent = "Sending...";

  fetch(form.action, {
    method: "POST",
    body: data,
    headers: { "Accept": "application/json" }
  })
  .then(res => {
    if (res.ok) {
      success.textContent = "✅ Message sent! I'll get back to you soon.";
      success.style.color = "#4ade80";
      form.reset();
    } else {
      success.textContent = "❌ Something went wrong. Please try again.";
      success.style.color = "#f87171";
    }
    success.classList.add("show");
    btn.disabled = false;
    btn.innerHTML = "Send Message <i class='fas fa-paper-plane'></i>";
    setTimeout(() => success.classList.remove("show"), 5000);
  })
  .catch(() => {
    success.textContent = "❌ Network error. Please try again.";
    success.style.color = "#f87171";
    success.classList.add("show");
    btn.disabled = false;
    btn.innerHTML = "Send Message <i class='fas fa-paper-plane'></i>";
  });
}

// ── Escape key closes modal ───────────────────────────────────
document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModal();
});
