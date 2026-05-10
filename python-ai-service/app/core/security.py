from fastapi import HTTPException, Security
from fastapi.security import APIKeyHeader

from app.core.config import API_KEY

api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


def verify_api_key(key: str = Security(api_key_header)):
    """
    Validate the X-API-Key provided in the request header.

    Args:
        key (str): The API key extracted from the header.

    Raises:
        HTTPException: 403 error if the key is invalid or missing.
    """
    if key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid or missing X-API-Key")

