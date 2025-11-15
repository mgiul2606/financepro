#!/usr/bin/env python3
"""
Generate OpenAPI specification from FastAPI app
This script exports the OpenAPI schema to a JSON file for frontend consumption
"""
import json
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))


def generate_openapi():
    """Generate OpenAPI JSON file from FastAPI app"""
    try:
        print("📝 Generating OpenAPI specification...")

        # Import FastAPI app
        from app.main import app

        # Get OpenAPI schema
        openapi_schema = app.openapi()

        # Output path
        output_path = backend_dir / "openapi.json"

        # Write to file
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(openapi_schema, f, indent=2, ensure_ascii=False)

        print(f"✅ OpenAPI schema generated successfully!")
        print(f"📁 File: {output_path}")
        print(f"📊 Endpoints: {len([r for r in app.routes if hasattr(r, 'methods')])}")
        print(f"🏷️  Tags: {len(openapi_schema.get('tags', []))}")

        return 0

    except Exception as e:
        print(f"❌ Error generating OpenAPI schema: {e}", file=sys.stderr)
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(generate_openapi())
