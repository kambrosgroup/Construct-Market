"""
ConstructMarket API Tests
Tests for: Authentication, Tasks, Bids, Contracts, Notifications, Admin Panel
"""

import pytest
import requests
import os
import uuid

# Base URL from environment - IMPORTANT: uses trailing slashes for routes
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_endpoint(self):
        """Test that the health endpoint is working"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ Health check passed")


class TestAuthentication:
    """Authentication flow tests - Signup and Login"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup unique email for each test to avoid conflicts"""
        self.unique_id = uuid.uuid4().hex[:8]
    
    def test_builder_signup(self):
        """Test builder user signup flow"""
        payload = {
            "email": f"TEST_builder_{self.unique_id}@test.com",
            "password": "Test123!",
            "first_name": "Test",
            "last_name": "Builder",
            "role": "builder",
            "phone": "0400000000",
            "company_name": f"TEST Builder Co {self.unique_id}",
            "company_type": "builder",
            "abn": "12345678901"
        }
        response = requests.post(f"{BASE_URL}/api/auth/signup", json=payload)
        assert response.status_code == 200, f"Signup failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["email"] == payload["email"]
        assert data["role"] == "builder"
        assert data.get("company_id") is not None
        print(f"✓ Builder signup successful: {data['email']}")
    
    def test_provider_signup(self):
        """Test provider user signup flow"""
        payload = {
            "email": f"TEST_provider_{self.unique_id}@test.com",
            "password": "Test123!",
            "first_name": "Test",
            "last_name": "Provider",
            "role": "provider",
            "phone": "0400000001",
            "company_name": f"TEST Provider Co {self.unique_id}",
            "company_type": "provider",
            "abn": "12345678902"
        }
        response = requests.post(f"{BASE_URL}/api/auth/signup", json=payload)
        assert response.status_code == 200, f"Signup failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["role"] == "provider"
        print(f"✓ Provider signup successful: {data['email']}")
    
    def test_login_with_valid_credentials(self):
        """Test login with the provided test builder account"""
        payload = {
            "email": "builder@test.com",
            "password": "Test123!"
        }
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        # First check if user exists, if not create it
        if response.status_code == 401:
            # User may not exist, create it
            signup_payload = {
                "email": "builder@test.com",
                "password": "Test123!",
                "first_name": "Test",
                "last_name": "Builder",
                "role": "builder",
                "company_name": "Test Builder Company",
                "company_type": "builder"
            }
            signup_resp = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_payload)
            if signup_resp.status_code == 200:
                response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["email"] == payload["email"]
        print(f"✓ Login successful for: {data['email']}")
    
    def test_login_with_invalid_credentials(self):
        """Test login with invalid credentials returns 401"""
        payload = {
            "email": "nonexistent@test.com",
            "password": "WrongPassword123!"
        }
        response = requests.post(f"{BASE_URL}/api/auth/login", json=payload)
        assert response.status_code == 401
        print("✓ Invalid credentials correctly rejected")
    
    def test_signup_duplicate_email(self):
        """Test that duplicate email signup returns error"""
        # First signup
        payload = {
            "email": f"TEST_duplicate_{self.unique_id}@test.com",
            "password": "Test123!",
            "first_name": "Test",
            "last_name": "User",
            "role": "builder",
            "company_name": f"TEST Duplicate Co {self.unique_id}",
            "company_type": "builder"
        }
        response1 = requests.post(f"{BASE_URL}/api/auth/signup", json=payload)
        assert response1.status_code == 200
        
        # Second signup with same email should fail
        response2 = requests.post(f"{BASE_URL}/api/auth/signup", json=payload)
        assert response2.status_code == 400
        print("✓ Duplicate email correctly rejected")


