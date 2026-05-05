// ── Load project from URL param ───────────────────────────────
const params = new URLSearchParams(window.location.search);
const projectId = parseInt(params.get("id"));

document.getElementById("year").textContent = new Date().getFullYear();

const DEFAULT_PROJECTS = [];

function getProjects() {
  const stored = localStorage.getItem("tmk_projects");
  return stored ? JSON.parse(stored) : DEFAULT_PROJECTS;
}
function saveProjects(projects) {
  localStorage.setItem("tmk_projects", JSON.stringify(projects));
}

const projects = getProjects();
const project = projects.find(p => p.id === projectId);

if (!project) {
  document.getElementById("projTitle").textContent = "Project Not Found";
  document.getElementById("projDesc").textContent = "This project does not exist or has been removed.";
} else {
  // Page title
  document.title = `${project.title} | TMK`;

  // Hero
  document.getElementById("projCategory").textContent = project.category;
  document.getElementById("projTitle").textContent = project.title;
  document.getElementById("projDesc").textContent = project.desc;

  // Tech tags
  const techWrap = document.getElementById("projTech");
  if (project.tech && project.tech.length) {
    techWrap.innerHTML = project.tech.map(t => `<span class="tech-tag">${t}</span>`).join("");
  }

  // Hero background image
  if (project.image) {
    document.getElementById("projHero").style.backgroundImage = `url('${project.image}')`;
    document.getElementById("projHero").style.backgroundSize = "cover";
    document.getElementById("projHero").style.backgroundPosition = "center";
  }

  // Action buttons
  const actionsEl = document.getElementById("projActions");
  let btns = `<a href="index.html#projects" class="btn outline"><i class="fas fa-arrow-left"></i> All Projects</a>`;
  if (project.link) {
    btns += `<a href="${project.link}" target="_blank" class="btn primary">Live Demo <i class="fas fa-external-link-alt"></i></a>`;
  }
  actionsEl.innerHTML = btns;

  // Details
  document.getElementById("projDetails").textContent = project.details || project.desc;

  // Gallery
  const gallery = document.getElementById("projGallery");
  if (project.images && project.images.length) {
    gallery.innerHTML = project.images.map(src =>
      `<img src="${src}" alt="${project.title}" onclick="window.open('${src}','_blank')" />`
    ).join("");
  }
  // If single image, show it too
  else if (project.image) {
    gallery.innerHTML = `<img src="${project.image}" alt="${project.title}" onclick="window.open('${project.image}','_blank')" />`;
  }

  // Stats
  const avg = project.reviews.length
    ? (project.reviews.reduce((s, r) => s + r.rating, 0) / project.reviews.length).toFixed(1)
    : "—";
  document.getElementById("projStats").innerHTML = `
    <div class="stat-card"><span class="stat-val">${project.reviews.length}</span><span class="stat-label">Total Reviews</span></div>
    <div class="stat-card"><span class="stat-val">${avg}</span><span class="stat-label">Avg Rating</span></div>
    <div class="stat-card"><span class="stat-val">${(project.tech || []).length}</span><span class="stat-label">Technologies</span></div>
    <div class="stat-card"><span class="stat-val">${project.category}</span><span class="stat-label">Category</span></div>
  `;

  // Reviews
  renderReviews();
}

// ── Reviews ───────────────────────────────────────────────────
function renderReviews() {
  const p = getProjects().find(x => x.id === projectId);
  const list = document.getElementById("reviewsListFull");
  if (!p || !p.reviews.length) {
    list.innerHTML = `<p class="no-reviews" style="color:var(--muted)">No reviews yet. Be the first to leave one!</p>`;
    return;
  }
  list.innerHTML = p.reviews.map(r => `
    <div class="review-item">
      <div class="r-header">
        <span class="r-name">${r.name}</span>
        <span class="r-stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span>
      </div>
      <p class="r-text">${r.text}</p>
    </div>`).join("");
}

// ── Star rating ───────────────────────────────────────────────
let selectedRating = 0;
function setRating(val) {
  selectedRating = val;
  document.querySelectorAll("#starInput span").forEach((s, i) => {
    s.classList.toggle("active", i < val);
  });
}

// ── Submit review ─────────────────────────────────────────────
function submitReview() {
  if (!project) return;
  const name = document.getElementById("reviewName").value.trim() || "Anonymous";
  const text = document.getElementById("reviewText").value.trim();
  if (!text) { alert("Please write a review."); return; }
  if (!selectedRating) { alert("Please select a star rating."); return; }

  const projects = getProjects();
  const p = projects.find(x => x.id === projectId);
  if (!p) return;
  p.reviews.push({ name, rating: selectedRating, text, date: new Date().toLocaleDateString() });
  saveProjects(projects);
  renderReviews();

  // Update stats
  const avg = p.reviews.length
    ? (p.reviews.reduce((s, r) => s + r.rating, 0) / p.reviews.length).toFixed(1)
    : "—";
  document.querySelector(".proj-stats").innerHTML = `
    <div class="stat-card"><span class="stat-val">${p.reviews.length}</span><span class="stat-label">Total Reviews</span></div>
    <div class="stat-card"><span class="stat-val">${avg}</span><span class="stat-label">Avg Rating</span></div>
    <div class="stat-card"><span class="stat-val">${(p.tech || []).length}</span><span class="stat-label">Technologies</span></div>
    <div class="stat-card"><span class="stat-val">${p.category}</span><span class="stat-label">Category</span></div>
  `;

  document.getElementById("reviewName").value = "";
  document.getElementById("reviewText").value = "";
  selectedRating = 0;
  document.querySelectorAll("#starInput span").forEach(s => s.classList.remove("active"));
}
