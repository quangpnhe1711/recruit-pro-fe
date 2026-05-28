# RecruitPro - API JSON Schemas for Backend Development

This document contains all necessary JSON data structures for each screen and feature in the RecruitPro platform.

---

## 1. Authentication Module

### 1.1 Login Request
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### 1.2 Login Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-001",
      "email": "user@example.com",
      "fullName": "John Doe",
      "avatarUrl": "https://example.com/avatar.jpg",
      "phone": "+1 (555) 0123 4567",
      "roles": ["HR", "Admin"],
      "permissions": ["create_job", "manage_candidates", "schedule_interview"]
    }
  }
}
```

### 1.3 User DTO
```json
{
  "id": "user-001",
  "email": "user@example.com",
  "fullName": "John Doe",
  "avatarUrl": "https://example.com/avatar.jpg",
  "phone": "+1 (555) 0123 4567",
  "roles": ["HR", "Recruiter"],
  "permissions": ["create_job", "view_candidates", "schedule_interview"]
}
```

### 1.4 Logout Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Logout successful",
  "data": null
}
```

### 1.5 Candidate Register Request
```json
{
  "account": {
    "fullName": "Jane Doe",
    "email": "jane@recruitpro.com",
    "password": "securePassword123",
    "phone": "+84 8123 45678"
  },
  "professional": {
    "position": "Senior Talent Specialist",
    "experienceYears": 5,
    "education": "BBA - University of Economics",
    "address": "Ho Chi Minh City, Vietnam",
    "bio": "Talent acquisition specialist with 5 years of experience."
  },
  "links": {
    "github": "https://github.com/janedoe",
    "linkedin": "https://linkedin.com/in/janedoe",
    "resume": {
      "fileName": "jane-doe-cv.pdf",
      "mimeType": "application/pdf",
      "size": 245811
    }
  }
}
```

### 1.6 Candidate Register Persistence Mapping
```json
{
  "user": {
    "fullName": "Jane Doe",
    "email": "jane@recruitpro.com",
    "passwordHash": "{{bcrypt(password)}}",
    "phone": "+84 8123 45678",
    "role": "candidate"
  },
  "candidate_profile": {
    "userId": "{{user.id}}",
    "position": "Senior Talent Specialist",
    "experienceYears": 5,
    "education": "BBA - University of Economics",
    "address": "Ho Chi Minh City, Vietnam",
    "bio": "Talent acquisition specialist with 5 years of experience."
  },
  "candidate_links": {
    "userId": "{{user.id}}",
    "github": "https://github.com/janedoe",
    "linkedin": "https://linkedin.com/in/janedoe"
  },
  "candidate_resume": {
    "userId": "{{user.id}}",
    "fileName": "jane-doe-cv.pdf",
    "mimeType": "application/pdf",
    "size": 245811
  }
}
```

---

## 2. Job Management

### 2.1 Job Posting Model
```json
{
  "id": "job-001",
  "title": "Senior Full-Stack Engineer",
  "department": "Engineering",
  "employment_type": "Full-time",
  "work_mode": "Remote",
  "short_pitch": "Join our team to build scalable systems",
  "description": "We are looking for a senior full-stack engineer with 8+ years of experience...",
  "responsibilities": [
    "Design and implement scalable microservices",
    "Lead code reviews and architectural discussions",
    "Mentor junior developers"
  ],
  "requirements": [
    "8+ years of full-stack development",
    "Experience with Go and React",
    "Strong system design knowledge",
    "Experience with Kubernetes"
  ],
  "required_skills": [
    "React",
    "TypeScript",
    "Go",
    "Kubernetes"
  ],
  "nice_to_have_skills": [
    "Docker",
    "CI/CD Pipelines",
    "AWS"
  ],
  "salary_min": 165000,
  "salary_max": 210000,
  "currency": "USD",
  "location": "San Francisco, CA",
  "created_date": "2024-10-24",
  "created_at": 1729700000000,
  "created_by": "hr-user-001",
  "approval_status": "Pending",
  "applications_count": 45,
  "posted_at": "2024-10-24T10:00:00Z",
  "deadline": "2024-11-24",
  "tags": ["Remote Friendly", "Full-Time", "Senior Level"]
}
```

