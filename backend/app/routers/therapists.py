from datetime import time
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.user import User
from app.models.therapist import Therapist, TherapistAvailability
from app.schemas.schemas import (
    TherapistDetailResponse, TherapistResponse, AvailabilitySlot,
    AvailabilityResponse, UserResponse,
)
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/therapists", tags=["Therapists"])


@router.get("/", response_model=list[TherapistDetailResponse])
async def list_therapists(
    specialization: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Therapist).options(
        selectinload(Therapist.user),
        selectinload(Therapist.availability_slots),
    )
    if specialization:
        query = query.where(Therapist.specialization.ilike(f"%{specialization}%"))

    result = await db.execute(query)
    therapists = result.scalars().all()

    response = []
    for t in therapists:
        slots = [
            AvailabilityResponse(
                id=s.id,
                therapist_id=s.therapist_id,
                day_of_week=s.day_of_week,
                start_time=s.start_time.strftime("%H:%M") if isinstance(s.start_time, time) else str(s.start_time),
                end_time=s.end_time.strftime("%H:%M") if isinstance(s.end_time, time) else str(s.end_time),
            )
            for s in t.availability_slots
        ]
        response.append(TherapistDetailResponse(
            id=t.id,
            user_id=t.user_id,
            specialization=t.specialization,
            license_number=t.license_number,
            bio=t.bio,
            experience_years=t.experience_years,
            rating=t.rating,
            user=UserResponse.model_validate(t.user) if t.user else None,
            availability_slots=slots,
        ))
    return response


@router.get("/{therapist_id}", response_model=TherapistDetailResponse)
async def get_therapist(therapist_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Therapist)
        .options(selectinload(Therapist.user), selectinload(Therapist.availability_slots))
        .where(Therapist.id == therapist_id)
    )
    therapist = result.scalar_one_or_none()
    if not therapist:
        raise HTTPException(status_code=404, detail="Therapist not found")

    slots = [
        AvailabilityResponse(
            id=s.id,
            therapist_id=s.therapist_id,
            day_of_week=s.day_of_week,
            start_time=s.start_time.strftime("%H:%M") if isinstance(s.start_time, time) else str(s.start_time),
            end_time=s.end_time.strftime("%H:%M") if isinstance(s.end_time, time) else str(s.end_time),
        )
        for s in therapist.availability_slots
    ]
    return TherapistDetailResponse(
        id=therapist.id,
        user_id=therapist.user_id,
        specialization=therapist.specialization,
        license_number=therapist.license_number,
        bio=therapist.bio,
        experience_years=therapist.experience_years,
        rating=therapist.rating,
        user=UserResponse.model_validate(therapist.user) if therapist.user else None,
        availability_slots=slots,
    )


@router.get("/me", response_model=TherapistDetailResponse)
async def get_my_therapist_profile(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    if current_user.role != "therapist":
        raise HTTPException(status_code=403, detail="Not a therapist")
    
    result = await db.execute(
        select(Therapist).options(selectinload(Therapist.user), selectinload(Therapist.availability_slots)).where(Therapist.user_id == current_user.id)
    )
    therapist = result.scalar_one_or_none()
    if not therapist:
        raise HTTPException(status_code=404, detail="Profile not found")

    slots = [
        AvailabilityResponse(id=s.id, therapist_id=s.therapist_id, day_of_week=s.day_of_week, start_time=s.start_time.strftime("%H:%M") if isinstance(s.start_time, time) else str(s.start_time), end_time=s.end_time.strftime("%H:%M") if isinstance(s.end_time, time) else str(s.end_time))
        for s in therapist.availability_slots
    ]
    return TherapistDetailResponse(id=therapist.id, user_id=therapist.user_id, specialization=therapist.specialization, license_number=therapist.license_number, bio=therapist.bio, experience_years=therapist.experience_years, rating=therapist.rating, user=UserResponse.model_validate(therapist.user) if therapist.user else None, availability_slots=slots)

@router.put("/availability", response_model=list[AvailabilityResponse])
async def set_availability(
    slots: list[AvailabilitySlot],
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "therapist":
        raise HTTPException(status_code=403, detail="Only therapists can set availability")

    # Get therapist profile
    result = await db.execute(
        select(Therapist).where(Therapist.user_id == current_user.id)
    )
    therapist = result.scalar_one_or_none()
    if not therapist:
        raise HTTPException(status_code=404, detail="Therapist profile not found")

    # Clear existing slots
    existing = await db.execute(
        select(TherapistAvailability).where(TherapistAvailability.therapist_id == therapist.id)
    )
    for slot in existing.scalars().all():
        await db.delete(slot)

    # Create new slots
    new_slots = []
    for s in slots:
        slot = TherapistAvailability(
            therapist_id=therapist.id,
            day_of_week=s.day_of_week,
            start_time=time.fromisoformat(s.start_time),
            end_time=time.fromisoformat(s.end_time),
        )
        db.add(slot)
        new_slots.append(slot)

    await db.commit()
    for s in new_slots:
        await db.refresh(s)

    return [
        AvailabilityResponse(
            id=s.id,
            therapist_id=s.therapist_id,
            day_of_week=s.day_of_week,
            start_time=s.start_time.strftime("%H:%M") if isinstance(s.start_time, time) else str(s.start_time),
            end_time=s.end_time.strftime("%H:%M") if isinstance(s.end_time, time) else str(s.end_time),
        )
        for s in new_slots
    ]

@router.patch("/me", response_model=TherapistDetailResponse)
async def update_therapist_profile(
    data: __import__('app.schemas.schemas', fromlist=['TherapistUpdate']).TherapistUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role != "therapist":
        raise HTTPException(status_code=403, detail="Only therapists can update their profile")

    result = await db.execute(
        select(Therapist).options(selectinload(Therapist.user), selectinload(Therapist.availability_slots)).where(Therapist.user_id == current_user.id)
    )
    therapist = result.scalar_one_or_none()
    if not therapist:
        raise HTTPException(status_code=404, detail="Therapist profile not found")

    if data.specialization is not None:
        therapist.specialization = data.specialization
    if data.bio is not None:
        therapist.bio = data.bio
    if data.experience_years is not None:
        therapist.experience_years = data.experience_years

    await db.commit()
    await db.refresh(therapist)

    slots = [
        AvailabilityResponse(
            id=s.id,
            therapist_id=s.therapist_id,
            day_of_week=s.day_of_week,
            start_time=s.start_time.strftime("%H:%M") if isinstance(s.start_time, time) else str(s.start_time),
            end_time=s.end_time.strftime("%H:%M") if isinstance(s.end_time, time) else str(s.end_time),
        )
        for s in therapist.availability_slots
    ]

    return TherapistDetailResponse(
        id=therapist.id,
        user_id=therapist.user_id,
        specialization=therapist.specialization,
        license_number=therapist.license_number,
        bio=therapist.bio,
        experience_years=therapist.experience_years,
        rating=therapist.rating,
        user=UserResponse.model_validate(therapist.user) if therapist.user else None,
        availability_slots=slots,
    )
