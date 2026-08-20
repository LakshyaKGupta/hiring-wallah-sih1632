// Shared data store for Next.js serverless API routes on Vercel

export interface Opportunity {
  id: string
  title: string
  organization: string
  sector: string
  opportunity_type?: string
  department?: string
  location: string
  stipend_or_salary?: string
  experience_level?: string
  qualification_required?: string
  branch?: string
  skills_required?: string[]
  eligibility_criteria?: string
  application_deadline?: string
  official_link?: string
  source?: string
  description: string
  is_verified?: boolean
  created_at: string
}

export const INITIAL_OPPORTUNITIES: Opportunity[] = [
  {
    id: 'c1f3fa61-1004-4ca5-9086-857554e5aa68',
    title: 'Informatics Assistant / Assistant Programmer',
    organization: 'Department of Information Technology & Communication (DOIT&C)',
    sector: 'govt_job',
    opportunity_type: 'full_time',
    department: 'Information Technology & Communication, Govt. of Rajasthan',
    location: 'Jaipur / Remote within Rajasthan',
    stipend_or_salary: 'Pay Level 8 (₹28,000 - ₹89,000)',
    experience_level: 'Fresher',
    qualification_required: 'B.Tech CSE/IT, MCA, BCA, or Polytechnic Diploma in Computer Science',
    branch: 'Computer Science / IT',
    skills_required: ['Python', 'JavaScript', 'SQL', 'Database Management', 'Hindi & English Typing', 'Web Development'],
    eligibility_criteria: 'Diploma / Degree in Computer Engineering or IT from Technical Education Board',
    application_deadline: '2026-10-15',
    official_link: 'https://doitc.rajasthan.gov.in',
    source: 'Technical Education & DOIT&C Portal',
    description: 'Direct state government IT career managing e-governance applications, Jan Soochna Portal, and citizen technical portals across Rajasthan districts.',
    is_verified: true,
    created_at: '2026-08-20T04:15:13.199419'
  },
  {
    id: '1608551c-262c-4413-bde1-20c3c1612554',
    title: 'Associate Software Engineer (Campus & Fresher Drive)',
    organization: 'Infosys Technologies (Mahindra World City SEZ)',
    sector: 'private_job',
    opportunity_type: 'full_time',
    department: 'Enterprise Software Services',
    location: 'Jaipur, Rajasthan',
    stipend_or_salary: '₹4.5 - ₹7.0 LPA + Performance Bonus',
    experience_level: 'Fresher',
    qualification_required: 'B.Tech (All Technical Branches) / MCA / B.Sc IT',
    branch: 'All Technical Branches',
    skills_required: ['Java', 'Spring Boot', 'React', 'Data Structures', 'SQL', 'Git', 'Problem Solving'],
    eligibility_criteria: '2024/2025/2026 Batch Graduates with min 60% throughout',
    application_deadline: '2026-09-30',
    official_link: 'https://www.infosys.com/careers',
    source: 'Employer Direct',
    description: 'Major private sector placement opportunity for Rajasthan technical graduates. Comprehensive 3-month foundation training followed by client digital transformation projects.',
    is_verified: true,
    created_at: '2026-08-20T04:15:13.199419'
  },
  {
    id: 'd0f092e8-2378-402e-a01a-ebe823511c66',
    title: 'Full Stack Cloud Developer',
    organization: 'Nagarro Software',
    sector: 'private_job',
    opportunity_type: 'full_time',
    department: 'Digital Product Engineering',
    location: 'Jaipur / Remote, Rajasthan',
    stipend_or_salary: '₹6.0 - ₹9.5 LPA',
    experience_level: 'Fresher / 0-1 yr',
    qualification_required: 'B.Tech CSE / IT / ECE',
    branch: 'Computer Science / IT',
    skills_required: ['Node.js', 'React', 'TypeScript', 'AWS Cloud', 'Docker', 'PostgreSQL', 'REST APIs'],
    eligibility_criteria: 'Strong hands-on project portfolio in Full Stack Web Development',
    application_deadline: '2026-10-20',
    official_link: 'https://www.nagarro.com',
    source: 'Employer Direct',
    description: 'Build cutting-edge enterprise cloud web applications and microservices. Ideal for passionate developers with strong coding fundamentals.',
    is_verified: true,
    created_at: '2026-08-20T04:15:13.199419'
  },
  {
    id: '96b864d4-09ad-4f51-b847-7589d9ea8e93',
    title: 'Solar PV Site Operations & Commissioning Engineer',
    organization: 'Rajasthan Renewable Energy Corporation Ltd (RRECL) / Bhadla Solar Park',
    sector: 'govt_job',
    opportunity_type: 'full_time',
    department: 'Energy & Power Infrastructure',
    location: 'Bhadla (Phalodi / Jodhpur), Rajasthan',
    stipend_or_salary: '₹35,000 - ₹52,000 / month + Site Allowance',
    experience_level: 'Diploma / Degree Freshers Welcome',
    qualification_required: 'Diploma / B.Tech in Electrical / Power Systems / Renewable Energy',
    branch: 'Electrical / Power Systems',
    skills_required: ['Solar PV Systems', 'High Voltage Substation Operations', 'SCADA', 'AutoCAD Electrical', 'Safety Compliance'],
    eligibility_criteria: 'Technical degree or polytechnic diploma from recognized institution in Rajasthan',
    application_deadline: '2026-11-01',
    official_link: 'https://energy.rajasthan.gov.in/rrecl',
    source: 'State Government Energy Department',
    description: 'High-impact technical operations role at the world’s largest solar park. Manage inverter stations, PV array telemetry, grid synchronization, and daily power dispatch.',
    is_verified: true,
    created_at: '2026-08-20T04:15:13.199419'
  },
  {
    id: '4481d9f8-b39b-4e89-a292-06b29841f3d4',
    title: 'Junior Engineer (JEN - Electrical / Substation Automation)',
    organization: 'Rajasthan Rajya Vidyut Utpadan Nigam Ltd (RVUNL)',
    sector: 'govt_job',
    opportunity_type: 'full_time',
    department: 'Power Generation & Transmission',
    location: 'Kota / Suratgarh / Jhabua, Rajasthan',
    stipend_or_salary: 'Pay Level 10 (₹33,800 - ₹1,06,700)',
    experience_level: 'Fresher (State Exam Track)',
    qualification_required: 'Degree or 3-Year Diploma in Electrical Engineering',
    branch: 'Electrical',
    skills_required: ['Power Systems', 'Circuit Theory', 'Switchgear & Protection', 'Electrical Machines', 'Rajasthan General Knowledge'],
    eligibility_criteria: 'Direct state selection through RVUNL technical recruitment exam',
    application_deadline: '2026-10-31',
    official_link: 'https://energy.rajasthan.gov.in/rvunl',
    source: 'Official RVUNL Recruitment Board',
    description: 'Premier state technical engineering cadre in Rajasthan power plants and high-voltage transmission substations.',
    is_verified: true,
    created_at: '2026-08-20T04:15:13.199419'
  },
  {
    id: 'f93d3bb7-f1c5-4ceb-851f-b52e0081d454',
    title: 'Technical Intern — Japan TITP Industrial Apprenticeship',
    organization: 'Technical Intern Training Program (TITP) / NSDC International',
    sector: 'overseas',
    opportunity_type: 'internship',
    department: 'International Skill Development & Global Placement',
    location: 'Tokyo & Nagoya, Japan',
    stipend_or_salary: '¥220,000 - ¥280,000 / month (approx. ₹1.2L - ₹1.6L/mo)',
    experience_level: 'Fresher',
    qualification_required: 'Polytechnic Diploma / B.Tech (Mechanical, Electrical, Mechatronics, Automotive)',
    branch: 'Mechanical / Electrical / Robotics',
    skills_required: ['Industrial Automation', 'CNC Machining', 'Japanese Language (N5/N4)', 'Blueprint Reading', 'Quality Control'],
    eligibility_criteria: 'Age 19-27, Diploma/Degree holder, physically fit, willingness to undergo subsidized language prep',
    application_deadline: '2026-12-15',
    official_link: 'https://nsdcindia.org/titp',
    source: 'State Overseas Placement Cell',
    description: 'Government-supported overseas apprenticeship in Japanese high-tech manufacturing, automotive components, and robotics.',
    is_verified: true,
    created_at: '2026-08-20T04:15:13.199419'
  },
  {
    id: '99201cb4-7773-455b-86ea-19ea019992f0',
    title: 'AICTE Mandatory 6-Month Industrial Internship',
    organization: 'Bosch Automotive Electronics (Sitapura Industrial SEZ)',
    sector: 'internship',
    opportunity_type: 'internship',
    department: 'Automotive Embedded Systems & Sensors',
    location: 'Jaipur, Rajasthan',
    stipend_or_salary: '₹15,000 - ₹22,000 / month + Meal Allowance',
    experience_level: 'Pre-final / Final Year Technical Students',
    qualification_required: 'Polytechnic Diploma / B.Tech (ECE, Electrical, Mechanical, CSE)',
    branch: 'Electrical / Electronics / Computer Science',
    skills_required: ['C/C++ Embedded', 'CAN Protocol', 'Microcontrollers', 'Sensor Calibration', 'Troubleshooting'],
    eligibility_criteria: 'Accredited technical college student with NOC from Principal / TPO',
    application_deadline: '2026-09-15',
    official_link: 'https://internship.aicte-india.org',
    source: 'AICTE & Rajasthan Technical Education Board',
    description: 'AICTE academic credit-aligned mandatory industrial internship. Hands-on testing of electronic control units (ECU) with high Pre-Placement Offer (PPO) conversion rates.',
    is_verified: true,
    created_at: '2026-08-20T04:15:13.199419'
  }
]

