# backend/scripts/validate_config.py
"""
Validate configuration before deployment
"""
from app.config import settings
import sys


def validate_production_config():
    """Validate critical production settings"""
    errors = []
    
    # Check secret key
    if settings.is_production:
        if "dev-secret-key" in settings.security.secret_key.lower():
            errors.append("❌ Production is using development secret key!")
        
        if settings.debug:
            errors.append("❌ Debug mode enabled in production!")
        
        if not settings.rate_limit.enabled:
            errors.append("⚠️  Rate limiting disabled in production")
        
        if "localhost" in settings.database.url:
            errors.append("❌ Production using localhost database!")
    
    # Check required fields
    if not settings.api.contact_email:
        errors.append("⚠️  Contact email not configured")
    
    if errors:
        print("\n".join(errors))
        return False
    
    print("✅ Configuration validation passed!")
    return True


def print_config_summary():
    """Print configuration summary"""
    print("=" * 60)
    print(f"🚀 {settings.api.name} Configuration")
    print("=" * 60)
    print(f"Environment:     {settings.environment}")
    print(f"API Version:     {settings.api.api_version}")
    print(f"App Version:     {settings.api.version}")
    print(f"Debug Mode:      {settings.debug}")
    print(f"Database:        {settings.database.url.split('@')[-1]}")  # Hide credentials
    print(f"API Prefix:      {settings.api.api_prefix}")
    print(f"OpenAPI URL:     {settings.api.openapi_url}")
    print("\nFeatures:")
    for feature, enabled in vars(settings.features).items():
        if feature.startswith('enable_'):
            status = "✅" if enabled else "❌"
            print(f"  {status} {feature.replace('enable_', '').replace('_', ' ').title()}")
    print("=" * 60)


if __name__ == "__main__":
    print_config_summary()
    
    if not validate_production_config():
        sys.exit(1)