from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Request, Response
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import asyncio
import base64
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET_KEY', 'construct_market_secret')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 168  # 7 days

# Create the main app
app = FastAPI(title="ConstructMarket API")

# Create routers
api_router = APIRouter(prefix="/api")
auth_router = APIRouter(prefix="/auth", tags=["Authentication"])
users_router = APIRouter(prefix="/users", tags=["Users"])
companies_router = APIRouter(prefix="/companies", tags=["Companies"])
tasks_router = APIRouter(prefix="/tasks", tags=["Tasks"])
bids_router = APIRouter(prefix="/bids", tags=["Bids"])
contracts_router = APIRouter(prefix="/contracts", tags=["Contracts"])
work_orders_router = APIRouter(prefix="/work-orders", tags=["Work Orders"])
payments_router = APIRouter(prefix="/payments", tags=["Payments"])
invoices_router = APIRouter(prefix="/invoices", tags=["Invoices"])
ratings_router = APIRouter(prefix="/ratings", tags=["Ratings"])
notifications_router = APIRouter(prefix="/notifications", tags=["Notifications"])
admin_router = APIRouter(prefix="/admin", tags=["Admin"])
licences_router = APIRouter(prefix="/licences", tags=["Licences"])
insurance_router = APIRouter(prefix="/insurance", tags=["Insurance"])

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ============== ENUMS (as string literals for Pydantic) ==============
ROLES = ["builder", "provider", "admin"]
COMPANY_TYPES = ["builder", "provider", "supplier"]
SUBSCRIPTION_TIERS = ["essentials", "professional", "enterprise"]
SUBSCRIPTION_STATUSES = ["active", "paused", "cancelled"]
VERIFICATION_STATUSES = ["pending", "verified", "rejected"]
POLICY_TYPES = ["public_liability", "workers_comp", "professional_indemnity"]
TASK_CATEGORIES = ["concrete", "framing", "roofing", "plumbing", "electrical", "painting", "excavation", "other"]
TASK_STATUSES = ["draft", "posted", "bidding_open", "bidding_closed", "awarded", "in_progress", "completed", "cancelled"]
TIMELINE_OPTIONS = ["urgent", "week_1", "week_2", "month_1", "flexible"]
BID_STATUSES = ["submitted", "viewed", "selected", "rejected", "withdrawn"]
CONTRACT_STATUSES = ["draft", "sent_for_signature", "signed_by_builder", "signed_by_provider", "fully_executed", "cancelled"]
WORK_ORDER_STATUSES = ["scheduled", "started", "in_progress", "paused", "completed", "cancelled"]
PAYMENT_TYPES = ["upfront", "milestone", "completion", "variation"]
PAYMENT_STATUSES = ["pending", "escrow_held", "paid", "refunded", "disputed"]
DISPUTE_STATUSES = ["open", "in_mediation", "resolved", "escalated"]
INVOICE_STATUSES = ["draft", "issued", "viewed", "partially_paid", "paid", "overdue", "cancelled"]
NOTIFICATION_TYPES = ["task_posted", "bid_received", "bid_selected", "contract_ready", "work_started", "payment_released", "invoice_due", "rating_received", "system"]

# ============== PYDANTIC MODELS ==============

# Auth Models
class UserSignup(BaseModel):
    email: EmailStr
    password: str
    first_name: str
    last_name: str
    role: str
    phone: Optional[str] = None
    company_name: Optional[str] = None  # Optional for admin role
    company_type: Optional[str] = None  # Optional for admin role
    abn: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    token: str
    user_id: str
    email: str
    role: str
    company_id: Optional[str] = None

# User Models
class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str = Field(default_factory=lambda: f"user_{uuid.uuid4().hex[:12]}")
    email: EmailStr
    first_name: str
    last_name: str
    role: str
    company_id: Optional[str] = None
    is_active: bool = True
    profile_verified: bool = False
    phone: Optional[str] = None
    position_title: Optional[str] = None
    picture: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    first_name: str
    last_name: str
    role: str
    company_id: Optional[str] = None
    is_active: bool
    profile_verified: bool
    phone: Optional[str] = None
    position_title: Optional[str] = None
    picture: Optional[str] = None

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    position_title: Optional[str] = None

# Company Models
class CompanyBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    company_id: str = Field(default_factory=lambda: f"comp_{uuid.uuid4().hex[:12]}")
    name: str
    abn: Optional[str] = None
    company_type: str
    phone: Optional[str] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postcode: Optional[str] = None
    country: str = "Australia"
    website: Optional[str] = None
    subscription_tier: str = "essentials"
    subscription_status: str = "active"
    is_verified: bool = False
    team_size_range: Optional[str] = None
    annual_revenue_estimate: Optional[str] = None
    stripe_connect_id: Optional[str] = None
    stripe_customer_id: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CompanyResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    company_id: str
    name: str
    abn: Optional[str] = None
    company_type: str
    phone: Optional[str] = None
    address_line_1: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postcode: Optional[str] = None
    country: str
    website: Optional[str] = None
    subscription_tier: str
    subscription_status: str
    is_verified: bool
    stripe_connect_id: Optional[str] = None

class CompanyUpdate(BaseModel):
    name: Optional[str] = None
    abn: Optional[str] = None
    phone: Optional[str] = None
    address_line_1: Optional[str] = None
    address_line_2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postcode: Optional[str] = None
    website: Optional[str] = None
    team_size_range: Optional[str] = None
    annual_revenue_estimate: Optional[str] = None

# Licence Models
class LicenceCreate(BaseModel):
    license_type: str
    license_number: str
    issuing_body: str
    state: str
    issue_date: str
    expiry_date: str

class LicenceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    licence_id: str
    user_id: str
    license_type: str
    license_number: str
    issuing_body: str
    state: str
    issue_date: str
    expiry_date: str
    document_file: Optional[str] = None
    verification_status: str
    verified_at: Optional[str] = None
    verified_by: Optional[str] = None

# Insurance Models
class InsuranceCreate(BaseModel):
    policy_type: str
    policy_number: str
    provider_name: str
    cover_amount: float
    issue_date: str
    expiry_date: str

class InsuranceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    insurance_id: str
    user_id: str
    policy_type: str
    policy_number: str
    provider_name: str
    cover_amount: float
    issue_date: str
    expiry_date: str
    certificate_file: Optional[str] = None
    verification_status: str
    verified_at: Optional[str] = None
    verified_by: Optional[str] = None

# Task Models
class TaskCreate(BaseModel):
    title: str
    description: str
    category: str
    scope: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    budget_fixed: Optional[float] = None
    location_address: Optional[str] = None
    location_city: Optional[str] = None
    location_state: Optional[str] = None
    location_postcode: Optional[str] = None
    service_radius_km: Optional[float] = None
    scheduled_start_date: Optional[str] = None
    scheduled_end_date: Optional[str] = None
    preferred_timeline: Optional[str] = "flexible"
    required_qualifications: Optional[str] = None
    estimated_team_size: Optional[int] = None
    equipment_needed: Optional[str] = None
    bid_deadline: Optional[str] = None

class TaskResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    task_id: str
    company_id: str
    created_by: str
    title: str
    description: str
    category: str
    scope: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    budget_fixed: Optional[float] = None
    location_address: Optional[str] = None
    location_city: Optional[str] = None
    location_state: Optional[str] = None
    location_postcode: Optional[str] = None
    service_radius_km: Optional[float] = None
    scheduled_start_date: Optional[str] = None
    scheduled_end_date: Optional[str] = None
    preferred_timeline: Optional[str] = None
    required_qualifications: Optional[str] = None
    estimated_team_size: Optional[int] = None
    equipment_needed: Optional[str] = None
    status: str
    selected_provider_id: Optional[str] = None
    posted_at: Optional[str] = None
    bid_deadline: Optional[str] = None
    bid_count: int = 0
    view_count: int = 0
    created_at: str
    company_name: Optional[str] = None
    creator_name: Optional[str] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    scope: Optional[str] = None
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    budget_fixed: Optional[float] = None
    location_address: Optional[str] = None
    location_city: Optional[str] = None
    location_state: Optional[str] = None
    location_postcode: Optional[str] = None
    scheduled_start_date: Optional[str] = None
    scheduled_end_date: Optional[str] = None
    preferred_timeline: Optional[str] = None
    required_qualifications: Optional[str] = None
    estimated_team_size: Optional[int] = None
    equipment_needed: Optional[str] = None
    bid_deadline: Optional[str] = None
    status: Optional[str] = None

# Bid Models
class BidCreate(BaseModel):
    task_id: str
    amount: float
    description: str
    timeline_days: int
    start_date: Optional[str] = None
    team_size: Optional[int] = None
    materials_included: Optional[str] = None
    materials_excluded: Optional[str] = None
    notes: Optional[str] = None

class BidResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    bid_id: str
    task_id: str
    provider_company_id: str
    provider_user_id: str
    amount: float
    currency: str = "AUD"
    description: str
    timeline_days: int
    start_date: Optional[str] = None
    team_size: Optional[int] = None
    materials_included: Optional[str] = None
    materials_excluded: Optional[str] = None
    notes: Optional[str] = None
    status: str
    selected_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    created_at: str
    provider_company_name: Optional[str] = None
    provider_name: Optional[str] = None
    provider_rating: Optional[float] = None