class TestTaskWorkflow:
    """Task creation and management tests"""
    
    @pytest.fixture
    def builder_auth(self):
        """Get authentication token for builder"""
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "email": f"TEST_builder_task_{unique_id}@test.com",
            "password": "Test123!",
            "first_name": "Task",
            "last_name": "Builder",
            "role": "builder",
            "company_name": f"TEST Task Builder Co {unique_id}",
            "company_type": "builder"
        }
        response = requests.post(f"{BASE_URL}/api/auth/signup", json=payload)
        assert response.status_code == 200
        return response.json()["token"]
    
    def test_create_task(self, builder_auth):
        """Test task creation by builder"""
        headers = {"Authorization": f"Bearer {builder_auth}"}
        task_payload = {
            "title": "TEST Concrete Pour 150m²",
            "description": "Need concrete pour for residential slab",
            "category": "concrete",
            "scope": "Full concrete pour including finishing",
            "budget_min": 5000,
            "budget_max": 8000,
            "location_city": "Melbourne",
            "location_state": "VIC",
            "location_postcode": "3000",
            "preferred_timeline": "week_2"
        }
        response = requests.post(f"{BASE_URL}/api/tasks/", json=task_payload, headers=headers)
        assert response.status_code == 200, f"Task creation failed: {response.text}"
        data = response.json()
        assert data["title"] == task_payload["title"]
        assert data["status"] == "draft"
        assert data.get("task_id") is not None
        print(f"✓ Task created: {data['task_id']}")
        return data
    
    def test_publish_task(self, builder_auth):
        """Test task publishing flow"""
        headers = {"Authorization": f"Bearer {builder_auth}"}
        # Create task first
        task_payload = {
            "title": "TEST Task to Publish",
            "description": "Task that will be published",
            "category": "electrical"
        }
        create_resp = requests.post(f"{BASE_URL}/api/tasks/", json=task_payload, headers=headers)
        assert create_resp.status_code == 200
        task_id = create_resp.json()["task_id"]
        
        # Publish task
        publish_resp = requests.put(f"{BASE_URL}/api/tasks/{task_id}", json={"status": "posted"}, headers=headers)
        assert publish_resp.status_code == 200
        data = publish_resp.json()
        assert data["status"] == "posted"
        assert data.get("posted_at") is not None
        print(f"✓ Task published: {task_id}")
    
    def test_list_tasks(self, builder_auth):
        """Test listing tasks"""
        headers = {"Authorization": f"Bearer {builder_auth}"}
        response = requests.get(f"{BASE_URL}/api/tasks/", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Tasks listed: {len(data)} tasks")
    
    def test_get_task_by_id(self, builder_auth):
        """Test getting task by ID"""
        headers = {"Authorization": f"Bearer {builder_auth}"}
        # Create task first
        task_payload = {
            "title": "TEST Task to Get",
            "description": "Task to fetch by ID",
            "category": "plumbing"
        }
        create_resp = requests.post(f"{BASE_URL}/api/tasks/", json=task_payload, headers=headers)
        assert create_resp.status_code == 200
        task_id = create_resp.json()["task_id"]
        
        # Get task
        get_resp = requests.get(f"{BASE_URL}/api/tasks/{task_id}", headers=headers)
        assert get_resp.status_code == 200
        data = get_resp.json()
        assert data["task_id"] == task_id
        assert data["title"] == task_payload["title"]
        print(f"✓ Task retrieved: {task_id}")


class TestBiddingWorkflow:
    """Bidding workflow tests"""
    
    @pytest.fixture
    def setup_bidding_scenario(self):
        """Setup builder with published task and provider"""
        unique_id = uuid.uuid4().hex[:8]
        
        # Create builder and task
        builder_payload = {
            "email": f"TEST_builder_bid_{unique_id}@test.com",
            "password": "Test123!",
            "first_name": "Bid",
            "last_name": "Builder",
            "role": "builder",
            "company_name": f"TEST Bid Builder Co {unique_id}",
            "company_type": "builder"
        }
        builder_resp = requests.post(f"{BASE_URL}/api/auth/signup", json=builder_payload)
        assert builder_resp.status_code == 200
        builder_token = builder_resp.json()["token"]
        
        # Create and publish task
        task_payload = {
            "title": f"TEST Task for Bidding {unique_id}",
            "description": "Task open for bidding",
            "category": "roofing",
            "budget_min": 10000,
            "budget_max": 15000
        }
        headers = {"Authorization": f"Bearer {builder_token}"}
        task_resp = requests.post(f"{BASE_URL}/api/tasks/", json=task_payload, headers=headers)
        assert task_resp.status_code == 200
        task_id = task_resp.json()["task_id"]
        
        # Publish task
        requests.put(f"{BASE_URL}/api/tasks/{task_id}", json={"status": "posted"}, headers=headers)
        
        # Create provider
        provider_payload = {
            "email": f"TEST_provider_bid_{unique_id}@test.com",
            "password": "Test123!",
            "first_name": "Bid",
            "last_name": "Provider",
            "role": "provider",
            "company_name": f"TEST Bid Provider Co {unique_id}",
            "company_type": "provider"
        }
        provider_resp = requests.post(f"{BASE_URL}/api/auth/signup", json=provider_payload)
        assert provider_resp.status_code == 200
        provider_token = provider_resp.json()["token"]
        
        return {
            "builder_token": builder_token,
            "provider_token": provider_token,
            "task_id": task_id,
            "unique_id": unique_id
        }
    
    def test_provider_submit_bid(self, setup_bidding_scenario):
        """Test provider submitting a bid"""
        data = setup_bidding_scenario
        headers = {"Authorization": f"Bearer {data['provider_token']}"}
        
        bid_payload = {
            "task_id": data["task_id"],
            "amount": 12000,
            "description": "Professional roofing service",
            "timeline_days": 14,
            "team_size": 4,
            "materials_included": "All roofing materials"
        }
        response = requests.post(f"{BASE_URL}/api/bids/", json=bid_payload, headers=headers)
        assert response.status_code == 200, f"Bid submission failed: {response.text}"
        bid_data = response.json()
        assert bid_data["amount"] == 12000
        assert bid_data["status"] == "submitted"
        assert bid_data.get("bid_id") is not None
        print(f"✓ Bid submitted: {bid_data['bid_id']}")
    
    def test_builder_view_bids(self, setup_bidding_scenario):
        """Test builder viewing bids on their task"""
        data = setup_bidding_scenario
        
        # Provider submits bid
        provider_headers = {"Authorization": f"Bearer {data['provider_token']}"}
        bid_payload = {
            "task_id": data["task_id"],
            "amount": 11500,
            "description": "Quality roofing work",
            "timeline_days": 10
        }
        requests.post(f"{BASE_URL}/api/bids/", json=bid_payload, headers=provider_headers)
        
        # Builder views bids
        builder_headers = {"Authorization": f"Bearer {data['builder_token']}"}
        response = requests.get(f"{BASE_URL}/api/bids/?task_id={data['task_id']}", headers=builder_headers)
        assert response.status_code == 200
        bids = response.json()
        assert isinstance(bids, list)
        assert len(bids) >= 1
        print(f"✓ Builder can view bids: {len(bids)} bids")
    
    def test_builder_select_bid(self, setup_bidding_scenario):
        """Test builder selecting a bid"""
        data = setup_bidding_scenario
        
        # Provider submits bid
        provider_headers = {"Authorization": f"Bearer {data['provider_token']}"}
        bid_payload = {
            "task_id": data["task_id"],
            "amount": 13000,
            "description": "Premium roofing service",
            "timeline_days": 7
        }
        bid_resp = requests.post(f"{BASE_URL}/api/bids/", json=bid_payload, headers=provider_headers)
        assert bid_resp.status_code == 200
        bid_id = bid_resp.json()["bid_id"]
        
        # Builder selects bid
        builder_headers = {"Authorization": f"Bearer {data['builder_token']}"}
        select_resp = requests.put(f"{BASE_URL}/api/bids/{bid_id}", json={"status": "selected"}, headers=builder_headers)
        assert select_resp.status_code == 200
        selected_bid = select_resp.json()
        assert selected_bid["status"] == "selected"
        assert selected_bid.get("selected_at") is not None
        print(f"✓ Bid selected: {bid_id}")


class TestContractWorkflow:
    """Contract creation and e-signature tests"""
    
    @pytest.fixture
    def setup_contract_scenario(self):
        """Setup complete scenario with selected bid"""
        unique_id = uuid.uuid4().hex[:8]
        
        # Create builder
        builder_payload = {
            "email": f"TEST_builder_contract_{unique_id}@test.com",
            "password": "Test123!",
            "first_name": "Contract",
            "last_name": "Builder",
            "role": "builder",
            "company_name": f"TEST Contract Builder Co {unique_id}",
            "company_type": "builder"
        }
        builder_resp = requests.post(f"{BASE_URL}/api/auth/signup", json=builder_payload)
        builder_token = builder_resp.json()["token"]
        
        # Create task
        task_payload = {
            "title": f"TEST Contract Task {unique_id}",
            "description": "Task for contract testing",
            "category": "painting",
            "budget_fixed": 5000
        }
        builder_headers = {"Authorization": f"Bearer {builder_token}"}
        task_resp = requests.post(f"{BASE_URL}/api/tasks/", json=task_payload, headers=builder_headers)
        task_id = task_resp.json()["task_id"]
        
        # Publish task
        requests.put(f"{BASE_URL}/api/tasks/{task_id}", json={"status": "posted"}, headers=builder_headers)
        
        # Create provider
        provider_payload = {
            "email": f"TEST_provider_contract_{unique_id}@test.com",
            "password": "Test123!",
            "first_name": "Contract",
            "last_name": "Provider",
            "role": "provider",
            "company_name": f"TEST Contract Provider Co {unique_id}",
            "company_type": "provider"
        }
        provider_resp = requests.post(f"{BASE_URL}/api/auth/signup", json=provider_payload)
        provider_token = provider_resp.json()["token"]
        
        # Submit bid
        provider_headers = {"Authorization": f"Bearer {provider_token}"}
        bid_payload = {
            "task_id": task_id,
            "amount": 4500,
            "description": "Professional painting",
            "timeline_days": 5
        }
        bid_resp = requests.post(f"{BASE_URL}/api/bids/", json=bid_payload, headers=provider_headers)
        bid_id = bid_resp.json()["bid_id"]
        
        # Select bid
        requests.put(f"{BASE_URL}/api/bids/{bid_id}", json={"status": "selected"}, headers=builder_headers)
        
        return {
            "builder_token": builder_token,
            "provider_token": provider_token,
            "task_id": task_id,
            "bid_id": bid_id
        }
    
    def test_create_contract(self, setup_contract_scenario):
        """Test contract creation from selected bid"""
        data = setup_contract_scenario
        headers = {"Authorization": f"Bearer {data['builder_token']}"}
        
        contract_payload = {
            "task_id": data["task_id"],
            "bid_id": data["bid_id"],
            "start_date": "2026-02-01",
            "end_date": "2026-02-10",
            "payment_terms": "50% upfront, 50% on completion",
            "defects_liability_months": 12
        }
        response = requests.post(f"{BASE_URL}/api/contracts/", json=contract_payload, headers=headers)
        assert response.status_code == 200, f"Contract creation failed: {response.text}"
        contract = response.json()
        assert contract.get("contract_id") is not None
        assert contract["status"] == "draft"
        assert contract.get("html_body") is not None  # Contract HTML generated
        print(f"✓ Contract created: {contract['contract_id']}")
        return contract["contract_id"]
    
    def test_builder_sign_contract(self, setup_contract_scenario):
        """Test builder signing contract"""
        data = setup_contract_scenario
        builder_headers = {"Authorization": f"Bearer {data['builder_token']}"}
        
        # Create contract
        contract_payload = {
            "task_id": data["task_id"],
            "bid_id": data["bid_id"],
            "start_date": "2026-02-01",
            "end_date": "2026-02-10"
        }
        contract_resp = requests.post(f"{BASE_URL}/api/contracts/", json=contract_payload, headers=builder_headers)
        contract_id = contract_resp.json()["contract_id"]
        
        # Builder signs
        sign_resp = requests.post(f"{BASE_URL}/api/contracts/{contract_id}/sign", headers=builder_headers)
        assert sign_resp.status_code == 200
        signed = sign_resp.json()
        # API returns status message, not full contract
        assert signed["status"] == "signed_by_builder"
        assert "message" in signed or "builder_signed_at" in signed
        print(f"✓ Builder signed contract: {contract_id}")
    
    def test_full_signature_flow(self, setup_contract_scenario):
        """Test complete e-signature flow (both parties sign)"""
        data = setup_contract_scenario
        builder_headers = {"Authorization": f"Bearer {data['builder_token']}"}
        provider_headers = {"Authorization": f"Bearer {data['provider_token']}"}
        
        # Create contract
        contract_payload = {
            "task_id": data["task_id"],
            "bid_id": data["bid_id"],
            "start_date": "2026-02-01",
            "end_date": "2026-02-10"
        }
        contract_resp = requests.post(f"{BASE_URL}/api/contracts/", json=contract_payload, headers=builder_headers)
        contract_id = contract_resp.json()["contract_id"]
        
        # Builder signs first
        requests.post(f"{BASE_URL}/api/contracts/{contract_id}/sign", headers=builder_headers)
        
        # Provider signs
        sign_resp = requests.post(f"{BASE_URL}/api/contracts/{contract_id}/sign", headers=provider_headers)
        assert sign_resp.status_code == 200
        signed = sign_resp.json()
        assert signed["status"] == "fully_executed"
        # API returns status message, verify via GET
        get_resp = requests.get(f"{BASE_URL}/api/contracts/{contract_id}", headers=builder_headers)
        assert get_resp.status_code == 200
        contract_data = get_resp.json()
        assert contract_data.get("builder_signed_at") is not None
        assert contract_data.get("provider_signed_at") is not None
        print(f"✓ Contract fully executed: {contract_id}")


class TestNotifications:
    """Notification tests"""
    
    @pytest.fixture
    def authenticated_user(self):
        """Get authenticated user"""
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "email": f"TEST_notif_{unique_id}@test.com",
            "password": "Test123!",
            "first_name": "Notif",
            "last_name": "User",
            "role": "builder",
            "company_name": f"TEST Notif Co {unique_id}",
            "company_type": "builder"
        }
        response = requests.post(f"{BASE_URL}/api/auth/signup", json=payload)
        return response.json()["token"]
    
    def test_get_notifications(self, authenticated_user):
        """Test retrieving notifications"""
        headers = {"Authorization": f"Bearer {authenticated_user}"}
        response = requests.get(f"{BASE_URL}/api/notifications/", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Notifications retrieved: {len(data)} notifications")
    
    def test_get_unread_count(self, authenticated_user):
        """Test getting unread notification count"""
        headers = {"Authorization": f"Bearer {authenticated_user}"}
        response = requests.get(f"{BASE_URL}/api/notifications/unread-count", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "count" in data
        print(f"✓ Unread count: {data['count']}")


class TestAdminPanel:
    """Admin panel tests"""
    
    @pytest.fixture
    def admin_auth(self):
        """Get admin authentication token"""
        # Try login first
        login_payload = {
            "email": "admin@constructmarket.com",
            "password": "Admin123!"
        }
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json=login_payload)
        
        if login_resp.status_code == 200:
            return login_resp.json()["token"]
        
        # Create admin if doesn't exist
        unique_id = uuid.uuid4().hex[:8]
        signup_payload = {
            "email": f"TEST_admin_{unique_id}@test.com",
            "password": "Admin123!",
            "first_name": "Test",
            "last_name": "Admin",
            "role": "admin"
        }
        signup_resp = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_payload)
        if signup_resp.status_code == 200:
            return signup_resp.json()["token"]
        
        pytest.skip("Could not create admin user")
    
    def test_admin_dashboard_stats(self, admin_auth):
        """Test admin dashboard statistics endpoint"""
        headers = {"Authorization": f"Bearer {admin_auth}"}
        response = requests.get(f"{BASE_URL}/api/admin/dashboard", headers=headers)
        assert response.status_code == 200, f"Admin dashboard failed: {response.text}"
        data = response.json()
        # Dashboard returns nested structure
        assert "users" in data
        assert "companies" in data
        assert "tasks" in data
        assert "contracts" in data
        print(f"✓ Admin dashboard stats: {data['users']['total']} users, {data['companies']['total']} companies")
    
    def test_admin_list_users(self, admin_auth):
        """Test admin listing all users"""
        headers = {"Authorization": f"Bearer {admin_auth}"}
        response = requests.get(f"{BASE_URL}/api/admin/users", headers=headers)
        assert response.status_code == 200
        data = response.json()
        # Admin users endpoint returns wrapped object with total and users array
        assert "users" in data
        assert "total" in data
        assert isinstance(data["users"], list)
        print(f"✓ Admin users list: {data['total']} users")
    
    def test_admin_list_companies(self, admin_auth):
        """Test admin listing all companies"""
        headers = {"Authorization": f"Bearer {admin_auth}"}
        response = requests.get(f"{BASE_URL}/api/admin/companies", headers=headers)
        assert response.status_code == 200
        data = response.json()
        # Admin companies endpoint returns wrapped object with total and companies array
        assert "companies" in data
        assert "total" in data
        assert isinstance(data["companies"], list)
        print(f"✓ Admin companies list: {data['total']} companies")


