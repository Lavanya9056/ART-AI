from art_ai.utils.jwt import create_access_token, verify_access_token
from art_ai.utils.security import hash_password, verify_password


def test_create_and_verify_access_token():
    data = {"user_id": 123}
    token = create_access_token(data)

    assert isinstance(token, str)

    payload = verify_access_token(token)
    assert payload is not None
    assert payload["user_id"] == 123
    assert "exp" in payload


def test_verify_invalid_access_token_returns_none():
    assert verify_access_token("invalid-token") is None


def test_password_hashing_and_verification():
    secret = "StrongP@ssw0rd"
    hashed = hash_password(secret)

    assert isinstance(hashed, str)
    assert hashed != secret
    assert verify_password(secret, hashed)
    assert not verify_password("wrong-password", hashed)
