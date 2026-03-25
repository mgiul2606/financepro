# app/api/assets.py
from app.api.utils import children_for, get_by_id
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Annotated
from uuid import UUID

from app.db.database import get_db
from app.models.user import User
from app.models.asset import Asset
from app.models.financial_profile import FinancialProfile
from app.schemas.asset import (
    AssetCreate,
    AssetUpdate,
    AssetResponse,
    AssetListResponse,
)
from app.api.dependencies import get_current_user


def validate_profile_ids(db: Session, current_user: User, profile_ids: list[UUID] | None) -> list[UUID]:
    return children_for(db, User, FinancialProfile, current_user.id, profile_ids, transform=lambda o: o.id)


def validate_profile_id(db: Session, current_user: User, profile_id: UUID) -> UUID:
    return children_for(db, User, FinancialProfile, current_user.id, profile_id, transform=lambda o: o.id)


router = APIRouter()


@router.get(
    "/",
    response_model=AssetListResponse,
    summary="List all assets",
    description="Retrieve all assets for the authenticated user, filtered by financial profile",
)
async def list_assets(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    profile_id: Annotated[UUID | None, Query(description="Filter by financial profile ID")] = None,
) -> AssetListResponse:
    """List all assets for the current user."""
    if profile_id:
        validate_profile_id(db, current_user, profile_id)
        assets = db.query(Asset).filter(Asset.financial_profile_id == profile_id).all()
    else:
        # Get all assets across user's profiles
        profile_ids = validate_profile_ids(db, current_user, None)
        assets = db.query(Asset).filter(Asset.financial_profile_id.in_(profile_ids)).all()

    return AssetListResponse(items=assets, total=len(assets))


@router.post(
    "/",
    response_model=AssetResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new asset",
)
async def create_asset(
    asset_in: AssetCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AssetResponse:
    """Create a new asset."""
    validate_profile_id(db, current_user, asset_in.financial_profile_id)

    asset_data = asset_in.model_dump()
    asset = Asset(**asset_data)
    db.add(asset)
    db.commit()
    db.refresh(asset)
    return asset


@router.get(
    "/{asset_id}",
    response_model=AssetResponse,
    summary="Get asset by ID",
)
async def get_asset(
    asset_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AssetResponse:
    """Get asset by ID."""
    asset: Asset = get_by_id(db, Asset, asset_id)
    validate_profile_id(db, current_user, asset.financial_profile_id)
    return asset


@router.patch(
    "/{asset_id}",
    response_model=AssetResponse,
    summary="Update asset",
)
async def update_asset(
    asset_id: UUID,
    asset_in: AssetUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> AssetResponse:
    """Update an existing asset."""
    asset: Asset = get_by_id(db, Asset, asset_id)
    validate_profile_id(db, current_user, asset.financial_profile_id)

    update_data = asset_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(asset, field, value)

    db.commit()
    db.refresh(asset)
    return asset


@router.delete(
    "/{asset_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete asset",
)
async def delete_asset(
    asset_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    """Delete an asset."""
    asset: Asset = get_by_id(db, Asset, asset_id)
    validate_profile_id(db, current_user, asset.financial_profile_id)

    db.delete(asset)
    db.commit()
