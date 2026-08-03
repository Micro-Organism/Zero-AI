def test_text_upload_extracts_content_and_can_download(auth_client):
    uploaded = auth_client.post(
        "/api/v1/files",
        files={"file": ("job.md", "# AI 工程师\n熟练 Python", "text/markdown")},
    )
    assert uploaded.status_code == 201
    assert "熟练 Python" in uploaded.json()["extracted_text"]

    listing = auth_client.get("/api/v1/files?page=1&page_size=10")
    assert listing.json()["total"] == 1

    downloaded = auth_client.get(f"/api/v1/files/{uploaded.json()['id']}/download")
    assert downloaded.status_code == 200


def test_illegal_file_extension_is_rejected(auth_client):
    response = auth_client.post(
        "/api/v1/files",
        files={"file": ("malware.exe", b"bad", "application/octet-stream")},
    )
    assert response.status_code == 400
