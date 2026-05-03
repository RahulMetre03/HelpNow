import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr


# --- Auth Schemas ---
class UserSignup(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "patient"  # patient | therapist
    city: str | None = None


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    avatar_url: str | None = None
    city: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


# --- Therapist Schemas ---
class TherapistSignupExtra(BaseModel):
    specialization: str
    license_number: str
    bio: str | None = None
    experience_years: int = 0


class TherapistUpdate(BaseModel):
    specialization: str | None = None
    bio: str | None = None
    experience_years: int | None = None
    city: str | None = None


class TherapistResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    specialization: str
    license_number: str
    bio: str | None = None
    experience_years: int
    rating: float
    city: str | None = None
    user: UserResponse | None = None

    class Config:
        from_attributes = True


class AvailabilitySlot(BaseModel):
    day_of_week: int  # 0=Mon, 6=Sun
    start_time: str   # "09:00"
    end_time: str     # "17:00"


class AvailabilityResponse(BaseModel):
    id: uuid.UUID
    therapist_id: uuid.UUID
    day_of_week: int
    start_time: str
    end_time: str

    class Config:
        from_attributes = True


class TherapistDetailResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    specialization: str
    license_number: str
    bio: str | None = None
    experience_years: int
    rating: float
    city: str | None = None
    user: UserResponse | None = None
    availability_slots: list[AvailabilityResponse] = []

    class Config:
        from_attributes = True


# --- Appointment Schemas ---
class AppointmentCreate(BaseModel):
    therapist_id: uuid.UUID
    scheduled_at: datetime
    duration_minutes: int = 60
    notes: str | None = None


class AppointmentUpdate(BaseModel):
    status: str | None = None  # pending | confirmed | completed | cancelled
    notes: str | None = None


class AppointmentResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    therapist_id: uuid.UUID
    scheduled_at: datetime
    duration_minutes: int
    status: str
    notes: str | None = None
    created_at: datetime
    therapist: TherapistResponse | None = None
    user: UserResponse | None = None

    class Config:
        from_attributes = True


# --- Chat Schemas ---
class ChatSessionCreate(BaseModel):
    appointment_id: uuid.UUID
    title: str = "New Chat"


class ChatSessionUpdate(BaseModel):
    title: str


class ChatSessionResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    appointment_id: uuid.UUID | None = None
    title: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    sender: str
    content: str
    sent_at: datetime

    class Config:
        from_attributes = True


class ChatSendMessage(BaseModel):
    content: str
