# app/db/seed.py
from sqlalchemy.orm import Session
from app.models.category import Category
from app.db.database import SessionLocal

def seed_categories():
    """Popola tabella categories con categorie predefinite"""
    
    categories = [
        # Income
        {"name": "Salary", "icon": "💼", "color": "#10b981"},
        {"name": "Freelance", "icon": "💻", "color": "#3b82f6"},
        {"name": "Investment", "icon": "📈", "color": "#8b5cf6"},
        {"name": "Other Income", "icon": "💰", "color": "#06b6d4"},
        
        # Expenses - Essential
        {"name": "Groceries", "icon": "🛒", "color": "#ef4444"},
        {"name": "Rent/Mortgage", "icon": "🏠", "color": "#f59e0b"},
        {"name": "Utilities", "icon": "⚡", "color": "#eab308"},
        {"name": "Transport", "icon": "🚗", "color": "#6366f1"},
        {"name": "Healthcare", "icon": "🏥", "color": "#ec4899"},
        {"name": "Insurance", "icon": "🛡️", "color": "#14b8a6"},
        
        # Expenses - Lifestyle
        {"name": "Restaurants", "icon": "🍽️", "color": "#f97316"},
        {"name": "Shopping", "icon": "🛍️", "color": "#a855f7"},
        {"name": "Entertainment", "icon": "🎬", "color": "#06b6d4"},
        {"name": "Travel", "icon": "✈️", "color": "#0ea5e9"},
        {"name": "Education", "icon": "📚", "color": "#8b5cf6"},
        {"name": "Subscriptions", "icon": "📱", "color": "#6366f1"},
        
        # Other
        {"name": "Savings", "icon": "💎", "color": "#10b981"},
        {"name": "Gifts", "icon": "🎁", "color": "#ec4899"},
        {"name": "Pets", "icon": "🐕", "color": "#f59e0b"},
        {"name": "Other", "icon": "📦", "color": "#6b7280"},
    ]
    
    db = SessionLocal()
    
    try:
        # Check se già esistono
        existing = db.query(Category).count()
        if existing > 0:
            print(f"Categories already seeded ({existing} found). Skipping.")
            return
        
        # Crea categorie
        for cat_data in categories:
            category = Category(**cat_data)
            db.add(category)
        
        db.commit()
        print(f"✅ Seeded {len(categories)} categories")
        
    except Exception as e:
        print(f"❌ Error seeding categories: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_categories()