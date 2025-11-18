#!/usr/bin/env python3
"""
Script per pulire il database PostgreSQL e rimuovere tutti i tipi ENUM e tabelle esistenti.
ATTENZIONE: Questo script eliminerà TUTTI i dati!

Uso:
    python scripts/cleanup_database.py
"""
import sys
import os
from pathlib import Path

# Aggiungi il percorso del backend al path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from sqlalchemy import create_engine, text
from app.config import settings


def cleanup_database():
    """Pulisce il database eliminando tutte le tabelle e tipi ENUM."""

    print("=" * 80)
    print("ATTENZIONE: Questo script eliminerà TUTTI i dati dal database!")
    print("=" * 80)
    print(f"\nDatabase: {settings.DATABASE_URL.split('@')[1] if '@' in settings.DATABASE_URL else 'N/A'}")
    print("\nSei sicuro di voler continuare? (scrivi 'SI' per confermare)")

    confirmation = input("> ").strip()

    if confirmation != "SI":
        print("\n❌ Operazione annullata.")
        return False

    print("\n🔄 Connessione al database...")

    try:
        engine = create_engine(settings.DATABASE_URL)

        with engine.connect() as conn:
            print("✅ Connesso al database")

            # Leggi lo script SQL
            sql_file = backend_dir / "scripts" / "cleanup_database.sql"
            with open(sql_file, 'r', encoding='utf-8') as f:
                sql_script = f.read()

            print("\n🗑️  Eliminazione tabelle e tipi ENUM...")

            # Esegui lo script SQL
            # Dividi per statement (separati da ;) ed esegui uno per uno
            statements = [s.strip() for s in sql_script.split(';') if s.strip() and not s.strip().startswith('--')]

            for statement in statements:
                if statement and not statement.startswith('SELECT'):
                    try:
                        conn.execute(text(statement))
                        conn.commit()
                    except Exception as e:
                        # Ignora errori se l'oggetto non esiste
                        if "does not exist" not in str(e):
                            print(f"⚠️  Warning: {e}")

            print("✅ Database pulito con successo!")
            print("\n📋 Prossimi passi:")
            print("   1. python -m alembic upgrade head")
            print("   2. Verifica che tutte le tabelle siano state create correttamente")

            return True

    except Exception as e:
        print(f"\n❌ Errore durante il cleanup del database:")
        print(f"   {e}")
        print("\n💡 Suggerimenti:")
        print("   - Verifica che le credenziali nel file .env.development siano corrette")
        print("   - Verifica che il database sia accessibile")
        print("   - Puoi eseguire manualmente lo script SQL in scripts/cleanup_database.sql")
        return False


if __name__ == "__main__":
    success = cleanup_database()
    sys.exit(0 if success else 1)
