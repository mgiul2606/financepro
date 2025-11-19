# app/db/types.py
"""Custom SQLAlchemy types for proper enum handling"""
from sqlalchemy import types, Enum as SQLEnum
from typing import Type
import enum


class StringEnum(types.TypeDecorator):
    """
    Custom SQLAlchemy type that properly handles Python str enums.

    This ensures that enum VALUES (not names) are used in the database.
    For example: ProfileType.PERSONAL → "personal" (not "PERSONAL")

    Usage:
        profile_type = Column(StringEnum(ProfileType), nullable=False)
    """
    impl = types.String
    cache_ok = True

    def __init__(self, enum_class: Type[enum.Enum], length: int = 50, *args, **kwargs):
        self.enum_class = enum_class
        super().__init__(length, *args, **kwargs)

    def process_bind_param(self, value, dialect):
        """Convert Python enum to database string (using .value)"""
        if value is None:
            return None
        if isinstance(value, self.enum_class):
            return value.value
        if isinstance(value, str):
            # If already a string, validate it's a valid enum value
            try:
                self.enum_class(value)
                return value
            except ValueError:
                raise ValueError(f"'{value}' is not a valid {self.enum_class.__name__}")
        raise ValueError(f"Expected {self.enum_class.__name__} or str, got {type(value)}")

    def process_result_value(self, value, dialect):
        """Convert database string to Python enum"""
        if value is None:
            return None
        return self.enum_class(value)


class PostgreSQLEnum(types.TypeDecorator):
    """
    Alternative: Use native PostgreSQL ENUM but with proper value handling.

    This creates a native ENUM type in PostgreSQL for better performance
    and database-level constraints.

    Usage:
        profile_type = Column(PostgreSQLEnum(ProfileType), nullable=False)
    """
    impl = types.Enum
    cache_ok = True

    def __init__(self, enum_class: Type[enum.Enum], *args, **kwargs):
        self.enum_class = enum_class
        # Extract values from enum
        values = [e.value for e in enum_class]
        super().__init__(*values, name=enum_class.__name__.lower(), *args, **kwargs)

    def process_bind_param(self, value, dialect):
        """Convert Python enum to database value"""
        if value is None:
            return None
        if isinstance(value, self.enum_class):
            return value.value
        if isinstance(value, str):
            # Validate and return
            try:
                self.enum_class(value)
                return value
            except ValueError:
                raise ValueError(f"'{value}' is not a valid {self.enum_class.__name__}")
        raise ValueError(f"Expected {self.enum_class.__name__} or str, got {type(value)}")

    def process_result_value(self, value, dialect):
        """Convert database value to Python enum"""
        if value is None:
            return None
        return self.enum_class(value)
