from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.appointment import Appointment
from app.models.therapist import Therapist
from app.schemas.schemas import (
    AppointmentCreate, AppointmentUpdate, AppointmentResponse,
    TherapistResponse, UserResponse,
)
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])


@router.post("/", response_model=AppointmentResponse)
async def create_appointment(
    data: AppointmentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify therapist exists
    result = await db.execute(select(Therapist).where(Therapist.id == data.therapist_id))
    therapist = result.scalar_one_or_none()
    if not therapist:
        raise HTTPException(status_code=404, detail="Therapist not found")

    appointment = Appointment(
        user_id=current_user.id,
        therapist_id=data.therapist_id,
        scheduled_at=data.scheduled_at,
        duration_minutes=data.duration_minutes,
        notes=data.notes,
    )
    db.add(appointment)
    await db.commit()
    await db.refresh(appointment)

    return AppointmentResponse(
        id=appointment.id,
        user_id=appointment.user_id,
        therapist_id=appointment.therapist_id,
        scheduled_at=appointment.scheduled_at,
        duration_minutes=appointment.duration_minutes,
        status=appointment.status,
        notes=appointment.notes,
        created_at=appointment.created_at,
    )


@router.get("/", response_model=list[AppointmentResponse])
async def list_appointments(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role == "therapist":
        # Get therapist's appointments
        therapist_result = await db.execute(
            select(Therapist).where(Therapist.user_id == current_user.id)
        )
        therapist = therapist_result.scalar_one_or_none()
        if not therapist:
            return []
        query = select(Appointment).where(Appointment.therapist_id == therapist.id)
    else:
        query = select(Appointment).where(Appointment.user_id == current_user.id)

    query = query.options(selectinload(Appointment.therapist).selectinload(Therapist.user), selectinload(Appointment.user))
    query = query.order_by(Appointment.scheduled_at.desc())
    result = await db.execute(query)
    appointments = result.scalars().all()

    response = []
    for a in appointments:
        therapist_resp = None
        if a.therapist and a.therapist.user:
            therapist_resp = TherapistResponse(
                id=a.therapist.id,
                user_id=a.therapist.user_id,
                specialization=a.therapist.specialization,
                license_number=a.therapist.license_number,
                bio=a.therapist.bio,
                experience_years=a.therapist.experience_years,
                rating=a.therapist.rating,
                user=UserResponse.model_validate(a.therapist.user),
            )
        response.append(AppointmentResponse(
            id=a.id,
            user_id=a.user_id,
            therapist_id=a.therapist_id,
            scheduled_at=a.scheduled_at,
            duration_minutes=a.duration_minutes,
            status=a.status,
            notes=a.notes,
            created_at=a.created_at,
            therapist=therapist_resp,
            user=UserResponse.model_validate(a.user) if a.user else None,
        ))
    return response


@router.patch("/{appointment_id}", response_model=AppointmentResponse)
async def update_appointment(
    appointment_id: str,
    data: AppointmentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Appointment).where(Appointment.id == appointment_id)
    )
    appointment = result.scalar_one_or_none()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Verify ownership
    if appointment.user_id != current_user.id:
        # Check if current user is the therapist
        therapist_result = await db.execute(
            select(Therapist).where(Therapist.user_id == current_user.id)
        )
        therapist = therapist_result.scalar_one_or_none()
        if not therapist or appointment.therapist_id != therapist.id:
            raise HTTPException(status_code=403, detail="Not authorized")

    if data.status:
        appointment.status = data.status
    if data.notes is not None:
        appointment.notes = data.notes

    await db.commit()
    await db.refresh(appointment)

    return AppointmentResponse(
        id=appointment.id,
        user_id=appointment.user_id,
        therapist_id=appointment.therapist_id,
        scheduled_at=appointment.scheduled_at,
        duration_minutes=appointment.duration_minutes,
        status=appointment.status,
        notes=appointment.notes,
        created_at=appointment.created_at,
    )