class BidUpdate(BaseModel):
    amount: Optional[float] = None
    description: Optional[str] = None
    timeline_days: Optional[int] = None
    start_date: Optional[str] = None
    team_size: Optional[int] = None
    materials_included: Optional[str] = None
    materials_excluded: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None
    rejection_reason: Optional[str] = None

# Contract Models
class ContractCreate(BaseModel):
    task_id: str
    bid_id: str
    start_date: str
    end_date: str
    payment_terms: Optional[str] = None
    defects_liability_months: int = 12
    cancellation_terms: Optional[str] = None

class ContractResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    contract_id: str
    task_id: str
    bid_id: str
    builder_company_id: str
    provider_company_id: str
    html_body: Optional[str] = None
    pdf_file: Optional[str] = None
    status: str
    builder_signed_at: Optional[str] = None
    provider_signed_at: Optional[str] = None
    start_date: str
    end_date: str
    price: float
    payment_terms: Optional[str] = None
    defects_liability_months: int
    cancellation_terms: Optional[str] = None
    created_at: str
    task_title: Optional[str] = None
    builder_company_name: Optional[str] = None
    provider_company_name: Optional[str] = None

# Work Order Models
class WorkOrderCreate(BaseModel):
    contract_id: str
    scheduled_start_date: str
    scheduled_end_date: str
    site_foreman_name: Optional[str] = None
    site_foreman_phone: Optional[str] = None
    notes: Optional[str] = None

class WorkOrderResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    work_order_id: str
    contract_id: str
    number: str
    status: str
    scheduled_start_date: str
    actual_start_date: Optional[str] = None
    scheduled_end_date: str
    actual_end_date: Optional[str] = None
    actual_duration_hours: Optional[float] = None
    notes: Optional[str] = None
    site_foreman_name: Optional[str] = None
    site_foreman_phone: Optional[str] = None
    created_at: str

class WorkOrderUpdate(BaseModel):
    status: Optional[str] = None
    actual_start_date: Optional[str] = None
    actual_end_date: Optional[str] = None
    actual_duration_hours: Optional[float] = None
    notes: Optional[str] = None
    site_foreman_name: Optional[str] = None
    site_foreman_phone: Optional[str] = None

# Work Diary Entry Models
class WorkDiaryEntryCreate(BaseModel):
    work_order_id: str
    description: str
    hours_worked: float
    team_members: int
    equipment_used: Optional[str] = None
    weather_conditions: Optional[str] = None
    safety_incidents: bool = False
    safety_notes: Optional[str] = None

class WorkDiaryEntryResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    entry_id: str
    work_order_id: str
    recorded_by: str
    entry_date: str
    description: str
    hours_worked: float
    team_members: int
    equipment_used: Optional[str] = None
    weather_conditions: Optional[str] = None
    safety_incidents: bool
    safety_notes: Optional[str] = None
    photos: List[str] = []
    created_at: str
    recorder_name: Optional[str] = None

# Payment Models
class PaymentCreate(BaseModel):
    contract_id: str
    work_order_id: Optional[str] = None
    type: str
    description: str
    amount: float
    milestone_index: Optional[int] = None

class PaymentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    payment_id: str
    contract_id: str
    work_order_id: Optional[str] = None
    type: str
    description: str
    amount: float
    currency: str = "AUD"
    milestone_index: Optional[int] = None
    status: str
    builder_initiated_at: Optional[str] = None
    escrow_held_at: Optional[str] = None
    released_at: Optional[str] = None
    provider_paid_at: Optional[str] = None
    stripe_charge_id: Optional[str] = None
    stripe_transfer_id: Optional[str] = None
    dispute_reason: Optional[str] = None
    dispute_status: Optional[str] = None
    created_at: str

# Invoice Models
class InvoiceResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    invoice_id: str
    payment_id: str
    contract_id: str
    issued_by_company_id: str
    issued_to_company_id: str
    invoice_number: str
    invoice_date: str
    due_date: str
    subtotal: float
    tax_amount: float
    total: float
    tax_rate: float
    currency: str
    description: str
    status: str
    pdf_file: Optional[str] = None
    created_at: str
    issued_by_company_name: Optional[str] = None
    issued_to_company_name: Optional[str] = None

# Rating Models
class RatingCreate(BaseModel):
    contract_id: str
    score: int
    comment: Optional[str] = None
    quality: int
    punctuality: int
    communication: int
    safety: int
    value: int
    would_rehire: bool

class RatingResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    rating_id: str
    provider_company_id: str
    rater_company_id: str
    rater_user_id: str
    contract_id: str
    score: float
    comment: Optional[str] = None
    quality: float
    punctuality: float
    communication: float
    safety: float
    value: float
    would_rehire: bool
    created_at: str
    rater_name: Optional[str] = None

# Notification Models
class NotificationResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    notification_id: str
    user_id: str
    type: str
    title: str
    message: str
    related_type: Optional[str] = None
    related_id: Optional[str] = None
    is_read: bool
    action_url: Optional[str] = None
    created_at: str

# Stripe Connect Models
class StripeConnectRequest(BaseModel):
    origin_url: str

class CheckoutRequest(BaseModel):
    payment_id: str
    origin_url: str

# ============== HELPER FUNCTIONS ==============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, email: str, role: str, company_id: str = None) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "company_id": company_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(request: Request) -> dict:
    # Check cookies first
    session_token = request.cookies.get("session_token")
    if session_token:
        session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
        if session:
            expires_at = session.get("expires_at")
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at)
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            if expires_at > datetime.now(timezone.utc):
                user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
                if user:
                    return user
    
    # Check Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]
        # Check if it's a session token
        session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
        if session:
            user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
            if user:
                return user
        # Otherwise try JWT
        try:
            payload = decode_token(token)
            user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
            if user:
                return user
        except:
            pass
    
    raise HTTPException(status_code=401, detail="Not authenticated")

async def require_role(request: Request, roles: List[str]) -> dict:
    user = await get_current_user(request)
    if user["role"] not in roles:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    return user