### 2.2 Create Job Request
```json
{
  "title": "Senior Full-Stack Engineer",
  "department": "Engineering",
  "employment_type": "Full-time",
  "work_mode": "Remote",
  "short_pitch": "Join our team to build scalable systems",
  "description": "We are looking for a senior full-stack engineer...",
  "responsibilities": [
    "Design and implement scalable microservices",
    "Lead code reviews"
  ],
  "requirements": [
    "8+ years of experience",
    "Strong system design"
  ],
  "required_skills": [
    "React",
    "TypeScript",
    "Go"
  ],
  "nice_to_have_skills": [
    "Docker",
    "Kubernetes"
  ],
  "salary_min": 165000,
  "salary_max": 210000,
  "currency": "USD",
  "location": "San Francisco, CA",
  "deadline": "2024-11-24"
}
```

### 2.3 Job Response (List)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Jobs retrieved successfully",
  "data": [
    {
      "id": "job-001",
      "title": "Senior Full-Stack Engineer",
      "department": "Engineering",
      "employment_type": "Full-time",
      "work_mode": "Remote",
      "short_pitch": "Join our team",
      "salary_min": 165000,
      "salary_max": 210000,
      "currency": "USD",
      "location": "San Francisco, CA",
      "posted_at": "2024-10-24T10:00:00Z",
      "required_skills": ["React", "TypeScript", "Go"],
      "tags": ["Remote Friendly", "Full-Time"]
    }
  ]
}
```

### 2.4 Update Job Status Request
```json
{
  "approval_status": "Approved"
}
```

---

## 3. Job Applications

### 3.1 Application Model
```json
{
  "id": "app-001",
  "candidate_id": "candidate-001",
  "job_id": "job-001",
  "candidate_name": "Alexander Pierce",
  "candidate_email": "alex.pierce@example.com",
  "job_title": "Senior Full-Stack Engineer",
  "department": "Engineering",
  "applied_date": "2024-10-24",
  "applied_at": 1729700000000,
  "status": "Interviewing",
  "next_step": "Schedule technical interview",
  "cv_url": "https://example.com/cv/alex-pierce.pdf",
  "cover_letter": "I am interested in this position because...",
  "rating": 4,
  "notes": "Strong technical background, good communication skills"
}
```

### 3.2 Application Request (Create)
```json
{
  "candidate_id": "candidate-001",
  "job_id": "job-001",
  "cv_url": "https://example.com/cv/alex-pierce.pdf",
  "cover_letter": "I am interested in this position..."
}
```

### 3.3 Update Application Status Request
```json
{
  "status": "Interviewing",
  "next_step": "Schedule technical interview",
  "notes": "Strong candidate, proceed to technical round"
}
```

### 3.4 Application Response (List)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Applications retrieved successfully",
  "data": [
    {
      "id": "app-001",
      "candidate_name": "Alexander Pierce",
      "job_title": "Senior Full-Stack Engineer",
      "applied_date": "2024-10-24",
      "status": "Interviewing",
      "next_step": "Schedule technical interview"
    }
  ]
}
```

---

## 4. Interview Scheduling

### 4.1 Interview Schedule Model
```json
{
  "id": "interview-001",
  "candidate_id": "candidate-001",
  "candidate_name": "Alexander Pierce",
  "candidate_email": "alex.pierce@example.com",
  "candidate_avatar": "https://example.com/avatar/alex.jpg",
  "job_title": "Senior Full-Stack Engineer",
  "job_id": "job-001",
  "interviewer_id": "user-001",
  "interviewer_name": "Sarah Jenkins",
  "interviewer_title": "Director of Engineering",
  "interview_mode": "video",
  "location_or_link": "https://meet.google.com/abc-defg-hij",
  "scheduled_date": "2024-10-26",
  "scheduled_at": 1729987200000,
  "start_time": "10:30 AM",
  "end_time": "11:30 AM",
  "duration_minutes": 60,
  "status": "Confirmed",
  "notes": "Technical round - focusing on system design",
  "feedback": "",
  "created_at": 1729700000000
}
```

