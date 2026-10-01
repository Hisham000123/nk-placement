const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/nk_placement';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Data files fallback paths
const STUDENTS_FILE = path.join(__dirname, 'data', 'students.json');
const COMPANIES_FILE = path.join(__dirname, 'data', 'companies.json');

// Mongoose Schemas & Models
const CompanySchema = new mongoose.Schema({
  id: String,
  name: String,
  industry: String,
  logo: String,
  tier: String,
  location: String,
  averagePackageUSD: Number,
  highestPackageUSD: Number,
  averagePackageLPA: Number,
  rolesOffered: [String],
  packageBreakdown: Object,
  hiresCount: Number,
  description: String
});

const StudentSchema = new mongoose.Schema({
  id: Number,
  studentId: String,
  name: String,
  email: String,
  degree: String,
  gpa: Number,
  status: String,
  company: String,
  companyLogo: String,
  role: String,
  location: String,
  skills: [String],
  salaryPackage: Object,
  avatarInitials: String,
  placedDate: String
});

const Company = mongoose.model('Company', CompanySchema);
const Student = mongoose.model('Student', StudentSchema);

let isMongoConnected = false;

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  serverSelectionTimeoutMS: 5000
}).then(() => {
  isMongoConnected = true;
  console.log(`✅ Connected to MongoDB database at ${MONGO_URI}`);
}).catch(err => {
  console.warn(`⚠️ Could not connect to MongoDB (${err.message}). Using JSON data fallback.`);
});

// Helpers for reading data (MongoDB or JSON fallback)
async function getStudentsData() {
  if (isMongoConnected) {
    try {
      return await Student.find({}).lean();
    } catch (e) {
      console.error('Error fetching students from MongoDB:', e.message);
    }
  }
  return readJSON(STUDENTS_FILE);
}

async function getCompaniesData() {
  if (isMongoConnected) {
    try {
      return await Company.find({}).lean();
    } catch (e) {
      console.error('Error fetching companies from MongoDB:', e.message);
    }
  }
  return readJSON(COMPANIES_FILE);
}

function readJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// ==========================================
// API ROUTES
// ==========================================

