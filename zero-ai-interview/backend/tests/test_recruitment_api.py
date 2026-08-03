def test_recruitment_crud_and_requirement_extraction(auth_client):
    company = auth_client.post(
        "/api/v1/companies",
        json={"name": "未来智能", "industry": "企业软件"},
    )
    assert company.status_code == 201

    job = auth_client.post(
        "/api/v1/job-postings",
        json={
            "company_id": company.json()["id"],
            "title": "大模型应用工程师",
            "source_text": "必须熟练 Python、PyTorch 和 RAG。熟悉 Agent 优先，有良好沟通能力。",
        },
    )
    assert job.status_code == 201

    extracted = auth_client.post(f"/api/v1/job-postings/{job.json()['id']}/extract")
    assert extracted.status_code == 200
    kinds = {item["kind"] for item in extracted.json()["requirements"]}
    assert "required" in kinds
    assert "preferred" in kinds

    listing = auth_client.get("/api/v1/job-postings?keyword=大模型&page=1&page_size=10")
    assert listing.status_code == 200
    assert listing.json()["total"] == 1