### 4.2 Create Interview Schedule Request
```json
{
  "candidate_id": "candidate-001",
  "job_id": "job-001",
  "interviewer_id": "user-001",
  "scheduled_date": "2024-10-26",
  "start_time": "10:30 AM",
  "duration_minutes": 60,
  "interview_mode": "video",
  "location_or_link": "https://meet.google.com/abc-defg-hij",
  "notes": "Technical round - focusing on system design"
}
```

### 4.3 Interviewer Availability Model
```json
{
  "id": "user-001",
  "name": "Sarah Jenkins",
  "title": "Director of Engineering",
  "avatar_url": "https://example.com/avatar/sarah.jpg",
  "busy_slots_by_date": {
    "2024-10-26": [600, 1020],
    "2024-10-27": [540, 660]
  }
}
```

### 4.4 Interview Response (List)
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Interviews retrieved successfully",
  "data": [
    {
      "id": "interview-001",
      "candidate_name": "Alexander Pierce",
      "candidate_email": "alex.pierce@example.com",
      "job_title": "Senior Full-Stack Engineer",
      "interviewer": "Sarah Jenkins",
      "date_label": "Oct 26, 2024",
      "time_label": "10:30 AM - 11:30 AM",
      "status": "Confirmed"
    }
  ]
}
```

### 4.5 Update Interview Status Request
```json
{
  "status": "Completed",
  "feedback": "Great technical knowledge, good communication, proceed to final round"
}
```

---

## 5. Candidate Profile & CV Management

### 5.1 Candidate Profile Model
```json
{
  "id": "candidate-001",
  "name": "Alex Thompson",
  "headline": "Senior Full-Stack Engineer",
  "email": "alex.thompson@example.com",
  "phone": "+1 (555) 0123 4567",
  "location": "Chicago, IL • Remote Friendly",
  "member_since": "2024-01-15",
  "bio": "Senior Full-Stack Engineer with 8+ years of experience building scalable web applications.",
  "avatar_url": "https://example.com/avatar/alex.jpg",
  "github": "github.com/athompson-dev",
  "linkedin": "linkedin.com/in/alexthompson",
  "skills": [
    {
      "label": ".NET Core",
      "active": true
    },
    {
      "label": "React & Redux",
      "active": true
    },
    {
      "label": "SQL Server",
      "active": true
    },
    {
      "label": "Azure Cloud",
      "active": true
    }
  ]
}
```

### 5.2 Update Profile Request
```json
{
  "name": "Alex Thompson",
  "headline": "Senior Full-Stack Engineer",
  "email": "alex.thompson@example.com",
  "phone": "+1 (555) 0123 4567",
  "location": "Chicago, IL • Remote Friendly",
  "bio": "Senior Full-Stack Engineer with 8+ years of experience...",
  "github": "github.com/athompson-dev",
  "linkedin": "linkedin.com/in/alexthompson"
}
```

### 5.3 Experience Entry Model
```json
{
  "id": "exp-001",
  "title": "Senior Software Engineer",
  "company": "TechFlow Solutions Inc.",
  "start_month": 1,
  "start_year": 2020,
  "end_month": null,
  "end_year": null,
  "is_current": true,
  "bullets": [
    "Architected and led the migration of legacy monolith to microservices using .NET 8.",
    "Improved system performance by 40% through SQL optimization and caching strategies.",
    "Mentored a team of 5 junior and mid-level developers."
  ]
}
```

### 5.4 Create/Update Experience Request
```json
{
  "title": "Senior Software Engineer",
  "company": "TechFlow Solutions Inc.",
  "start_month": 1,
  "start_year": 2020,
  "end_month": null,
  "end_year": null,
  "is_current": true,
  "bullets": [
    "Architected and led the migration of legacy monolith to microservices",
    "Improved system performance by 40%",
    "Mentored a team of 5 developers"
  ]
}
```

### 5.5 Skills Model
```json
{
  "skills": [
    {
      "label": ".NET Core",
      "active": true
    },
    {
      "label": "React & Redux",
      "active": true
    },
    {
      "label": "SQL Server",
      "active": true
    },
    {
      "label": "Node.js",
      "active": false
    }
  ]
}
```

### 5.6 Update Skills Request
```json
{
  "skills": [
    {
      "label": ".NET Core",
      "active": true
    },
    {
      "label": "React & Redux",
      "active": true
    }
  ]
}
```

---

## 6. Dashboard Data

### 6.1 HR Dashboard Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Dashboard data retrieved",
  "data": {
    "stat_cards": [
      {
        "label": "Active Postings",
        "value": "12",
        "helper": "+2 from last week",
        "helper_class": "text-blue-600",
        "icon": "work"
      },
      {
        "label": "Total Applicants",
        "value": "84",
        "helper": "15.2% conversion rate",
        "helper_class": "text-blue-600",
        "icon": "group"
      },
      {
        "label": "Interviews Today",
        "value": "5",
        "helper": "Next: 2:00 PM (L6 Dev)",
        "helper_class": "text-red-600",
        "icon": "schedule"
      }
    ],
    "recent_applications": [
      {
        "candidate_name": "Sarah Jenkins",
        "job_applied_for": "Senior UX Designer",
        "status": "Interviewing",
        "status_class": "bg-blue-100 text-blue-600",
        "date": "Oct 24, 2024"
      }
    ],
    "pending_approvals": [
      {
        "title": "Senior Full-Stack Engineer",
        "meta": "Engineering • Posted 2h ago",
        "avatar_src": "https://example.com/avatar.jpg",
        "extra_count": "+2 more"
      }
    ]
  }
}
```

