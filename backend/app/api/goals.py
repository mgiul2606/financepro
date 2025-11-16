# app/api/goals.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import Annotated, Optional
from uuid import UUID
from datetime import datetime, timezone

from app.db.database import get_db
from app.models.user import User
from app.models.financial_goal import FinancialGoal, GoalMilestone, GoalStatus
from app.models.financial_profile import FinancialProfile
from app.schemas.goal import (
    FinancialGoalCreate,
    FinancialGoalUpdate,
    FinancialGoalResponse,
    FinancialGoalListResponse,
    GoalMilestoneCreate,
    GoalMilestoneUpdate,
    GoalMilestoneResponse,
)
from app.api.dependencies import get_current_user

router = APIRouter()


async def verify_profile_ownership(
    profile_id: UUID,
    db: Session,
    current_user: User
) -> FinancialProfile:
    """
    Helper function to verify that the current user owns the financial profile.

    Args:
        profile_id: ID of the profile to verify
        db: Database session
        current_user: Current authenticated user

    Returns:
        FinancialProfile object if authorized

    Raises:
        HTTPException 404: If profile doesn't exist
        HTTPException 403: If user doesn't own the profile
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


@router.get(
    "/",
    response_model=FinancialGoalListResponse,
    summary="List financial goals",
    description="Retrieve all financial goals for a financial profile",
    responses={
        200: {"description": "Goals retrieved successfully"},
    },
    tags=["Financial Goals"]
)
async def list_goals(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    profile_id: UUID = Query(..., description="Financial profile ID"),
    status_filter: Optional[GoalStatus] = Query(None, description="Filter by goal status"),
    include_milestones: bool = Query(False, description="Include milestones in response"),
) -> FinancialGoalListResponse:
    """
    List all financial goals for a financial profile.

    Args:
        profile_id: Financial profile ID to filter goals
        status_filter: Optional filter by goal status
        include_milestones: Whether to include milestones in response

    Returns:
        FinancialGoalListResponse with goals and total count
    """
    # Verify profile ownership
    await verify_profile_ownership(profile_id, db, current_user)

    # Build query
    query = db.query(FinancialGoal).filter(
        FinancialGoal.financial_profile_id == profile_id
    )

    if status_filter:
        query = query.filter(FinancialGoal.status == status_filter)

    goals = query.order_by(
        FinancialGoal.priority.desc(),
        FinancialGoal.target_date.asc()
    ).all()

    # Build response
    goal_responses = []
    for goal in goals:
        goal_dict = {
            "id": goal.id,
            "financial_profile_id": goal.financial_profile_id,
            "name": goal.name,
            "description": goal.description,
            "goal_type": goal.goal_type,
            "target_amount": goal.target_amount,
            "current_amount": goal.current_amount,
            "target_date": goal.target_date,
            "priority": goal.priority,
            "status": goal.status,
            "monthly_contribution": goal.monthly_contribution,
            "achievement_probability": goal.achievement_probability,
            "gamification_points": goal.gamification_points,
            "created_at": goal.created_at,
            "updated_at": goal.updated_at,
            "milestones": goal.milestones if include_milestones else None,
        }
        goal_responses.append(FinancialGoalResponse(**goal_dict))

    return FinancialGoalListResponse(items=goal_responses, total=len(goal_responses))


@router.post(
    "/",
    response_model=FinancialGoalResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create financial goal",
    description="Create a new financial goal for a financial profile",
    responses={
        201: {"description": "Goal created successfully"},
        403: {"description": "Not authorized to create goal for this profile"},
        404: {"description": "Financial profile not found"}
    },
    tags=["Financial Goals"]
)
async def create_goal(
    goal_in: FinancialGoalCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FinancialGoalResponse:
    """
    Create a new financial goal.

    Verifies that the user owns the financial profile before creating the goal.

    Args:
        goal_in: Goal creation data

    Returns:
        Created goal with generated ID

    Raises:
        HTTPException 404: If financial profile doesn't exist
        HTTPException 403: If user doesn't own the financial profile
    """
    # Verify profile ownership
    await verify_profile_ownership(goal_in.financial_profile_id, db, current_user)

    # Create goal
    goal = FinancialGoal(**goal_in.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)

    return goal


@router.get(
    "/{goal_id}",
    response_model=FinancialGoalResponse,
    summary="Get financial goal with milestones",
    description="Retrieve a specific financial goal by its ID with all milestones",
    responses={
        200: {"description": "Goal retrieved successfully"},
        404: {"description": "Goal not found"},
        403: {"description": "Not authorized to access this goal"}
    },
    tags=["Financial Goals"]
)
async def get_goal(
    goal_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FinancialGoalResponse:
    """
    Get financial goal by ID with milestones.

    Args:
        goal_id: The goal ID to retrieve

    Returns:
        Goal details with milestones

    Raises:
        HTTPException 404: If goal doesn't exist
        HTTPException 403: If user doesn't own the goal
    """
    goal = db.query(FinancialGoal).filter(FinancialGoal.id == goal_id).first()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Financial goal with id {goal_id} not found"
        )

    # Verify ownership through profile
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.id == goal.financial_profile_id
    ).first()

    if not profile or profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this goal"
        )

    return goal


@router.patch(
    "/{goal_id}",
    response_model=FinancialGoalResponse,
    summary="Update financial goal",
    description="Update an existing financial goal (partial update supported)",
    responses={
        200: {"description": "Goal updated successfully"},
        404: {"description": "Goal not found"},
        403: {"description": "Not authorized to update this goal"}
    },
    tags=["Financial Goals"]
)
async def update_goal(
    goal_id: UUID,
    goal_in: FinancialGoalUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FinancialGoalResponse:
    """
    Update financial goal.

    Args:
        goal_id: The goal ID to update
        goal_in: Fields to update (partial update supported)

    Returns:
        Updated goal

    Raises:
        HTTPException 404: If goal doesn't exist
        HTTPException 403: If user doesn't own the goal
    """
    goal = db.query(FinancialGoal).filter(FinancialGoal.id == goal_id).first()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Financial goal with id {goal_id} not found"
        )

    # Verify ownership
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.id == goal.financial_profile_id
    ).first()

    if not profile or profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this goal"
        )

    # Update only provided fields
    update_data = goal_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)

    db.commit()
    db.refresh(goal)
    return goal


@router.delete(
    "/{goal_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete financial goal",
    description="Delete a financial goal and all its milestones",
    responses={
        204: {"description": "Goal deleted successfully"},
        404: {"description": "Goal not found"},
        403: {"description": "Not authorized to delete this goal"}
    },
    tags=["Financial Goals"]
)
async def delete_goal(
    goal_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> None:
    """
    Delete financial goal.

    This will also delete all milestones associated with the goal (CASCADE).

    Args:
        goal_id: The goal ID to delete

    Returns:
        No content (204)

    Raises:
        HTTPException 404: If goal doesn't exist
        HTTPException 403: If user doesn't own the goal
    """
    goal = db.query(FinancialGoal).filter(FinancialGoal.id == goal_id).first()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Financial goal with id {goal_id} not found"
        )

    # Verify ownership
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.id == goal.financial_profile_id
    ).first()

    if not profile or profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this goal"
        )

    db.delete(goal)
    db.commit()


@router.post(
    "/{goal_id}/milestones",
    response_model=GoalMilestoneResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Add milestone to goal",
    description="Create a new milestone for a financial goal",
    responses={
        201: {"description": "Milestone created successfully"},
        404: {"description": "Goal not found"},
        403: {"description": "Not authorized to add milestone to this goal"}
    },
    tags=["Financial Goals"]
)
async def add_milestone(
    goal_id: UUID,
    milestone_in: GoalMilestoneCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> GoalMilestoneResponse:
    """
    Add a milestone to a financial goal.

    Args:
        goal_id: The goal ID to add milestone to
        milestone_in: Milestone creation data

    Returns:
        Created milestone

    Raises:
        HTTPException 404: If goal doesn't exist
        HTTPException 403: If user doesn't own the goal
    """
    goal = db.query(FinancialGoal).filter(FinancialGoal.id == goal_id).first()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Financial goal with id {goal_id} not found"
        )

    # Verify ownership
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.id == goal.financial_profile_id
    ).first()

    if not profile or profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to add milestone to this goal"
        )

    # Create milestone
    milestone = GoalMilestone(
        **milestone_in.model_dump(),
        goal_id=goal_id
    )
    db.add(milestone)
    db.commit()
    db.refresh(milestone)

    return milestone


@router.patch(
    "/{goal_id}/milestones/{milestone_id}",
    response_model=GoalMilestoneResponse,
    summary="Update milestone",
    description="Update a goal milestone (partial update supported)",
    responses={
        200: {"description": "Milestone updated successfully"},
        404: {"description": "Milestone or goal not found"},
        403: {"description": "Not authorized to update this milestone"}
    },
    tags=["Financial Goals"]
)
async def update_milestone(
    goal_id: UUID,
    milestone_id: UUID,
    milestone_in: GoalMilestoneUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> GoalMilestoneResponse:
    """
    Update a goal milestone.

    Args:
        goal_id: The goal ID
        milestone_id: The milestone ID to update
        milestone_in: Fields to update (partial update supported)

    Returns:
        Updated milestone

    Raises:
        HTTPException 404: If milestone or goal doesn't exist
        HTTPException 403: If user doesn't own the goal
    """
    # Verify goal exists and user owns it
    goal = db.query(FinancialGoal).filter(FinancialGoal.id == goal_id).first()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Financial goal with id {goal_id} not found"
        )

    # Verify ownership
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.id == goal.financial_profile_id
    ).first()

    if not profile or profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this milestone"
        )

    # Get milestone
    milestone = db.query(GoalMilestone).filter(
        and_(
            GoalMilestone.id == milestone_id,
            GoalMilestone.goal_id == goal_id
        )
    ).first()

    if not milestone:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Milestone with id {milestone_id} not found for this goal"
        )

    # Update only provided fields
    update_data = milestone_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        if field == "is_completed" and value and not milestone.is_completed:
            # Mark milestone as completed
            setattr(milestone, field, value)
            milestone.completed_at = datetime.now(timezone.utc)
        elif field == "is_completed" and not value and milestone.is_completed:
            # Unmark milestone as completed
            setattr(milestone, field, value)
            milestone.completed_at = None
        else:
            setattr(milestone, field, value)

    db.commit()
    db.refresh(milestone)
    return milestone


@router.post(
    "/{goal_id}/complete",
    response_model=FinancialGoalResponse,
    summary="Mark goal as completed",
    description="Mark a financial goal as completed",
    responses={
        200: {"description": "Goal marked as completed"},
        404: {"description": "Goal not found"},
        403: {"description": "Not authorized to complete this goal"}
    },
    tags=["Financial Goals"]
)
async def complete_goal(
    goal_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> FinancialGoalResponse:
    """
    Mark a financial goal as completed.

    This updates the goal status to COMPLETED and awards gamification points.

    Args:
        goal_id: The goal ID to mark as completed

    Returns:
        Updated goal

    Raises:
        HTTPException 404: If goal doesn't exist
        HTTPException 403: If user doesn't own the goal
    """
    goal = db.query(FinancialGoal).filter(FinancialGoal.id == goal_id).first()

    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Financial goal with id {goal_id} not found"
        )

    # Verify ownership
    profile = db.query(FinancialProfile).filter(
        FinancialProfile.id == goal.financial_profile_id
    ).first()

    if not profile or profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to complete this goal"
        )

    # Mark as completed
    goal.status = GoalStatus.COMPLETED

    # Award gamification points based on goal achievement
    # Simple formula: base 100 points + priority * 10
    if goal.gamification_points == 0:  # Only award once
        goal.gamification_points = 100 + (goal.priority * 10)

    db.commit()
    db.refresh(goal)
    return goal
