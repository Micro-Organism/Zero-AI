def _build_match(auth_client):
    auth_client.post(
        "/api/v1/skills",
        json={"name": "Python", "category": "编程", "level": 4, "evidence": "完成 FastAPI 项目"},
    )
    resume = auth_client.post(
        "/api/v1/resumes",
        json={"title": "主简历", "content": {"skill_names": ["Python", "FastAPI"]}},
    ).json()
    version = auth_client.post(f"/api/v1/resumes/{resume['id']}/versions", json={"note": "用于匹配"}).json()
    job = auth_client.post(
        "/api/v1/job-postings",
        json={"title": "AI 工程师", "source_text": "必须熟练 Python；熟悉 RAG 优先。"},
    ).json()
    auth_client.post(f"/api/v1/job-postings/{job['id']}/extract")
    return job, version


def test_matching_is_explainable_and_generates_targeted_resume(auth_client):
    job, version = _build_match(auth_client)
    created = auth_client.post(
        "/api/v1/matching-projects",
        json={"job_posting_id": job["id"], "resume_version_id": version["id"]},
    )
    assert created.status_code == 201
    assert 0 <= created.json()["total_score"] <= 100
    assert created.json()["score_breakdown"]

    targeted = auth_client.post(f"/api/v1/matching-projects/{created.json()['id']}/targeted-resume")
    assert targeted.status_code == 201
    assert targeted.json()["kind"] == "targeted"
    assert targeted.json()["source_matching_id"] == created.json()["id"]

    targeted_version = auth_client.post(
        f"/api/v1/resumes/{targeted.json()['id']}/versions",
        json={"note": "岗位定制版"},
    )
    assert targeted_version.status_code == 201
    snapshot = targeted_version.json()["snapshot"]
    assert snapshot["resume"]["title"] == "AI 工程师 - 定制简历"
    assert snapshot["skill_names"] == ["Python", "FastAPI"]
