const fs = require('fs');
const path = require('path');

const companies = [
  { name: 'QuantumPulse Labs', roles: ['Quantum ML Researcher', 'AI Core Engineer', 'Algorithmic Scientist'], base: 145000, bonus: 25000, equity: 25000, logo: '⚡' },
  { name: 'Hyperion Financial', roles: ['Quantitative Developer', 'Low-Latency C++ Engineer', 'Financial Risk Analyst'], base: 160000, bonus: 35000, equity: 15000, logo: '📈' },
  { name: 'NK Cybernetics', roles: ['SDE II', 'Computer Vision Specialist', 'Edge AI Developer'], base: 125000, bonus: 20000, equity: 20000, logo: '🌐' },
  { name: 'Zenith Blockchain Labs', roles: ['Smart Contract Auditor', 'Zero-Knowledge Engineer', 'Distributed Systems Lead'], base: 135000, bonus: 15000, equity: 25000, logo: '⛓️' },
  { name: 'CyberShield AI', roles: ['Security Operations Engineer', 'Penetration Tester', 'Cloud Security Architect'], base: 120000, bonus: 20000, equity: 20000, logo: '🛡️' },
  { name: 'OmniData Analytics', roles: ['Data Engineer', 'BI Analytics Engineer', 'ETL Specialist'], base: 115000, bonus: 18000, equity: 17000, logo: '📊' },
  { name: 'Aether Dynamics', roles: ['Cloud Solutions Architect', 'Kubernetes Engineer', 'Infrastructure Engineer'], base: 110000, bonus: 15000, equity: 20000, logo: '☁️' },
  { name: 'Vortex Cloud Tech', roles: ['Site Reliability Engineer', 'DevOps Specialist', 'CI/CD Pipeline Lead'], base: 105000, bonus: 15000, equity: 20000, logo: '🌀' },
  { name: 'Novus HealthTech', roles: ['HealthTech Software Engineer', 'Bioinformatics Pipeline Engineer', 'HIPAA Data Compliance Dev'], base: 100000, bonus: 15000, equity: 15000, logo: '🧬' },
  { name: 'Apex Robotics', roles: ['Embedded Firmware Engineer', 'Control Systems Engineer', 'ROS Developer'], base: 102000, bonus: 15000, equity: 18000, logo: '🤖' },
  { name: 'Starlight Systems', roles: ['Full Stack Developer', 'Frontend Engineer (React/Node)', 'API Backend Engineer'], base: 95000, bonus: 12000, equity: 18000, logo: '⭐' },
  { name: 'Prism Interactive', roles: ['Unreal Engine Developer', '3D Graphics Programmer', 'Shaders Specialist'], base: 92000, bonus: 13000, equity: 15000, logo: '🎮' }
];

const firstNames = [
  'Aarav', 'Sophia', 'Liam', 'Ananya', 'Ethan', 'Olivia', 'Rohan', 'Emma', 'Noah', 'Diya',
  'Lucas', 'Ava', 'Vikram', 'Isabella', 'Mason', 'Priya', 'Logan', 'Mia', 'Aditya', 'Charlotte',
  'Alexander', 'Amara', 'Benjamin', 'Zoe', 'Kavya', 'Daniel', 'Harper', 'Siddharth', 'Evelyn', 'Kabir',
  'James', 'Abigail', 'Rahul', 'Emily', 'Sebastian', 'Neha', 'Jack', 'Ella', 'Arjun', 'Scarlett',
  'Henry', 'Grace', 'Dev', 'Chloe', 'Wyatt', 'Riya', 'Julian', 'Victoria', 'Karan', 'Aria'
];