async def create_notification(user_id: str, type: str, title: str, message: str, related_type: str = None, related_id: str = None, action_url: str = None):
    notification = {
        "notification_id": f"notif_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "type": type,
        "title": title,
        "message": message,
        "related_type": related_type,
        "related_id": related_id,
        "is_read": False,
        "action_url": action_url,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.notifications.insert_one(notification)
    return notification

def generate_contract_html(task: dict, bid: dict, builder_company: dict, provider_company: dict, contract: dict) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Construction Contract - {contract.get('contract_id', '')}</title>
        <style>
            body {{ font-family: 'Public Sans', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }}
            h1 {{ color: #0F766E; border-bottom: 2px solid #0F766E; padding-bottom: 10px; }}
            h2 {{ color: #334155; margin-top: 30px; }}
            .parties {{ background: #F1F5F9; padding: 20px; border-radius: 4px; margin: 20px 0; }}
            .section {{ margin: 20px 0; }}
            .amount {{ font-size: 24px; color: #0F766E; font-weight: bold; }}
            .signature-box {{ border: 1px solid #CBD5E1; padding: 20px; margin: 10px 0; }}
            table {{ width: 100%; border-collapse: collapse; }}
            th, td {{ border: 1px solid #CBD5E1; padding: 10px; text-align: left; }}
            th {{ background: #F1F5F9; }}
        </style>
    </head>
    <body>
        <h1>CONSTRUCTION CONTRACT</h1>
        <p><strong>Contract Number:</strong> {contract.get('contract_id', '')}</p>
        <p><strong>Date:</strong> {datetime.now(timezone.utc).strftime('%B %d, %Y')}</p>
        
        <div class="parties">
            <h2>Parties</h2>
            <table>
                <tr>
                    <th>Builder (Principal)</th>
                    <th>Provider (Contractor)</th>
                </tr>
                <tr>
                    <td>
                        <strong>{builder_company.get('name', 'N/A')}</strong><br>
                        ABN: {builder_company.get('abn', 'N/A')}<br>
                        {builder_company.get('address_line_1', '')}<br>
                        {builder_company.get('city', '')}, {builder_company.get('state', '')} {builder_company.get('postcode', '')}
                    </td>
                    <td>
                        <strong>{provider_company.get('name', 'N/A')}</strong><br>
                        ABN: {provider_company.get('abn', 'N/A')}<br>
                        {provider_company.get('address_line_1', '')}<br>
                        {provider_company.get('city', '')}, {provider_company.get('state', '')} {provider_company.get('postcode', '')}
                    </td>
                </tr>
            </table>
        </div>
        
        <div class="section">
            <h2>1. Project Details</h2>
            <p><strong>Project Title:</strong> {task.get('title', 'N/A')}</p>
            <p><strong>Category:</strong> {task.get('category', 'N/A').replace('_', ' ').title()}</p>
            <p><strong>Location:</strong> {task.get('location_address', '')}, {task.get('location_city', '')}, {task.get('location_state', '')} {task.get('location_postcode', '')}</p>
            <p><strong>Description:</strong></p>
            <p>{task.get('description', 'N/A')}</p>
            <p><strong>Scope of Work:</strong></p>
            <p>{task.get('scope', bid.get('description', 'As per bid submission'))}</p>
        </div>
        
        <div class="section">
            <h2>2. Contract Price</h2>
            <p class="amount">AUD ${bid.get('amount', 0):,.2f}</p>
            <p><strong>Payment Terms:</strong> {contract.get('payment_terms', 'As agreed between parties')}</p>
        </div>
        
        <div class="section">
            <h2>3. Timeline</h2>
            <p><strong>Commencement Date:</strong> {contract.get('start_date', 'TBD')}</p>
            <p><strong>Completion Date:</strong> {contract.get('end_date', 'TBD')}</p>
            <p><strong>Duration:</strong> {bid.get('timeline_days', 'N/A')} days</p>
        </div>
        
        <div class="section">
            <h2>4. Materials</h2>
            <p><strong>Included:</strong> {bid.get('materials_included', 'As per quote')}</p>
            <p><strong>Excluded:</strong> {bid.get('materials_excluded', 'N/A')}</p>
        </div>
        
        <div class="section">
            <h2>5. Terms and Conditions</h2>
            <p><strong>Defects Liability Period:</strong> {contract.get('defects_liability_months', 12)} months from practical completion</p>
            <p><strong>Cancellation Terms:</strong> {contract.get('cancellation_terms', 'Either party may terminate with 14 days written notice. Work completed to date shall be paid for.')}</p>
        </div>
        
        <div class="section">
            <h2>6. Signatures</h2>
            <div class="signature-box">
                <p><strong>Builder Representative:</strong></p>
                <p>Signed: ____________________</p>
                <p>Name: ____________________</p>
                <p>Date: ____________________</p>
            </div>
            <div class="signature-box">
                <p><strong>Provider Representative:</strong></p>
                <p>Signed: ____________________</p>
                <p>Name: ____________________</p>
                <p>Date: ____________________</p>
            </div>
        </div>
    </body>
    </html>
    """

def generate_invoice_html(invoice: dict, issued_by: dict, issued_to: dict, payment: dict) -> str:
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Invoice - {invoice.get('invoice_number', '')}</title>
        <style>
            body {{ font-family: 'Public Sans', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }}
            h1 {{ color: #0F766E; }}
            .header {{ display: flex; justify-content: space-between; margin-bottom: 40px; }}
            .invoice-info {{ text-align: right; }}
            .parties {{ margin: 30px 0; }}
            .party {{ margin-bottom: 20px; }}
            table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
            th, td {{ border: 1px solid #CBD5E1; padding: 12px; text-align: left; }}
            th {{ background: #F1F5F9; }}
            .totals {{ text-align: right; }}
            .total-row {{ font-size: 18px; font-weight: bold; color: #0F766E; }}
        </style>
    </head>
    <body>
        <div class="header">
            <div>
                <h1>TAX INVOICE</h1>
                <p><strong>{issued_by.get('name', '')}</strong></p>
                <p>ABN: {issued_by.get('abn', 'N/A')}</p>
                <p>{issued_by.get('address_line_1', '')}</p>
                <p>{issued_by.get('city', '')}, {issued_by.get('state', '')} {issued_by.get('postcode', '')}</p>
            </div>
            <div class="invoice-info">
                <p><strong>Invoice Number:</strong> {invoice.get('invoice_number', '')}</p>
                <p><strong>Invoice Date:</strong> {invoice.get('invoice_date', '')}</p>
                <p><strong>Due Date:</strong> {invoice.get('due_date', '')}</p>
                <p><strong>Status:</strong> {invoice.get('status', '').upper()}</p>
            </div>
        </div>
        
        <div class="parties">
            <div class="party">
                <p><strong>Bill To:</strong></p>
                <p>{issued_to.get('name', '')}</p>
                <p>ABN: {issued_to.get('abn', 'N/A')}</p>
                <p>{issued_to.get('address_line_1', '')}</p>
                <p>{issued_to.get('city', '')}, {issued_to.get('state', '')} {issued_to.get('postcode', '')}</p>
            </div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Description</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{invoice.get('description', payment.get('description', 'Construction Services'))}</td>
                    <td>${invoice.get('subtotal', 0):,.2f}</td>
                </tr>
            </tbody>
        </table>
        
        <div class="totals">
            <p><strong>Subtotal:</strong> ${invoice.get('subtotal', 0):,.2f}</p>
            <p><strong>GST ({invoice.get('tax_rate', 10)}%):</strong> ${invoice.get('tax_amount', 0):,.2f}</p>
            <p class="total-row"><strong>Total:</strong> ${invoice.get('total', 0):,.2f} {invoice.get('currency', 'AUD')}</p>
        </div>
        
        <div style="margin-top: 40px; padding: 20px; background: #F1F5F9; border-radius: 4px;">
            <p><strong>Payment Details:</strong></p>
            <p>Please make payment within the due date. For questions, contact us.</p>
        </div>
    </body>
    </html>
    """

# ============== AUTH ROUTES ==============

@auth_router.post("/signup", response_model=TokenResponse)
async def signup(data: UserSignup):
    # Check if user exists
    existing = await db.users.find_one({"email": data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate role
    if data.role not in ["builder", "provider", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role. Must be 'builder', 'provider', or 'admin'")
    
    company_id = None
    
    # Create company for builder/provider roles
    if data.role in ["builder", "provider"]:
        if not data.company_name or not data.company_type:
            raise HTTPException(status_code=400, detail="Company name and type are required for builder/provider roles")
        
        company = CompanyBase(
            name=data.company_name,
            company_type=data.company_type,
            abn=data.abn
        )
        company_doc = company.model_dump()
        company_doc["created_at"] = company_doc["created_at"].isoformat()
        await db.companies.insert_one(company_doc)
        company_id = company.company_id
    
    # Create user
    user = UserBase(
        email=data.email,
        first_name=data.first_name,
        last_name=data.last_name,
        role=data.role,
        company_id=company_id,
        phone=data.phone
    )
    user_doc = user.model_dump()
    user_doc["password_hash"] = hash_password(data.password)
    user_doc["created_at"] = user_doc["created_at"].isoformat()
    await db.users.insert_one(user_doc)
    
    token = create_token(user.user_id, user.email, user.role, company_id)
    return TokenResponse(token=token, user_id=user.user_id, email=user.email, role=user.role, company_id=company_id)

@auth_router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    user = await db.users.find_one({"email": data.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(data.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="Account is deactivated")
    
    token = create_token(user["user_id"], user["email"], user["role"], user.get("company_id"))
    return TokenResponse(token=token, user_id=user["user_id"], email=user["email"], role=user["role"], company_id=user.get("company_id"))

@auth_router.post("/google/session")
async def google_session(request: Request, response: Response):
    # REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        body = await request.json()
        session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID required")
    
    # Exchange session_id with Emergent Auth
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid session")
        
        auth_data = resp.json()
    
    email = auth_data.get("email")
    name = auth_data.get("name", "")
    picture = auth_data.get("picture")
    session_token = auth_data.get("session_token")
    
    # Check if user exists
    user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if user:
        # Update user picture if changed
        if picture and user.get("picture") != picture:
            await db.users.update_one({"email": email}, {"$set": {"picture": picture}})
            user["picture"] = picture
    else:
        # Create new user - will need to complete onboarding
        name_parts = name.split(" ", 1)
        first_name = name_parts[0] if name_parts else ""
        last_name = name_parts[1] if len(name_parts) > 1 else ""
        
        user = {
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": email,
            "first_name": first_name,
            "last_name": last_name,
            "role": "pending",  # Will be set during onboarding
            "company_id": None,
            "is_active": True,
            "profile_verified": False,
            "picture": picture,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user)
    
    # Store session
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "first_name": user.get("first_name", ""),
        "last_name": user.get("last_name", ""),
        "role": user.get("role", "pending"),
        "company_id": user.get("company_id"),
        "picture": user.get("picture"),
        "needs_onboarding": user.get("role") == "pending" or not user.get("company_id")
    }

@auth_router.get("/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    company = None
    if user.get("company_id"):
        company = await db.companies.find_one({"company_id": user["company_id"]}, {"_id": 0})
    
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "first_name": user.get("first_name", ""),
        "last_name": user.get("last_name", ""),
        "role": user.get("role", ""),
        "company_id": user.get("company_id"),
        "picture": user.get("picture"),
        "phone": user.get("phone"),
        "position_title": user.get("position_title"),
        "profile_verified": user.get("profile_verified", False),
        "is_active": user.get("is_active", True),
        "company": company,
        "needs_onboarding": user.get("role") == "pending" or not user.get("company_id")
    }

@auth_router.post("/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

@auth_router.post("/complete-onboarding")
async def complete_onboarding(request: Request, data: dict):
    user = await get_current_user(request)
    
    role = data.get("role")
    if role not in ["builder", "provider"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    # Create company
    company = CompanyBase(
        name=data.get("company_name", ""),
        company_type=data.get("company_type", role),
        abn=data.get("abn"),
        phone=data.get("company_phone"),
        address_line_1=data.get("address_line_1"),
        city=data.get("city"),
        state=data.get("state"),
        postcode=data.get("postcode")
    )
    company_doc = company.model_dump()
    company_doc["created_at"] = company_doc["created_at"].isoformat()
    await db.companies.insert_one(company_doc)
    
    # Update user
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {
            "role": role,
            "company_id": company.company_id,
            "phone": data.get("phone"),
            "position_title": data.get("position_title")
        }}
    )
    
    return {
        "message": "Onboarding completed",
        "role": role,
        "company_id": company.company_id
    }

# ============== USER ROUTES ==============

@users_router.get("/me", response_model=UserResponse)
async def get_user_profile(request: Request):
    user = await get_current_user(request)
    return UserResponse(**user)

@users_router.put("/me", response_model=UserResponse)
async def update_user_profile(request: Request, data: UserUpdate):
    user = await get_current_user(request)
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.users.update_one({"user_id": user["user_id"]}, {"$set": update_data})
    updated = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    return UserResponse(**updated)

# ============== COMPANY ROUTES ==============

@companies_router.get("/me", response_model=CompanyResponse)
async def get_my_company(request: Request):
    user = await get_current_user(request)
    if not user.get("company_id"):
        raise HTTPException(status_code=404, detail="No company associated")
    company = await db.companies.find_one({"company_id": user["company_id"]}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return CompanyResponse(**company)

@companies_router.put("/me", response_model=CompanyResponse)
async def update_my_company(request: Request, data: CompanyUpdate):
    user = await get_current_user(request)
    if not user.get("company_id"):
        raise HTTPException(status_code=404, detail="No company associated")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    if update_data:
        await db.companies.update_one({"company_id": user["company_id"]}, {"$set": update_data})
    
    updated = await db.companies.find_one({"company_id": user["company_id"]}, {"_id": 0})
    return CompanyResponse(**updated)

@companies_router.get("/{company_id}", response_model=CompanyResponse)
async def get_company(company_id: str, request: Request):
    await get_current_user(request)
    company = await db.companies.find_one({"company_id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return CompanyResponse(**company)

# ============== LICENCE ROUTES ==============

@licences_router.post("/", response_model=LicenceResponse)
async def create_licence(request: Request, data: LicenceCreate):
    user = await get_current_user(request)
    
    licence = {
        "licence_id": f"lic_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "license_type": data.license_type,
        "license_number": data.license_number,
        "issuing_body": data.issuing_body,
        "state": data.state,
        "issue_date": data.issue_date,
        "expiry_date": data.expiry_date,
        "document_file": None,
        "verification_status": "pending",
        "verified_at": None,
        "verified_by": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.licences.insert_one(licence)
    return LicenceResponse(**licence)

@licences_router.get("/", response_model=List[LicenceResponse])
async def get_my_licences(request: Request):
    user = await get_current_user(request)
    licences = await db.licences.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    return [LicenceResponse(**lic) for lic in licences]

# ============== INSURANCE ROUTES ==============

@insurance_router.post("/", response_model=InsuranceResponse)
async def create_insurance(request: Request, data: InsuranceCreate):
    user = await get_current_user(request)
    
    insurance = {
        "insurance_id": f"ins_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "policy_type": data.policy_type,
        "policy_number": data.policy_number,
        "provider_name": data.provider_name,
        "cover_amount": data.cover_amount,
        "issue_date": data.issue_date,
        "expiry_date": data.expiry_date,
        "certificate_file": None,
        "verification_status": "pending",
        "verified_at": None,
        "verified_by": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.insurance.insert_one(insurance)
    return InsuranceResponse(**insurance)

@insurance_router.get("/", response_model=List[InsuranceResponse])
async def get_my_insurance(request: Request):
    user = await get_current_user(request)
    policies = await db.insurance.find({"user_id": user["user_id"]}, {"_id": 0}).to_list(100)
    return [InsuranceResponse(**pol) for pol in policies]

# ============== TASK ROUTES ==============

@tasks_router.post("/", response_model=TaskResponse)
async def create_task(request: Request, data: TaskCreate):
    user = await require_role(request, ["builder", "admin"])
    
    task = {
        "task_id": f"task_{uuid.uuid4().hex[:12]}",
        "company_id": user["company_id"],
        "created_by": user["user_id"],
        "title": data.title,
        "description": data.description,
        "category": data.category,
        "scope": data.scope,
        "budget_min": data.budget_min,
        "budget_max": data.budget_max,
        "budget_fixed": data.budget_fixed,
        "location_address": data.location_address,
        "location_city": data.location_city,
        "location_state": data.location_state,
        "location_postcode": data.location_postcode,
        "service_radius_km": data.service_radius_km,
        "scheduled_start_date": data.scheduled_start_date,
        "scheduled_end_date": data.scheduled_end_date,
        "preferred_timeline": data.preferred_timeline,
        "required_qualifications": data.required_qualifications,
        "estimated_team_size": data.estimated_team_size,
        "equipment_needed": data.equipment_needed,
        "status": "draft",
        "selected_provider_id": None,
        "posted_at": None,
        "bid_deadline": data.bid_deadline,
        "bid_count": 0,
        "view_count": 0,
        "attachments": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.tasks.insert_one(task)
    return TaskResponse(**task)

@tasks_router.get("/", response_model=List[TaskResponse])
async def list_tasks(request: Request, status: Optional[str] = None, category: Optional[str] = None, city: Optional[str] = None, limit: int = 50, skip: int = 0):
    user = await get_current_user(request)
    
    query = {}
    
    if user["role"] == "builder":
        # Builders see their own tasks
        query["company_id"] = user["company_id"]
    elif user["role"] == "provider":
        # Providers see posted tasks only
        query["status"] = {"$in": ["posted", "bidding_open"]}
    # Admins see all
    
    if status and user["role"] != "provider":
        query["status"] = status
    if category:
        query["category"] = category
    if city:
        query["location_city"] = {"$regex": city, "$options": "i"}
    
    tasks = await db.tasks.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    
    # Enrich with company and user names
    for task in tasks:
        company = await db.companies.find_one({"company_id": task.get("company_id")}, {"_id": 0, "name": 1})
        if company:
            task["company_name"] = company.get("name")
        creator = await db.users.find_one({"user_id": task.get("created_by")}, {"_id": 0, "first_name": 1, "last_name": 1})
        if creator:
            task["creator_name"] = f"{creator.get('first_name', '')} {creator.get('last_name', '')}".strip()
    
    return [TaskResponse(**task) for task in tasks]

@tasks_router.get("/{task_id}", response_model=TaskResponse)
async def get_task(task_id: str, request: Request):
    user = await get_current_user(request)
    
    task = await db.tasks.find_one({"task_id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    # Increment view count for providers
    if user["role"] == "provider":
        await db.tasks.update_one({"task_id": task_id}, {"$inc": {"view_count": 1}})
        task["view_count"] = task.get("view_count", 0) + 1
    
    # Enrich
    company = await db.companies.find_one({"company_id": task.get("company_id")}, {"_id": 0, "name": 1})
    if company:
        task["company_name"] = company.get("name")
    creator = await db.users.find_one({"user_id": task.get("created_by")}, {"_id": 0, "first_name": 1, "last_name": 1})
    if creator:
        task["creator_name"] = f"{creator.get('first_name', '')} {creator.get('last_name', '')}".strip()
    
    return TaskResponse(**task)

@tasks_router.put("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: str, request: Request, data: TaskUpdate):
    user = await require_role(request, ["builder", "admin"])
    
    task = await db.tasks.find_one({"task_id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if user["role"] == "builder" and task["company_id"] != user["company_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    # Handle publishing
    if update_data.get("status") == "posted" and task["status"] == "draft":
        update_data["posted_at"] = datetime.now(timezone.utc).isoformat()
    
    if update_data:
        await db.tasks.update_one({"task_id": task_id}, {"$set": update_data})
    
    updated = await db.tasks.find_one({"task_id": task_id}, {"_id": 0})
    return TaskResponse(**updated)

@tasks_router.delete("/{task_id}")
async def delete_task(task_id: str, request: Request):
    user = await require_role(request, ["builder", "admin"])
    
    task = await db.tasks.find_one({"task_id": task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if user["role"] == "builder" and task["company_id"] != user["company_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if task["status"] not in ["draft", "cancelled"]:
        raise HTTPException(status_code=400, detail="Can only delete draft or cancelled tasks")
    
    await db.tasks.delete_one({"task_id": task_id})
    return {"message": "Task deleted"}

# ============== BID ROUTES ==============

@bids_router.post("/", response_model=BidResponse)
async def create_bid(request: Request, data: BidCreate):
    user = await require_role(request, ["provider"])
    
    task = await db.tasks.find_one({"task_id": data.task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    if task["status"] not in ["posted", "bidding_open"]:
        raise HTTPException(status_code=400, detail="Task is not accepting bids")
    
    # Check if already bid
    existing = await db.bids.find_one({
        "task_id": data.task_id,
        "provider_company_id": user["company_id"]
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="You have already submitted a bid for this task")
    
    bid = {
        "bid_id": f"bid_{uuid.uuid4().hex[:12]}",
        "task_id": data.task_id,
        "provider_company_id": user["company_id"],
        "provider_user_id": user["user_id"],
        "amount": data.amount,
        "currency": "AUD",
        "description": data.description,
        "timeline_days": data.timeline_days,
        "start_date": data.start_date,
        "team_size": data.team_size,
        "materials_included": data.materials_included,
        "materials_excluded": data.materials_excluded,
        "notes": data.notes,
        "status": "submitted",
        "selected_at": None,
        "rejection_reason": None,
        "attachments": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.bids.insert_one(bid)
    
    # Increment bid count
    await db.tasks.update_one({"task_id": data.task_id}, {"$inc": {"bid_count": 1}})
    
    # Notify builder
    task_creator = await db.users.find_one({"user_id": task["created_by"]}, {"_id": 0})
    if task_creator:
        provider_company = await db.companies.find_one({"company_id": user["company_id"]}, {"_id": 0, "name": 1})
        await create_notification(
            user_id=task_creator["user_id"],
            type="bid_received",
            title="New Bid Received",
            message=f"New bid of ${data.amount:,.2f} received from {provider_company.get('name', 'Unknown')} for {task['title']}",
            related_type="Bid",
            related_id=bid["bid_id"],
            action_url=f"/builder/tasks/{data.task_id}"
        )
    
    return BidResponse(**bid)

@bids_router.get("/", response_model=List[BidResponse])
async def list_bids(request: Request, task_id: Optional[str] = None):
    user = await get_current_user(request)
    
    query = {}
    if user["role"] == "provider":
        query["provider_company_id"] = user["company_id"]
    elif user["role"] == "builder":
        if task_id:
            # Verify task belongs to builder
            task = await db.tasks.find_one({"task_id": task_id, "company_id": user["company_id"]}, {"_id": 0})
            if not task:
                raise HTTPException(status_code=403, detail="Not authorized")
            query["task_id"] = task_id
        else:
            # Get all bids for builder's tasks
            tasks = await db.tasks.find({"company_id": user["company_id"]}, {"_id": 0, "task_id": 1}).to_list(1000)
            task_ids = [t["task_id"] for t in tasks]
            query["task_id"] = {"$in": task_ids}
    
    if task_id and "task_id" not in query:
        query["task_id"] = task_id
    
    bids = await db.bids.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Enrich bids
    for bid in bids:
        company = await db.companies.find_one({"company_id": bid.get("provider_company_id")}, {"_id": 0, "name": 1})
        if company:
            bid["provider_company_name"] = company.get("name")
        provider = await db.users.find_one({"user_id": bid.get("provider_user_id")}, {"_id": 0, "first_name": 1, "last_name": 1})
        if provider:
            bid["provider_name"] = f"{provider.get('first_name', '')} {provider.get('last_name', '')}".strip()
        
        # Get average rating
        ratings = await db.ratings.find({"provider_company_id": bid.get("provider_company_id")}, {"_id": 0, "score": 1}).to_list(100)
        if ratings:
            bid["provider_rating"] = sum(r["score"] for r in ratings) / len(ratings)
    
    return [BidResponse(**bid) for bid in bids]

@bids_router.get("/{bid_id}", response_model=BidResponse)
async def get_bid(bid_id: str, request: Request):
    user = await get_current_user(request)
    
    bid = await db.bids.find_one({"bid_id": bid_id}, {"_id": 0})
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    
    # Enrich
    company = await db.companies.find_one({"company_id": bid.get("provider_company_id")}, {"_id": 0, "name": 1})
    if company:
        bid["provider_company_name"] = company.get("name")
    
    return BidResponse(**bid)

@bids_router.put("/{bid_id}", response_model=BidResponse)
async def update_bid(bid_id: str, request: Request, data: BidUpdate):
    user = await get_current_user(request)
    
    bid = await db.bids.find_one({"bid_id": bid_id}, {"_id": 0})
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    # Provider can only update their own bids
    if user["role"] == "provider":
        if bid["provider_company_id"] != user["company_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        # Can only update if status is submitted
        if bid["status"] != "submitted":
            raise HTTPException(status_code=400, detail="Cannot update bid after selection")
        # Remove status from update if present
        update_data.pop("status", None)
    
    # Builder can select/reject bids
    if user["role"] == "builder":
        task = await db.tasks.find_one({"task_id": bid["task_id"]}, {"_id": 0})
        if not task or task["company_id"] != user["company_id"]:
            raise HTTPException(status_code=403, detail="Not authorized")
        
        if "status" in update_data:
            if update_data["status"] == "selected":
                update_data["selected_at"] = datetime.now(timezone.utc).isoformat()
                # Update task
                await db.tasks.update_one(
                    {"task_id": bid["task_id"]},
                    {"$set": {"status": "awarded", "selected_provider_id": bid["provider_company_id"]}}
                )
                # Reject other bids
                await db.bids.update_many(
                    {"task_id": bid["task_id"], "bid_id": {"$ne": bid_id}},
                    {"$set": {"status": "rejected"}}
                )
                # Notify provider
                await create_notification(
                    user_id=bid["provider_user_id"],
                    type="bid_selected",
                    title="Bid Selected!",
                    message=f"Your bid for {task['title']} has been selected!",
                    related_type="Bid",
                    related_id=bid_id,
                    action_url=f"/provider/bids/{bid_id}"
                )
    
    if update_data:
        await db.bids.update_one({"bid_id": bid_id}, {"$set": update_data})
    
    updated = await db.bids.find_one({"bid_id": bid_id}, {"_id": 0})
    return BidResponse(**updated)

# ============== CONTRACT ROUTES ==============

@contracts_router.post("/", response_model=ContractResponse)
async def create_contract(request: Request, data: ContractCreate):
    user = await require_role(request, ["builder", "admin"])
    
    task = await db.tasks.find_one({"task_id": data.task_id}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    bid = await db.bids.find_one({"bid_id": data.bid_id}, {"_id": 0})
    if not bid:
        raise HTTPException(status_code=404, detail="Bid not found")
    
    if user["role"] == "builder" and task["company_id"] != user["company_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    builder_company = await db.companies.find_one({"company_id": task["company_id"]}, {"_id": 0})
    provider_company = await db.companies.find_one({"company_id": bid["provider_company_id"]}, {"_id": 0})
    
    contract = {
        "contract_id": f"con_{uuid.uuid4().hex[:12]}",
        "task_id": data.task_id,
        "bid_id": data.bid_id,
        "builder_company_id": task["company_id"],
        "provider_company_id": bid["provider_company_id"],
        "status": "draft",
        "builder_signed_at": None,
        "provider_signed_at": None,
        "start_date": data.start_date,
        "end_date": data.end_date,
        "price": bid["amount"],
        "payment_terms": data.payment_terms,
        "defects_liability_months": data.defects_liability_months,
        "cancellation_terms": data.cancellation_terms,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Generate contract HTML
    contract["html_body"] = generate_contract_html(task, bid, builder_company, provider_company, contract)
    
    await db.contracts.insert_one(contract)
    
    # Update task status
    await db.tasks.update_one({"task_id": data.task_id}, {"$set": {"status": "awarded"}})
    
    # Notify provider
    await create_notification(
        user_id=bid["provider_user_id"],
        type="contract_ready",
        title="Contract Ready for Review",
        message=f"Contract for {task['title']} is ready for your review and signature.",
        related_type="Contract",
        related_id=contract["contract_id"],
        action_url=f"/contracts/{contract['contract_id']}"
    )
    
    return ContractResponse(**contract)

@contracts_router.get("/", response_model=List[ContractResponse])
async def list_contracts(request: Request, status: Optional[str] = None):
    user = await get_current_user(request)
    
    query = {}
    if user["role"] == "builder":
        query["builder_company_id"] = user["company_id"]
    elif user["role"] == "provider":
        query["provider_company_id"] = user["company_id"]
    
    if status:
        query["status"] = status
    
    contracts = await db.contracts.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Enrich
    for contract in contracts:
        task = await db.tasks.find_one({"task_id": contract.get("task_id")}, {"_id": 0, "title": 1})
        if task:
            contract["task_title"] = task.get("title")
        builder = await db.companies.find_one({"company_id": contract.get("builder_company_id")}, {"_id": 0, "name": 1})
        if builder:
            contract["builder_company_name"] = builder.get("name")
        provider = await db.companies.find_one({"company_id": contract.get("provider_company_id")}, {"_id": 0, "name": 1})
        if provider:
            contract["provider_company_name"] = provider.get("name")
    
    return [ContractResponse(**c) for c in contracts]

@contracts_router.get("/{contract_id}", response_model=ContractResponse)
async def get_contract(contract_id: str, request: Request):
    user = await get_current_user(request)
    
    contract = await db.contracts.find_one({"contract_id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Check authorization
    if user["role"] == "builder" and contract["builder_company_id"] != user["company_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    if user["role"] == "provider" and contract["provider_company_id"] != user["company_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Enrich
    task = await db.tasks.find_one({"task_id": contract.get("task_id")}, {"_id": 0, "title": 1})
    if task:
        contract["task_title"] = task.get("title")
    builder = await db.companies.find_one({"company_id": contract.get("builder_company_id")}, {"_id": 0, "name": 1})
    if builder:
        contract["builder_company_name"] = builder.get("name")
    provider = await db.companies.find_one({"company_id": contract.get("provider_company_id")}, {"_id": 0, "name": 1})
    if provider:
        contract["provider_company_name"] = provider.get("name")
    
    return ContractResponse(**contract)

@contracts_router.post("/{contract_id}/sign")
async def sign_contract(contract_id: str, request: Request):
    user = await get_current_user(request)
    
    contract = await db.contracts.find_one({"contract_id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    update_data = {}
    now = datetime.now(timezone.utc).isoformat()
    
    if user["role"] == "builder" and contract["builder_company_id"] == user["company_id"]:
        update_data["builder_signed_at"] = now
        if contract.get("provider_signed_at"):
            update_data["status"] = "fully_executed"
        else:
            update_data["status"] = "signed_by_builder"
    elif user["role"] == "provider" and contract["provider_company_id"] == user["company_id"]:
        update_data["provider_signed_at"] = now
        if contract.get("builder_signed_at"):
            update_data["status"] = "fully_executed"
        else:
            update_data["status"] = "signed_by_provider"
    else:
        raise HTTPException(status_code=403, detail="Not authorized to sign this contract")
    
    await db.contracts.update_one({"contract_id": contract_id}, {"$set": update_data})
    
    # If fully executed, create work order and initial payment
    if update_data.get("status") == "fully_executed":
        # Update task status
        await db.tasks.update_one({"task_id": contract["task_id"]}, {"$set": {"status": "in_progress"}})
        
        # Create work order
        wo_count = await db.work_orders.count_documents({})
        work_order = {
            "work_order_id": f"wo_{uuid.uuid4().hex[:12]}",
            "contract_id": contract_id,
            "number": f"WO-{wo_count + 1:04d}",
            "status": "scheduled",
            "scheduled_start_date": contract["start_date"],
            "actual_start_date": None,
            "scheduled_end_date": contract["end_date"],
            "actual_end_date": None,
            "actual_duration_hours": None,
            "notes": None,
            "site_foreman_name": None,
            "site_foreman_phone": None,
            "created_at": now
        }
        await db.work_orders.insert_one(work_order)
        
        # Create completion payment
        payment = {
            "payment_id": f"pay_{uuid.uuid4().hex[:12]}",
            "contract_id": contract_id,
            "work_order_id": work_order["work_order_id"],
            "type": "completion",
            "description": f"Completion payment for contract {contract_id}",
            "amount": float(contract["price"]),
            "currency": "AUD",
            "milestone_index": None,
            "status": "pending",
            "builder_initiated_at": None,
            "escrow_held_at": None,
            "released_at": None,
            "provider_paid_at": None,
            "stripe_charge_id": None,
            "stripe_transfer_id": None,
            "dispute_reason": None,
            "dispute_status": None,
            "created_at": now
        }
        await db.payments.insert_one(payment)
        
        # Notify both parties
        builder = await db.users.find_one({"company_id": contract["builder_company_id"]}, {"_id": 0})
        provider = await db.users.find_one({"company_id": contract["provider_company_id"]}, {"_id": 0})
        
        task = await db.tasks.find_one({"task_id": contract["task_id"]}, {"_id": 0, "title": 1})
        
        if builder:
            await create_notification(
                user_id=builder["user_id"],
                type="work_started",
                title="Contract Executed",
                message=f"Contract for {task.get('title', 'project')} is now fully executed. Work can begin!",
                related_type="Contract",
                related_id=contract_id,
                action_url=f"/contracts/{contract_id}"
            )
        if provider:
            await create_notification(
                user_id=provider["user_id"],
                type="work_started",
                title="Contract Executed - Start Work",
                message=f"Contract for {task.get('title', 'project')} is fully executed. You can now begin work!",
                related_type="Contract",
                related_id=contract_id,
                action_url=f"/provider/contracts/{contract_id}"
            )
    
    updated = await db.contracts.find_one({"contract_id": contract_id}, {"_id": 0})
    return {"message": "Contract signed", "status": updated["status"]}

# ============== WORK ORDER ROUTES ==============

@work_orders_router.get("/", response_model=List[WorkOrderResponse])
async def list_work_orders(request: Request, contract_id: Optional[str] = None):
    user = await get_current_user(request)
    
    query = {}
    if contract_id:
        query["contract_id"] = contract_id
    else:
        # Get work orders for user's contracts
        if user["role"] == "builder":
            contracts = await db.contracts.find({"builder_company_id": user["company_id"]}, {"_id": 0, "contract_id": 1}).to_list(1000)
        elif user["role"] == "provider":
            contracts = await db.contracts.find({"provider_company_id": user["company_id"]}, {"_id": 0, "contract_id": 1}).to_list(1000)
        else:
            contracts = await db.contracts.find({}, {"_id": 0, "contract_id": 1}).to_list(1000)
        contract_ids = [c["contract_id"] for c in contracts]
        query["contract_id"] = {"$in": contract_ids}
    
    work_orders = await db.work_orders.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [WorkOrderResponse(**wo) for wo in work_orders]

@work_orders_router.get("/{work_order_id}", response_model=WorkOrderResponse)
async def get_work_order(work_order_id: str, request: Request):
    await get_current_user(request)
    
    work_order = await db.work_orders.find_one({"work_order_id": work_order_id}, {"_id": 0})
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    return WorkOrderResponse(**work_order)

@work_orders_router.put("/{work_order_id}", response_model=WorkOrderResponse)
async def update_work_order(work_order_id: str, request: Request, data: WorkOrderUpdate):
    user = await get_current_user(request)
    
    work_order = await db.work_orders.find_one({"work_order_id": work_order_id}, {"_id": 0})
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    # Handle status changes
    if "status" in update_data:
        if update_data["status"] == "started" and not work_order.get("actual_start_date"):
            update_data["actual_start_date"] = datetime.now(timezone.utc).isoformat()
        elif update_data["status"] == "completed" and not work_order.get("actual_end_date"):
            update_data["actual_end_date"] = datetime.now(timezone.utc).isoformat()
    
    if update_data:
        await db.work_orders.update_one({"work_order_id": work_order_id}, {"$set": update_data})
    
    updated = await db.work_orders.find_one({"work_order_id": work_order_id}, {"_id": 0})
    return WorkOrderResponse(**updated)

# ============== WORK DIARY ROUTES ==============

@work_orders_router.post("/{work_order_id}/diary", response_model=WorkDiaryEntryResponse)
async def create_diary_entry(work_order_id: str, request: Request, data: WorkDiaryEntryCreate):
    user = await require_role(request, ["provider"])
    
    work_order = await db.work_orders.find_one({"work_order_id": work_order_id}, {"_id": 0})
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    entry = {
        "entry_id": f"diary_{uuid.uuid4().hex[:12]}",
        "work_order_id": work_order_id,
        "recorded_by": user["user_id"],
        "entry_date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "description": data.description,
        "hours_worked": data.hours_worked,
        "team_members": data.team_members,
        "equipment_used": data.equipment_used,
        "weather_conditions": data.weather_conditions,
        "safety_incidents": data.safety_incidents,
        "safety_notes": data.safety_notes,
        "photos": [],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.work_diary.insert_one(entry)
    
    entry["recorder_name"] = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
    return WorkDiaryEntryResponse(**entry)

@work_orders_router.get("/{work_order_id}/diary", response_model=List[WorkDiaryEntryResponse])
async def list_diary_entries(work_order_id: str, request: Request):
    await get_current_user(request)
    
    entries = await db.work_diary.find({"work_order_id": work_order_id}, {"_id": 0}).sort("entry_date", -1).to_list(1000)
    
    # Enrich
    for entry in entries:
        recorder = await db.users.find_one({"user_id": entry.get("recorded_by")}, {"_id": 0, "first_name": 1, "last_name": 1})
        if recorder:
            entry["recorder_name"] = f"{recorder.get('first_name', '')} {recorder.get('last_name', '')}".strip()
    
    return [WorkDiaryEntryResponse(**e) for e in entries]

# ============== PAYMENT ROUTES ==============

@payments_router.get("/", response_model=List[PaymentResponse])
async def list_payments(request: Request, contract_id: Optional[str] = None, status: Optional[str] = None):
    user = await get_current_user(request)
    
    query = {}
    if contract_id:
        query["contract_id"] = contract_id
    else:
        if user["role"] == "builder":
            contracts = await db.contracts.find({"builder_company_id": user["company_id"]}, {"_id": 0, "contract_id": 1}).to_list(1000)
        elif user["role"] == "provider":
            contracts = await db.contracts.find({"provider_company_id": user["company_id"]}, {"_id": 0, "contract_id": 1}).to_list(1000)
        else:
            contracts = await db.contracts.find({}, {"_id": 0, "contract_id": 1}).to_list(1000)
        contract_ids = [c["contract_id"] for c in contracts]
        query["contract_id"] = {"$in": contract_ids}
    
    if status:
        query["status"] = status
    
    payments = await db.payments.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return [PaymentResponse(**p) for p in payments]

@payments_router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(payment_id: str, request: Request):
    await get_current_user(request)
    
    payment = await db.payments.find_one({"payment_id": payment_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return PaymentResponse(**payment)

@payments_router.post("/{payment_id}/initiate-checkout")
async def initiate_payment_checkout(payment_id: str, request: Request, data: CheckoutRequest):
    """Initiate Stripe checkout for a payment"""
    user = await require_role(request, ["builder"])
    
    payment = await db.payments.find_one({"payment_id": payment_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    contract = await db.contracts.find_one({"contract_id": payment["contract_id"]}, {"_id": 0})
    if not contract or contract["builder_company_id"] != user["company_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if payment["status"] not in ["pending"]:
        raise HTTPException(status_code=400, detail="Payment already processed")
    
    # Use Stripe checkout
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    
    api_key = os.environ.get("STRIPE_API_KEY")
    origin_url = data.origin_url
    webhook_url = f"{origin_url}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    success_url = f"{origin_url}/payments/{payment_id}/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/payments/{payment_id}"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(payment["amount"]),
        currency="aud",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "payment_id": payment_id,
            "contract_id": payment["contract_id"],
            "user_id": user["user_id"]
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create payment transaction record
    transaction = {
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "payment_id": payment_id,
        "session_id": session.session_id,
        "amount": float(payment["amount"]),
        "currency": "AUD",
        "user_id": user["user_id"],
        "payment_status": "initiated",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payment_transactions.insert_one(transaction)
    
    # Update payment
    await db.payments.update_one(
        {"payment_id": payment_id},
        {"$set": {
            "builder_initiated_at": datetime.now(timezone.utc).isoformat(),
            "stripe_charge_id": session.session_id
        }}
    )
    
    return {"checkout_url": session.url, "session_id": session.session_id}

@payments_router.get("/{payment_id}/checkout-status/{session_id}")
async def get_checkout_status(payment_id: str, session_id: str, request: Request):
    """Get status of a Stripe checkout session"""
    await get_current_user(request)
    
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    api_key = os.environ.get("STRIPE_API_KEY")
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
    
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update payment and transaction if paid
    if status.payment_status == "paid":
        # Check if already processed
        transaction = await db.payment_transactions.find_one({"session_id": session_id}, {"_id": 0})
        if transaction and transaction.get("payment_status") != "paid":
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid"}}
            )
            await db.payments.update_one(
                {"payment_id": payment_id},
                {"$set": {
                    "status": "escrow_held",
                    "escrow_held_at": datetime.now(timezone.utc).isoformat()
                }}
            )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency
    }

@payments_router.post("/{payment_id}/release")
async def release_payment(payment_id: str, request: Request):
    """Builder releases payment to provider after work completion"""
    user = await require_role(request, ["builder"])
    
    payment = await db.payments.find_one({"payment_id": payment_id}, {"_id": 0})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    contract = await db.contracts.find_one({"contract_id": payment["contract_id"]}, {"_id": 0})
    if not contract or contract["builder_company_id"] != user["company_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if payment["status"] != "escrow_held":
        raise HTTPException(status_code=400, detail="Payment must be in escrow to release")
    
    # Update payment status
    now = datetime.now(timezone.utc).isoformat()
    await db.payments.update_one(
        {"payment_id": payment_id},
        {"$set": {
            "status": "paid",
            "released_at": now,
            "provider_paid_at": now
        }}
    )
    
    # Update contract and task if this is the completion payment
    if payment["type"] == "completion":
        await db.contracts.update_one(
            {"contract_id": payment["contract_id"]},
            {"$set": {"status": "completed"}}
        )
        await db.tasks.update_one(
            {"task_id": contract["task_id"]},
            {"$set": {"status": "completed"}}
        )
        
        # Complete work order
        if payment.get("work_order_id"):
            await db.work_orders.update_one(
                {"work_order_id": payment["work_order_id"]},
                {"$set": {"status": "completed", "actual_end_date": now}}
            )
    
    # Create invoice
    invoice_count = await db.invoices.count_documents({})
    invoice = {
        "invoice_id": f"inv_{uuid.uuid4().hex[:12]}",
        "payment_id": payment_id,
        "contract_id": payment["contract_id"],
        "issued_by_company_id": contract["provider_company_id"],
        "issued_to_company_id": contract["builder_company_id"],
        "invoice_number": f"INV-{invoice_count + 1:06d}",
        "invoice_date": now[:10],
        "due_date": now[:10],
        "subtotal": payment["amount"],
        "tax_rate": 10.0,
        "tax_amount": payment["amount"] * 0.1,
        "total": payment["amount"] * 1.1,
        "currency": "AUD",
        "description": payment["description"],
        "status": "paid",
        "pdf_file": None,
        "created_at": now
    }
    await db.invoices.insert_one(invoice)
    
    # Notify provider
    provider = await db.users.find_one({"company_id": contract["provider_company_id"]}, {"_id": 0})
    if provider:
        await create_notification(
            user_id=provider["user_id"],
            type="payment_released",
            title="Payment Released!",
            message=f"Payment of ${payment['amount']:,.2f} has been released to your account.",
            related_type="Payment",
            related_id=payment_id,
            action_url=f"/provider/payments/{payment_id}"
        )
    
    return {"message": "Payment released", "invoice_id": invoice["invoice_id"]}

# Webhook endpoint for Stripe
@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        from emergentintegrations.payments.stripe.checkout import StripeCheckout
        
        api_key = os.environ.get("STRIPE_API_KEY")
        stripe_checkout = StripeCheckout(api_key=api_key, webhook_url="")
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            payment_id = webhook_response.metadata.get("payment_id")
            
            if payment_id:
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"payment_status": "paid"}}
                )
                await db.payments.update_one(
                    {"payment_id": payment_id},
                    {"$set": {
                        "status": "escrow_held",
                        "escrow_held_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
        
        return {"received": True}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"received": True}

# ============== INVOICE ROUTES ==============

@invoices_router.get("/", response_model=List[InvoiceResponse])
async def list_invoices(request: Request, status: Optional[str] = None):
    user = await get_current_user(request)
    
    query = {}
    if user["role"] == "builder":
        query["issued_to_company_id"] = user["company_id"]
    elif user["role"] == "provider":
        query["issued_by_company_id"] = user["company_id"]
    
    if status:
        query["status"] = status
    
    invoices = await db.invoices.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Enrich
    for inv in invoices:
        issued_by = await db.companies.find_one({"company_id": inv.get("issued_by_company_id")}, {"_id": 0, "name": 1})
        if issued_by:
            inv["issued_by_company_name"] = issued_by.get("name")
        issued_to = await db.companies.find_one({"company_id": inv.get("issued_to_company_id")}, {"_id": 0, "name": 1})
        if issued_to:
            inv["issued_to_company_name"] = issued_to.get("name")
    
    return [InvoiceResponse(**inv) for inv in invoices]

@invoices_router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(invoice_id: str, request: Request):
    await get_current_user(request)
    
    invoice = await db.invoices.find_one({"invoice_id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    return InvoiceResponse(**invoice)

@invoices_router.get("/{invoice_id}/html")
async def get_invoice_html(invoice_id: str, request: Request):
    await get_current_user(request)
    
    invoice = await db.invoices.find_one({"invoice_id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    payment = await db.payments.find_one({"payment_id": invoice["payment_id"]}, {"_id": 0})
    issued_by = await db.companies.find_one({"company_id": invoice["issued_by_company_id"]}, {"_id": 0})
    issued_to = await db.companies.find_one({"company_id": invoice["issued_to_company_id"]}, {"_id": 0})
    
    html = generate_invoice_html(invoice, issued_by or {}, issued_to or {}, payment or {})
    return Response(content=html, media_type="text/html")

# ============== RATING ROUTES ==============

@ratings_router.post("/", response_model=RatingResponse)
async def create_rating(request: Request, data: RatingCreate):
    user = await require_role(request, ["builder"])
    
    contract = await db.contracts.find_one({"contract_id": data.contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    if contract["builder_company_id"] != user["company_id"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if contract["status"] != "completed":
        raise HTTPException(status_code=400, detail="Can only rate completed contracts")
    
    # Check if already rated
    existing = await db.ratings.find_one({
        "contract_id": data.contract_id,
        "rater_company_id": user["company_id"]
    }, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Already rated this contract")
    
    rating = {
        "rating_id": f"rating_{uuid.uuid4().hex[:12]}",
        "provider_company_id": contract["provider_company_id"],
        "rater_company_id": user["company_id"],
        "rater_user_id": user["user_id"],
        "contract_id": data.contract_id,
        "score": data.score,
        "comment": data.comment,
        "quality": data.quality,
        "punctuality": data.punctuality,
        "communication": data.communication,
        "safety": data.safety,
        "value": data.value,
        "would_rehire": data.would_rehire,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.ratings.insert_one(rating)
    
    # Notify provider
    provider = await db.users.find_one({"company_id": contract["provider_company_id"]}, {"_id": 0})
    if provider:
        await create_notification(
            user_id=provider["user_id"],
            type="rating_received",
            title="New Rating Received",
            message=f"You received a {data.score}-star rating!",
            related_type="Rating",
            related_id=rating["rating_id"],
            action_url=f"/provider/ratings"
        )
    
    return RatingResponse(**rating)

@ratings_router.get("/", response_model=List[RatingResponse])
async def list_ratings(request: Request, company_id: Optional[str] = None):
    user = await get_current_user(request)
    
    query = {}
    if company_id:
        query["provider_company_id"] = company_id
    elif user["role"] == "provider":
        query["provider_company_id"] = user["company_id"]
    
    ratings = await db.ratings.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    
    # Enrich
    for rating in ratings:
        rater = await db.users.find_one({"user_id": rating.get("rater_user_id")}, {"_id": 0, "first_name": 1, "last_name": 1})
        if rater:
            rating["rater_name"] = f"{rater.get('first_name', '')} {rater.get('last_name', '')}".strip()
    
    return [RatingResponse(**r) for r in ratings]

@ratings_router.get("/provider/{company_id}/summary")
async def get_provider_rating_summary(company_id: str, request: Request):
    await get_current_user(request)
    
    ratings = await db.ratings.find({"provider_company_id": company_id}, {"_id": 0}).to_list(1000)
    
    if not ratings:
        return {
            "total_ratings": 0,
            "average_score": 0,
            "average_quality": 0,
            "average_punctuality": 0,
            "average_communication": 0,
            "average_safety": 0,
            "average_value": 0,
            "rehire_percentage": 0
        }
    
    total = len(ratings)
    return {
        "total_ratings": total,
        "average_score": sum(r["score"] for r in ratings) / total,
        "average_quality": sum(r["quality"] for r in ratings) / total,
        "average_punctuality": sum(r["punctuality"] for r in ratings) / total,
        "average_communication": sum(r["communication"] for r in ratings) / total,
        "average_safety": sum(r["safety"] for r in ratings) / total,
        "average_value": sum(r["value"] for r in ratings) / total,
        "rehire_percentage": sum(1 for r in ratings if r["would_rehire"]) / total * 100
    }

# ============== NOTIFICATION ROUTES ==============

@notifications_router.get("/", response_model=List[NotificationResponse])
async def list_notifications(request: Request, unread_only: bool = False):
    user = await get_current_user(request)
    
    query = {"user_id": user["user_id"]}
    if unread_only:
        query["is_read"] = False
    
    notifications = await db.notifications.find(query, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    return [NotificationResponse(**n) for n in notifications]

@notifications_router.get("/unread-count")
async def get_unread_count(request: Request):
    user = await get_current_user(request)
    count = await db.notifications.count_documents({"user_id": user["user_id"], "is_read": False})
    return {"count": count}

@notifications_router.put("/{notification_id}/read")
async def mark_notification_read(notification_id: str, request: Request):
    user = await get_current_user(request)
    
    result = await db.notifications.update_one(
        {"notification_id": notification_id, "user_id": user["user_id"]},
        {"$set": {"is_read": True}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    return {"message": "Marked as read"}

@notifications_router.put("/mark-all-read")
async def mark_all_notifications_read(request: Request):
    user = await get_current_user(request)
    
    await db.notifications.update_many(
        {"user_id": user["user_id"], "is_read": False},
        {"$set": {"is_read": True}}
    )
    
    return {"message": "All notifications marked as read"}

# ============== ADMIN ROUTES ==============

@admin_router.get("/dashboard")
async def admin_dashboard(request: Request):
    await require_role(request, ["admin"])
    
    # Get platform stats
    total_users = await db.users.count_documents({})
    active_users = await db.users.count_documents({"is_active": True})
    total_companies = await db.companies.count_documents({})
    verified_companies = await db.companies.count_documents({"is_verified": True})
    
    total_tasks = await db.tasks.count_documents({})
    posted_tasks = await db.tasks.count_documents({"status": "posted"})
    in_progress_tasks = await db.tasks.count_documents({"status": "in_progress"})
    completed_tasks = await db.tasks.count_documents({"status": "completed"})
    
    total_bids = await db.bids.count_documents({})
    total_contracts = await db.contracts.count_documents({})
    executed_contracts = await db.contracts.count_documents({"status": "fully_executed"})
    
    total_payments = await db.payments.count_documents({})
    completed_payments = await db.payments.count_documents({"status": "completed"})
    
    # Calculate GMV (Gross Merchandise Value)
    pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    gmv_result = await db.payments.aggregate(pipeline).to_list(1)
    gmv = gmv_result[0]["total"] if gmv_result else 0
    
    # Pending verifications
    pending_licences = await db.licences.count_documents({"status": "pending"})
    pending_insurance = await db.insurance.count_documents({"status": "pending"})
    
    return {
        "users": {"total": total_users, "active": active_users},
        "companies": {"total": total_companies, "verified": verified_companies},
        "tasks": {"total": total_tasks, "posted": posted_tasks, "in_progress": in_progress_tasks, "completed": completed_tasks},
        "bids": {"total": total_bids},
        "contracts": {"total": total_contracts, "executed": executed_contracts},
        "payments": {"total": total_payments, "completed": completed_payments},
        "gmv": gmv,
        "pending_verifications": {"licences": pending_licences, "insurance": pending_insurance}
    }

@admin_router.get("/users")
async def admin_list_users(request: Request, role: Optional[str] = None, is_active: Optional[bool] = None, limit: int = 50, skip: int = 0):
    await require_role(request, ["admin"])
    
    query = {}
    if role:
        query["role"] = role
    if is_active is not None:
        query["is_active"] = is_active
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    return {"users": users, "total": total}

@admin_router.get("/companies")
async def admin_list_companies(request: Request, company_type: Optional[str] = None, is_verified: Optional[bool] = None, limit: int = 50, skip: int = 0):
    await require_role(request, ["admin"])
    
    query = {}
    if company_type:
        query["company_type"] = company_type
    if is_verified is not None:
        query["is_verified"] = is_verified
    
    companies = await db.companies.find(query, {"_id": 0}).skip(skip).limit(limit).to_list(limit)
    total = await db.companies.count_documents(query)
    
    return {"companies": companies, "total": total}

@admin_router.get("/compliance/licences")
async def admin_list_licences(request: Request, status: Optional[str] = None):
    await require_role(request, ["admin"])
    
    query = {}
    if status:
        query["verification_status"] = status
    
    licences = await db.licences.find(query, {"_id": 0}).to_list(1000)
    return licences

@admin_router.put("/compliance/licences/{licence_id}")
async def admin_verify_licence(licence_id: str, request: Request, data: dict):
    user = await require_role(request, ["admin"])
    
    status = data.get("verification_status")
    if status not in ["verified", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    update_data = {
        "verification_status": status,
        "verified_at": datetime.now(timezone.utc).isoformat(),
        "verified_by": user["user_id"]
    }
    
    result = await db.licences.update_one({"licence_id": licence_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Licence not found")
    
    return {"message": f"Licence {status}"}

@admin_router.get("/compliance/insurance")
async def admin_list_insurance(request: Request, status: Optional[str] = None):
    await require_role(request, ["admin"])
    
    query = {}
    if status:
        query["verification_status"] = status
    
    insurance = await db.insurance.find(query, {"_id": 0}).to_list(1000)
    return insurance

@admin_router.put("/compliance/insurance/{insurance_id}")
async def admin_verify_insurance(insurance_id: str, request: Request, data: dict):
    user = await require_role(request, ["admin"])
    
    status = data.get("verification_status")
    if status not in ["verified", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    update_data = {
        "verification_status": status,
        "verified_at": datetime.now(timezone.utc).isoformat(),
        "verified_by": user["user_id"]
    }
    
    result = await db.insurance.update_one({"insurance_id": insurance_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Insurance not found")
    
    return {"message": f"Insurance {status}"}

@admin_router.get("/disputes")
async def admin_list_disputes(request: Request):
    await require_role(request, ["admin"])
    
    disputes = await db.payments.find({"status": "disputed"}, {"_id": 0}).to_list(1000)
    return disputes

@admin_router.get("/analytics")
async def admin_get_analytics(request: Request):
    await require_role(request, ["admin"])
    
    total_users = await db.users.count_documents({})
    total_companies = await db.companies.count_documents({})
    total_tasks = await db.tasks.count_documents({})
    total_contracts = await db.contracts.count_documents({})
    completed_contracts = await db.contracts.count_documents({"status": "completed"})
    
    # Payment volume
    payments = await db.payments.find({"status": "paid"}, {"_id": 0, "amount": 1}).to_list(10000)
    total_payment_volume = sum(p["amount"] for p in payments)
    
    # Average rating
    ratings = await db.ratings.find({}, {"_id": 0, "score": 1}).to_list(10000)
    avg_rating = sum(r["score"] for r in ratings) / len(ratings) if ratings else 0
    
    # Tasks by category
    tasks_by_category = {}
    for cat in TASK_CATEGORIES:
        count = await db.tasks.count_documents({"category": cat})
        tasks_by_category[cat] = count
    
    # Tasks by status
    tasks_by_status = {}
    for status in TASK_STATUSES:
        count = await db.tasks.count_documents({"status": status})
        tasks_by_status[status] = count
    
    return {
        "total_users": total_users,
        "total_companies": total_companies,
        "total_tasks": total_tasks,
        "total_contracts": total_contracts,
        "completed_contracts": completed_contracts,
        "total_payment_volume": total_payment_volume,
        "average_provider_rating": round(avg_rating, 2),
        "tasks_by_category": tasks_by_category,
        "tasks_by_status": tasks_by_status
    }

@admin_router.put("/users/{user_id}/activate")
async def admin_toggle_user_active(user_id: str, request: Request, data: dict):
    await require_role(request, ["admin"])
    
    is_active = data.get("is_active", True)
    result = await db.users.update_one({"user_id": user_id}, {"$set": {"is_active": is_active}})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": f"User {'activated' if is_active else 'deactivated'}"}

@admin_router.put("/companies/{company_id}/verify")
async def admin_verify_company(company_id: str, request: Request, data: dict):
    await require_role(request, ["admin"])
    
    is_verified = data.get("is_verified", True)
    result = await db.companies.update_one({"company_id": company_id}, {"$set": {"is_verified": is_verified}})
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Company not found")
    
    return {"message": f"Company {'verified' if is_verified else 'unverified'}"}

# ============== ROOT ENDPOINT ==============

@api_router.get("/")
async def root():
    return {"message": "ConstructMarket API", "version": "1.0.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include all routers
api_router.include_router(auth_router)
api_router.include_router(users_router)
api_router.include_router(companies_router)
api_router.include_router(licences_router)
api_router.include_router(insurance_router)
api_router.include_router(tasks_router)
api_router.include_router(bids_router)
api_router.include_router(contracts_router)
api_router.include_router(work_orders_router)
api_router.include_router(payments_router)
api_router.include_router(invoices_router)
api_router.include_router(ratings_router)
api_router.include_router(notifications_router)
api_router.include_router(admin_router)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