class TestPayments:
    """Payment tests"""
    
    @pytest.fixture
    def authenticated_builder(self):
        """Get authenticated builder"""
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "email": f"TEST_pay_builder_{unique_id}@test.com",
            "password": "Test123!",
            "first_name": "Pay",
            "last_name": "Builder",
            "role": "builder",
            "company_name": f"TEST Pay Co {unique_id}",
            "company_type": "builder"
        }
        response = requests.post(f"{BASE_URL}/api/auth/signup", json=payload)
        return response.json()["token"]
    
    def test_list_payments(self, authenticated_builder):
        """Test listing payments"""
        headers = {"Authorization": f"Bearer {authenticated_builder}"}
        response = requests.get(f"{BASE_URL}/api/payments/", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Payments listed: {len(data)} payments")


class TestProviderTaskFeed:
    """Provider task feed tests"""
    
    @pytest.fixture
    def provider_auth(self):
        """Get provider authentication"""
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "email": f"TEST_feed_provider_{unique_id}@test.com",
            "password": "Test123!",
            "first_name": "Feed",
            "last_name": "Provider",
            "role": "provider",
            "company_name": f"TEST Feed Provider Co {unique_id}",
            "company_type": "provider"
        }
        response = requests.post(f"{BASE_URL}/api/auth/signup", json=payload)
        return response.json()["token"]
    
    def test_provider_view_task_feed(self, provider_auth):
        """Test provider viewing available tasks"""
        headers = {"Authorization": f"Bearer {provider_auth}"}
        response = requests.get(f"{BASE_URL}/api/tasks/", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Provider should only see posted/bidding_open tasks
        for task in data:
            assert task["status"] in ["posted", "bidding_open"]
        print(f"✓ Provider task feed: {len(data)} available tasks")


class TestUserProfile:
    """User profile tests"""
    
    @pytest.fixture
    def authenticated_user(self):
        """Get authenticated user with token"""
        unique_id = uuid.uuid4().hex[:8]
        payload = {
            "email": f"TEST_profile_{unique_id}@test.com",
            "password": "Test123!",
            "first_name": "Profile",
            "last_name": "User",
            "role": "builder",
            "company_name": f"TEST Profile Co {unique_id}",
            "company_type": "builder"
        }
        response = requests.post(f"{BASE_URL}/api/auth/signup", json=payload)
        return response.json()["token"]
    
    def test_get_current_user(self, authenticated_user):
        """Test getting current user profile"""
        headers = {"Authorization": f"Bearer {authenticated_user}"}
        response = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "user_id" in data
        assert "email" in data
        assert "role" in data
        print(f"✓ User profile retrieved: {data['email']}")
    
    def test_update_user_profile(self, authenticated_user):
        """Test updating user profile"""
        headers = {"Authorization": f"Bearer {authenticated_user}"}
        update_payload = {
            "first_name": "Updated",
            "phone": "0412345678"
        }
        response = requests.put(f"{BASE_URL}/api/users/me", json=update_payload, headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert data["first_name"] == "Updated"
        print(f"✓ User profile updated")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