const lastNames = [
  'Sharma', 'Smith', 'Patel', 'Johnson', 'Gupta', 'Williams', 'Verma', 'Brown', 'Rao', 'Jones',
  'Deshmukh', 'Garcia', 'Nair', 'Miller', 'Chopra', 'Davis', 'Reddy', 'Rodriguez', 'Kumar', 'Martinez',
  'Mehta', 'Hernandez', 'Joshi', 'Lopez', 'Bhat', 'Gonzalez', 'Kapoor', 'Wilson', 'Malhotra', 'Anderson',
  'Singh', 'Thomas', 'Roy', 'Taylor', 'Saxena', 'Moore', 'Banerjee', 'Jackson', 'Iyer', 'Martin',
  'Sengupta', 'Lee', 'Agarwal', 'Perez', 'Kulkarni', 'Thompson', 'Trivedi', 'White', 'Mukherjee', 'Harris'
];

const degrees = [
  'B.Tech Computer Science & Engineering',
  'B.Tech Artificial Intelligence & Data Science',
  'M.S. Computer Science',
  'B.S. Software Engineering',
  'B.Tech Cybersecurity & Privacy',
  'M.S. Data Analytics & AI',
  'B.Tech Robotics & Automation'
];

const skillPool = [
  'Node.js', 'React', 'TypeScript', 'Python', 'PyTorch', 'C++', 'Go', 'Kubernetes',
  'Docker', 'AWS', 'PostgreSQL', 'MongoDB', 'GraphQL', 'Rust', 'Kafka', 'TensorFlow',
  'Solidity', 'System Design', 'Redis', 'Next.js', 'OpenCV', 'Spark', 'Linux Kernel'
];

const locations = [
  'San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX',
  'Boston, MA', 'Chicago, IL', 'Denver, CO', 'San Jose, CA', 'Remote'
];

const students = [];

for (let i = 1; i <= 50; i++) {
  const firstName = firstNames[i - 1];
  const lastName = lastNames[i - 1];
  const name = `${firstName} ${lastName}`;
  const studentId = `STU-2026-${String(i).padStart(3, '0')}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}@university.edu`;
  const degree = degrees[i % degrees.length];
  const gpa = (3.4 + (Math.sin(i) * 0.5 + 0.5) * 0.6).toFixed(2); // between 3.40 and 4.00
  
  // Pick random company & role
  const compObj = companies[(i - 1) % companies.length];
  const role = compObj.roles[i % compObj.roles.length];
  
  // Package variations
  const variance = (i % 5 - 2) * 2500;
  const baseSalary = compObj.base + variance;
  const joiningBonus = compObj.bonus + (i % 3) * 1000;
  const equity = compObj.equity + (i % 4) * 1500;
  const totalCTCUSD = baseSalary + joiningBonus + equity;
  const totalCTCLPA = (totalCTCUSD / 3700).toFixed(1); // approximate conversion ratio representation for LPA

  // Pick 3-4 skills
  const studentSkills = [];
  const startSkillIndex = (i * 3) % skillPool.length;
  for (let s = 0; s < 4; s++) {
    studentSkills.push(skillPool[(startSkillIndex + s) % skillPool.length]);
  }

  const status = i % 15 === 0 ? 'Offered (Pending Acceptance)' : i % 23 === 0 ? 'In Final Rounds' : 'Placed';
  const location = locations[i % locations.length];

  students.push({
    id: i,
    studentId: studentId,
    name: name,
    email: email,
    degree: degree,
    gpa: parseFloat(gpa),
    status: status,
    company: compObj.name,
    companyLogo: compObj.logo,
    role: role,
    location: location,
    skills: studentSkills,
    salaryPackage: {
      totalUSD: totalCTCUSD,
      totalLPA: parseFloat(totalCTCLPA),
      baseUSD: baseSalary,
      joiningBonusUSD: joiningBonus,
      equityUSD: equity,
      currencyDisplayUSD: `$${totalCTCUSD.toLocaleString()} /yr`,
      currencyDisplayLPA: `${totalCTCLPA} LPA`
    },
    avatarInitials: `${firstName[0]}${lastName[0]}`,
    placedDate: `2026-0${(i % 8) + 1}-${String((i * 3) % 28 + 1).padStart(2, '0')}`
  });
}

fs.writeFileSync(path.join(__dirname, '../data/students.json'), JSON.stringify(students, null, 2));
console.log(`Generated ${students.length} student records successfully!`);
