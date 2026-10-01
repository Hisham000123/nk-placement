// Global state
let studentsData = [];
let companiesData = [];
let statsData = {};
let currentView = 'grid'; // 'grid' or 'table'
let salaryDistChart = null;
let topRecruitersChart = null;

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  setupEventListeners();
  await fetchStats();
  await fetchCompanies();
  await fetchStudents();
  initAnalyticsCharts();
}

// ==========================================
// API FETCH FUNCTIONS
// ==========================================

async function fetchStats() {
  try {
    const res = await fetch('/api/stats');
    if (!res.ok) throw new Error('Failed to fetch stats');
    statsData = await res.json();
    renderStats(statsData);
  } catch (err) {
    console.error('Error fetching stats:', err);
  }
}

async function fetchCompanies() {
  try {
    const res = await fetch('/api/companies');
    if (!res.ok) throw new Error('Failed to fetch companies');
    companiesData = await res.json();
    populateCompanyFilter(companiesData);
    renderCompanies(companiesData);
  } catch (err) {
    console.error('Error fetching companies:', err);
  }
}

async function fetchStudents() {
  try {
    const search = document.getElementById('searchInput').value;
    const company = document.getElementById('filterCompany').value;
    const degree = document.getElementById('filterDegree').value;
    const sortBy = document.getElementById('sortBy').value;

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (company && company !== 'All') params.append('company', company);
    if (degree && degree !== 'All') params.append('degree', degree);
    if (sortBy) params.append('sortBy', sortBy);

    const res = await fetch(`/api/students?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch students');
    const data = await res.json();
    studentsData = data.students;

    document.getElementById('headerStudentCount').textContent = `${data.total} Students Loaded`;
    document.getElementById('resultsCount').textContent = `Showing ${data.students.length} of ${data.total} students`;

    if (currentView === 'grid') {
      renderStudentsGrid(studentsData);
    } else {
      renderStudentsTable(studentsData);
    }
  } catch (err) {
    console.error('Error fetching students:', err);
  }
}

// ==========================================
// RENDER FUNCTIONS
// ==========================================

function renderStats(stats) {
  document.getElementById('metricTotalStudents').textContent = stats.totalStudents || 50;
  document.getElementById('metricPlacementRate').textContent = `${stats.placementRate}% Placement Rate (${stats.placedCount} Placed)`;
  document.getElementById('metricAvgSalaryUSD').innerHTML = `$${(stats.averageSalaryUSD || 0).toLocaleString()} <span class="unit">/yr</span>`;
  document.getElementById('metricAvgSalaryLPA').textContent = `~${stats.averageSalaryLPA} LPA equivalent`;
  document.getElementById('metricMaxSalaryUSD').innerHTML = `$${(stats.maxSalaryUSD || 0).toLocaleString()} <span class="unit">/yr</span>`;
  
  if (stats.highestPackageStudent) {
    document.getElementById('metricMaxPackageCompany').textContent = `${stats.highestPackageStudent.name} @ ${stats.highestPackageStudent.company}`;
  }
  
  document.getElementById('metricTotalCompanies').textContent = stats.totalCompanies || 12;
}

function populateCompanyFilter(companies) {
  const select = document.getElementById('filterCompany');
  select.innerHTML = '<option value="All">All Companies (12)</option>';
  companies.forEach(comp => {
    const opt = document.createElement('option');
    opt.value = comp.name;
    opt.textContent = `${comp.name} (${comp.hiresCount} Hires)`;
    select.appendChild(opt);
  });
}

function renderStudentsGrid(students) {
  const grid = document.getElementById('studentsGrid');
  grid.innerHTML = '';

  if (students.length === 0) {
    grid.innerHTML = `
      <div class="glass-card" style="grid-column: 1 / -1; padding: 40px; text-align: center; color: var(--text-muted);">
        <h3>No student placement records found matching your filters</h3>
        <p>Try clearing search keywords or changing filter dropdowns.</p>
      </div>
    `;
    return;
  }

  students.forEach(s => {
    const card = document.createElement('div');
    card.className = 'student-card glass-card';

    const pkg = s.salaryPackage || {};

    card.innerHTML = `
      <div>
        <div class="student-card-header">
          <div class="student-avatar-box">
            <div class="avatar">${s.avatarInitials || 'ST'}</div>
            <div class="student-meta">
              <h3>${escapeHTML(s.name)}</h3>
              <p>${escapeHTML(s.studentId)} • ${escapeHTML(s.degree.split(' ')[0])}</p>
            </div>
          </div>
          <span class="gpa-pill">GPA ${s.gpa}</span>
        </div>

        <div class="student-placement-info">
          <div class="company-row">
            <span class="company-title"><span>${s.companyLogo || '🏢'}</span> ${escapeHTML(s.company)}</span>
          </div>
          <div class="role-title">${escapeHTML(s.role)}</div>
          <div class="location-tag">📍 ${escapeHTML(s.location)}</div>

          <div class="ctc-box">
            <div>
              <div style="font-size: 0.7rem; color: var(--text-muted);">Package (CTC)</div>
              <div class="ctc-val">${pkg.currencyDisplayUSD || '$150,000 /yr'}</div>
            </div>
            <div class="ctc-lpa">${pkg.currencyDisplayLPA || '38.5 LPA'}</div>
          </div>
        </div>

        <div class="skills-list">
          ${(s.skills || []).map(sk => `<span class="skill-tag">${escapeHTML(sk)}</span>`).join('')}
        </div>
      </div>

      <button class="btn-breakdown" onclick="openSalaryModal(${s.id})">
        🔍 View Salary Package Details
      </button>
    `;

    grid.appendChild(card);
  });
}

function renderStudentsTable(students) {
  const tbody = document.getElementById('studentsTableBody');
  tbody.innerHTML = '';

  if (students.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 30px; color: var(--text-muted);">
          No matching records found.
        </td>
      </tr>
    `;
    return;
  }

  students.forEach(s => {
    const tr = document.createElement('tr');
    const pkg = s.salaryPackage || {};

    tr.innerHTML = `
      <td>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div class="avatar" style="width: 32px; height: 32px; font-size: 0.8rem;">${s.avatarInitials}</div>
          <div>
            <div style="font-weight: 700; color: var(--text-main);">${escapeHTML(s.name)}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHTML(s.email)}</div>
          </div>
        </div>
      </td>
      <td>
        <div style="font-size: 0.85rem;">${escapeHTML(s.degree)}</div>
        <span class="gpa-pill">GPA ${s.gpa}</span>
      </td>
      <td>
        <div style="font-weight: 700; color: #818cf8;">${s.companyLogo || '🏢'} ${escapeHTML(s.company)}</div>
      </td>
      <td>
        <div style="font-weight: 600; font-size: 0.85rem;">${escapeHTML(s.role)}</div>
        <div style="font-size: 0.75rem; color: var(--text-dim);">📍 ${escapeHTML(s.location)}</div>
      </td>
      <td>
        <div style="font-weight: 800; color: var(--accent-success);">${pkg.currencyDisplayUSD}</div>
        <div style="font-size: 0.75rem; color: #a78bfa;">~${pkg.currencyDisplayLPA}</div>
      </td>
      <td>
        <span class="badge badge-node">${escapeHTML(s.status)}</span>
      </td>
      <td>
        <button class="btn-breakdown" style="margin-top: 0; padding: 6px 10px;" onclick="openSalaryModal(${s.id})">Details</button>
      </td>
    `;

    tbody.appendChild(tr);
  });
}

function renderCompanies(companies) {
  const grid = document.getElementById('companiesGrid');
  grid.innerHTML = '';

  companies.forEach(c => {
    const card = document.createElement('div');
    card.className = 'company-card glass-card';

    const b = c.packageBreakdown || {};
    const totalAvg = c.averagePackageUSD || 150000;
    const basePct = Math.round(((b.base || 100000) / totalAvg) * 100);
    const bonusPct = Math.round(((b.bonus || 20000) / totalAvg) * 100);
    const equityPct = 100 - basePct - bonusPct;

    card.innerHTML = `
      <div>
        <div class="company-header">
          <div class="comp-badge">
            <div class="comp-logo">${c.logo || '🏢'}</div>
            <div class="comp-title">
              <h3>${escapeHTML(c.name)}</h3>
              <p>${escapeHTML(c.industry)}</p>
            </div>
          </div>
          <span class="tier-badge">${escapeHTML(c.tier)}</span>
        </div>

        <p style="font-size: 0.83rem; color: var(--text-muted); margin-bottom: 12px;">${escapeHTML(c.description)}</p>

        <div class="package-summary-row">
          <div class="pkg-box">
            <span class="label">Average Package</span>
            <span class="val">$${(c.averagePackageUSD || 0).toLocaleString()}</span>
          </div>
          <div class="pkg-box">
            <span class="label">Highest Package</span>
            <span class="val" style="color: #a78bfa;">$${(c.highestPackageUSD || 0).toLocaleString()}</span>
          </div>
          <div class="pkg-box">
            <span class="label">Total Hires</span>
            <span class="val" style="color: #34d399;">${c.hiresCount} Students</span>
          </div>
        </div>

        <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); margin-top: 10px;">
          Salary Package Structure Breakdown
        </div>

        <div class="breakdown-stacked-bar">
          <div class="bar-base" style="width: ${basePct}%;" title="Base Salary: $${(b.base || 0).toLocaleString()}"></div>
          <div class="bar-bonus" style="width: ${bonusPct}%;" title="Joining Bonus: $${(b.bonus || 0).toLocaleString()}"></div>
          <div class="bar-equity" style="width: ${equityPct}%;" title="Equity: $${(b.equity || 0).toLocaleString()}"></div>
        </div>

        <div class="breakdown-legend">
          <span>🟦 Base ($${((b.base || 0) / 1000).toFixed(0)}k)</span>
          <span>🟩 Bonus ($${((b.bonus || 0) / 1000).toFixed(0)}k)</span>
          <span>🟪 Equity ($${((b.equity || 0) / 1000).toFixed(0)}k)</span>
        </div>

        <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted); margin-top: 10px;">
          Roles Offered
        </div>
        <div class="skills-list" style="margin: 6px 0 12px 0;">
          ${(c.rolesOffered || []).map(r => `<span class="skill-tag" style="border-color: rgba(139, 92, 246, 0.3); color: #a78bfa;">${escapeHTML(r)}</span>`).join('')}
        </div>

        <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-muted);">
          Employee Perks & Stipends
        </div>
        <div class="perks-list">
          ${(b.perks || []).map(p => `<span class="perk-tag">✨ ${escapeHTML(p)}</span>`).join('')}
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

// ==========================================
// MODAL LOGIC
// ==========================================

function openSalaryModal(studentId) {
  const student = studentsData.find(s => s.id === studentId);
  if (!student) return;

  const pkg = student.salaryPackage || {};
  const baseUSD = pkg.baseUSD || Math.round(pkg.totalUSD * 0.75);
  const bonusUSD = pkg.joiningBonusUSD || Math.round(pkg.totalUSD * 0.12);
  const equityUSD = pkg.equityUSD || (pkg.totalUSD - baseUSD - bonusUSD);

  const basePct = Math.round((baseUSD / pkg.totalUSD) * 100);
  const bonusPct = Math.round((bonusUSD / pkg.totalUSD) * 100);
  const equityPct = 100 - basePct - bonusPct;

  document.getElementById('modalAvatar').textContent = student.avatarInitials;
  document.getElementById('modalStudentName').textContent = student.name;
  document.getElementById('modalStudentMeta').textContent = `${student.studentId} • ${student.degree} (GPA ${student.gpa})`;

  document.getElementById('modalCompanyLogo').textContent = student.companyLogo || '🏢';
  document.getElementById('modalCompanyName').textContent = student.company;
  document.getElementById('modalRole').textContent = student.role;

  document.getElementById('modalTotalCTC').textContent = pkg.currencyDisplayUSD;
  document.getElementById('modalLPA').textContent = `~${pkg.currencyDisplayLPA} CTC`;

  document.getElementById('modalBaseSalary').textContent = `$${baseUSD.toLocaleString()}`;
  document.getElementById('modalBasePct').textContent = `${basePct}% of CTC`;

  document.getElementById('modalJoiningBonus').textContent = `$${bonusUSD.toLocaleString()}`;
  document.getElementById('modalBonusPct').textContent = `${bonusPct}% of CTC`;

  document.getElementById('modalEquity').textContent = `$${equityUSD.toLocaleString()}`;
  document.getElementById('modalEquityPct').textContent = `${equityPct}% of CTC`;

  const skillsBox = document.getElementById('modalSkills');
  skillsBox.innerHTML = (student.skills || []).map(sk => `<span class="skill-tag" style="padding: 6px 12px; font-size: 0.8rem; background: #e0e7ff; border-color: #c7d2fe; color: #4338ca; font-weight: 600;">${escapeHTML(sk)}</span>`).join('');

  document.getElementById('modalLocation').textContent = student.location;

  document.getElementById('salaryModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('salaryModal').classList.add('hidden');
}

// ==========================================
// ANALYTICS CHARTS
// ==========================================

function initAnalyticsCharts() {
  // Chart 1: Salary distribution by tier
  const ctx1 = document.getElementById('salaryDistChart').getContext('2d');
  
  // Tiers calculation
  const tierCounts = { '$100k - $130k': 0, '$130k - $160k': 0, '$160k - $190k': 0, '$190k+': 0 };
  studentsData.forEach(s => {
    const val = s.salaryPackage?.totalUSD || 0;
    if (val < 130000) tierCounts['$100k - $130k']++;
    else if (val < 160000) tierCounts['$130k - $160k']++;
    else if (val < 190000) tierCounts['$160k - $190k']++;
    else tierCounts['$190k+']++;
  });

  if (salaryDistChart) salaryDistChart.destroy();
  salaryDistChart = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: Object.keys(tierCounts),
      datasets: [{
        label: 'Number of Students Placed',
        data: Object.values(tierCounts),
        backgroundColor: ['#6366f1', '#8b5cf6', '#ec4899', '#10b981'],
        borderRadius: 8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false }
      },
      scales: {
        x: { ticks: { color: '#475569' }, grid: { color: '#e2e8f0' } },
        y: { ticks: { color: '#475569' }, grid: { color: '#e2e8f0' }, beginAtZero: true }
      }
    }
  });

  // Chart 2: Top Recruiters
  const ctx2 = document.getElementById('topRecruitersChart').getContext('2d');
  const topCompNames = companiesData.map(c => c.name).slice(0, 6);
  const topCompCounts = companiesData.map(c => c.hiresCount).slice(0, 6);

  if (topRecruitersChart) topRecruitersChart.destroy();
  topRecruitersChart = new Chart(ctx2, {
    type: 'doughnut',
    data: {
      labels: topCompNames,
      datasets: [{
        data: topCompCounts,
        backgroundColor: ['#4f46e5', '#2563eb', '#059669', '#d97706', '#db2777', '#7c3aed'],
        borderWidth: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: { color: '#0f172a', font: { family: 'Inter', size: 12 } }
        }
      }
    }
  });
}

// ==========================================
// EVENT LISTENERS & SETUP
// ==========================================

function setupEventListeners() {
  // Tabs switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      document.getElementById(targetId).classList.add('active');

      if (targetId === 'tab-analytics') {
        initAnalyticsCharts();
      }
    });
  });

  // View toggle
  document.getElementById('viewGridBtn').addEventListener('click', () => {
    currentView = 'grid';
    document.getElementById('viewGridBtn').classList.add('active');
    document.getElementById('viewTableBtn').classList.remove('active');
    document.getElementById('studentsGrid').classList.remove('hidden');
    document.getElementById('studentsTableWrapper').classList.add('hidden');
    renderStudentsGrid(studentsData);
  });

  document.getElementById('viewTableBtn').addEventListener('click', () => {
    currentView = 'table';
    document.getElementById('viewTableBtn').classList.add('active');
    document.getElementById('viewGridBtn').classList.remove('active');
    document.getElementById('studentsGrid').classList.add('hidden');
    document.getElementById('studentsTableWrapper').classList.remove('hidden');
    renderStudentsTable(studentsData);
  });

  // Search & Filter change listeners
  let searchTimeout = null;
  document.getElementById('searchInput').addEventListener('input', (e) => {
    const val = e.target.value;
    document.getElementById('clearSearchBtn').style.display = val ? 'block' : 'none';
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      fetchStudents();
    }, 250);
  });

  document.getElementById('clearSearchBtn').addEventListener('click', () => {
    document.getElementById('searchInput').value = '';
    document.getElementById('clearSearchBtn').style.display = 'none';
    fetchStudents();
  });

  document.getElementById('filterCompany').addEventListener('change', fetchStudents);
  document.getElementById('filterDegree').addEventListener('change', fetchStudents);
  document.getElementById('sortBy').addEventListener('change', fetchStudents);

  // Modal close handlers
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('salaryModal').addEventListener('click', (e) => {
    if (e.target.id === 'salaryModal') closeModal();
  });

  // Add Student Form submission
  document.getElementById('addStudentForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('newStudentName').value;
    const email = document.getElementById('newStudentEmail').value;
    const degree = document.getElementById('newStudentDegree').value;
    const gpa = document.getElementById('newStudentGPA').value;
    const company = document.getElementById('newStudentCompany').value;
    const role = document.getElementById('newStudentRole').value;
    const salaryUSD = document.getElementById('newStudentSalary').value;
    const location = document.getElementById('newStudentLocation').value;
    const skills = document.getElementById('newStudentSkills').value;

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, degree, gpa, company, role, salaryUSD, location, skills })
      });

      if (!res.ok) throw new Error('Failed to register student placement');
      const data = await res.json();

      alert(`🎉 Student "${data.student.name}" placed at ${data.student.company} registered successfully!`);
      
      // Reset form and switch to students tab
      document.getElementById('addStudentForm').reset();
      await fetchStats();
      await fetchCompanies();
      await fetchStudents();

      // Switch back to students tab
      document.querySelector('[data-tab="tab-students"]').click();

    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  });
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