// 1. GET /api/stats - Placement & Salary Package Analytics
app.get('/api/stats', async (req, res) => {
  const students = await getStudentsData();
  const companies = await getCompaniesData();

  const totalStudents = students.length;
  const placedStudents = students.filter(s => s.status === 'Placed');
  const offeredStudents = students.filter(s => s.status && s.status.includes('Offered'));
  const placementRate = totalStudents ? ((placedStudents.length / totalStudents) * 100).toFixed(1) : '0';

  const totalSalarySum = placedStudents.reduce((acc, s) => acc + (s.salaryPackage?.totalUSD || 0), 0);
  const averageSalaryUSD = placedStudents.length ? Math.round(totalSalarySum / placedStudents.length) : 0;
  const averageSalaryLPA = (averageSalaryUSD / 3700).toFixed(1);

  const maxSalaryUSD = students.length ? Math.max(...students.map(s => s.salaryPackage?.totalUSD || 0)) : 0;
  const maxSalaryLPA = (maxSalaryUSD / 3700).toFixed(1);

  const highestPackageStudent = students.find(s => s.salaryPackage?.totalUSD === maxSalaryUSD);

  const companyCounts = {};
  students.forEach(s => {
    if (s.company) {
      companyCounts[s.company] = (companyCounts[s.company] || 0) + 1;
    }
  });

  const topRecruiters = Object.entries(companyCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  res.json({
    dbSource: isMongoConnected ? 'MongoDB (nk_placement)' : 'Local JSON Fallback',
    totalStudents,
    placedCount: placedStudents.length,
    offeredCount: offeredStudents.length,
    placementRate: parseFloat(placementRate),
    averageSalaryUSD,
    averageSalaryLPA: parseFloat(averageSalaryLPA),
    maxSalaryUSD,
    maxSalaryLPA: parseFloat(maxSalaryLPA),
    highestPackageStudent: highestPackageStudent ? {
      name: highestPackageStudent.name,
      company: highestPackageStudent.company,
      role: highestPackageStudent.role,
      packageUSD: highestPackageStudent.salaryPackage.totalUSD,
      packageLPA: highestPackageStudent.salaryPackage.totalLPA
    } : null,
    totalCompanies: companies.length,
    topRecruiters
  });
});

// 2. GET /api/students - List Students with search, filter, sorting, pagination
app.get('/api/students', async (req, res) => {
  let students = await getStudentsData();
  const { search, company, degree, status, minSalary, maxSalary, sortBy, order = 'asc', page, limit } = req.query;

  if (search) {
    const query = search.toLowerCase().trim();
    students = students.filter(s =>
      (s.name && s.name.toLowerCase().includes(query)) ||
      (s.email && s.email.toLowerCase().includes(query)) ||
      (s.studentId && s.studentId.toLowerCase().includes(query)) ||
      (s.role && s.role.toLowerCase().includes(query)) ||
      (s.company && s.company.toLowerCase().includes(query)) ||
      (s.skills && s.skills.some(sk => sk.toLowerCase().includes(query)))
    );
  }

  if (company && company !== 'All') {
    students = students.filter(s => s.company && s.company.toLowerCase() === company.toLowerCase());
  }

  if (degree && degree !== 'All') {
    students = students.filter(s => s.degree && s.degree.toLowerCase().includes(degree.toLowerCase()));
  }

  if (status && status !== 'All') {
    students = students.filter(s => s.status && s.status.toLowerCase() === status.toLowerCase());
  }

  if (minSalary) {
    const minVal = Number(minSalary);
    students = students.filter(s => (s.salaryPackage?.totalUSD || 0) >= minVal);
  }

  if (maxSalary) {
    const maxVal = Number(maxSalary);
    students = students.filter(s => (s.salaryPackage?.totalUSD || 0) <= maxVal);
  }

  if (sortBy) {
    students.sort((a, b) => {
      let valA, valB;
      if (sortBy === 'salaryUSD') {
        valA = a.salaryPackage?.totalUSD || 0;
        valB = b.salaryPackage?.totalUSD || 0;
      } else if (sortBy === 'gpa') {
        valA = a.gpa || 0;
        valB = b.gpa || 0;
      } else if (sortBy === 'name') {
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
      } else if (sortBy === 'company') {
        valA = (a.company || '').toLowerCase();
        valB = (b.company || '').toLowerCase();
      } else {
        valA = a.id || 0;
        valB = b.id || 0;
      }

      if (valA < valB) return order === 'desc' ? 1 : -1;
      if (valA > valB) return order === 'desc' ? -1 : 1;
      return 0;
    });
  }

  const totalCount = students.length;

  let paginatedStudents = students;
  if (page && limit) {
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const startIndex = (pageNum - 1) * limitNum;
    paginatedStudents = students.slice(startIndex, startIndex + limitNum);
  }

  res.json({
    dbSource: isMongoConnected ? 'MongoDB (nk_placement)' : 'Local JSON Fallback',
    total: totalCount,
    page: parseInt(page, 10) || 1,
    limit: parseInt(limit, 10) || totalCount,
    totalPages: limit ? Math.ceil(totalCount / parseInt(limit, 10)) : 1,
    students: paginatedStudents
  });
});

// 3. GET /api/students/:id - Individual Student Profile
app.get('/api/students/:id', async (req, res) => {
  const students = await getStudentsData();
  const student = students.find(s => s.id === parseInt(req.params.id, 10) || s.studentId === req.params.id);

  if (!student) {
    return res.status(404).json({ error: 'Student record not found' });
  }

  res.json(student);
});

// 4. POST /api/students - Add a new student record to MongoDB & JSON fallback
app.post('/api/students', async (req, res) => {
  const students = await getStudentsData();
  const { name, email, degree, gpa, company, role, salaryUSD, skills, location } = req.body;

  if (!name || !email || !company || !role || !salaryUSD) {
    return res.status(400).json({ error: 'Missing required fields: name, email, company, role, salaryUSD' });
  }

  const newId = students.length ? Math.max(...students.map(s => s.id || 0)) + 1 : 1;
  const numSalaryUSD = Number(salaryUSD);
  const baseUSD = Math.round(numSalaryUSD * 0.75);
  const joiningBonusUSD = Math.round(numSalaryUSD * 0.12);
  const equityUSD = numSalaryUSD - baseUSD - joiningBonusUSD;
  const totalLPA = (numSalaryUSD / 3700).toFixed(1);

  const names = name.trim().split(' ');
  const initials = names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name.slice(0, 2).toUpperCase();

  const newStudent = {
    id: newId,
    studentId: `STU-2026-${String(newId).padStart(3, '0')}`,
    name,
    email,
    degree: degree || 'B.Tech Computer Science & Engineering',
    gpa: parseFloat(gpa) || 3.75,
    status: 'Placed',
    company,
    companyLogo: '🏢',
    role,
    location: location || 'San Francisco, CA',
    skills: Array.isArray(skills) ? skills : (skills ? skills.split(',').map(s => s.trim()) : ['Node.js', 'JavaScript']),
    salaryPackage: {
      totalUSD: numSalaryUSD,
      totalLPA: parseFloat(totalLPA),
      baseUSD,
      joiningBonusUSD,
      equityUSD,
      currencyDisplayUSD: `$${numSalaryUSD.toLocaleString()} /yr`,
      currencyDisplayLPA: `${totalLPA} LPA`
    },
    avatarInitials: initials,
    placedDate: new Date().toISOString().split('T')[0]
  };

  if (isMongoConnected) {
    try {
      await Student.create(newStudent);
      console.log(`🎓 Inserted student "${name}" into MongoDB`);
    } catch (e) {
      console.error('Failed to save to MongoDB:', e.message);
    }
  }

  // Also sync to JSON file
  const localStudents = readJSON(STUDENTS_FILE);
  localStudents.unshift(newStudent);
  writeJSON(STUDENTS_FILE, localStudents);

  res.status(201).json({ message: 'Student record created successfully', student: newStudent });
});

// 5. GET /api/companies - List Companies with hiring counts
app.get('/api/companies', async (req, res) => {
  const companies = await getCompaniesData();
  const students = await getStudentsData();

  const enrichedCompanies = companies.map(comp => {
    const placedStudents = students.filter(s => s.company && s.company.toLowerCase() === comp.name.toLowerCase());
    return {
      ...comp,
      hiresCount: placedStudents.length,
      placedStudents: placedStudents.map(s => ({
        id: s.id,
        name: s.name,
        role: s.role,
        packageUSD: s.salaryPackage?.totalUSD,
        packageLPA: s.salaryPackage?.totalLPA
      }))
    };
  });

  res.json(enrichedCompanies);
});

// 6. GET /api/companies/:id - Single Company Detail
app.get('/api/companies/:id', async (req, res) => {
  const companies = await getCompaniesData();
  const students = await getStudentsData();
  
  const comp = companies.find(c => c.id === req.params.id || (c.name && c.name.toLowerCase() === req.params.id.toLowerCase()));
  
  if (!comp) {
    return res.status(404).json({ error: 'Company not found' });
  }

  const placedStudents = students.filter(s => s.company && s.company.toLowerCase() === comp.name.toLowerCase());

  res.json({
    ...comp,
    hiresCount: placedStudents.length,
    students: placedStudents
  });
});

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server (only if not running on Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 NK Placement & Salary Portal Server Running!`);
    console.log(`📡 URL: http://localhost:${PORT}`);
    console.log(`🍃 MongoDB: ${MONGO_URI}`);
    console.log(`====================================================`);
  });
}

module.exports = app;
