# backend/tests/test_config.py
import os
import pytest
from config import DevelopmentConfig, TestingConfig, ProductionConfig


def test_development_config():
    """Test development configuration."""
    config = DevelopmentConfig()
    assert config.DEBUG is True
    assert config.TESTING is False


def test_testing_config():
    """Test testing configuration."""
    config = TestingConfig()
    assert config.TESTING is True
    assert config.JWT_COOKIE_SECURE is False


def test_production_config():
    """Test production configuration."""
    config = ProductionConfig()
    assert config.DEBUG is False
    assert config.TESTING is False
    assert config.JWT_COOKIE_SECURE is True
