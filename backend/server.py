from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File, Request, Response, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse, FileResponse, StreamingResponse
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
import json
import pyotp
import qrcode
import io
import aiofiles
from weasyprint import HTML

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Create uploads directory
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

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
marketplace_router = APIRouter(prefix="/marketplace", tags=["Marketplace"])
crm_router = APIRouter(prefix="/crm", tags=["CRM"])
provider_router = APIRouter(prefix="/provider", tags=["Provider"])
chat_router = APIRouter(prefix="/chat", tags=["Chat"])
files_router = APIRouter(prefix="/files", tags=["Files"])
twofa_router = APIRouter(prefix="/2fa", tags=["Two-Factor Auth"])

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
        "needs_onboarding": user.get("role") == "pending" or (user.get("role") not in ["admin", "founder"] and not user.get("company_id"))
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
        "needs_onboarding": user.get("role") == "pending" or (user.get("role") not in ["admin", "founder"] and not user.get("company_id"))
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

# ============== MARKETPLACE ROUTES (Public) ==============

@marketplace_router.get("/tasks")
async def marketplace_list_tasks(
    category: Optional[str] = None,
    state: Optional[str] = None,
    city: Optional[str] = None,
    status: str = "posted",
    limit: int = 50,
    skip: int = 0
):
    """Public endpoint to list available tasks"""
    query = {"status": {"$in": ["posted", "bidding_open"]}}
    if category:
        query["category"] = category
    if state:
        query["location_state"] = state
    if city:
        query["location_city"] = {"$regex": city, "$options": "i"}
    
    tasks = await db.tasks.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.tasks.count_documents(query)
    
    # Get category counts
    categories = {}
    for cat in TASK_CATEGORIES:
        cat_query = {"status": {"$in": ["posted", "bidding_open"]}, "category": cat}
        categories[cat] = await db.tasks.count_documents(cat_query)
    
    return {"tasks": tasks, "total": total, "categories": categories}

@marketplace_router.get("/tasks/{task_id}")
async def marketplace_get_task(task_id: str):
    """Public endpoint to get task details"""
    task = await db.tasks.find_one({"task_id": task_id, "status": {"$in": ["posted", "bidding_open"]}}, {"_id": 0})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task

# ============== CRM ROUTES (Admin/Founder) ==============

