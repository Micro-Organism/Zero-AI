def test_career_evidence_and_resume_version(auth_client):
    work = auth_client.post(
        "/api/v1/work-experiences",
        json={
            "company": "示例科技",
            "role": "Java 工程师",
            "description": "负责企业级系统与 AI 服务集成",
            "technologies": ["Java", "Spring Boot"],
            "achievements": ["交付核心服务"],
        },
    )
    assert work.status_code == 201

    skill = auth_client.post(
        "/api/v1/skills",
        json={"name": "Python", "category": "编程", "level": 3, "evidence": "AI 学习项目"},
    )
    assert skill.status_code == 201

    resume = auth_client.post(
        "/api/v1/resumes",
        json={
            "title": "人工智能工程师主简历",
            "summary": "Java 工程背景，向 Python AI 生态发展",
            "content": {"work_ids": [work.json()["id"]], "skill_ids": [skill.json()["id"]]},
        },
    )
    assert resume.status_code == 201

    version = auth_client.post(
        f"/api/v1/resumes/{resume.json()['id']}/versions",
        json={"note": "初始版本"},
    )
    assert version.status_code == 201
    assert version.json()["snapshot"]["resume"]["title"] == "人工智能工程师主简历"

    listing = auth_client.get("/api/v1/resumes?page=1&page_size=10")
    assert listing.status_code == 200
    assert listing.json()["total"] == 1


def test_resume_update_rejects_stale_version(auth_client):
    resume = auth_client.post("/api/v1/resumes", json={"title": "主简历"}).json()
    first = auth_client.put(
        f"/api/v1/resumes/{resume['id']}",
        json={"title": "主简历 v2", "version": resume["version"]},
    )
    assert first.status_code == 200

    stale = auth_client.put(
        f"/api/v1/resumes/{resume['id']}",
        json={"title": "冲突版本", "version": resume["version"]},
    )
    assert stale.status_code == 409