### 6.2 Candidate Dashboard Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Dashboard data retrieved",
  "data": {
    "stat_cards": [
      {
        "icon": "assignment",
        "icon_class": "text-red-600",
        "label": "Applied Jobs",
        "value": "04",
        "helper": "+1 since last week"
      },
      {
        "icon": "event",
        "icon_class": "text-blue-600",
        "label": "Interviews",
        "value": "01",
        "helper": "Next scheduled today at 2:00 PM"
      },
      {
        "icon": "notifications_active",
        "icon_class": "text-black",
        "label": "Unread",
        "value": "02",
        "helper": "Feedback received for UX Designer"
      }
    ],
    "recommended_jobs": [
      {
        "icon": "hub",
        "title": "Staff UX Researcher",
        "meta": "Remote • $140k - $180k",
        "tag": "Full Time",
        "chips": ["User Testing", "Figma", "Strategy"],
        "action_label": "Quick Apply"
      }
    ]
  }
}
```

---

## 7. Job Listing (Candidate View)

### 7.1 Job Card Model (For Listing)
```json
{
  "id": "job-001",
  "icon": "data_object",
  "title": "Senior Full-Stack Engineer",
  "meta": "Platform Infrastructure • San Francisco, CA (Remote)",
  "salary": "$165k - $210k",
  "posted": "Posted 2h ago",
  "tags": ["React", "TypeScript", "Go", "Kubernetes"],
  "description": "Looking for a technical lead to oversee the migration of our legacy monolith to a distributed microservices architecture using Go and React.",
  "employment_type": "Full-time",
  "work_mode": "Remote"
}
```

### 7.2 Jobs Listing Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Jobs retrieved successfully",
  "data": {
    "jobs": [
      {
        "id": "job-001",
        "title": "Senior Full-Stack Engineer",
        "meta": "Platform Infrastructure • San Francisco, CA (Remote)",
        "salary": "$165k - $210k",
        "posted": "Posted 2h ago",
        "tags": ["React", "TypeScript", "Go", "Kubernetes"],
        "employment_type": "Full-time",
        "work_mode": "Remote"
      }
    ],
    "total": 45,
    "page": 1,
    "limit": 10
  }
}
```

