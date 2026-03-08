"""
Test suite for ConstructMarket Enterprise Features:
- Two-Factor Authentication (2FA) - TOTP with QR code
- File Uploads - images/documents
- Work Diary Photo Upload
- Real-time Chat (rooms/messages)
- PDF Contract Export
- User Verification Badges
- Company Verification Status
- Admin Badge Award
- Push Notification Subscribe
"""

import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://construct-market-5.preview.emergentagent.com')

# Test credentials
BUILDER_CREDS = {"email": "builder@test.com", "password": "Test123!"}
PROVIDER_CREDS = {"email": "provider@test.com", "password": "Test123!"}
ADMIN_CREDS = {"email": "admin@constructmarket.com", "password": "Admin123!"}


class TestAuthentication:
    """Authentication tests - get tokens for other tests"""
    
    @pytest.fixture(scope="class")
    def builder_token(self):
        """Get builder authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=BUILDER_CREDS)
        if response.status_code != 200:
            pytest.skip("Builder login failed - skipping authenticated tests")
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def provider_token(self):
        """Get provider authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=PROVIDER_CREDS)
        if response.status_code != 200:
            pytest.skip("Provider login failed - skipping authenticated tests")
        return response.json()["token"]
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        if response.status_code != 200:
            pytest.skip("Admin login failed - skipping admin tests")
        return response.json()["token"]
    
    def test_builder_login(self):
        """Test builder can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=BUILDER_CREDS)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["role"] == "builder"
        print(f"Builder login successful: {data['user_id']}")
    
    def test_provider_login(self):
        """Test provider can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=PROVIDER_CREDS)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["role"] == "provider"
        print(f"Provider login successful: {data['user_id']}")
    
    def test_admin_login(self):
        """Test admin can login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert data["role"] == "admin"
        print(f"Admin login successful: {data['user_id']}")


class TestTwoFactorAuthentication:
    """Two-Factor Authentication (2FA) tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get authentication tokens"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=BUILDER_CREDS)
        if response.status_code != 200:
            pytest.skip("Builder login failed")
        self.builder_token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.builder_token}"}
    
    def test_2fa_setup_returns_qr_code_and_secret(self):
        """Test 2FA setup endpoint returns QR code and secret"""
        response = requests.post(f"{BASE_URL}/api/2fa/setup", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        # Validate secret is returned
        assert "secret" in data
        assert len(data["secret"]) > 10
        
        # Validate QR code is base64 PNG image
        assert "qr_code" in data
        assert data["qr_code"].startswith("data:image/png;base64,")
        
        # Validate manual entry key
        assert "manual_entry_key" in data
        assert data["manual_entry_key"] == data["secret"]
        
        print(f"2FA Setup successful - Secret length: {len(data['secret'])}")
        print(f"QR Code received: {len(data['qr_code'])} characters")
    
    def test_2fa_verify_rejects_invalid_code(self):
        """Test 2FA verify endpoint rejects invalid TOTP code"""
        # First setup 2FA
        setup_response = requests.post(f"{BASE_URL}/api/2fa/setup", headers=self.headers)
        assert setup_response.status_code == 200
        
        # Try to verify with invalid code
        response = requests.post(
            f"{BASE_URL}/api/2fa/verify",
            headers=self.headers,
            json={"code": "000000"}  # Invalid code
        )
        assert response.status_code == 400
        assert "Invalid verification code" in response.json().get("detail", "")
        print("2FA verify correctly rejects invalid code")
    
    def test_2fa_verify_rejects_without_setup(self):
        """Test 2FA verify fails without initial setup"""
        # Create a new test user to avoid conflict
        signup_data = {
            "email": f"test_2fa_{os.urandom(4).hex()}@test.com",
            "password": "Test123!",
            "first_name": "Test",
            "last_name": "2FA",
            "role": "builder",
            "company_name": "Test 2FA Company",
            "company_type": "builder"
        }
        response = requests.post(f"{BASE_URL}/api/auth/signup", json=signup_data)
        if response.status_code != 200:
            pytest.skip("Could not create test user for 2FA test")
        
        token = response.json()["token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Try to verify without setup (no pending secret)
        verify_response = requests.post(
            f"{BASE_URL}/api/2fa/verify",
            headers=headers,
            json={"code": "123456"}
        )
        assert verify_response.status_code == 400
        assert "2FA setup not initialized" in verify_response.json().get("detail", "")
        print("2FA verify correctly rejects without prior setup")


class TestFileUpload:
    """File upload endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get authentication tokens"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=BUILDER_CREDS)
        if response.status_code != 200:
            pytest.skip("Builder login failed")
        self.builder_token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.builder_token}"}
    
    def test_file_upload_image(self):
        """Test uploading an image file"""
        # Create a simple test image (1x1 pixel PNG)
        import base64
        # Minimal valid PNG
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {
            'file': ('test_image.png', io.BytesIO(png_data), 'image/png')
        }
        data = {'category': 'general'}
        
        response = requests.post(
            f"{BASE_URL}/api/files/upload",
            headers=self.headers,
            files=files,
            data=data
        )
        
        assert response.status_code == 200
        result = response.json()
        
        # Validate response structure
        assert "file_id" in result
        assert "url" in result
        assert "filename" in result
        assert "size" in result
        
        assert result["url"].startswith("/api/files/")
        print(f"File uploaded successfully: {result['file_id']}")
        print(f"URL: {result['url']}, Size: {result['size']} bytes")
        
        return result["file_id"]
    
    def test_file_upload_requires_auth(self):
        """Test file upload requires authentication"""
        import base64
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {
            'file': ('test.png', io.BytesIO(png_data), 'image/png')
        }
        
        response = requests.post(
            f"{BASE_URL}/api/files/upload",
            files=files
        )
        
        assert response.status_code == 401
        print("File upload correctly requires authentication")
    
    def test_file_upload_rejects_invalid_type(self):
        """Test file upload rejects invalid file types"""
        files = {
            'file': ('test.exe', io.BytesIO(b'fake executable'), 'application/x-executable')
        }
        
        response = requests.post(
            f"{BASE_URL}/api/files/upload",
            headers=self.headers,
            files=files
        )
        
        assert response.status_code == 400
        assert "File type not allowed" in response.json().get("detail", "")
        print("File upload correctly rejects invalid file types")
    
    def test_file_download(self):
        """Test downloading an uploaded file"""
        # First upload a file
        import base64
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {
            'file': ('download_test.png', io.BytesIO(png_data), 'image/png')
        }
        
        upload_response = requests.post(
            f"{BASE_URL}/api/files/upload",
            headers=self.headers,
            files=files
        )
        assert upload_response.status_code == 200
        file_id = upload_response.json()["file_id"]
        
        # Download the file
        download_response = requests.get(f"{BASE_URL}/api/files/{file_id}")
        assert download_response.status_code == 200
        assert len(download_response.content) > 0
        print(f"File download successful: {len(download_response.content)} bytes")
    
    def test_file_download_404_for_nonexistent(self):
        """Test file download returns 404 for non-existent files"""
        response = requests.get(f"{BASE_URL}/api/files/nonexistent_file_id")
        assert response.status_code == 404
        print("File download correctly returns 404 for non-existent files")


class TestChatRooms:
    """Chat rooms and messages tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get authentication tokens"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=BUILDER_CREDS)
        if response.status_code != 200:
            pytest.skip("Builder login failed")
        self.builder_token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.builder_token}"}
    
    def test_get_chat_rooms(self):
        """Test getting user's chat rooms"""
        response = requests.get(f"{BASE_URL}/api/chat/rooms", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "rooms" in data
        assert isinstance(data["rooms"], list)
        
        print(f"Chat rooms retrieved: {len(data['rooms'])} rooms")
        if data["rooms"]:
            room = data["rooms"][0]
            print(f"Sample room: {room.get('room_id')}, Other party: {room.get('other_party')}")
    
    def test_get_chat_rooms_requires_auth(self):
        """Test chat rooms endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/chat/rooms")
        assert response.status_code == 401
        print("Chat rooms correctly requires authentication")
    
    def test_get_chat_messages(self):
        """Test getting messages for a chat room"""
        # First get rooms
        rooms_response = requests.get(f"{BASE_URL}/api/chat/rooms", headers=self.headers)
        assert rooms_response.status_code == 200
        
        rooms = rooms_response.json().get("rooms", [])
        if not rooms:
            pytest.skip("No chat rooms available to test messages")
        
        room_id = rooms[0]["room_id"]
        
        # Get messages
        response = requests.get(f"{BASE_URL}/api/chat/rooms/{room_id}/messages", headers=self.headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "messages" in data
        assert isinstance(data["messages"], list)
        
        print(f"Messages retrieved for room {room_id}: {len(data['messages'])} messages")
    
    def test_get_chat_messages_with_pagination(self):
        """Test chat messages pagination"""
        rooms_response = requests.get(f"{BASE_URL}/api/chat/rooms", headers=self.headers)
        rooms = rooms_response.json().get("rooms", [])
        
        if not rooms:
            pytest.skip("No chat rooms available")
        
        room_id = rooms[0]["room_id"]
        
        # Get messages with limit
        response = requests.get(
            f"{BASE_URL}/api/chat/rooms/{room_id}/messages",
            headers=self.headers,
            params={"limit": 10}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert len(data.get("messages", [])) <= 10
        print(f"Pagination working - received {len(data.get('messages', []))} messages with limit=10")


class TestContractPDFExport:
    """Contract PDF export tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get authentication tokens"""
        builder_response = requests.post(f"{BASE_URL}/api/auth/login", json=BUILDER_CREDS)
        if builder_response.status_code != 200:
            pytest.skip("Builder login failed")
        self.builder_token = builder_response.json()["token"]
        self.builder_headers = {"Authorization": f"Bearer {self.builder_token}"}
    
    def test_contract_pdf_export(self):
        """Test exporting contract as PDF"""
        # First get a contract
        contracts_response = requests.get(f"{BASE_URL}/api/contracts/", headers=self.builder_headers)
        if contracts_response.status_code != 200:
            pytest.skip("Could not fetch contracts")
        
        contracts = contracts_response.json()
        if not contracts:
            pytest.skip("No contracts available to test PDF export")
        
        contract_id = contracts[0]["contract_id"]
        
        # Export PDF
        response = requests.get(
            f"{BASE_URL}/api/contracts/{contract_id}/pdf",
            headers=self.builder_headers
        )
        
        assert response.status_code == 200
        assert response.headers.get("content-type") == "application/pdf"
        assert len(response.content) > 0
        
        # Check PDF header (PDF files start with %PDF)
        assert response.content[:4] == b'%PDF'
        
        print(f"PDF export successful for contract {contract_id}")
        print(f"PDF size: {len(response.content)} bytes")
    
    def test_contract_pdf_requires_auth(self):
        """Test PDF export requires authentication"""
        response = requests.get(f"{BASE_URL}/api/contracts/test_contract_id/pdf")
        assert response.status_code == 401
        print("PDF export correctly requires authentication")
    
    def test_contract_pdf_404_for_nonexistent(self):
        """Test PDF export returns 404 for non-existent contract"""
        response = requests.get(
            f"{BASE_URL}/api/contracts/nonexistent_contract_id/pdf",
            headers=self.builder_headers
        )
        assert response.status_code == 404
        print("PDF export correctly returns 404 for non-existent contracts")


class TestVerificationBadges:
    """User verification badges tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get authentication tokens and user IDs"""
        builder_response = requests.post(f"{BASE_URL}/api/auth/login", json=BUILDER_CREDS)
        if builder_response.status_code != 200:
            pytest.skip("Builder login failed")
        self.builder_token = builder_response.json()["token"]
        self.builder_user_id = builder_response.json()["user_id"]
        self.builder_headers = {"Authorization": f"Bearer {self.builder_token}"}
        
        provider_response = requests.post(f"{BASE_URL}/api/auth/login", json=PROVIDER_CREDS)
        if provider_response.status_code == 200:
            self.provider_user_id = provider_response.json()["user_id"]
    
    def test_get_user_badges(self):
        """Test getting user's verification badges"""
        response = requests.get(f"{BASE_URL}/api/users/{self.builder_user_id}/badges")
        assert response.status_code == 200
        
        data = response.json()
        assert "badges" in data
        assert "badge_count" in data
        assert isinstance(data["badges"], list)
        
        print(f"User badges retrieved: {data['badge_count']} badges")
        for badge in data["badges"]:
            print(f"  - {badge.get('name')}: {badge.get('icon')} ({badge.get('color')})")
    
    def test_get_user_badges_404_for_nonexistent(self):
        """Test badges endpoint returns 404 for non-existent user"""
        response = requests.get(f"{BASE_URL}/api/users/nonexistent_user_id/badges")
        assert response.status_code == 404
        print("Badges endpoint correctly returns 404 for non-existent users")


class TestCompanyVerification:
    """Company verification status tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get authentication tokens and company IDs"""
        builder_response = requests.post(f"{BASE_URL}/api/auth/login", json=BUILDER_CREDS)
        if builder_response.status_code != 200:
            pytest.skip("Builder login failed")
        self.builder_token = builder_response.json()["token"]
        self.builder_company_id = builder_response.json().get("company_id")
        self.builder_headers = {"Authorization": f"Bearer {self.builder_token}"}
    
    def test_get_company_verification_status(self):
        """Test getting company's verification status"""
        if not self.builder_company_id:
            pytest.skip("Builder has no company_id")
        
        response = requests.get(f"{BASE_URL}/api/companies/{self.builder_company_id}/verification-status")
        assert response.status_code == 200
        
        data = response.json()
        
        # Validate response structure
        assert "company_id" in data
        assert "company_name" in data
        assert "verification_score" in data
        assert "trust_level" in data
        assert "verifications" in data
        assert "badge_eligible" in data
        
        # Validate trust level is valid
        valid_levels = ["unverified", "basic_verified", "partially_verified", "fully_verified"]
        assert data["trust_level"] in valid_levels
        
        # Validate verification score is 0-100
        assert 0 <= data["verification_score"] <= 100
        
        print(f"Company verification status retrieved for {data['company_name']}")
        print(f"  Trust Level: {data['trust_level']}")
        print(f"  Verification Score: {data['verification_score']}%")
        print(f"  Badge Eligible: {data['badge_eligible']}")
        for v in data["verifications"]:
            print(f"  - {v['type']}: {v['status']} - {v['label']}")
    
    def test_company_verification_404_for_nonexistent(self):
        """Test verification status returns 404 for non-existent company"""
        response = requests.get(f"{BASE_URL}/api/companies/nonexistent_company_id/verification-status")
        assert response.status_code == 404
        print("Verification status correctly returns 404 for non-existent companies")


class TestAdminBadgeAward:
    """Admin badge award tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get authentication tokens"""
        admin_response = requests.post(f"{BASE_URL}/api/auth/login", json=ADMIN_CREDS)
        if admin_response.status_code != 200:
            pytest.skip("Admin login failed")
        self.admin_token = admin_response.json()["token"]
        self.admin_headers = {"Authorization": f"Bearer {self.admin_token}"}
        
        builder_response = requests.post(f"{BASE_URL}/api/auth/login", json=BUILDER_CREDS)
        if builder_response.status_code == 200:
            self.builder_user_id = builder_response.json()["user_id"]
            self.builder_token = builder_response.json()["token"]
            self.builder_headers = {"Authorization": f"Bearer {self.builder_token}"}
    
    def test_admin_can_award_badge(self):
        """Test admin can award a badge to user"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/{self.builder_user_id}/badges",
            headers=self.admin_headers,
            json={"badge_type": "verified_identity"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "message" in data
        assert "badge" in data
        assert data["badge"]["badge_type"] == "verified_identity"
        assert "badge_id" in data["badge"]
        
        print(f"Badge awarded successfully: {data['badge']['name']}")
    
    def test_admin_badge_award_rejects_invalid_type(self):
        """Test badge award rejects invalid badge types"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/{self.builder_user_id}/badges",
            headers=self.admin_headers,
            json={"badge_type": "invalid_badge_type"}
        )
        
        assert response.status_code == 400
        assert "Invalid badge type" in response.json().get("detail", "")
        print("Badge award correctly rejects invalid badge types")
    
    def test_non_admin_cannot_award_badge(self):
        """Test non-admin users cannot award badges"""
        response = requests.post(
            f"{BASE_URL}/api/admin/users/{self.builder_user_id}/badges",
            headers=self.builder_headers,
            json={"badge_type": "verified_identity"}
        )
        
        assert response.status_code == 403
        print("Badge award correctly restricts to admin users")


class TestPushNotifications:
    """Push notification subscription tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get authentication tokens"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=BUILDER_CREDS)
        if response.status_code != 200:
            pytest.skip("Builder login failed")
        self.builder_token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.builder_token}"}
    
    def test_subscribe_push_notifications(self):
        """Test subscribing to push notifications"""
        subscription_data = {
            "endpoint": "https://fcm.googleapis.com/fcm/send/test-endpoint",
            "keys": {
                "p256dh": "test_p256dh_key",
                "auth": "test_auth_key"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/notifications/subscribe",
            headers=self.headers,
            json=subscription_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "Subscribed" in data["message"]
        
        print("Push notification subscription successful")
    
    def test_subscribe_push_requires_auth(self):
        """Test push notification subscription requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/subscribe",
            json={"endpoint": "https://test.com/endpoint"}
        )
        
        assert response.status_code == 401
        print("Push subscription correctly requires authentication")
    
    def test_unsubscribe_push_notifications(self):
        """Test unsubscribing from push notifications"""
        # First subscribe
        subscription_data = {
            "endpoint": "https://fcm.googleapis.com/fcm/send/test-endpoint-unsubscribe",
            "keys": {"p256dh": "test_key", "auth": "test_auth"}
        }
        
        requests.post(
            f"{BASE_URL}/api/notifications/subscribe",
            headers=self.headers,
            json=subscription_data
        )
        
        # Then unsubscribe
        response = requests.delete(
            f"{BASE_URL}/api/notifications/subscribe",
            headers=self.headers,
            json={"endpoint": subscription_data["endpoint"]}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "Unsubscribed" in data.get("message", "")
        
        print("Push notification unsubscription successful")


class TestWorkDiaryPhotoUpload:
    """Work diary photo upload tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get authentication tokens"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json=PROVIDER_CREDS)
        if response.status_code != 200:
            pytest.skip("Provider login failed")
        self.provider_token = response.json()["token"]
        self.headers = {"Authorization": f"Bearer {self.provider_token}"}
    
    def test_work_diary_photo_upload(self):
        """Test uploading photos to work diary"""
        # First get a work order
        work_orders_response = requests.get(f"{BASE_URL}/api/work-orders/", headers=self.headers)
        if work_orders_response.status_code != 200:
            pytest.skip("Could not fetch work orders")
        
        work_orders = work_orders_response.json()
        if not work_orders:
            pytest.skip("No work orders available to test photo upload")
        
        work_order_id = work_orders[0]["work_order_id"]
        
        # Create test image
        import base64
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = [
            ('photos', ('work_photo_1.png', io.BytesIO(png_data), 'image/png')),
            ('photos', ('work_photo_2.png', io.BytesIO(png_data), 'image/png'))
        ]
        
        response = requests.post(
            f"{BASE_URL}/api/files/work-diary/{work_order_id}/photos",
            headers=self.headers,
            files=files
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "uploaded" in data
        assert "count" in data
        
        print(f"Work diary photos uploaded: {data['count']} photos")
        for photo in data.get("uploaded", []):
            print(f"  - {photo.get('file_id')}: {photo.get('url')}")
    
    def test_work_diary_photo_upload_requires_auth(self):
        """Test work diary photo upload requires authentication"""
        import base64
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = [('photos', ('test.png', io.BytesIO(png_data), 'image/png'))]
        
        response = requests.post(
            f"{BASE_URL}/api/files/work-diary/test_work_order/photos",
            files=files
        )
        
        assert response.status_code == 401
        print("Work diary photo upload correctly requires authentication")
    
    def test_work_diary_photo_upload_404_for_nonexistent(self):
        """Test work diary photo upload returns 404 for non-existent work order"""
        import base64
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = [('photos', ('test.png', io.BytesIO(png_data), 'image/png'))]
        
        response = requests.post(
            f"{BASE_URL}/api/files/work-diary/nonexistent_work_order/photos",
            headers=self.headers,
            files=files
        )
        
        assert response.status_code == 404
        print("Work diary photo upload correctly returns 404 for non-existent work orders")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
