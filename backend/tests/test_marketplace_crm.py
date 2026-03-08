"""
Backend tests for ConstructMarket - New Features
Tests for: Public Marketplace, CRM Dashboard, Provider Payouts
"""

import pytest
import requests
import os
import uuid

# Get BASE_URL from environment - PUBLIC URL
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL environment variable is not set")

# Test credentials from requirements
ADMIN_EMAIL = "admin@constructmarket.com"
ADMIN_PASSWORD = "Admin123!"
BUILDER_EMAIL = "builder@test.com"
BUILDER_PASSWORD = "Test123!"
PROVIDER_EMAIL = "provider@test.com"
PROVIDER_PASSWORD = "Test123!"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": ADMIN_EMAIL,
        "password": ADMIN_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    # If admin doesn't exist, try to create one
    print(f"Admin login failed: {response.status_code} - {response.text}")
    pytest.skip("Admin login failed - skipping admin tests")


@pytest.fixture(scope="module")
def builder_token():
    """Get builder authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": BUILDER_EMAIL,
        "password": BUILDER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    print(f"Builder login failed: {response.status_code} - {response.text}")
    pytest.skip("Builder login failed - skipping builder tests")


@pytest.fixture(scope="module")
def provider_token():
    """Get provider authentication token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": PROVIDER_EMAIL,
        "password": PROVIDER_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("token")
    print(f"Provider login failed: {response.status_code} - {response.text}")
    pytest.skip("Provider login failed - skipping provider tests")


# ===========================================
# PUBLIC MARKETPLACE TESTS (No Auth Required)
# ===========================================

class TestPublicMarketplace:
    """Test public marketplace endpoints - no auth required"""
    
    def test_marketplace_list_tasks_public(self):
        """Test public marketplace task listing - no authentication needed"""
        response = requests.get(f"{BASE_URL}/api/marketplace/tasks")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "tasks" in data, "Response should contain 'tasks' key"
        assert "total" in data, "Response should contain 'total' key"
        assert "categories" in data, "Response should contain 'categories' key"
        assert isinstance(data["tasks"], list), "'tasks' should be a list"
        print(f"[PASS] Marketplace list tasks - Total: {data['total']}, Categories: {len(data['categories'])}")
    
    def test_marketplace_filter_by_category(self):
        """Test marketplace filtering by category"""
        response = requests.get(f"{BASE_URL}/api/marketplace/tasks?category=concrete")
        assert response.status_code == 200, f"Category filter failed: {response.text}"
        
        data = response.json()
        # All returned tasks should be concrete category
        for task in data["tasks"]:
            assert task.get("category") == "concrete", f"Task has wrong category: {task.get('category')}"
        print(f"[PASS] Category filter works - {len(data['tasks'])} concrete tasks found")
    
    def test_marketplace_filter_by_state(self):
        """Test marketplace filtering by state"""
        response = requests.get(f"{BASE_URL}/api/marketplace/tasks?state=NSW")
        assert response.status_code == 200, f"State filter failed: {response.text}"
        print(f"[PASS] State filter works - {response.json()['total']} tasks in NSW")
    
    def test_marketplace_task_detail_invalid(self):
        """Test marketplace task detail with invalid ID returns 404"""
        response = requests.get(f"{BASE_URL}/api/marketplace/tasks/invalid_task_id_12345")
        assert response.status_code == 404, f"Expected 404 for invalid task, got {response.status_code}"
        print("[PASS] Invalid task ID returns 404")


# ===========================================
# CRM DASHBOARD TESTS (Admin Auth Required)
# ===========================================

