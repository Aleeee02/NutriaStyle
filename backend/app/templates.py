from pathlib import Path

from fastapi.templating import Jinja2Templates

from app.configuracion import get_configuracion

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR.parent / "frontend"

templates = Jinja2Templates(directory=FRONTEND_DIR / "templates")
templates.env.globals["get_configuracion"] = get_configuracion