export const INITIAL_COUNSELORS = [
  {
    id: 'counselor-01',
    name: 'Dr. Arvind Meena',
    title: 'Senior State Advisor — Lateral Entry & Polytechnic Pathways',
    specialization: 'Polytechnic & LEET Guidance',
    organization: 'Directorate of Technical Education, Jodhpur',
    experience_years: 16,
    bio: 'Pioneered Rajasthan Lateral Entry Engineering Test (LEET) counseling reform. Specializes in assisting polytechnic diploma students transition smoothly into premier engineering colleges.',
    contact_email: 'arvind.meena@dte.rajasthan.gov.in',
    rating: 4.9,
    available_slots: ['Mon 10:00 AM', 'Wed 02:00 PM', 'Fri 11:30 AM'],
    languages: ['Hindi', 'English', 'Rajasthani']
  },
  {
    id: 'counselor-02',
    name: 'Er. Priya Rathore',
    title: 'State Technical Exams Strategist (RPSC & RVUNL)',
    specialization: 'Govt Technical Exams',
    organization: 'Rajasthan Technical Education Career Advisory Cell',
    experience_years: 12,
    bio: 'Former RVUNL Assistant Engineer and mentor to 4,000+ candidates who cleared RSSB JEN and RPSC technical examinations.',
    contact_email: 'priya.rathore@rajasthan.gov.in',
    rating: 4.95,
    available_slots: ['Tue 11:00 AM', 'Thu 04:00 PM', 'Sat 10:00 AM'],
    languages: ['Hindi', 'English']
  },
  {
    id: 'counselor-03',
    name: 'Kenji Takahashi & Rajesh Sharma',
    title: 'Japan TITP & Overseas Technical Mobility Lead',
    specialization: 'Overseas Mobility & Japan TITP',
    organization: 'NSDC International & Rajasthan Overseas Employment Cell',
    experience_years: 14,
    bio: 'Facilitates international technical apprenticeships and dual vocational certifications in Japan and Germany for Rajasthan students.',
    contact_email: 'overseas.placement@nsdc.org.in',
    rating: 4.88,
    available_slots: ['Wed 04:00 PM', 'Fri 03:00 PM'],
    languages: ['English', 'Hindi', 'Japanese (N2)']
  }
]

