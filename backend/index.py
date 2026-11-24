"""Point d'entrée Vercel : expose l'application FastAPI (objet `app`).

Vercel cherche une variable `app` dans index.py à la racine du projet (ici backend/).
Le code de l'API vit dans src/portfolio_api : on ajoute src/ au chemin d'import, au cas
où le paquet ne serait pas installé dans le bundle de la fonction.

En local, rien ne change : on lance toujours `uvicorn portfolio_api.main:app` (just dev).
"""

import sys
from pathlib import Path

_SRC = Path(__file__).resolve().parent / "src"
if str(_SRC) not in sys.path:
    sys.path.insert(0, str(_SRC))

from portfolio_api.main import app  # noqa: E402

__all__ = ["app"]
