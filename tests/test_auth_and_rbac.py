import pytest
import uuid
from fastapi.testclient import TestClient
from backend.main import app
from backend.models import User, Document
from backend.database import SessionLocal

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_user_registration_and_duplicate_check():
    unique_suffix = uuid.uuid4().hex[:6]
    test_email = f"sarah_{unique_suffix}@cyberdyne.io"
    
    # 1. Valid registration
    reg_payload = {
        "email": test_email,
        "full_name": "Sarah Connor",
        "password": "Password123!",
        "confirm_password": "Password123!"
    }
    res = client.post("/api/auth/register", json=reg_payload)
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user"]["email"] == test_email
    assert data["user"]["role"] == "user"

    # 2. Duplicate registration rejection
    res_dup = client.post("/api/auth/register", json=reg_payload)
    assert res_dup.status_code == 400
    assert "already exists" in res_dup.json()["detail"]

    # 3. Mismatched passwords rejection
    mismatch_payload = {
        "email": f"mismatch_{unique_suffix}@cyberdyne.io",
        "full_name": "Mismatch Tester",
        "password": "Password123!",
        "confirm_password": "DifferentPassword!"
    }
    res_mismatch = client.post("/api/auth/register", json=mismatch_payload)
    assert res_mismatch.status_code == 400

    # 4. Short password rejection (< 8 characters)
    short_payload = {
        "email": f"short_{unique_suffix}@cyberdyne.io",
        "full_name": "Short Password",
        "password": "short",
        "confirm_password": "short"
    }
    res_short = client.post("/api/auth/register", json=short_payload)
    assert res_short.status_code in [400, 422]

def test_user_login_and_token_validation():
    # Attempt login with invalid credentials
    invalid_login = client.post("/api/auth/login", json={
        "email": "developer@techdoc.ai",
        "password": "WrongPassword999!"
    })
    assert invalid_login.status_code == 401

    # Valid login for pre-provisioned demo user
    valid_login = client.post("/api/auth/login", json={
        "email": "developer@techdoc.ai",
        "password": "DemoPass123!"
    })
    assert valid_login.status_code == 200
    token_data = valid_login.json()
    assert "access_token" in token_data
    token = token_data["access_token"]

    # Validate session endpoint /api/auth/me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "developer@techdoc.ai"

def test_rbac_admin_vs_regular_user():
    # Login as regular user
    user_login = client.post("/api/auth/login", json={
        "email": "developer@techdoc.ai",
        "password": "DemoPass123!"
    })
    user_token = user_login.json()["access_token"]

    # Login as admin user
    admin_login = client.post("/api/auth/login", json={
        "email": "admin@techdoc.ai",
        "password": "AdminPass123!"
    })
    admin_token = admin_login.json()["access_token"]

    # 1. Regular user trying to access Admin Overview -> MUST RETURN 403 FORBIDDEN
    user_admin_attempt = client.get("/api/admin/overview", headers={"Authorization": f"Bearer {user_token}"})
    assert user_admin_attempt.status_code == 403
    assert "Administrative privileges required" in user_admin_attempt.json()["detail"]

    # 2. Regular user trying to list all users -> MUST RETURN 403 FORBIDDEN
    user_users_attempt = client.get("/api/admin/users", headers={"Authorization": f"Bearer {user_token}"})
    assert user_users_attempt.status_code == 403

    # 3. Admin accessing Admin Overview -> MUST SUCCEED (200 OK)
    admin_overview = client.get("/api/admin/overview", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_overview.status_code == 200
    overview_data = admin_overview.json()
    assert "total_users" in overview_data
    assert "total_documents" in overview_data
    assert overview_data["admin_users"] >= 1

    # 4. Admin listing all users -> MUST SUCCEED (200 OK)
    admin_users = client.get("/api/admin/users", headers={"Authorization": f"Bearer {admin_token}"})
    assert admin_users.status_code == 200
    assert isinstance(admin_users.json(), list)

def test_password_reset_workflow():
    # 1. Request password reset
    forgot_res = client.post("/api/auth/forgot-password", json={
        "email": "developer@techdoc.ai"
    })
    assert forgot_res.status_code == 200
    token = forgot_res.json().get("reset_token_dev")
    assert token is not None

    # 2. Reset password using token
    reset_res = client.post("/api/auth/reset-password", json={
        "token": token,
        "new_password": "NewDemoPassword123!",
        "confirm_password": "NewDemoPassword123!"
    })
    assert reset_res.status_code == 200

    # 3. Login with newly set password
    new_login = client.post("/api/auth/login", json={
        "email": "developer@techdoc.ai",
        "password": "NewDemoPassword123!"
    })
    assert new_login.status_code == 200

    # Reset back to default DemoPass123! so other tests stay consistent
    forgot_res2 = client.post("/api/auth/forgot-password", json={
        "email": "developer@techdoc.ai"
    })
    token2 = forgot_res2.json().get("reset_token_dev")
    client.post("/api/auth/reset-password", json={
        "token": token2,
        "new_password": "DemoPass123!",
        "confirm_password": "DemoPass123!"
    })

def test_multitenant_document_isolation():
    uid = uuid.uuid4().hex[:6]
    # Register User A
    user_a_res = client.post("/api/auth/register", json={
        "email": f"user_a_{uid}@tenant.com",
        "full_name": "User Alpha",
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    token_a = user_a_res.json()["access_token"]
    user_a_id = user_a_res.json()["user"]["id"]

    # Register User B
    user_b_res = client.post("/api/auth/register", json={
        "email": f"user_b_{uid}@tenant.com",
        "full_name": "User Beta",
        "password": "Password123!",
        "confirm_password": "Password123!"
    })
    token_b = user_b_res.json()["access_token"]

    # Directly create a private document owned by User A
    db = SessionLocal()
    try:
        private_doc = Document(
            user_id=user_a_id,
            filename=f"user_a_{uid}_private.txt",
            original_name="User_A_Proprietary_Design.txt",
            file_type="txt",
            file_size=512,
            status="completed"
        )
        db.add(private_doc)
        db.commit()
        db.refresh(private_doc)
        doc_id = private_doc.id
    finally:
        db.close()

    # User A should be able to view their own document
    view_a = client.get(f"/api/documents/{doc_id}", headers={"Authorization": f"Bearer {token_a}"})
    assert view_a.status_code == 200

    # User B attempting to view User A's document MUST BE 403 FORBIDDEN
    view_b = client.get(f"/api/documents/{doc_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert view_b.status_code == 403
    assert "Access denied" in view_b.json()["detail"]

    # User B attempting to delete User A's document MUST BE 403 FORBIDDEN
    del_b = client.delete(f"/api/documents/{doc_id}", headers={"Authorization": f"Bearer {token_b}"})
    assert del_b.status_code == 403