export const INITIAL_MENTORS = [
  {
    id: 'mentor-01',
    name: 'Vikram Singh Shekhawat',
    title: 'Lead Solar Grid Engineer',
    company: 'Sterling & Wilson Solar (Bhadla Park)',
    alumni_institution: 'MBM Engineering College, Jodhpur (2018 Batch)',
    industry: 'Solar & Renewable Power',
    experience_years: 8,
    bio: 'Specialist in 500MW+ PV array substation automation, SCADA integration, and high-voltage grid dispatch.',
    skills: ['Solar PV Systems', 'SCADA', 'AutoCAD Electrical', 'Grid Synchronization'],
    contact_email: 'vikram.shekhawat@alumni.mbm.ac.in',
    linkedin_url: 'https://linkedin.com/in/vikram-solar-engineer',
    is_verified: true,
    created_at: '2026-08-20T04:15:13.199419'
  },
  {
    id: 'mentor-02',
    name: 'Ananya Sharma',
    title: 'Senior Full Stack Cloud Engineer',
    company: 'Infosys Digital Innovation Hub',
    alumni_institution: 'RTU Kota (2020 Batch)',
    industry: 'Software & Cloud',
    experience_years: 6,
    bio: 'Mentoring Rajasthan technical graduates on mastering TypeScript, Next.js, and cloud deployments.',
    skills: ['TypeScript', 'Next.js', 'Python', 'AWS Cloud', 'System Design'],
    contact_email: 'ananya.sharma@alumni.rtu.ac.in',
    linkedin_url: 'https://linkedin.com/in/ananya-cloud-dev',
    is_verified: true,
    created_at: '2026-08-20T04:15:13.199419'
  },
  {
    id: 'mentor-03',
    name: 'Deepak Choudhary',
    title: 'Assistant Engineer (RVUNL Generation)',
    company: 'Rajasthan Rajya Vidyut Utpadan Nigam Ltd (Suratgarh)',
    alumni_institution: 'Govt. Polytechnic College, Bikaner (2016 Batch) -> RTU Kota',
    industry: 'Public Sector & Government',
    experience_years: 9,
    bio: 'Lateral Entry (LEET) success story. Transitioned from polytechnic diploma to B.Tech and ranked 4th in RVUNL AEN exam.',
    skills: ['Switchgear & Protection', 'LEET Strategy', 'Electrical Machines', 'State Exam Preparation'],
    contact_email: 'deepak.choudhary@rvunl.rajasthan.gov.in',
    linkedin_url: 'https://linkedin.com/in/deepak-rvunl-engineer',
    is_verified: true,
    created_at: '2026-08-20T04:15:13.199419'
  }
]

