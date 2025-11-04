# app/models/account.py
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base

class Account(Base):
    __tablename__ = "accounts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String(100), nullable=False)
    initial_balance = Column(Float, default=0.0)
    currency = Column(String(3), default="EUR")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="accounts")
    transactions = relationship("Transaction", back_populates="account", cascade="all, delete-orphan")
    
    @property
    def current_balance(self):
        """Calcola saldo corrente (balance + sum transactions)"""
        if not self.transactions:
            return self.initial_balance
        
        transaction_sum = sum(
            t.amount if t.type == "income" else -t.amount 
            for t in self.transactions
        )
        return self.initial_balance + transaction_sum