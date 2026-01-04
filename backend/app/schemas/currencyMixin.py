from app.schemas.base import CamelCaseModel
from pydantic import Field, field_validator
from typing import Optional

class CurrencyMixin(CamelCaseModel):
    currency: Optional[str] = Field(
        default="EUR",
        pattern="^[A-Z]{3}$",
        description="ISO 4217 currency code (3 uppercase letters)"
    )

    @field_validator("currency")
    @classmethod
    def validate_currency(cls, v: Optional[str]) -> Optional[str]:
        """Ensure currency is uppercase if provided"""
        return v.upper() if v else v