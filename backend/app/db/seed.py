# app/db/seed.py
from app.models.category import Category
from app.models.user import User
from app.db.database import SessionLocal
from app.api.auth import DEFAULT_CATEGORIES


def seed_categories_for_existing_users():
    """Crea categorie di default per tutti gli utenti che non ne hanno ancora."""
    db = SessionLocal()
    try:
        users = db.query(User).all()
        seeded = 0
        for user in users:
            has_categories = db.query(Category).filter(Category.user_id == user.id).count() > 0
            if has_categories:
                print(f"  User {user.email}: already has categories, skipping.")
                continue
            for cat_data in DEFAULT_CATEGORIES:
                db.add(Category(user_id=user.id, is_system=True, **cat_data))
            seeded += 1
            print(f"  User {user.email}: seeded {len(DEFAULT_CATEGORIES)} categories.")
        db.commit()
        print(f"✅ Done — seeded categories for {seeded} user(s).")
    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    seed_categories_for_existing_users()
