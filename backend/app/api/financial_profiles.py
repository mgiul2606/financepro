# app/api/financial_profiles.py
from sqlalchemy import select, update
from app.api.utils import children_for, get_by_id
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
    profiles: list[FinancialProfile] = children_for(db, User, FinancialProfile, current_user.id)
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
    profile_data = profile_in.model_dump(
        exclude={"database_connection_string", "database_type"}
    )
    profile = FinancialProfile(
        **profile_data,
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
    responses={
        200: {"description": "Main profile retrieved successfully"},
        404: {"description": "Default profile not found (data integrity issue)"}
    },
    tags=["Financial Profiles"]
)
async def get_main_profile(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> MainProfileResponse:
    
    default_profile = db.scalars(
        select(FinancialProfile).where(
            FinancialProfile.user_id == current_user.id,
            FinancialProfile.is_default == True
        )
    ).first()
    
    if not default_profile:
        raise HTTPException(
            status_code=500,
            detail="Default profile not found for user"
        )
    
    return MainProfileResponse(
        user_id=current_user.id,
        main_profile_id=default_profile.id
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
    profile = get_by_id(db, FinancialProfile, profile_data.main_profile_id)

    if profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to set this profile as main"
        )

    # Reset is_default on all user's profiles
    db.execute(update(FinancialProfile).where(
        FinancialProfile.user_id == current_user.id
        ).values(is_default=False))

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
        HTTPException 400: If profile doesn't belong to current user
    """
    return children_for(db, User, FinancialProfile, current_user.id, profile_id)


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
        HTTPException 400: If profile doesn't belong to current user
    """
    profile = children_for(db, User, FinancialProfile, current_user.id, profile_id)

    # Update only provided fields
    update_data = profile_in.model_dump(
        exclude_unset=True,
        exclude={"database_connection_string", "database_type"}
    )
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

    If the deleted profile was the default, another active profile will be
    automatically set as the new default.

    Args:
        profile_id: The financial profile ID to delete

    Returns:
        No content (204)

    Raises:
        HTTPException 404: If profile doesn't exist
        HTTPException 400: If profile doesn't belong to current user
    """
    profile = children_for(db, User, FinancialProfile, current_user.id, profile_id)

    was_default = profile.is_default

    # Soft delete - set is_active to False and remove default status
    profile.is_active = False
    profile.is_default = False

    # If deleted profile was default, set another active profile as default
    if was_default:
        # Get another active profile for this user
        other_profiles = children_for(db, User, FinancialProfile, current_user.id)
        new_default = next(
            (p for p in other_profiles if p.is_active and p.id != profile_id),
            None
        )

        if new_default:
            new_default.is_default = True

    db.commit()
