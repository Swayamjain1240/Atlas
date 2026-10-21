"""Process entrypoint for the private Atlas AI worker."""

from __future__ import annotations

from pathlib import Path

import uvicorn
from dotenv import load_dotenv

from aiServices.app.config.settings import load_config
from aiServices.app.main import create_app
from aiServices.app.services.runtime import WorkerRuntime


ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / ".env")
config = load_config()
app = create_app(config, WorkerRuntime(config))


def main() -> None:
    uvicorn.run(
        "aiServices.main:app",
        host=config.host,
        port=config.port,
        reload=False,
        log_level=config.log_level.lower(),
        access_log=False,
    )


if __name__ == "__main__":
    main()