class TestCRMDashboard:
    """Test CRM dashboard endpoints - admin authentication required"""
    
    def test_crm_dashboard_without_auth(self):
        """Test CRM dashboard requires authentication"""
        response = requests.get(f"{BASE_URL}/api/crm/dashboard")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("[PASS] CRM dashboard requires authentication")
    
    def test_crm_dashboard_with_admin(self, admin_token):
        """Test CRM dashboard with admin authentication"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/crm/dashboard", headers=headers)
        assert response.status_code == 200, f"CRM dashboard failed: {response.text}"
        
        data = response.json()
        assert "metrics" in data, "Response should contain 'metrics'"
        metrics = data["metrics"]
        
        # Check key metrics exist
        assert "total_revenue" in metrics, "Metrics should include total_revenue"
        assert "gmv" in metrics, "Metrics should include GMV"
        assert "active_customers" in metrics, "Metrics should include active_customers"
        assert "total_builders" in metrics, "Metrics should include total_builders"
        assert "total_providers" in metrics, "Metrics should include total_providers"
        assert "total_contracts" in metrics, "Metrics should include total_contracts"
        assert "conversion_rate" in metrics, "Metrics should include conversion_rate"
        assert "pipeline" in metrics, "Metrics should include pipeline"
        
        print(f"[PASS] CRM Dashboard - Revenue: ${metrics['total_revenue']:.2f}, GMV: ${metrics['gmv']:.2f}, Customers: {metrics['active_customers']}")
    
    def test_crm_dashboard_with_non_admin(self, builder_token):
        """Test CRM dashboard denied for non-admin users"""
        headers = {"Authorization": f"Bearer {builder_token}"}
        response = requests.get(f"{BASE_URL}/api/crm/dashboard", headers=headers)
        assert response.status_code == 403, f"Expected 403 for non-admin, got {response.status_code}"
        print("[PASS] CRM dashboard denies non-admin users")


class TestCRMCustomers:
    """Test CRM customer management endpoints"""
    
    def test_crm_customers_list(self, admin_token):
        """Test CRM customer listing"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/crm/customers", headers=headers)
        assert response.status_code == 200, f"CRM customers failed: {response.text}"
        
        data = response.json()
        assert "customers" in data, "Response should contain 'customers'"
        assert "total" in data, "Response should contain 'total'"
        print(f"[PASS] CRM Customers - Total: {data['total']}")
    
    def test_crm_customers_filter_by_role(self, admin_token):
        """Test CRM customer filtering by role"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/crm/customers?role=builder", headers=headers)
        assert response.status_code == 200, f"CRM customers role filter failed: {response.text}"
        
        data = response.json()
        for customer in data["customers"]:
            assert customer.get("role") == "builder", f"Customer has wrong role: {customer.get('role')}"
        print(f"[PASS] CRM Customers filter by role - {len(data['customers'])} builders")
    
    def test_crm_customers_pagination(self, admin_token):
        """Test CRM customer pagination"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/crm/customers?page=1&limit=5", headers=headers)
        assert response.status_code == 200, f"CRM customers pagination failed: {response.text}"
        
        data = response.json()
        assert len(data["customers"]) <= 5, "Pagination limit not respected"
        print(f"[PASS] CRM Customers pagination - Page 1 with limit 5")


class TestCRMPipeline:
    """Test CRM pipeline endpoints"""
    
    def test_crm_pipeline(self, admin_token):
        """Test CRM pipeline view"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/crm/pipeline", headers=headers)
        assert response.status_code == 200, f"CRM pipeline failed: {response.text}"
        
        data = response.json()
        assert "deals" in data, "Response should contain 'deals'"
        assert "stats" in data, "Response should contain 'stats'"
        
        # Check pipeline stages
        deals = data["deals"]
        expected_stages = ["lead", "contacted", "proposal", "negotiation", "won", "lost"]
        for stage in expected_stages:
            assert stage in deals, f"Pipeline should have stage '{stage}'"
        
        stats = data["stats"]
        assert "total_value" in stats, "Stats should include total_value"
        assert "win_rate" in stats, "Stats should include win_rate"
        assert "avg_deal_size" in stats, "Stats should include avg_deal_size"
        
        print(f"[PASS] CRM Pipeline - Total Value: ${stats['total_value']:.0f}, Win Rate: {stats['win_rate']}%")
    
    def test_crm_pipeline_filter(self, admin_token):
        """Test CRM pipeline time filter"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        for filter_type in ["all", "month", "quarter", "year"]:
            response = requests.get(f"{BASE_URL}/api/crm/pipeline?filter={filter_type}", headers=headers)
            assert response.status_code == 200, f"CRM pipeline filter {filter_type} failed: {response.text}"
        print("[PASS] CRM Pipeline - All time filters work")