export const INITIAL_RESOURCES = [
  {
    id: '18ba214a-e9ed-4484-8947-cf27e634e906',
    title: 'Complete Roadmap: Cracking Rajasthan Technical Govt Exams (RPSC AE / RSSB JE / RVUNL)',
    category: 'govt_exam_roadmap',
    department: 'Government Technical Services Preparation',
    description: 'Comprehensive step-by-step preparation strategy for Rajasthan state technical exams. Covers technical syllabus division (60%), Rajasthan General Knowledge & Culture (40%), and previous 5-year question paper trends.',
    tags: ['RPSC', 'RSSB JE', 'RVUNL', 'Govt Technical Exams', 'Rajasthan GK', 'Syllabus Breakdown'],
    created_at: '2026-08-20T04:15:13.199419'
  },
  {
    id: '5f61b05a-1db8-4e45-976e-7b29a7831e4a',
    title: 'Polytechnic Diploma to Degree (Lateral Entry & B.Tech LEET) Playbook',
    category: 'polytechnic_pathways',
    department: 'Higher Education Transition & AICTE Accreditations',
    description: 'Complete guidance for Rajasthan diploma holders planning higher technical education. Explains direct admission to 2nd year B.Tech via Lateral Entry (LEET), eligibility criteria, top state colleges, and scholarships.',
    tags: ['Polytechnic', 'Diploma to Degree', 'LEET Rajasthan', 'RTU Kota', 'Lateral Entry', 'Scholarships'],
    created_at: '2026-08-20T04:15:13.199419'
  }
]
