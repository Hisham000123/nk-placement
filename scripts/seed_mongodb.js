const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nk_placement';

// Define Schemas
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

async function seedDatabase() {
  try {
    console.log(`🔌 Connecting to MongoDB at ${MONGO_URI}...`);
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('✅ Connected to MongoDB successfully!');

    // Read local JSON files
    const companiesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/companies.json'), 'utf8'));
    const studentsData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/students.json'), 'utf8'));

    // Clear existing data
    await Company.deleteMany({});
    await Student.deleteMany({});
    console.log('🧹 Cleared existing database collections.');

    // Insert new data
    const insertedCompanies = await Company.insertMany(companiesData);
    console.log(`📦 Successfully seeded ${insertedCompanies.length} companies into MongoDB!`);

    const insertedStudents = await Student.insertMany(studentsData);
    console.log(`🎓 Successfully seeded ${insertedStudents.length} student records into MongoDB!`);

    console.log('🎉 MongoDB database seeding complete!');
  } catch (err) {
    console.error('❌ MongoDB Seeding Error:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedDatabase();
