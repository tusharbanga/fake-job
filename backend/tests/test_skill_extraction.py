from app.services.groq_service import extract_missing_job_fields, normalize_skills


def test_extract_missing_job_fields_handles_possessive_company_names():
    text = """
    Download POD Mobile Application.
    The posting advertises full-time Software Developer and Product Technical Analyst roles for ION Group's 2027 Leadership Development Program.
    """

    result = extract_missing_job_fields(text, {"title": "Not listed", "company": "Not listed", "salary": "Not listed"})

    assert result["company"] == "ION Group"
    assert result["title"] == "Product Technical Analyst"


def test_normalize_skills_removes_noise_and_duplicates():
    raw = [
        "Python",
        "python",
        "  SQL  ",
        "JavaScript",
        "Good to have: AWS",
        "B.Tech degree",
        "C++",
        "node.js",
        "node.js",
        "preferred",
        "-",
    ]

    skills = normalize_skills(raw)

    assert skills == ["Python", "SQL", "JavaScript", "AWS", "C++", "node.js"]


def test_normalize_skills_keeps_only_relevant_technical_terms():
    raw = ["Team player", "React", "TypeScript", "REST APIs", "Communication skills", "Docker"]

    skills = normalize_skills(raw)

    assert skills == ["React", "TypeScript", "REST APIs", "Docker"]


def test_extract_missing_job_fields_overrides_generic_app_title_and_company():
    text = """
    Download POD Mobile Application.
    The posting advertises full-time Product Technical Analyst and Software Developer roles for ION Group's 2027 Leadership Development Program.
    It specifies a remote work mode, CTC of ₹17.3 LPA (₹15 LPA fixed), and detailed eligibility criteria and selection steps.
    """

    result = extract_missing_job_fields(
        text,
        {
            "title": "Download POD Mobile Application.",
            "company": "Not listed",
            "location": "Not listed",
            "work_mode": "Not listed",
            "employment_type": "Not listed",
            "salary": "Not listed",
            "skills": [],
        },
    )

    assert result["company"] == "ION Group"
    assert result["title"] == "Software Developer"
    assert result["work_mode"] == "Remote"
    assert result["employment_type"] == "Full-time"
    assert result["salary"] == "₹17.3 LPA"


def test_normalize_skills_keeps_broad_engineering_terms():
    raw = [
        "Computer Engineering",
        "Data Structures",
        "Algorithms",
        "Operating Systems",
        "Computer Networks",
        "DBMS",
        "C++",
        "Java",
        "Python",
        "SQL",
        "Docker",
        "Communication skills",
        "Team player",
    ]

    skills = normalize_skills(raw)

    assert "Computer Engineering" in skills
    assert "Data Structures" in skills
    assert "Algorithms" in skills
    assert "Operating Systems" in skills
    assert "Computer Networks" in skills
    assert "DBMS" in skills
    assert "Java" in skills
    assert "Python" in skills
    assert "SQL" in skills
    assert "Docker" in skills
    assert "Communication skills" not in skills
    assert "Team player" not in skills


def test_normalize_skills_keeps_networking_and_sdn_keywords():
    raw = [
        "Networking",
        "Software Defined Networking",
        "SDN",
        "Distributed Architecture",
        "Control Plane",
        "Data Plane",
        "Management Plane",
        "Global Backbone",
        "Cloud Networking",
        "Network Infrastructure",
        "Communication skills",
    ]

    skills = normalize_skills(raw)

    assert "Networking" in skills
    assert "Software Defined Networking" in skills
    assert "SDN" in skills
    assert "Distributed Architecture" in skills
    assert "Control Plane" in skills
    assert "Data Plane" in skills
    assert "Management Plane" in skills
    assert "Global Backbone" in skills
    assert "Cloud Networking" in skills
    assert "Network Infrastructure" in skills
    assert "Communication skills" not in skills


def test_extract_missing_job_fields_prefers_google_header_over_generic_text():
    text = """
    ## Senior Technical Program Manager, Google Networking Technologies

    *corporate_fare*Google*place*Sunnyvale, CA, USA

    Minimum qualifications:
    - Bachelor's degree in a technical field, or equivalent practical experience.
    - 8 years of experience in program management.
    - Experience with software infrastructure.
    """

    result = extract_missing_job_fields(text, {"title": "Not listed", "company": "Not listed"})

    assert result["title"] == "Senior Technical Program Manager"
    assert result["company"] == "Google"