### 7.3 Filter Options
```json
{
  "filters": {
    "salary_range": [
      "$50k - $80k",
      "$80k - $120k",
      "$120k - $180k",
      "$180k+"
    ],
    "employment_type": [
      "Full-time",
      "Contract",
      "Freelance",
      "Part-time"
    ],
    "work_mode": [
      "Remote",
      "Hybrid",
      "On-site"
    ],
    "departments": [
      "Engineering",
      "Product",
      "Design",
      "Marketing",
      "Sales"
    ]
  }
}
```

---

## 8. My Applications (Candidate View)

### 8.1 Application Item Model
```json
{
  "id": "app-001",
  "icon": "work",
  "title": "Lead Product Designer",
  "department": "Luvina Tech - Design Team",
  "applied_date": "Oct 24, 2023",
  "status": "Interviewing",
  "status_class": "bg-blue-100 text-blue-600",
  "next_step": "Schedule technical interview",
  "action_label": "Withdraw",
  "action_class": "text-red-600"
}
```

### 8.2 My Applications Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Applications retrieved successfully",
  "data": {
    "applications": [
      {
        "id": "app-001",
        "title": "Lead Product Designer",
        "department": "Luvina Tech - Design Team",
        "applied_date": "Oct 24, 2023",
        "status": "Interviewing",
        "next_step": "Schedule technical interview"
      }
    ],
    "summary": {
      "total": 12,
      "active": 4,
      "closed": 8
    }
  }
}
```

---

## 9. Generic API Response Wrapper

### 9.1 Success Response Template
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation completed successfully",
  "data": {}
}
```

