# app/api/v2/goals.py
"""
v2.1 Goals Router for FinancePro.

Uses GoalService with:
- User-level goals with scope support
- Contributions tracking
- Milestone management
- Achievement probability
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Annotated, Optional, List
from uuid import UUID
from decimal import Decimal
from datetime import date

from app.db.database import get_db
from app.models.user import User
from app.models.enums import ScopeType, GoalType, GoalStatus
from app.services.v2 import GoalService
from app.core.rls import get_rls_context
from app.api.dependencies import get_current_user
from app.schemas.v2.goal import (
    GoalCreate,
    GoalUpdate,
    GoalResponse,
    GoalContributionCreate,
    GoalContributionResponse
)
from pydantic import BaseModel

router = APIRouter()


# Additional response models
class GoalListResponse(BaseModel):
    items: List[GoalResponse]
    total: int


class GoalProgressResponse(BaseModel):
    goal_id: str
    progress_percentage: float
    current_amount: float
    target_amount: float
    remaining_amount: float
    monthly_contribution_needed: float
    months_remaining: int
    days_remaining: int
    total_contributions: int
    average_contribution: float
    is_on_track: bool
    expected_progress: float
    achievement_probability: float
    gamification_points: int


class MilestoneResponse(BaseModel):
    id: str
    goal_id: str
    name: str
    target_amount: float
    target_percentage: int
    is_achieved: bool
    achieved_date: Optional[date] = None


def get_goal_service(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)]
) -> GoalService:
    """Get goal service with RLS context."""
    rls = get_rls_context(db, current_user.id)
    return GoalService(db, rls)


@router.get(
    "/",
    response_model=GoalListResponse,
    summary="List goals",
    description="List all goals for the current user"
)
async def list_goals(
    service: Annotated[GoalService, Depends(get_goal_service)],
    current_user: Annotated[User, Depends(get_current_user)],
    status_filter: Optional[GoalStatus] = Query(None, description="Filter by status"),
    goal_type: Optional[GoalType] = Query(None, description="Filter by type"),
    include_completed: bool = Query(False, description="Include completed goals"),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
) -> GoalListResponse:
    """List all goals for the current user."""
    goals = service.list_goals(
        user_id=current_user.id,
        status_filter=status_filter,
        goal_type=goal_type,
        include_completed=include_completed,
        limit=limit,
        offset=offset
    )

    items = []
    for goal in goals:
        progress = service.calculate_progress(goal)

        items.append(GoalResponse(
            id=goal.id,
            user_id=goal.user_id,
            name=goal.name,
            scope_type=goal.scope_type,
            scope_profile_ids=goal.scope_profile_ids,
            linked_account_id=goal.linked_account_id,
            goal_type=goal.goal_type,
            description=goal.description,
            target_amount=goal.target_amount,
            current_amount=goal.current_amount,
            currency=goal.currency,
            start_date=goal.start_date,
            target_date=goal.target_date,
            monthly_contribution=goal.monthly_contribution,
            auto_allocate=goal.auto_allocate,
            priority=goal.priority,
            status=goal.status,
            achievement_probability=goal.achievement_probability,
            gamification_points=goal.gamification_points,
            progress_percentage=Decimal(str(progress['progress_percentage'])),
            is_on_track=progress['is_on_track'],
            created_at=goal.created_at,
            updated_at=goal.updated_at
        ))

    return GoalListResponse(items=items, total=len(items))


@router.post(
    "/",
    response_model=GoalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create goal",
    description="Create a new financial goal"
)
async def create_goal(
    goal_in: GoalCreate,
    service: Annotated[GoalService, Depends(get_goal_service)],
    current_user: Annotated[User, Depends(get_current_user)]
) -> GoalResponse:
    """Create a new goal."""
    try:
        goal = service.create_goal(
            user_id=current_user.id,
            name=goal_in.name,
            goal_type=goal_in.goal_type,
            target_amount=goal_in.target_amount,
            target_date=goal_in.target_date,
            currency=goal_in.currency,
            scope_type=goal_in.scope_type,
            scope_profile_ids=goal_in.scope_profile_ids,
            linked_account_id=goal_in.linked_account_id,
            description=goal_in.description,
            start_date=goal_in.start_date,
            priority=goal_in.priority,
            auto_allocate=goal_in.auto_allocate,
            milestones=goal_in.milestones
        )

        progress = service.calculate_progress(goal)

        return GoalResponse(
            id=goal.id,
            user_id=goal.user_id,
            name=goal.name,
            scope_type=goal.scope_type,
            scope_profile_ids=goal.scope_profile_ids,
            linked_account_id=goal.linked_account_id,
            goal_type=goal.goal_type,
            description=goal.description,
            target_amount=goal.target_amount,
            current_amount=goal.current_amount,
            currency=goal.currency,
            start_date=goal.start_date,
            target_date=goal.target_date,
            monthly_contribution=goal.monthly_contribution,
            auto_allocate=goal.auto_allocate,
            priority=goal.priority,
            status=goal.status,
            achievement_probability=goal.achievement_probability,
            gamification_points=goal.gamification_points,
            progress_percentage=Decimal(str(progress['progress_percentage'])),
            is_on_track=progress['is_on_track'],
            created_at=goal.created_at,
            updated_at=goal.updated_at
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/{goal_id}",
    response_model=GoalResponse,
    summary="Get goal",
    description="Get a specific goal by ID"
)
async def get_goal(
    goal_id: UUID,
    service: Annotated[GoalService, Depends(get_goal_service)]
) -> GoalResponse:
    """Get goal by ID."""
    try:
        goal = service.get_goal(goal_id)
        progress = service.calculate_progress(goal)

        return GoalResponse(
            id=goal.id,
            user_id=goal.user_id,
            name=goal.name,
            scope_type=goal.scope_type,
            scope_profile_ids=goal.scope_profile_ids,
            linked_account_id=goal.linked_account_id,
            goal_type=goal.goal_type,
            description=goal.description,
            target_amount=goal.target_amount,
            current_amount=goal.current_amount,
            currency=goal.currency,
            start_date=goal.start_date,
            target_date=goal.target_date,
            monthly_contribution=goal.monthly_contribution,
            auto_allocate=goal.auto_allocate,
            priority=goal.priority,
            status=goal.status,
            achievement_probability=goal.achievement_probability,
            gamification_points=goal.gamification_points,
            progress_percentage=Decimal(str(progress['progress_percentage'])),
            is_on_track=progress['is_on_track'],
            created_at=goal.created_at,
            updated_at=goal.updated_at
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch(
    "/{goal_id}",
    response_model=GoalResponse,
    summary="Update goal",
    description="Update an existing goal"
)
async def update_goal(
    goal_id: UUID,
    goal_in: GoalUpdate,
    service: Annotated[GoalService, Depends(get_goal_service)]
) -> GoalResponse:
    """Update goal."""
    try:
        updates = goal_in.model_dump(exclude_unset=True)
        goal = service.update_goal(goal_id, **updates)
        progress = service.calculate_progress(goal)

        return GoalResponse(
            id=goal.id,
            user_id=goal.user_id,
            name=goal.name,
            scope_type=goal.scope_type,
            scope_profile_ids=goal.scope_profile_ids,
            linked_account_id=goal.linked_account_id,
            goal_type=goal.goal_type,
            description=goal.description,
            target_amount=goal.target_amount,
            current_amount=goal.current_amount,
            currency=goal.currency,
            start_date=goal.start_date,
            target_date=goal.target_date,
            monthly_contribution=goal.monthly_contribution,
            auto_allocate=goal.auto_allocate,
            priority=goal.priority,
            status=goal.status,
            achievement_probability=goal.achievement_probability,
            gamification_points=goal.gamification_points,
            progress_percentage=Decimal(str(progress['progress_percentage'])),
            is_on_track=progress['is_on_track'],
            created_at=goal.created_at,
            updated_at=goal.updated_at
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete(
    "/{goal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete goal",
    description="Delete a goal"
)
async def delete_goal(
    goal_id: UUID,
    service: Annotated[GoalService, Depends(get_goal_service)]
) -> None:
    """Delete goal."""
    try:
        service.delete_goal(goal_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get(
    "/{goal_id}/progress",
    response_model=GoalProgressResponse,
    summary="Get goal progress",
    description="Get detailed progress statistics for a goal"
)
async def get_goal_progress(
    goal_id: UUID,
    service: Annotated[GoalService, Depends(get_goal_service)]
) -> GoalProgressResponse:
    """Get detailed goal progress."""
    try:
        goal = service.get_goal(goal_id)
        progress = service.calculate_progress(goal)

        return GoalProgressResponse(**progress)

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post(
    "/{goal_id}/contributions",
    response_model=GoalContributionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add contribution",
    description="Add a contribution to a goal"
)
async def add_contribution(
    goal_id: UUID,
    contribution_in: GoalContributionCreate,
    service: Annotated[GoalService, Depends(get_goal_service)]
) -> GoalContributionResponse:
    """Add contribution to goal."""
    try:
        contribution = service.add_contribution(
            goal_id=goal_id,
            amount=contribution_in.amount,
            contribution_date=contribution_in.contribution_date,
            transaction_id=contribution_in.transaction_id,
            notes=contribution_in.notes
        )

        return GoalContributionResponse(
            id=contribution.id,
            goal_id=contribution.goal_id,
            transaction_id=contribution.transaction_id,
            amount=contribution.amount,
            contribution_date=contribution.contribution_date,
            notes=contribution.notes,
            created_at=contribution.created_at
        )

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "/{goal_id}/contributions",
    response_model=List[GoalContributionResponse],
    summary="List contributions",
    description="List all contributions for a goal"
)
async def list_contributions(
    goal_id: UUID,
    service: Annotated[GoalService, Depends(get_goal_service)],
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
) -> List[GoalContributionResponse]:
    """List contributions for a goal."""
    try:
        contributions = service.get_contributions(
            goal_id=goal_id,
            start_date=start_date,
            end_date=end_date,
            limit=limit,
            offset=offset
        )

        return [
            GoalContributionResponse(
                id=c.id,
                goal_id=c.goal_id,
                transaction_id=c.transaction_id,
                amount=c.amount,
                contribution_date=c.contribution_date,
                notes=c.notes,
                created_at=c.created_at
            )
            for c in contributions
        ]

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get(
    "/{goal_id}/milestones",
    response_model=List[MilestoneResponse],
    summary="List milestones",
    description="List all milestones for a goal"
)
async def list_milestones(
    goal_id: UUID,
    service: Annotated[GoalService, Depends(get_goal_service)]
) -> List[MilestoneResponse]:
    """List milestones for a goal."""
    try:
        milestones = service.get_milestones(goal_id)

        return [
            MilestoneResponse(
                id=str(m.id),
                goal_id=str(m.goal_id),
                name=m.name,
                target_amount=float(m.target_amount),
                target_percentage=m.target_percentage,
                is_achieved=m.is_achieved,
                achieved_date=m.achieved_date
            )
            for m in milestones
        ]

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
