# app/models/account.py
from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from decimal import Decimal
from app.db.database import Base


class Account(Base):
    """
    Account model representing a financial account.
    
    Attributes:
        id: Primary key
        user_id: Foreign key to User
        name: Account name
        initial_balance: Starting balance when account was created
        currency: ISO 4217 currency code (3 letters)
        created_at: Creation timestamp
        updated_at: Last update timestamp
    
    Relationships:
        user: Owner of the account
        transactions: All transactions for this account
    
    Properties:
        current_balance: Computed balance (initial + sum of transactions)
    """
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    
    # Usa Numeric invece di Float per precisione finanziaria
    initial_balance = Column(
        Numeric(precision=15, scale=2),
        default=Decimal("0.00"),
        nullable=False
    )
    
    currency = Column(String(3), default="EUR", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False
    )
    
    # Relationships
    user = relationship("User", back_populates="accounts")
    transactions = relationship(
        "Transaction",
        back_populates="account",
        cascade="all, delete-orphan",
        lazy="selectin"  # Carica transactions automaticamente per current_balance
    )
    
    @property
    def current_balance(self) -> Decimal:
        """
        Calcola il saldo corrente sommando initial_balance e tutte le transazioni.
        
        Returns:
            Decimal: Saldo corrente con precisione a 2 decimali
        """
        if not self.transactions:
            return self.initial_balance
        
        transaction_sum = sum(
            Decimal(str(t.amount)) if t.type == "income" else -Decimal(str(t.amount))
            for t in self.transactions
        )
        
        return self.initial_balance + transaction_sum
    
    def __repr__(self) -> str:
        return f"<Account(id={self.id}, name='{self.name}', balance={self.current_balance})>"