### 9.2 Error Response Template
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation error or operation failed",
  "data": null,
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 9.3 Pagination Response Template
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Data retrieved successfully",
  "data": {
    "items": [],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "pages": 10
    }
  }
}
```

---

## 10. Candidate Registration

### 10.1 Register Request (Complete)
```json
{
  "email": "newcandidate@example.com",
  "password": "securePassword123",
  "fullName": "John Doe",
  "phone": "+1 (555) 0123 4567",
  "location": "Chicago, IL",
  "headline": "Full-Stack Engineer",
  "bio": "Passionate about building scalable applications with 5+ years of experience",
  "avatar_url": "https://example.com/avatar/johndoe.jpg",
  "github": "github.com/johndoe",
  "linkedin": "linkedin.com/in/johndoe",
  "cv_url": "https://example.com/cv/john-doe.pdf",
  "work_authorization": "Authorized to work in USA",
  "willing_to_relocate": false,
  "availability_notice_period_days": 30,
  "employment_preferences": {
    "employment_types": ["Full-time", "Contract"],
    "work_modes": ["Remote", "Hybrid"],
    "salary_expectation_min": 100000,
    "salary_expectation_max": 150000,
    "currency": "USD"
  },
  "skills": [
    {
      "label": "JavaScript",
      "proficiency": "Expert",
      "years": 5
    },
    {
      "label": "React",
      "proficiency": "Advanced",
      "years": 4
    },
    {
      "label": "Node.js",
      "proficiency": "Advanced",
      "years": 3
    },
    {
      "label": "TypeScript",
      "proficiency": "Intermediate",
      "years": 2
    }
  ],
  "education": [
    {
      "institution": "University of Illinois",
      "degree": "Bachelor of Science",
      "field_of_study": "Computer Science",
      "graduation_year": 2019,
      "description": "GPA: 3.8/4.0"
    }
  ],
  "experience": [
    {
      "title": "Senior Software Engineer",
      "company": "TechFlow Solutions",
      "start_month": 6,
      "start_year": 2021,
      "end_month": null,
      "end_year": null,
      "is_current": true,
      "description": "Leading a team of 5 engineers on microservices architecture",
      "bullets": [
        "Architected microservices migration project",
        "Improved system performance by 40%",
        "Mentored 5 junior developers"
      ]
    }
  ],
  "job_interests": [
    "Full-Stack Engineer",
    "Backend Engineer",
    "Tech Lead"
  ],
  "industries": [
    "Technology",
    "FinTech",
    "E-commerce"
  ],
  "preferred_company_size": "Startup",
  "terms_accepted": true,
  "privacy_accepted": true,
  "marketing_emails_opted_in": true
}
```

### 10.2 Register Response (Complete)
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Registration successful",
  "data": {
    "id": "candidate-001",
    "email": "newcandidate@example.com",
    "fullName": "John Doe",
    "phone": "+1 (555) 0123 4567",
    "location": "Chicago, IL",
    "headline": "Full-Stack Engineer",
    "bio": "Passionate about building scalable applications with 5+ years of experience",
    "avatar_url": "https://example.com/avatar/johndoe.jpg",
    "github": "github.com/johndoe",
    "linkedin": "linkedin.com/in/johndoe",
    "cv_url": "https://example.com/cv/john-doe.pdf",
    "work_authorization": "Authorized to work in USA",
    "willing_to_relocate": false,
    "availability_notice_period_days": 30,
    "employment_preferences": {
      "employment_types": ["Full-time", "Contract"],
      "work_modes": ["Remote", "Hybrid"],
      "salary_expectation_min": 100000,
      "salary_expectation_max": 150000,
      "currency": "USD"
    },
    "skills": [
      {
        "label": "JavaScript",
        "proficiency": "Expert",
        "years": 5
      },
      {
        "label": "React",
        "proficiency": "Advanced",
        "years": 4
      }
    ],
    "education": [
      {
        "institution": "University of Illinois",
        "degree": "Bachelor of Science",
        "field_of_study": "Computer Science",
        "graduation_year": 2019
      }
    ],
    "experience_count": 1,
    "created_at": "2024-10-24T10:30:00Z",
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 10.3 Register Request (Minimal - Step 1)
```json
{
  "email": "newcandidate@example.com",
  "password": "securePassword123",
  "fullName": "John Doe",
  "phone": "+1 (555) 0123 4567",
  "terms_accepted": true,
  "privacy_accepted": true
}
```

### 10.4 Complete Profile Request (Step 2 - After Registration)
```json
{
  "location": "Chicago, IL",
  "headline": "Full-Stack Engineer",
  "bio": "Passionate about building scalable applications",
  "avatar_url": "https://example.com/avatar/johndoe.jpg",
  "github": "github.com/johndoe",
  "linkedin": "linkedin.com/in/johndoe",
  "cv_url": "https://example.com/cv/john-doe.pdf",
  "work_authorization": "Authorized to work in USA",
  "willing_to_relocate": false,
  "availability_notice_period_days": 30
}
```

### 10.5 Add Skills Request (Step 2)
```json
{
  "skills": [
    {
      "label": "JavaScript",
      "proficiency": "Expert",
      "years": 5
    },
    {
      "label": "React",
      "proficiency": "Advanced",
      "years": 4
    },
    {
      "label": "Node.js",
      "proficiency": "Advanced",
      "years": 3
    },
    {
      "label": "TypeScript",
      "proficiency": "Intermediate",
      "years": 2
    },
    {
      "label": "MongoDB",
      "proficiency": "Advanced",
      "years": 3
    },
    {
      "label": "PostgreSQL",
      "proficiency": "Advanced",
      "years": 4
    },
    {
      "label": "AWS",
      "proficiency": "Intermediate",
      "years": 2
    },
    {
      "label": "Docker",
      "proficiency": "Intermediate",
      "years": 1
    }
  ]
}
```

### 10.6 Add Education Request (Step 2)
```json
{
  "education": [
    {
      "institution": "University of Illinois",
      "degree": "Bachelor of Science",
      "field_of_study": "Computer Science",
      "graduation_year": 2019,
      "description": "GPA: 3.8/4.0, Dean's List all semesters"
    },
    {
      "institution": "Coursera",
      "degree": "Professional Certificate",
      "field_of_study": "Full Stack Web Development",
      "graduation_year": 2020,
      "description": "Advanced specialization in MERN Stack"
    }
  ]
}
```

### 10.7 Add Experience Request (Step 2)
```json
{
  "experience": [
    {
      "title": "Senior Software Engineer",
      "company": "TechFlow Solutions",
      "start_month": 6,
      "start_year": 2021,
      "end_month": null,
      "end_year": null,
      "is_current": true,
      "description": "Leading a team of 5 engineers on microservices architecture",
      "bullets": [
        "Architected microservices migration project reducing deployment time by 60%",
        "Improved system performance by 40% through optimization and caching",
        "Mentored 5 junior developers, 2 promoted to mid-level within 18 months",
        "Implemented CI/CD pipeline using Jenkins and Docker"
      ]
    },
    {
      "title": "Software Engineer",
      "company": "NextGen Tech",
      "start_month": 1,
      "start_year": 2019,
      "end_month": 5,
      "end_year": 2021,
      "is_current": false,
      "description": "Full-stack development on customer management platform",
      "bullets": [
        "Built React-based dashboard serving 10K+ daily users",
        "Developed REST APIs using Node.js and Express",
        "Optimized database queries reducing response time by 35%"
      ]
    },
    {
      "title": "Junior Developer",
      "company": "StartupXYZ",
      "start_month": 7,
      "start_year": 2018,
      "end_month": 12,
      "end_year": 2018,
      "is_current": false,
      "description": "Internship - Web development and maintenance",
      "bullets": [
        "Built features for company's main product using React",
        "Fixed 50+ bugs in production code",
        "Participated in code reviews and technical discussions"
      ]
    }
  ]
}
```

### 10.8 Employment Preferences Request (Step 2)
```json
{
  "employment_preferences": {
    "employment_types": ["Full-time", "Contract"],
    "work_modes": ["Remote", "Hybrid"],
    "salary_expectation_min": 100000,
    "salary_expectation_max": 150000,
    "currency": "USD",
    "job_titles_interested": [
      "Full-Stack Engineer",
      "Backend Engineer",
      "Tech Lead"
    ],
    "industries": [
      "Technology",
      "FinTech",
      "E-commerce"
    ],
    "preferred_company_size": "Startup",
    "job_functions": [
      "Software Development",
      "Architecture",
      "Technical Leadership"
    ]
  }
}
```

### 10.9 Verify Email Request
```json
{
  "email": "newcandidate@example.com",
  "verification_code": "123456"
}
```

### 10.10 Verify Email Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Email verified successfully",
  "data": {
    "id": "candidate-001",
    "email": "newcandidate@example.com",
    "email_verified": true,
    "email_verified_at": "2024-10-24T10:35:00Z"
  }
}
```