@crm_router.get("/dashboard")
async def crm_dashboard(request: Request):
    await require_role(request, ["admin", "founder"])
    
    # Get key metrics
    total_users = await db.users.count_documents({})
    total_builders = await db.users.count_documents({"role": "builder"})
    total_providers = await db.users.count_documents({"role": "provider"})
    total_companies = await db.companies.count_documents({})
    
    # Active metrics (users active in last 30 days)
    thirty_days_ago = (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()
    new_customers = await db.users.count_documents({"created_at": {"$gte": thirty_days_ago}})
    
    # Project metrics
    total_tasks = await db.tasks.count_documents({})
    active_tasks = await db.tasks.count_documents({"status": {"$in": ["posted", "in_progress"]}})
    completed_tasks = await db.tasks.count_documents({"status": "completed"})
    
    # Contract and payment metrics
    total_contracts = await db.contracts.count_documents({})
    executed_contracts = await db.contracts.count_documents({"status": "fully_executed"})
    
    # Calculate GMV
    pipeline = [{"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
    gmv_result = await db.payments.aggregate(pipeline).to_list(1)
    gmv = gmv_result[0]["total"] if gmv_result else 0
    
    # Revenue calculation (platform fees - assuming 5% fee)
    total_revenue = gmv * 0.05
    
    # Pipeline metrics
    pipeline_stats = {
        "leads": await db.users.count_documents({"created_at": {"$gte": thirty_days_ago}}),
        "in_progress": await db.tasks.count_documents({"status": "in_progress"}),
        "won": await db.contracts.count_documents({"status": "fully_executed"}),
        "lost": 0
    }
    
    # Conversion rate
    total_bids = await db.bids.count_documents({})
    accepted_bids = await db.bids.count_documents({"status": "selected"})
    conversion_rate = round((accepted_bids / total_bids * 100) if total_bids > 0 else 0, 1)
    
    # Recent activity
    recent_users = await db.users.find({}, {"_id": 0, "email": 1, "first_name": 1, "created_at": 1, "role": 1}).sort("created_at", -1).limit(5).to_list(5)
    recent_contracts = await db.contracts.find({}, {"_id": 0, "contract_id": 1, "price": 1, "created_at": 1}).sort("created_at", -1).limit(5).to_list(5)
    
    recent_activity = []
    for u in recent_users:
        recent_activity.append({
            "type": "signup",
            "title": f"New {u.get('role', 'user')} signup",
            "description": f"{u.get('first_name', '')} joined the platform",
            "created_at": u.get("created_at")
        })
    for c in recent_contracts:
        recent_activity.append({
            "type": "contract",
            "title": "New contract created",
            "description": f"Contract #{c.get('contract_id', '')[:8]} - ${c.get('price', 0):,.0f}",
            "created_at": c.get("created_at")
        })
    
    recent_activity.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    return {
        "metrics": {
            "total_revenue": total_revenue,
            "prev_revenue": total_revenue * 0.85,  # Simulated previous month
            "active_customers": total_users,
            "new_customers_this_month": new_customers,
            "active_projects": active_tasks,
            "completed_projects": completed_tasks,
            "gmv": gmv,
            "total_builders": total_builders,
            "total_providers": total_providers,
            "total_contracts": total_contracts,
            "conversion_rate": conversion_rate,
            "pipeline": pipeline_stats
        },
        "recent_activity": recent_activity[:10]
    }

@crm_router.get("/customers")
async def crm_customers(request: Request, role: Optional[str] = None, status: Optional[str] = None, page: int = 1, limit: int = 20):
    await require_role(request, ["admin", "founder"])
    
    query = {"role": {"$in": ["builder", "provider"]}}
    if role:
        query["role"] = role
    
    skip = (page - 1) * limit
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    total = await db.users.count_documents(query)
    
    # Enrich with company and lifetime value
    for user in users:
        if user.get("company_id"):
            company = await db.companies.find_one({"company_id": user["company_id"]}, {"_id": 0, "name": 1})
            user["company_name"] = company.get("name") if company else None
        
        # Calculate lifetime value
        if user.get("role") == "builder":
            payments = await db.payments.find({"builder_company_id": user.get("company_id")}, {"_id": 0, "amount": 1}).to_list(1000)
        else:
            payments = await db.payments.find({"provider_company_id": user.get("company_id")}, {"_id": 0, "amount": 1}).to_list(1000)
        user["lifetime_value"] = sum(p.get("amount", 0) for p in payments)
    
    return {"customers": users, "total": total}

@crm_router.get("/pipeline")
async def crm_pipeline(request: Request, filter: str = "all"):
    await require_role(request, ["admin", "founder"])
    
    # Build time filter
    date_filter = {}
    if filter == "month":
        date_filter = {"created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=30)).isoformat()}}
    elif filter == "quarter":
        date_filter = {"created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=90)).isoformat()}}
    elif filter == "year":
        date_filter = {"created_at": {"$gte": (datetime.now(timezone.utc) - timedelta(days=365)).isoformat()}}
    
    # Get deals by stage
    deals = {
        "lead": [],
        "contacted": [],
        "proposal": [],
        "negotiation": [],
        "won": [],
        "lost": []
    }
    
    # Map tasks to pipeline stages
    tasks_query = {**date_filter}
    tasks = await db.tasks.find(tasks_query, {"_id": 0}).sort("created_at", -1).to_list(500)
    
    for task in tasks:
        company = await db.companies.find_one({"company_id": task.get("company_id")}, {"_id": 0, "name": 1})
        deal = {
            "id": task.get("task_id"),
            "title": task.get("title"),
            "company_name": company.get("name") if company else "Unknown",
            "value": task.get("budget_max") or task.get("budget_min") or 0,
            "created_at": task.get("created_at")
        }
        
        status = task.get("status")
        if status == "draft":
            deals["lead"].append(deal)
        elif status == "posted":
            deals["contacted"].append(deal)
        elif status in ["bidding_open", "bidding_closed"]:
            deals["proposal"].append(deal)
        elif status == "awarded":
            deals["negotiation"].append(deal)
        elif status in ["in_progress", "completed"]:
            deals["won"].append(deal)
        elif status == "cancelled":
            deals["lost"].append(deal)
    
    # Calculate stats
    total_value = sum(sum(d.get("value", 0) for d in stage_deals) for stage_deals in deals.values())
    won_value = sum(d.get("value", 0) for d in deals["won"])
    total_deals = sum(len(stage_deals) for stage_deals in deals.values())
    won_deals = len(deals["won"])
    
    return {
        "deals": deals,
        "stats": {
            "total_value": total_value,
            "win_rate": round((won_deals / total_deals * 100) if total_deals > 0 else 0, 1),
            "avg_deal_size": round(total_value / total_deals if total_deals > 0 else 0, 0)
        }
    }

@crm_router.get("/revenue")
async def crm_revenue(request: Request, period: str = "month"):
    await require_role(request, ["admin", "founder"])
    
    # Build time filter
    if period == "week":
        start_date = datetime.now(timezone.utc) - timedelta(days=7)
    elif period == "month":
        start_date = datetime.now(timezone.utc) - timedelta(days=30)
    elif period == "quarter":
        start_date = datetime.now(timezone.utc) - timedelta(days=90)
    else:
        start_date = datetime.now(timezone.utc) - timedelta(days=365)
    
    # Get payments in period
    payments = await db.payments.find(
        {"created_at": {"$gte": start_date.isoformat()}},
        {"_id": 0}
    ).to_list(10000)
    
    gmv = sum(p.get("amount", 0) for p in payments)
    platform_fees = gmv * 0.05  # 5% platform fee
    total_revenue = platform_fees
    transaction_count = len(payments)
    avg_transaction = gmv / transaction_count if transaction_count > 0 else 0
    
    # Revenue by category
    category_revenue = {}
    for payment in payments:
        if payment.get("task_id"):
            task = await db.tasks.find_one({"task_id": payment["task_id"]}, {"_id": 0, "category": 1})
            cat = task.get("category", "other") if task else "other"
            category_revenue[cat] = category_revenue.get(cat, 0) + payment.get("amount", 0)
    
    by_category = [
        {"category": cat, "revenue": rev, "percentage": round(rev / gmv * 100 if gmv > 0 else 0, 1)}
        for cat, rev in sorted(category_revenue.items(), key=lambda x: x[1], reverse=True)
    ]
    
    # Monthly trend (last 6 months)
    monthly_trend = []
    for i in range(5, -1, -1):
        month_start = datetime.now(timezone.utc).replace(day=1) - timedelta(days=30*i)
        month_end = month_start + timedelta(days=30)
        month_payments = [p for p in payments if month_start.isoformat() <= p.get("created_at", "") < month_end.isoformat()]
        monthly_trend.append({
            "month": month_start.strftime("%b"),
            "revenue": sum(p.get("amount", 0) for p in month_payments) * 0.05
        })
    
    max_monthly = max(m["revenue"] for m in monthly_trend) if monthly_trend else 1
    
    # Top customers
    customer_revenue = {}
    for payment in payments:
        company_id = payment.get("builder_company_id")
        if company_id:
            customer_revenue[company_id] = customer_revenue.get(company_id, {"revenue": 0, "transactions": 0})
            customer_revenue[company_id]["revenue"] += payment.get("amount", 0)
            customer_revenue[company_id]["transactions"] += 1
    
    top_customers = []
    for company_id, stats in sorted(customer_revenue.items(), key=lambda x: x[1]["revenue"], reverse=True)[:10]:
        company = await db.companies.find_one({"company_id": company_id}, {"_id": 0, "name": 1})
        user = await db.users.find_one({"company_id": company_id}, {"_id": 0, "first_name": 1, "last_name": 1})
        top_customers.append({
            "name": f"{user.get('first_name', '')} {user.get('last_name', '')}" if user else "Unknown",
            "company": company.get("name") if company else "Unknown",
            "transactions": stats["transactions"],
            "revenue": stats["revenue"]
        })
    
    return {
        "total_revenue": total_revenue,
        "revenue_change": 15.5,  # Simulated
        "platform_fees": platform_fees,
        "fee_rate": 5,
        "gmv": gmv,
        "gmv_change": 22.3,  # Simulated
        "avg_transaction": avg_transaction,
        "transaction_count": transaction_count,
        "by_category": by_category,
        "monthly_trend": monthly_trend,
        "max_monthly": max_monthly,
        "top_customers": top_customers
    }

@crm_router.get("/reports")
async def crm_list_reports(request: Request):
    await require_role(request, ["admin", "founder"])
    # Return empty list - reports are generated on demand
    return {"reports": []}

@crm_router.post("/reports/generate")
async def crm_generate_report(request: Request, data: dict):
    await require_role(request, ["admin", "founder"])
    
    report_type = data.get("type", "executive")
    period = data.get("period", "month")
    
    # Generate report based on type
    if report_type == "executive":
        title = "Executive Summary Report"
        summary = [
            {"label": "Total Revenue", "value": 45000, "type": "currency"},
            {"label": "New Customers", "value": 23, "type": "number"},
            {"label": "Active Projects", "value": 15, "type": "number"},
            {"label": "Conversion Rate", "value": "18%", "type": "text"}
        ]
        sections = [
            {
                "title": "Key Highlights",
                "type": "text",
                "content": "Platform performance has improved by 15% compared to the previous period. Customer acquisition is on track with targets."
            },
            {
                "title": "Top Performing Categories",
                "type": "table",
                "columns": ["Category", "Projects", "Revenue"],
                "rows": [
                    ["Concrete", "12", "$28,500"],
                    ["Electrical", "8", "$15,200"],
                    ["Plumbing", "6", "$9,800"]
                ]
            }
        ]
    else:
        title = f"{report_type.title()} Report"
        summary = []
        sections = []
    
    return {
        "title": title,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "period": period,
        "summary": summary,
        "sections": sections
    }

# ============== PROVIDER PAYOUT ROUTES ==============

@provider_router.get("/payouts")
async def provider_get_payouts(request: Request):
    user = await get_current_user(request)
    if user.get("role") != "provider":
        raise HTTPException(status_code=403, detail="Provider access only")
    
    company_id = user.get("company_id")
    
    # Get completed payments (payable)
    payments = await db.payments.find(
        {"provider_company_id": company_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Calculate stats
    available = sum(p.get("amount", 0) for p in payments if p.get("status") == "completed")
    pending = sum(p.get("amount", 0) for p in payments if p.get("status") in ["pending", "held"])
    total = sum(p.get("amount", 0) for p in payments)
    
    return {
        "payouts": payments,
        "stats": {
            "available": available,
            "pending": pending,
            "total": total
        }
    }

@provider_router.get("/stripe-status")
async def provider_stripe_status(request: Request):
    user = await get_current_user(request)
    company = await db.companies.find_one({"company_id": user.get("company_id")}, {"_id": 0})
    
    return {
        "connected": bool(company.get("stripe_connect_id") if company else False),
        "onboarding_url": None
    }

@provider_router.post("/stripe-onboard")
async def provider_stripe_onboard(request: Request, data: dict):
    user = await get_current_user(request)
    return_url = data.get("return_url", "")
    
    # In production, this would create a Stripe Connect onboarding link
    # For now, we'll simulate the response
    return {
        "url": return_url + "?stripe_onboarded=true",
        "message": "Stripe Connect onboarding initiated"
    }

@provider_router.post("/request-payout")
async def provider_request_payout(request: Request):
    user = await get_current_user(request)
    company_id = user.get("company_id")
    
    # Get available balance
    payments = await db.payments.find(
        {"provider_company_id": company_id, "status": "completed"},
        {"_id": 0, "amount": 1}
    ).to_list(100)
    
    available = sum(p.get("amount", 0) for p in payments)
    
    if available <= 0:
        raise HTTPException(status_code=400, detail="No available balance to withdraw")
    
    # Create payout record (in production, this would initiate a Stripe transfer)
    payout = {
        "payout_id": f"payout_{uuid.uuid4().hex[:12]}",
        "company_id": company_id,
        "amount": available,
        "status": "processing",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.payouts.insert_one(payout)
    
    return {"message": "Payout request submitted", "payout_id": payout["payout_id"]}

# ============== WEBSOCKET CHAT ==============

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}  # room_id -> {user_id: websocket}
    
    async def connect(self, websocket: WebSocket, room_id: str, user_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = {}
        self.active_connections[room_id][user_id] = websocket
    
    def disconnect(self, room_id: str, user_id: str):
        if room_id in self.active_connections:
            self.active_connections[room_id].pop(user_id, None)
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]
    
    async def send_personal(self, message: dict, room_id: str, user_id: str):
        if room_id in self.active_connections and user_id in self.active_connections[room_id]:
            await self.active_connections[room_id][user_id].send_json(message)
    
    async def broadcast(self, message: dict, room_id: str, exclude_user: str = None):
        if room_id in self.active_connections:
            for user_id, connection in self.active_connections[room_id].items():
                if user_id != exclude_user:
                    try:
                        await connection.send_json(message)
                    except:
                        pass

manager = ConnectionManager()

@app.websocket("/ws/chat/{room_id}")
async def websocket_chat(websocket: WebSocket, room_id: str, token: str = None):
    """WebSocket endpoint for real-time chat"""
    # Authenticate user
    user_id = None
    user_name = "Anonymous"
    try:
        if token:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id = payload.get("user_id")
            user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
            if user:
                user_name = f"{user.get('first_name', '')} {user.get('last_name', '')}"
    except:
        pass
    
    if not user_id:
        await websocket.close(code=4001)
        return
    
    await manager.connect(websocket, room_id, user_id)
    
    # Notify room of new user
    await manager.broadcast({
        "type": "user_joined",
        "user_id": user_id,
        "user_name": user_name,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }, room_id, exclude_user=user_id)
    
    try:
        while True:
            data = await websocket.receive_json()
            
            # Store message in database
            message = {
                "message_id": f"msg_{uuid.uuid4().hex[:12]}",
                "room_id": room_id,
                "sender_id": user_id,
                "sender_name": user_name,
                "content": data.get("content", ""),
                "type": data.get("type", "text"),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.chat_messages.insert_one(message)
            
            # Broadcast to room
            await manager.broadcast({
                "type": "message",
                **{k: v for k, v in message.items() if k != "_id"}
            }, room_id)
            
    except WebSocketDisconnect:
        manager.disconnect(room_id, user_id)
        await manager.broadcast({
            "type": "user_left",
            "user_id": user_id,
            "user_name": user_name,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }, room_id)

@chat_router.get("/rooms")
async def get_chat_rooms(request: Request):
    """Get user's chat rooms"""
    user = await get_current_user(request)
    user_id = user["user_id"]
    company_id = user.get("company_id")
    
    # Find rooms user is part of (via contracts)
    rooms = []
    
    if user.get("role") == "builder":
        contracts = await db.contracts.find({"builder_company_id": company_id}, {"_id": 0}).to_list(100)
    else:
        contracts = await db.contracts.find({"provider_company_id": company_id}, {"_id": 0}).to_list(100)
    
    for contract in contracts:
        room_id = f"contract_{contract['contract_id']}"
        last_message = await db.chat_messages.find_one(
            {"room_id": room_id}, 
            {"_id": 0},
            sort=[("created_at", -1)]
        )
        
        # Get other party info
        other_company_id = contract["provider_company_id"] if user.get("role") == "builder" else contract["builder_company_id"]
        other_company = await db.companies.find_one({"company_id": other_company_id}, {"_id": 0, "name": 1})
        
        rooms.append({
            "room_id": room_id,
            "contract_id": contract["contract_id"],
            "other_party": other_company.get("name") if other_company else "Unknown",
            "last_message": last_message,
            "unread_count": 0  # Could implement read receipts
        })
    
    return {"rooms": rooms}

@chat_router.get("/rooms/{room_id}/messages")
async def get_chat_messages(request: Request, room_id: str, limit: int = 50, before: str = None):
    """Get messages for a chat room"""
    await get_current_user(request)
    
    query = {"room_id": room_id}
    if before:
        query["created_at"] = {"$lt": before}
    
    messages = await db.chat_messages.find(query, {"_id": 0}).sort("created_at", -1).limit(limit).to_list(limit)
    messages.reverse()  # Oldest first
    
    return {"messages": messages}

# ============== FILE UPLOAD ==============

ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

@files_router.post("/upload")
async def upload_file(request: Request, file: UploadFile = File(...), category: str = "general"):
    """Upload a file (photos, documents)"""
    user = await get_current_user(request)
    
    # Validate file extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type not allowed. Allowed: {ALLOWED_EXTENSIONS}")
    
    # Read and validate size
    contents = await file.read()
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File too large. Max size: {MAX_FILE_SIZE // (1024*1024)}MB")
    
    # Generate unique filename
    file_id = f"file_{uuid.uuid4().hex[:12]}"
    filename = f"{file_id}{ext}"
    file_path = UPLOAD_DIR / category / filename
    file_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(contents)
    
    # Store file metadata
    file_record = {
        "file_id": file_id,
        "original_name": file.filename,
        "filename": filename,
        "category": category,
        "content_type": file.content_type,
        "size": len(contents),
        "uploaded_by": user["user_id"],
        "company_id": user.get("company_id"),
        "path": str(file_path),
        "url": f"/api/files/{file_id}",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.files.insert_one(file_record)
    
    return {
        "file_id": file_id,
        "url": file_record["url"],
        "filename": file.filename,
        "size": len(contents)
    }

@files_router.get("/{file_id}")
async def get_file(file_id: str):
    """Download/view a file"""
    file_record = await db.files.find_one({"file_id": file_id}, {"_id": 0})
    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")
    
    file_path = Path(file_record["path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        path=str(file_path),
        filename=file_record["original_name"],
        media_type=file_record.get("content_type", "application/octet-stream")
    )

@files_router.post("/work-diary/{work_order_id}/photos")
async def upload_work_diary_photos(request: Request, work_order_id: str, photos: List[UploadFile] = File(...)):
    """Upload photos to work diary"""
    user = await get_current_user(request)
    
    # Verify work order exists and user has access
    work_order = await db.work_orders.find_one({"work_order_id": work_order_id}, {"_id": 0})
    if not work_order:
        raise HTTPException(status_code=404, detail="Work order not found")
    
    uploaded_files = []
    for photo in photos[:10]:  # Max 10 photos per upload
        ext = Path(photo.filename).suffix.lower()
        if ext not in {'.jpg', '.jpeg', '.png', '.gif'}:
            continue
        
        contents = await photo.read()
        if len(contents) > MAX_FILE_SIZE:
            continue
        
        file_id = f"photo_{uuid.uuid4().hex[:12]}"
        filename = f"{file_id}{ext}"
        file_path = UPLOAD_DIR / "work_diary" / work_order_id / filename
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(contents)
        
        file_record = {
            "file_id": file_id,
            "work_order_id": work_order_id,
            "original_name": photo.filename,
            "filename": filename,
            "category": "work_diary",
            "content_type": photo.content_type,
            "size": len(contents),
            "uploaded_by": user["user_id"],
            "path": str(file_path),
            "url": f"/api/files/{file_id}",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.files.insert_one(file_record)
        uploaded_files.append({"file_id": file_id, "url": file_record["url"]})
    
    # Create work diary entry
    if uploaded_files:
        diary_entry = {
            "entry_id": f"diary_{uuid.uuid4().hex[:12]}",
            "work_order_id": work_order_id,
            "type": "photo_upload",
            "photos": uploaded_files,
            "note": f"Uploaded {len(uploaded_files)} photos",
            "created_by": user["user_id"],
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.work_diary_entries.insert_one(diary_entry)
    
    return {"uploaded": uploaded_files, "count": len(uploaded_files)}

# ============== TWO-FACTOR AUTHENTICATION ==============

@twofa_router.post("/setup")
async def setup_2fa(request: Request):
    """Initialize 2FA setup - returns QR code"""
    user = await get_current_user(request)
    
    # Generate secret
    secret = pyotp.random_base32()
    
    # Store temporarily (will be confirmed on verification)
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"totp_secret_pending": secret}}
    )
    
    # Generate provisioning URI
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=user["email"],
        issuer_name="ConstructMarket"
    )
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return {
        "secret": secret,
        "qr_code": f"data:image/png;base64,{qr_base64}",
        "manual_entry_key": secret
    }

@twofa_router.post("/verify")
async def verify_2fa_setup(request: Request, data: dict):
    """Verify and activate 2FA"""
    user = await get_current_user(request)
    code = data.get("code", "")
    
    user_record = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    secret = user_record.get("totp_secret_pending")
    
    if not secret:
        raise HTTPException(status_code=400, detail="2FA setup not initialized")
    
    totp = pyotp.TOTP(secret)
    if not totp.verify(code):
        raise HTTPException(status_code=400, detail="Invalid verification code")
    
    # Activate 2FA
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {
            "$set": {"totp_secret": secret, "two_factor_enabled": True},
            "$unset": {"totp_secret_pending": ""}
        }
    )
    
    # Generate backup codes
    backup_codes = [uuid.uuid4().hex[:8].upper() for _ in range(10)]
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {"$set": {"backup_codes": [bcrypt.hashpw(c.encode(), bcrypt.gensalt()).decode() for c in backup_codes]}}
    )
    
    return {
        "message": "2FA enabled successfully",
        "backup_codes": backup_codes  # Show only once
    }

@twofa_router.post("/validate")
async def validate_2fa(data: dict):
    """Validate 2FA code during login"""
    user_id = data.get("user_id")
    code = data.get("code", "")
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user or not user.get("two_factor_enabled"):
        raise HTTPException(status_code=400, detail="2FA not enabled for this user")
    
    totp = pyotp.TOTP(user["totp_secret"])
    if totp.verify(code):
        # Generate new token
        token = create_token(user["user_id"], user["email"], user["role"], user.get("company_id"))
        return {"token": token, "valid": True}
    
    # Check backup codes
    for i, hashed in enumerate(user.get("backup_codes", [])):
        if bcrypt.checkpw(code.upper().encode(), hashed.encode()):
            # Remove used backup code
            backup_codes = user["backup_codes"]
            backup_codes.pop(i)
            await db.users.update_one(
                {"user_id": user_id},
                {"$set": {"backup_codes": backup_codes}}
            )
            token = create_token(user["user_id"], user["email"], user["role"], user.get("company_id"))
            return {"token": token, "valid": True, "backup_code_used": True}
    
    raise HTTPException(status_code=401, detail="Invalid 2FA code")

@twofa_router.delete("/disable")
async def disable_2fa(request: Request, data: dict):
    """Disable 2FA"""
    user = await get_current_user(request)
    password = data.get("password", "")
    
    user_record = await db.users.find_one({"user_id": user["user_id"]}, {"_id": 0})
    if not bcrypt.checkpw(password.encode(), user_record.get("password_hash", "").encode()):
        raise HTTPException(status_code=401, detail="Invalid password")
    
    await db.users.update_one(
        {"user_id": user["user_id"]},
        {
            "$unset": {"totp_secret": "", "backup_codes": ""},
            "$set": {"two_factor_enabled": False}
        }
    )
    
    return {"message": "2FA disabled successfully"}

# ============== PDF CONTRACT EXPORT ==============

@contracts_router.get("/{contract_id}/pdf")
async def export_contract_pdf(request: Request, contract_id: str):
    """Export contract as PDF"""
    user = await get_current_user(request)
    
    contract = await db.contracts.find_one({"contract_id": contract_id}, {"_id": 0})
    if not contract:
        raise HTTPException(status_code=404, detail="Contract not found")
    
    # Verify access
    user_company = user.get("company_id")
    if user_company not in [contract.get("builder_company_id"), contract.get("provider_company_id")]:
        if user.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Access denied")
    
    # Get related data
    task = await db.tasks.find_one({"task_id": contract.get("task_id")}, {"_id": 0})
    builder_company = await db.companies.find_one({"company_id": contract.get("builder_company_id")}, {"_id": 0})
    provider_company = await db.companies.find_one({"company_id": contract.get("provider_company_id")}, {"_id": 0})
    
    # Generate PDF HTML
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }}
            .header {{ text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 20px; margin-bottom: 30px; }}
            .header h1 {{ color: #0d9488; margin: 0; }}
            .section {{ margin-bottom: 25px; }}
            .section h2 {{ color: #334155; font-size: 16px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }}
            .parties {{ display: flex; justify-content: space-between; }}
            .party {{ width: 45%; }}
            .detail-row {{ display: flex; margin-bottom: 8px; }}
            .detail-label {{ font-weight: bold; width: 150px; }}
            .signature-section {{ margin-top: 50px; page-break-inside: avoid; }}
            .signature-box {{ border-top: 1px solid #000; width: 250px; margin-top: 50px; padding-top: 10px; }}
            .footer {{ margin-top: 50px; text-align: center; font-size: 12px; color: #64748b; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>CONSTRUCTION SERVICE AGREEMENT</h1>
            <p>Contract ID: {contract_id}</p>
            <p>Date: {datetime.now().strftime('%B %d, %Y')}</p>
        </div>
        
        <div class="section">
            <h2>PARTIES</h2>
            <div class="parties">
                <div class="party">
                    <strong>BUILDER (Principal)</strong><br>
                    {builder_company.get('name', 'N/A') if builder_company else 'N/A'}<br>
                    ABN: {builder_company.get('abn', 'N/A') if builder_company else 'N/A'}
                </div>
                <div class="party">
                    <strong>PROVIDER (Contractor)</strong><br>
                    {provider_company.get('name', 'N/A') if provider_company else 'N/A'}<br>
                    ABN: {provider_company.get('abn', 'N/A') if provider_company else 'N/A'}
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>PROJECT DETAILS</h2>
            <div class="detail-row"><span class="detail-label">Project:</span> {task.get('title', 'N/A') if task else 'N/A'}</div>
            <div class="detail-row"><span class="detail-label">Location:</span> {task.get('location_city', '')}, {task.get('location_state', '') if task else 'N/A'}</div>
            <div class="detail-row"><span class="detail-label">Category:</span> {task.get('category', 'N/A').replace('_', ' ').title() if task else 'N/A'}</div>
        </div>
        
        <div class="section">
            <h2>CONTRACT TERMS</h2>
            <div class="detail-row"><span class="detail-label">Contract Price:</span> ${contract.get('price', 0):,.2f} AUD</div>
            <div class="detail-row"><span class="detail-label">Start Date:</span> {contract.get('start_date', 'TBD')}</div>
            <div class="detail-row"><span class="detail-label">End Date:</span> {contract.get('end_date', 'TBD')}</div>
            <div class="detail-row"><span class="detail-label">Status:</span> {contract.get('status', '').replace('_', ' ').title()}</div>
        </div>
        
        <div class="section">
            <h2>SCOPE OF WORK</h2>
            <p>{task.get('scope', task.get('description', 'As per project specifications')) if task else 'As per project specifications'}</p>
        </div>
        
        <div class="signature-section">
            <h2>SIGNATURES</h2>
            <div class="parties">
                <div class="party">
                    <div class="signature-box">
                        <strong>Builder Signature</strong><br>
                        {'Signed: ' + contract.get('builder_signed_at', '')[:10] if contract.get('builder_signed_at') else 'Pending'}
                    </div>
                </div>
                <div class="party">
                    <div class="signature-box">
                        <strong>Provider Signature</strong><br>
                        {'Signed: ' + contract.get('provider_signed_at', '')[:10] if contract.get('provider_signed_at') else 'Pending'}
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Generated by ConstructMarket | {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>
        </div>
    </body>
    </html>
    """
    
    # Generate PDF
    pdf_buffer = io.BytesIO()
    HTML(string=html_content).write_pdf(pdf_buffer)
    pdf_buffer.seek(0)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=contract_{contract_id}.pdf"}
    )

# ============== VERIFICATION BADGES ==============

BADGE_TYPES = {
    "verified_identity": {"name": "Identity Verified", "icon": "shield-check", "color": "green"},
    "verified_licence": {"name": "Licensed Professional", "icon": "award", "color": "blue"},
    "verified_insurance": {"name": "Fully Insured", "icon": "shield", "color": "purple"},
    "top_rated": {"name": "Top Rated", "icon": "star", "color": "gold"},
    "trusted_builder": {"name": "Trusted Builder", "icon": "building", "color": "teal"},
    "premium_provider": {"name": "Premium Provider", "icon": "badge-check", "color": "orange"},
    "founding_member": {"name": "Founding Member", "icon": "crown", "color": "amber"}
}

@users_router.get("/{user_id}/badges")
async def get_user_badges(user_id: str):
    """Get user's verification badges"""
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    badges = []
    company_id = user.get("company_id")
    
    # Check identity verification
    if user.get("profile_verified"):
        badges.append({**BADGE_TYPES["verified_identity"], "earned_at": user.get("verified_at")})
    
    if company_id:
        # Check licence verification
        licence = await db.licences.find_one({"company_id": company_id, "status": "approved"}, {"_id": 0})
        if licence:
            badges.append({**BADGE_TYPES["verified_licence"], "earned_at": licence.get("verified_at")})
        
        # Check insurance verification
        insurance = await db.insurance.find_one({"company_id": company_id, "status": "approved"}, {"_id": 0})
        if insurance:
            badges.append({**BADGE_TYPES["verified_insurance"], "earned_at": insurance.get("verified_at")})
        
        # Check rating
        ratings = await db.ratings.find({"provider_company_id": company_id}, {"_id": 0, "rating": 1}).to_list(100)
        if ratings:
            avg_rating = sum(r["rating"] for r in ratings) / len(ratings)
            if avg_rating >= 4.5 and len(ratings) >= 5:
                badges.append({**BADGE_TYPES["top_rated"], "rating": avg_rating, "review_count": len(ratings)})
        
        # Check completed contracts
        completed = await db.contracts.count_documents({"provider_company_id": company_id, "status": "completed"})
        if completed >= 10 and user.get("role") == "provider":
            badges.append({**BADGE_TYPES["premium_provider"], "completed_contracts": completed})
        if completed >= 10 and user.get("role") == "builder":
            badges.append({**BADGE_TYPES["trusted_builder"], "completed_contracts": completed})
    
    # Check founding member (early signup)
    if user.get("created_at"):
        created = datetime.fromisoformat(user["created_at"].replace("Z", "+00:00"))
        if created < datetime(2026, 6, 1, tzinfo=timezone.utc):
            badges.append({**BADGE_TYPES["founding_member"], "earned_at": user["created_at"]})
    
    return {"badges": badges, "badge_count": len(badges)}

@admin_router.post("/users/{user_id}/badges")
async def award_badge(request: Request, user_id: str, data: dict):
    """Admin: Award a badge to user"""
    await require_role(request, ["admin"])
    
    badge_type = data.get("badge_type")
    if badge_type not in BADGE_TYPES:
        raise HTTPException(status_code=400, detail="Invalid badge type")
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Add custom badge
    badge = {
        "badge_id": f"badge_{uuid.uuid4().hex[:12]}",
        "user_id": user_id,
        "badge_type": badge_type,
        **BADGE_TYPES[badge_type],
        "awarded_by": "admin",
        "awarded_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_badges.insert_one(badge)
    
    return {"message": "Badge awarded", "badge": {k: v for k, v in badge.items() if k != "_id"}}

@companies_router.get("/{company_id}/verification-status")
async def get_company_verification_status(company_id: str):
    """Get company's verification status"""
    company = await db.companies.find_one({"company_id": company_id}, {"_id": 0})
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    
    # Check all verifications
    licence = await db.licences.find_one({"company_id": company_id}, {"_id": 0, "status": 1, "licence_type": 1})
    insurance = await db.insurance.find_one({"company_id": company_id}, {"_id": 0, "status": 1, "coverage_amount": 1})
    
    verification_score = 0
    verifications = []
    
    if company.get("is_verified"):
        verification_score += 25
        verifications.append({"type": "company", "status": "verified", "label": "Company Verified"})
    else:
        verifications.append({"type": "company", "status": "pending", "label": "Company Verification Pending"})
    
    if licence and licence.get("status") == "approved":
        verification_score += 35
        verifications.append({"type": "licence", "status": "verified", "label": f"Licensed ({licence.get('licence_type', 'Trade')})"})
    elif licence:
        verifications.append({"type": "licence", "status": licence.get("status", "pending"), "label": "Licence Verification In Progress"})
    else:
        verifications.append({"type": "licence", "status": "missing", "label": "No Licence Submitted"})
    
    if insurance and insurance.get("status") == "approved":
        verification_score += 40
        verifications.append({"type": "insurance", "status": "verified", "label": f"Insured (${insurance.get('coverage_amount', 0):,.0f})"})
    elif insurance:
        verifications.append({"type": "insurance", "status": insurance.get("status", "pending"), "label": "Insurance Verification In Progress"})
    else:
        verifications.append({"type": "insurance", "status": "missing", "label": "No Insurance Submitted"})
    
    # Determine trust level
    trust_level = "unverified"
    if verification_score >= 90:
        trust_level = "fully_verified"
    elif verification_score >= 50:
        trust_level = "partially_verified"
    elif verification_score >= 25:
        trust_level = "basic_verified"
    
    return {
        "company_id": company_id,
        "company_name": company.get("name"),
        "verification_score": verification_score,
        "trust_level": trust_level,
        "verifications": verifications,
        "badge_eligible": verification_score >= 90
    }

# ============== PUSH NOTIFICATIONS ==============

@notifications_router.post("/subscribe")
async def subscribe_push(request: Request, data: dict):
    """Subscribe to push notifications"""
    user = await get_current_user(request)
    
    subscription = {
        "subscription_id": f"sub_{uuid.uuid4().hex[:12]}",
        "user_id": user["user_id"],
        "endpoint": data.get("endpoint"),
        "keys": data.get("keys"),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    # Upsert subscription
    await db.push_subscriptions.update_one(
        {"user_id": user["user_id"], "endpoint": data.get("endpoint")},
        {"$set": subscription},
        upsert=True
    )
    
    return {"message": "Subscribed to push notifications"}

@notifications_router.delete("/subscribe")
async def unsubscribe_push(request: Request, data: dict):
    """Unsubscribe from push notifications"""
    user = await get_current_user(request)
    
    await db.push_subscriptions.delete_one({
        "user_id": user["user_id"],
        "endpoint": data.get("endpoint")
    })
    
    return {"message": "Unsubscribed from push notifications"}

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
api_router.include_router(marketplace_router)
api_router.include_router(crm_router)
api_router.include_router(provider_router)
api_router.include_router(chat_router)
api_router.include_router(files_router)
api_router.include_router(twofa_router)

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
