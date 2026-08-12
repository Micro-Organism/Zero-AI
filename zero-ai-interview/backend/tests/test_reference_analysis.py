def test_analyze_reference_resume_extracts_skills_and_roadmap(auth_client):
    response = auth_client.post(
        "/api/v1/resumes/analyze",
        json={
            "title": "候选人",
            "summary": "AI 工程师",
            "source_text": "精通 Python，熟悉 PyTorch，负责 RAG 问答系统。\n- 检索准确率提升 30%",
        },
    )
    assert response.status_code == 200
    data = response.json()
    names = [item["name"] for item in data["skills"]]
    assert "Python" in names
    assert "PyTorch" in names
    assert "RAG" in names
    assert data["interview_roadmap"]
    assert all(item["levels"] for item in data["interview_roadmap"])
    assert data["highlights"] == ["检索准确率提升 30%"]


def test_import_reference_skills_creates_skills_once(auth_client):
    resume = auth_client.post(
        "/api/v1/resumes",
        json={"title": "参考候选人", "kind": "reference"},
    ).json()
    payload = {
        "skills": [
            {"name": "Python", "category": "编程"},
            {"name": "PyTorch", "category": "深度学习"},
        ]
    }
    first = auth_client.post(f"/api/v1/resumes/{resume['id']}/import-skills", json=payload)
    assert first.status_code == 200
    assert first.json()["created"] == ["Python", "PyTorch"]
    assert first.json()["skipped"] == []

    second = auth_client.post(
        f"/api/v1/resumes/{resume['id']}/import-skills",
        json={"skills": [{"name": "Python", "category": "编程"}]},
    )
    assert second.json()["created"] == []
    assert second.json()["skipped"] == ["Python"]

    skills = auth_client.get("/api/v1/skills").json()
    assert {item["name"] for item in skills["items"]} == {"Python", "PyTorch"}