### 10.11 Resend Verification Email Request
```json
{
  "email": "newcandidate@example.com"
}
```

### 10.12 Proficiency Levels
```json
{
  "proficiency_levels": [
    "Beginner",
    "Intermediate",
    "Advanced",
    "Expert"
  ]
}
```

### 10.13 Employment Types (For Preferences)
```json
{
  "employment_types": [
    "Full-time",
    "Contract",
    "Freelance",
    "Part-time",
    "Temporary"
  ]
}
```

### 10.14 Work Modes (For Preferences)
```json
{
  "work_modes": [
    "Remote",
    "Hybrid",
    "On-site"
  ]
}
```

### 10.15 Company Sizes
```json
{
  "company_sizes": [
    "Startup (1-50)",
    "Small (51-500)",
    "Medium (501-5000)",
    "Large (5000+)"
  ]
}
```

---

## 11. Job Management (HR View)

### 11.1 Job Status Model
```json
{
  "id": "job-001",
  "title": "Senior Full-Stack Engineer",
  "department": "Engineering",
  "created_date": "Oct 24, 2024",
  "created_at": 1729700000000,
  "approval_status": "Pending",
  "applications_count": 45
}
```

### 11.2 Job Management Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Jobs retrieved successfully",
  "data": {
    "jobs": [
      {
        "id": "job-001",
        "title": "Senior Full-Stack Engineer",
        "department": "Engineering",
        "created_date": "Oct 24, 2024",
        "approval_status": "Pending",
        "applications_count": 45
      }
    ],
    "total": 12,
    "page": 1,
    "limit": 10
  }
}
```

---

## 12. Enums & Constants

### 12.1 Employment Types
```json
{
  "employment_types": [
    "Full-time",
    "Contract",
    "Freelance",
    "Part-time"
  ]
}
```

### 12.2 Work Modes
```json
{
  "work_modes": [
    "Remote",
    "Hybrid",
    "On-site"
  ]
}
```

### 12.3 Application Statuses
```json
{
  "application_statuses": [
    "Applied",
    "Under Review",
    "Interviewing",
    "Offered",
    "Rejected",
    "Withdrawn"
  ]
}
```

### 12.4 Interview Statuses
```json
{
  "interview_statuses": [
    "Confirmed",
    "Completed",
    "Rescheduled",
    "Cancelled"
  ]
}
```

### 12.5 Interview Modes
```json
{
  "interview_modes": [
    "video",
    "in_person",
    "phone"
  ]
}
```

### 12.6 Job Approval Status
```json
{
  "approval_statuses": [
    "Draft",
    "Pending",
    "Approved",
    "Rejected"
  ]
}
```

### 12.7 Departments
```json
{
  "departments": [
    "Engineering",
    "Product",
    "Design",
    "Marketing",
    "Sales",
    "Operations",
    "HR"
  ]
}
```

### 12.8 Currencies
```json
{
  "currencies": [
    "USD",
    "EUR",
    "GBP",
    "JPY",
    "VND",
    "AUD",
    "CAD"
  ]
}
```

---

## 13. Summary of Endpoints Expected

### Authentication
- `POST /auth/login` - Candidate/HR login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh access token

### Jobs
- `GET /jobs` - Get all jobs (with filters)
- `POST /jobs` - Create new job (HR only)
- `GET /jobs/{id}` - Get job details
- `PUT /jobs/{id}` - Update job
- `DELETE /jobs/{id}` - Delete job (HR only)
- `GET /jobs/{id}/applications` - Get applications for a job

### Candidates
- `POST /auth/register` - Candidate registration
- `GET /candidates/{id}` - Get candidate profile
- `PUT /candidates/{id}` - Update candidate profile
- `GET /candidates/{id}/experience` - Get experience history
- `POST /candidates/{id}/experience` - Add experience
- `PUT /candidates/{id}/experience/{expId}` - Update experience
- `DELETE /candidates/{id}/experience/{expId}` - Delete experience
- `GET /candidates/{id}/skills` - Get skills
- `PUT /candidates/{id}/skills` - Update skills

### Applications
- `POST /applications` - Apply for job
- `GET /applications` - Get user's applications (candidate)
- `GET /jobs/{jobId}/applications` - Get job applications (HR)
- `PUT /applications/{id}` - Update application status
- `GET /applications/{id}` - Get application details
- `DELETE /applications/{id}` - Withdraw application

### Interviews
- `GET /interviews` - Get scheduled interviews
- `POST /interviews` - Schedule interview (HR only)
- `PUT /interviews/{id}` - Update interview
- `DELETE /interviews/{id}` - Cancel interview (HR only)
- `GET /interviews/{id}` - Get interview details

### Dashboard
- `GET /dashboard/hr` - Get HR dashboard data
- `GET /dashboard/candidate` - Get candidate dashboard data

### Interviewers
- `GET /users/interviewers` - Get available interviewers
- `GET /users/{id}/availability` - Get interviewer availability
