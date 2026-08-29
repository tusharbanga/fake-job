from app.services.matching import match_resume


def test_matches_ai_extracted_networking_skills_not_in_generic_list():
    # BGP/OSPF/SDN/Cisco/TCP-IP are not in the old hardcoded MATCHABLE_TERMS
    # list at all — this proves matching now relies on job_skills, not it.
    job_skills = ["BGP", "OSPF", "SDN", "Cisco", "TCP/IP"]
    resume_text = "Configured BGP peering and deployed Cisco routers for enterprise networks."

    result = match_resume("Network Engineer role", resume_text, job_skills)

    assert result["matched_keywords"] == ["BGP", "Cisco"]
    assert set(result["missing_keywords"]) == {"OSPF", "SDN", "TCP/IP"}
    assert result["matched_count"] == 2


def test_partial_match_reports_missing_skill():
    job_skills = ["Python", "FastAPI", "PostgreSQL"]
    resume_text = "5 years of Python and PostgreSQL experience building backend services."

    result = match_resume("Backend Engineer role", resume_text, job_skills)

    assert "FastAPI" in result["missing_keywords"]
    assert set(result["matched_keywords"]) == {"Python", "PostgreSQL"}


def test_no_matching_skills_reports_all_missing_and_zero_score():
    job_skills = ["Kotlin", "Android", "Jetpack Compose"]
    resume_text = "Experienced iOS developer skilled in Swift and SwiftUI."

    result = match_resume("Android Engineer role", resume_text, job_skills)

    assert result["matched_keywords"] == []
    assert set(result["missing_keywords"]) == {"Kotlin", "Android", "Jetpack Compose"}
    assert result["score"] == 0


def test_full_match_scores_100():
    job_skills = ["React", "TypeScript"]
    resume_text = "Frontend engineer with React and TypeScript experience."

    result = match_resume("Frontend Engineer role", resume_text, job_skills)

    assert set(result["matched_keywords"]) == {"React", "TypeScript"}
    assert result["missing_keywords"] == []
    assert result["score"] == 100


def test_generic_noise_terms_never_become_job_skills_for_matching():
    # normalize_skills() in groq_service.py is responsible for filtering
    # noise like "communication skills" / "team player" / "degree" out of
    # groq["job"]["skills"] before it ever reaches match_resume. This test
    # documents that match_resume only ever sees the already-filtered list.
    job_skills = ["Java", "Spring Boot"]
    resume_text = "Java developer, strong team player with excellent communication skills and a degree."

    result = match_resume("Java Developer role", resume_text, job_skills)

    for noise in ("communication skills", "team player", "degree", "experience"):
        assert noise not in [k.lower() for k in result["matched_keywords"]]
        assert noise not in [k.lower() for k in result["missing_keywords"]]
    assert result["matched_keywords"] == ["Java"]
    assert result["missing_keywords"] == ["Spring Boot"]


def test_empty_ai_skills_falls_back_instead_of_crashing():
    # groq["job"]["skills"] == [] — must not crash, and must not silently
    # score 0/0 as if it were a perfect or undefined match.
    job_text = "We need a Python developer with AWS and Docker experience."
    resume_text = "Skilled Python developer with AWS and Docker background."

    result = match_resume(job_text, resume_text, [])

    assert result["score"] >= 0
    assert isinstance(result["matched_keywords"], list)
    assert isinstance(result["missing_keywords"], list)
    # Falls back to the known-terms list scanned against the job text itself.
    assert "python" in result["matched_keywords"]


def test_matching_is_case_and_punctuation_insensitive():
    job_skills = ["Node.js", "C++", "REST APIs"]
    resume_text = "Built services in NODE JS and C++ , integrating rest apis."

    result = match_resume("Backend role", resume_text, job_skills)

    # Readable labels from job_skills are preserved in the output even
    # though the resume used different casing/punctuation.
    assert set(result["matched_keywords"]) == {"Node.js", "C++", "REST APIs"}
    assert result["missing_keywords"] == []


def test_duplicate_job_skills_are_deduplicated():
    job_skills = ["Python", "python", "  Python  ", "AWS"]
    resume_text = "Experienced with Python and AWS."

    result = match_resume("role", resume_text, job_skills)

    assert result["matched_count"] == 2
    assert result["matched_keywords"] == ["Python", "AWS"]
