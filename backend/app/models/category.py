# app/models/category.py
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import uuid
from app.db.database import Base


class Category(Base):
    """
    Category model with hierarchical structure (up to 3 levels).

    Hierarchical structure example:
    - Level 1: "Supermercato" (parent_category_id = None)
    - Level 2: "Alimentari freschi" (parent_category_id = Level 1 ID)
    - Level 3: "Frutta e verdura" (parent_category_id = Level 2 ID)

    Attributes:
        id: UUID primary key
        financial_profile_id: Foreign key to FinancialProfile
        parent_category_id: Foreign key to parent Category (nullable for root categories)
        name: Category name
        description: Optional description
        icon: Icon identifier (emoji or icon name)
        color: Hex color code for UI
        level: Hierarchy level (1, 2, or 3)
        full_path: Full path in hierarchy (e.g., "Supermercato > Alimentari freschi > Frutta")
        is_system: System categories cannot be deleted by users
        is_active: Whether the category is active
        created_at: Creation timestamp
        updated_at: Last update timestamp

    Relationships:
        financial_profile: Parent financial profile
        parent_category: Parent category in hierarchy
        subcategories: Child categories
        transactions: Transactions in this category
        budget_categories: Budget allocations for this category
        ml_classification_logs: ML classification logs for this category
    """
    __tablename__ = "categories"

    # Primary key - UUID for security
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)

    # Foreign keys
    financial_profile_id = Column(
        UUID(as_uuid=True),
        ForeignKey("financial_profiles.id"),
        nullable=False,
        index=True
    )
    parent_category_id = Column(
        UUID(as_uuid=True),
        ForeignKey("categories.id"),
        nullable=True,
        index=True
    )

    # Category information
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)  # emoji or icon name
    color = Column(String(7), nullable=True)  # hex color code

    # Hierarchy
    level = Column(Integer, nullable=False)  # 1, 2, or 3
    full_path = Column(String(500), nullable=True)  # e.g., "Supermercato > Alimentari > Frutta"

    # Status
    is_system = Column(Boolean, default=False, nullable=False)  # System categories cannot be deleted
    is_active = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False
    )

    # Relationships
    financial_profile = relationship("FinancialProfile", back_populates="categories")
    parent_category = relationship("Category", remote_side=[id], back_populates="subcategories")
    subcategories = relationship(
        "Category",
        back_populates="parent_category",
        cascade="all, delete-orphan"
    )
    transactions = relationship("Transaction", back_populates="category")
    budget_categories = relationship("BudgetCategory", back_populates="category", cascade="all, delete-orphan")
    ml_classification_logs_predicted = relationship(
        "MLClassificationLog",
        foreign_keys="MLClassificationLog.predicted_category_id",
        back_populates="predicted_category"
    )
    ml_classification_logs_corrected = relationship(
        "MLClassificationLog",
        foreign_keys="MLClassificationLog.corrected_category_id",
        back_populates="corrected_category"
    )

    def __repr__(self) -> str:
        return f"<Category(id={self.id}, name='{self.name}', level={self.level})>"

    def build_full_path(self) -> str:
        """
        Build the full hierarchical path for this category.

        Returns:
            str: Full path (e.g., "Supermercato > Alimentari freschi > Frutta")
        """
        if not self.parent_category:
            return self.name

        # Recursively build path
        parent_path = self.parent_category.build_full_path()
        return f"{parent_path} > {self.name}"