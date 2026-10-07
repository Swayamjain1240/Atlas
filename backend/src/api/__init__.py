"""
Atlas API — Standard response models.
Consistent format for all API responses.
"""

from typing import Any, Dict, Optional
from fastapi.responses import JSONResponse


def api_response(
    data: Any = None,
    success: bool = True,
    error: Optional[Dict[str, str]] = None,
    meta: Optional[Dict[str, Any]] = None,
    status_code: int = 200,
) -> JSONResponse:
    """
    Standard API response format.
    
    Success: { "success": true,  "data": {...}, "meta": {...} }
    Error:   { "success": false, "error": {"code": "...", "message": "..."} }
    """
    body: Dict[str, Any] = {"success": success}
    
    if success and data is not None:
        body["data"] = data
    if not success and error:
        body["error"] = error
    if meta:
        body["meta"] = meta
    
    return JSONResponse(content=body, status_code=status_code)
