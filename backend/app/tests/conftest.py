# backend/tests/conftest.py
import pytest
from app.config import DatabaseSettings, FeatureFlags, SecuritySettings, Settings, APIInfo


@pytest.fixture
def test_settings():
    """Override settings for testing"""
    return Settings(
        environment="testing",
        debug=True,
        testing=True,
        api=APIInfo(
            name="FinancePro Test",
            version="0.0.0-test",
            api_version="v1",
        ),
        database=DatabaseSettings(
            url="postgresql://test:test@localhost:5432/financepro_test"
        ),
        security=SecuritySettings(
            secret_key="test-secret-key",
            access_token_expire_minutes=5,
        ),
        features=FeatureFlags(
            enable_ai_classification=False,  # Disable AI in tests
            enable_vector_search=False,
        ),
    )


@pytest.fixture
def client(test_settings):
    """FastAPI test client with test settings"""
    from app.main import app
    from fastapi.testclient import TestClient
    
    # Override settings in app
    app.dependency_overrides[test_settings] = lambda: test_settings
    
    with TestClient(app) as c:
        yield c