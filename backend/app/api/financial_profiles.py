# app/api/financial_profiles.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Annotated
from uuid import UUID

from app.db.database import get_db
from app.models.user import User
from app.models.financial_profile import FinancialProfile
from app.schemas.financial_profile import (
    FinancialProfileCreate,
    FinancialProfileUpdate,
    FinancialProfileResponse,
    FinancialProfileListResponse,
    MainProfileUpdate,
    MainProfileResponse,
)
from app.api.dependencies import get_current_user

router = APIRouter()


@router.get(
    "/",
    response_model=FinancialProfileListResponse,
    summary="List financial profiles",
    description="Retrieve all financial profiles for the authenticated user",
    responses={
        200: {
            "description": "List of financial profiles retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "profiles": [
                            {
                                "id": "550e8400-e29b-41d4-a716-446655440000",
                                "user_id": "550e8400-e29b-41d4-a716-446655440001",
                                "name": "Personal Finance",
                                "description": "My personal financial tracking",
                                "profile_type": "personal",
                                "default_currency": "EUR",
                                "database_connection_string": None,
                                "database_type": None,
                                "is_active": True,
                                "created_at": "2025-01-15T10:30:00Z",
                                "updated_at": "2025-01-20T14:22:00Z",
                                "is_available": True
                            }
                        ],
                        "total": 1
                    }
                }
            }
        }
    },
    tags=["Financial Profiles"]
)
async def list_profiles(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FinancialProfileListResponse:
    """
    List all financial profiles for the current user.

    Returns:
        FinancialProfileListResponse with all user's profiles and total count
    """
    profiles = db.query(FinancialProfile).filter(
        FinancialProfile.user_id == current_user.id
    ).all()
    return FinancialProfileListResponse(profiles=profiles, total=len(profiles))


@router.post(
    "/",
    response_model=FinancialProfileResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new financial profile",
    description="Create a new financial profile for the authenticated user",
    responses={
        201: {"description": "Financial profile created successfully"},
    },
    tags=["Financial Profiles"]
)
async def create_profile(
    profile_in: FinancialProfileCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FinancialProfileResponse:
    """
    Create a new financial profile.

    Args:
        profile_in: Financial profile creation data

    Returns:
        Created financial profile with generated ID
    """
    profile = FinancialProfile(
        **profile_in.model_dump(),
        user_id=current_user.id
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


# ========== Static routes MUST come before parametric routes ==========

@router.get(
    "/main",
    response_model=MainProfileResponse,
    summary="Get main financial profile",
    description="Get the main financial profile for the authenticated user",
    responses={
        200: {"description": "Main profile retrieved successfully"}
    },
    tags=["Financial Profiles"]
)
async def get_main_profile(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> MainProfileResponse:
    """
    Get the user's main financial profile.

    Returns:
        Main profile information
    """
    # Find the default profile using is_default field
    default_profile = db.query(FinancialProfile).filter(
        FinancialProfile.user_id == current_user.id,
        FinancialProfile.is_default == True
    ).first()

    return MainProfileResponse(
        user_id=current_user.id,
        main_profile_id=default_profile.id if default_profile else None
    )


@router.patch(
    "/main",
    response_model=MainProfileResponse,
    summary="Set main financial profile",
    description="Set the main financial profile for the authenticated user",
    responses={
        200: {"description": "Main profile set successfully"},
        404: {"description": "Profile not found"},
        403: {"description": "Not authorized to set this profile as main"}
    },
    tags=["Financial Profiles"]
)
async def set_main_profile(
    profile_data: MainProfileUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> MainProfileResponse:
    """
    Set the main financial profile for the user.

    The main profile is used as the default for creating new transactions,
    budgets, and goals.

    Args:
        profile_data: Contains the profile ID to set as main

    Returns:
        Main profile information

    Raises:
        HTTPException 404: If profile doesn't exist
        HTTPException 403: If profile doesn't belong to current user
    """
    # Verify profile exists and belongs to user
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.id == profile_data.main_profile_id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Financial profile with id {profile_data.main_profile_id} not found"
        )

    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to set this profile as main"
        )

    # Reset is_default on all user's profiles
    db.query(FinancialProfile).filter(
        FinancialProfile.user_id == current_user.id
    ).update({"is_default": False})

    # Set is_default=True on the selected profile
    profile.is_default = True
    db.commit()
    db.refresh(profile)

    return MainProfileResponse(
        user_id=current_user.id,
        main_profile_id=profile.id
    )


# ========== Parametric routes MUST come after static routes ==========

@router.get(
    "/{profile_id}",
    response_model=FinancialProfileResponse,
    summary="Get financial profile by ID",
    description="Retrieve a specific financial profile by its ID",
    responses={
        200: {"description": "Financial profile retrieved successfully"},
        404: {"description": "Financial profile not found"},
        403: {"description": "Not authorized to access this profile"}
    },
    tags=["Financial Profiles"]
)
async def get_profile(
    profile_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FinancialProfileResponse:
    """
    Get financial profile by ID.

    Args:
        profile_id: The financial profile ID to retrieve

    Returns:
        Financial profile details

    Raises:
        HTTPException 404: If profile doesn't exist
        HTTPException 403: If profile doesn't belong to current user
    """
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.id == profile_id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Financial profile with id {profile_id} not found"
        )

    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this financial profile"
        )

    return profile


@router.patch(
    "/{profile_id}",
    response_model=FinancialProfileResponse,
    summary="Update financial profile",
    description="Update an existing financial profile (partial update supported)",
    responses={
        200: {"description": "Financial profile updated successfully"},
        404: {"description": "Financial profile not found"},
        403: {"description": "Not authorized to update this profile"}
    },
    tags=["Financial Profiles"]
)
async def update_profile(
    profile_id: UUID,
    profile_in: FinancialProfileUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FinancialProfileResponse:
    """
    Update financial profile.

    Args:
        profile_id: The financial profile ID to update
        profile_in: Fields to update (partial update supported)

    Returns:
        Updated financial profile

    Raises:
        HTTPException 404: If profile doesn't exist
        HTTPException 403: If profile doesn't belong to current user
    """
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.id == profile_id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Financial profile with id {profile_id} not found"
        )

    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this financial profile"
        )

    # Update only provided fields
    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.delete(
    "/{profile_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete financial profile",
    description="Soft delete a financial profile by setting is_active to False",
    responses={
        204: {"description": "Financial profile deleted successfully"},
        404: {"description": "Financial profile not found"},
        403: {"description": "Not authorized to delete this profile"}
    },
    tags=["Financial Profiles"]
)
async def delete_profile(
    profile_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    """
    Soft delete financial profile.

    This sets is_active to False instead of permanently deleting the record.
    This preserves data integrity and allows for potential recovery.

    Args:
        profile_id: The financial profile ID to delete

    Returns:
        No content (204)

    Raises:
        HTTPException 404: If profile doesn't exist
        HTTPException 403: If profile doesn't belong to current user
    """
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.id == profile_id
    ).first()

    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Financial profile with id {profile_id} not found"
        )

    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this financial profile"
        )

    # Soft delete - set is_active to False
    profile.is_active = False
    db.commit()
