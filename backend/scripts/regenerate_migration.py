#!/usr/bin/env python3
"""
Script per rigenerare la migration iniziale basandosi sui modelli Python attuali.

Uso:
    python scripts/regenerate_migration.py

ATTENZIONE: Questo eliminerà la migration esistente e ne creerà una nuova!
"""
import sys
import os
from pathlib import Path
import subprocess

# Aggiungi il percorso del backend al path
backend_dir = Path(__file__).parent.parent
os.chdir(backend_dir)

print("=" * 80)
print("🔄 RIGENERAZIONE MIGRATION - FinancePro")
print("=" * 80)

print("\n⚠️  ATTENZIONE!")
print("Questo script eliminerà la migration esistente e ne creerà una nuova")
print("basandosi sui modelli Python attuali.")
print("\nSei sicuro di voler continuare? (scrivi 'SI' per confermare)")

confirmation = input("> ").strip()

if confirmation != "SI":
    print("\n❌ Operazione annullata.")
    sys.exit(0)

print("\n🗑️  Eliminazione vecchia migration...")

# Trova e elimina la vecchia migration
versions_dir = Path("alembic/versions")
for migration_file in versions_dir.glob("*.py"):
    if migration_file.name != "__pycache__":
        print(f"   Elimino: {migration_file.name}")
        migration_file.unlink()

print("✅ Vecchia migration eliminata")

print("\n📝 Generazione nuova migration...")

# Genera nuova migration con alembic autogenerate
result = subprocess.run(
    ["alembic", "revision", "--autogenerate", "-m", "Initial database schema"],
    capture_output=True,
    text=True
)

if result.returncode != 0:
    print(f"\n❌ Errore durante la generazione della migration:")
    print(result.stderr)
    sys.exit(1)

print("✅ Nuova migration generata!")
print(result.stdout)

# Trova il file generato
migration_files = list(versions_dir.glob("*_initial_database_schema.py"))

if migration_files:
    migration_file = migration_files[0]
    print(f"\n📄 Migration generata: {migration_file.name}")

    print("\n✨ IMPORTANTE:")
    print("1. Verifica il file di migration generato in:")
    print(f"   {migration_file}")
    print("\n2. Controlla che tutti i campi e tipi ENUM siano corretti")
    print("\n3. Se tutto è OK, puoi testare con:")
    print("   python -m alembic upgrade head")

else:
    print("\n⚠️  Migration generata ma file non trovato automaticamente")
    print("   Controlla manualmente in alembic/versions/")

print("\n" + "=" * 80)
print("✅ PROCEDURA COMPLETATA")
print("=" * 80)
