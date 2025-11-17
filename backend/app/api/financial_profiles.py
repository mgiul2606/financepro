# app/api/financial_profiles.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Annotated
from uuid import UUID

from app.db.database import get_db
from app.models.user import User
from app.models.financial_profile import FinancialProfile
from app.models.user_profile_selection import UserProfileSelection
from app.schemas.financial_profile import (
    FinancialProfileCreate,
    FinancialProfileUpdate,
    FinancialProfileResponse,
    FinancialProfileListResponse,
    ProfileSelectionUpdate,
    ProfileSelectionResponse,
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

    # Update user's main profile
    current_user.main_profile_id = profile_data.main_profile_id
    db.commit()
    db.refresh(current_user)

    return MainProfileResponse(
        user_id=current_user.id,
        main_profile_id=current_user.main_profile_id
    )


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
    return MainProfileResponse(
        user_id=current_user.id,
        main_profile_id=current_user.main_profile_id
    )


@router.post(
    "/selection",
    response_model=ProfileSelectionResponse,
    summary="Update active profile selection",
    description="Update which profiles are currently active for multi-profile operations",
    responses={
        200: {"description": "Profile selection updated successfully"},
        404: {"description": "One or more profiles not found"},
        403: {"description": "Not authorized to select these profiles"}
    },
    tags=["Financial Profiles"]
)
async def update_profile_selection(
    selection_data: ProfileSelectionUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ProfileSelectionResponse:
    """
    Update active profile selection.

    Allows users to select multiple profiles for simultaneous viewing and analysis.

    Args:
        selection_data: Contains list of profile IDs to mark as active

    Returns:
        Updated profile selection

    Raises:
        HTTPException 404: If any profile doesn't exist
        HTTPException 403: If any profile doesn't belong to current user
    """
    # Verify all profiles exist and belong to user
    if selection_data.active_profile_ids:
        profiles = db.query(FinancialProfile).filter(
            FinancialProfile.id.in_(selection_data.active_profile_ids)
        ).all()

        if len(profiles) != len(selection_data.active_profile_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more profiles not found"
            )

        for profile in profiles:
            if profile.user_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to select these profiles"
                )

    # Get or create selection record
    selection = db.query(UserProfileSelection).filter(
        UserProfileSelection.user_id == current_user.id
    ).first()

    if selection:
        # Update existing selection
        selection.active_profile_ids = selection_data.active_profile_ids
    else:
        # Create new selection
        selection = UserProfileSelection(
            user_id=current_user.id,
            active_profile_ids=selection_data.active_profile_ids
        )
        db.add(selection)

    db.commit()
    db.refresh(selection)
    return selection


@router.get(
    "/selection",
    response_model=ProfileSelectionResponse,
    summary="Get active profile selection",
    description="Get which profiles are currently active for the authenticated user",
    responses={
        200: {"description": "Profile selection retrieved successfully"},
        404: {"description": "No profile selection found"}
    },
    tags=["Financial Profiles"]
)
async def get_profile_selection(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> ProfileSelectionResponse:
    """
    Get active profile selection.

    Returns:
        Current profile selection

    Raises:
        HTTPException 404: If no selection exists
    """
    selection = db.query(UserProfileSelection).filter(
        UserProfileSelection.user_id == current_user.id
    ).first()

    if not selection:
        # Create default empty selection
        selection = UserProfileSelection(
            user_id=current_user.id,
            active_profile_ids=[]
        )
        db.add(selection)
        db.commit()
        db.refresh(selection)

    return selection
