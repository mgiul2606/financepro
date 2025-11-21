# app/core/rls.py
"""
Row Level Security (RLS) implementation at application level.

This service provides RLS-like access control at the application layer,
complementing PostgreSQL RLS policies where needed.

Key Features:
- Sets user context in database session for RLS policies
- Provides helper methods for permission checks
- Ensures users can only access their own data
"""
from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import text
import logging

logger = logging.getLogger(__name__)


class RLSService:
    """
    Application-level Row Level Security service.

    Usage:
        rls = RLSService(db)
        rls.set_user_context(user_id)  # Call at start of request

        # Then queries will respect RLS
        profiles = db.query(FinancialProfile).all()  # Only user's profiles
    """

    def __init__(self, db: Session):
        """Initialize RLS service with database session."""
        self.db = db
        self._current_user_id: Optional[UUID] = None

    def set_user_context(self, user_id: UUID) -> None:
        """
        Set the current user context for RLS policies.

        This sets a session variable that PostgreSQL RLS policies can use
        to filter rows automatically.

        Args:
            user_id: Current authenticated user's UUID
        """
        self._current_user_id = user_id

        # Set PostgreSQL session variable for RLS policies
        # This allows RLS policies to use: current_setting('app.current_user_id')
        try:
            self.db.execute(
                text("SET LOCAL app.current_user_id = :user_id"),
                {"user_id": str(user_id)}
            )
            logger.debug(f"RLS context set for user: {user_id}")
        except Exception as e:
            logger.warning(f"Failed to set RLS context: {e}")
            # Continue anyway - app-level checks will still work

    def clear_user_context(self) -> None:
        """Clear the current user context."""
        self._current_user_id = None
        try:
            self.db.execute(text("RESET app.current_user_id"))
        except Exception:
            pass

    @property
    def current_user_id(self) -> Optional[UUID]:
        """Get the current user ID."""
        return self._current_user_id

    def check_user_owns_resource(
        self,
        resource_user_id: UUID,
        raise_exception: bool = True
    ) -> bool:
        """
        Check if current user owns a resource.

        Args:
            resource_user_id: User ID of the resource
            raise_exception: Whether to raise exception on failure

        Returns:
            bool: True if user owns resource

        Raises:
            PermissionError: If user doesn't own resource and raise_exception=True
        """
        if self._current_user_id is None:
            if raise_exception:
                raise PermissionError("No user context set")
            return False

        if resource_user_id != self._current_user_id:
            if raise_exception:
                raise PermissionError("Access denied - resource belongs to another user")
            return False

        return True

    def check_profile_access(
        self,
        profile_id: UUID,
        required_profile_ids: Optional[List[UUID]] = None,
        raise_exception: bool = True
    ) -> bool:
        """
        Check if current user can access a profile.

        Args:
            profile_id: Profile ID to check
            required_profile_ids: List of allowed profile IDs (if None, fetch from DB)
            raise_exception: Whether to raise exception on failure

        Returns:
            bool: True if user can access profile
        """
        if self._current_user_id is None:
            if raise_exception:
                raise PermissionError("No user context set")
            return False

        # If we have a pre-fetched list, use it
        if required_profile_ids is not None:
            if profile_id not in required_profile_ids:
                if raise_exception:
                    raise PermissionError("Access denied - profile not owned by user")
                return False
            return True

        # Otherwise, query the database
        from app.models import FinancialProfile

        profile = self.db.query(FinancialProfile).filter(
            FinancialProfile.id == profile_id,
            FinancialProfile.user_id == self._current_user_id
        ).first()

        if not profile:
            if raise_exception:
                raise PermissionError("Access denied - profile not found or not owned by user")
            return False

        return True

    def get_user_profile_ids(self) -> List[UUID]:
        """
        Get all profile IDs owned by current user.

        Returns:
            List[UUID]: List of profile IDs
        """
        if self._current_user_id is None:
            return []

        from app.models import FinancialProfile

        profiles = self.db.query(FinancialProfile.id).filter(
            FinancialProfile.user_id == self._current_user_id
        ).all()

        return [p.id for p in profiles]

    def filter_by_user(self, query, model_class):
        """
        Add user filter to a query.

        Args:
            query: SQLAlchemy query
            model_class: Model class with user_id field

        Returns:
            Filtered query
        """
        if self._current_user_id is None:
            raise PermissionError("No user context set")

        return query.filter(model_class.user_id == self._current_user_id)

    def filter_by_profile(self, query, model_class, profile_ids: Optional[List[UUID]] = None):
        """
        Add profile filter to a query.

        Args:
            query: SQLAlchemy query
            model_class: Model class with financial_profile_id field
            profile_ids: Specific profile IDs to filter (None = all user's profiles)

        Returns:
            Filtered query
        """
        if profile_ids is None:
            profile_ids = self.get_user_profile_ids()

        if not profile_ids:
            # Return empty result if no profiles
            return query.filter(False)

        return query.filter(model_class.financial_profile_id.in_(profile_ids))


def get_rls_service(db: Session) -> RLSService:
    """
    Create an RLS service for a database session.

    Args:
        db: SQLAlchemy database session

    Returns:
        RLSService: RLS service instance
    """
    return RLSService(db)


# Dependency for FastAPI
def get_rls_context(db: Session, user_id: UUID) -> RLSService:
    """
    FastAPI dependency to get RLS context with user set.

    Usage in FastAPI endpoint:
        @app.get("/profiles")
        def get_profiles(
            db: Session = Depends(get_db),
            current_user: User = Depends(get_current_user)
        ):
            rls = get_rls_context(db, current_user.id)
            # Now all queries will be filtered
    """
    rls = RLSService(db)
    rls.set_user_context(user_id)
    return rls