class TestCRMRevenue:
    """Test CRM revenue analytics endpoints"""
    
    def test_crm_revenue(self, admin_token):
        """Test CRM revenue analytics"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/crm/revenue", headers=headers)
        assert response.status_code == 200, f"CRM revenue failed: {response.text}"
        
        data = response.json()
        # Check key revenue fields
        assert "total_revenue" in data, "Should include total_revenue"
        assert "platform_fees" in data, "Should include platform_fees"
        assert "gmv" in data, "Should include GMV"
        assert "avg_transaction" in data, "Should include avg_transaction"
        assert "by_category" in data, "Should include by_category breakdown"
        assert "monthly_trend" in data, "Should include monthly_trend"
        assert "top_customers" in data, "Should include top_customers"
        
        print(f"[PASS] CRM Revenue - Total: ${data['total_revenue']:.2f}, GMV: ${data['gmv']:.2f}")
    
    def test_crm_revenue_periods(self, admin_token):
        """Test CRM revenue with different time periods"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        for period in ["week", "month", "quarter", "year"]:
            response = requests.get(f"{BASE_URL}/api/crm/revenue?period={period}", headers=headers)
            assert response.status_code == 200, f"CRM revenue period {period} failed: {response.text}"
        print("[PASS] CRM Revenue - All periods work")


class TestCRMReports:
    """Test CRM reports endpoints"""
    
    def test_crm_list_reports(self, admin_token):
        """Test CRM reports listing"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/crm/reports", headers=headers)
        assert response.status_code == 200, f"CRM reports list failed: {response.text}"
        
        data = response.json()
        assert "reports" in data, "Should include 'reports' key"
        print("[PASS] CRM Reports list")
    
    def test_crm_generate_report(self, admin_token):
        """Test CRM report generation"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.post(
            f"{BASE_URL}/api/crm/reports/generate",
            headers=headers,
            json={"type": "executive", "period": "month"}
        )
        assert response.status_code == 200, f"CRM report generation failed: {response.text}"
        
        data = response.json()
        assert "title" in data, "Report should have title"
        assert "generated_at" in data, "Report should have generated_at"
        print(f"[PASS] CRM Report Generated - Title: {data['title']}")


# ===========================================
# PROVIDER PAYOUTS TESTS
# ===========================================

class TestProviderPayouts:
    """Test provider payout endpoints"""
    
    def test_provider_payouts_list(self, provider_token):
        """Test provider payouts listing"""
        headers = {"Authorization": f"Bearer {provider_token}"}
        response = requests.get(f"{BASE_URL}/api/provider/payouts", headers=headers)
        assert response.status_code == 200, f"Provider payouts failed: {response.text}"
        
        data = response.json()
        assert "payouts" in data, "Should include 'payouts'"
        assert "stats" in data, "Should include 'stats'"
        
        stats = data["stats"]
        assert "available" in stats, "Stats should include available balance"
        assert "pending" in stats, "Stats should include pending balance"
        assert "total" in stats, "Stats should include total earned"
        
        print(f"[PASS] Provider Payouts - Available: ${stats['available']:.2f}, Pending: ${stats['pending']:.2f}, Total: ${stats['total']:.2f}")
    
    def test_provider_payouts_non_provider_denied(self, builder_token):
        """Test provider payouts denied for non-providers"""
        headers = {"Authorization": f"Bearer {builder_token}"}
        response = requests.get(f"{BASE_URL}/api/provider/payouts", headers=headers)
        assert response.status_code == 403, f"Expected 403 for non-provider, got {response.status_code}"
        print("[PASS] Provider payouts denied for builders")
    
    def test_provider_stripe_status(self, provider_token):
        """Test provider Stripe status check"""
        headers = {"Authorization": f"Bearer {provider_token}"}
        response = requests.get(f"{BASE_URL}/api/provider/stripe-status", headers=headers)
        assert response.status_code == 200, f"Stripe status failed: {response.text}"
        
        data = response.json()
        assert "connected" in data, "Should include 'connected' status"
        print(f"[PASS] Provider Stripe Status - Connected: {data['connected']}")
    
    def test_provider_stripe_onboard(self, provider_token):
        """Test provider Stripe onboarding initiation"""
        headers = {"Authorization": f"Bearer {provider_token}"}
        response = requests.post(
            f"{BASE_URL}/api/provider/stripe-onboard",
            headers=headers,
            json={"return_url": "https://example.com/payouts"}
        )
        assert response.status_code == 200, f"Stripe onboard failed: {response.text}"
        
        data = response.json()
        assert "url" in data, "Should include onboarding 'url'"
        print("[PASS] Provider Stripe Onboarding - URL generated")


# ===========================================
# API HEALTH AND ROOT TESTS
# ===========================================

class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_root(self):
        """Test API root endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200, f"API root failed: {response.text}"
        data = response.json()
        assert "message" in data, "Root should have message"
        print(f"[PASS] API Root - Message: {data['message']}")
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"API health failed: {response.text}"
        data = response.json()
        assert data.get("status") == "healthy", "Health should be healthy"
        print("[PASS] API Health - Status: healthy")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
