"""Tests — logique pure du seed : normalisation, validation, nœuds Competence."""

from __future__ import annotations

import json

import pytest

from portfolio_api.scripts import seed

from .conftest import CANDIDAT, PROJET


def test_slug_pivots_are_normalized():
    c = {**CANDIDAT, "candidat_slug": " Alice-Martin ", "competences": [{"skill_slug": "MongoDB", "nom": "MongoDB"}]}
    p = {**PROJET, "competences": ["Python", "python ", "MongoDB"]}
    cands, projs, _ = seed.prepare([c], [p])
    assert cands[0]["candidat_slug"] == "alice-martin"
    assert cands[0]["competences"][0]["skill_slug"] == "mongodb"
    assert projs[0]["competences"] == ["python", "mongodb"]  # dédoublonné, ordre conservé


def test_legacy_single_author_format_is_accepted():
    p = {k: v for k, v in PROJET.items() if k != "candidat_slugs"} | {"candidat_slug": "alice-martin"}
    _, projs, _ = seed.prepare([CANDIDAT], [p])
    assert projs[0]["candidat_slugs"] == ["alice-martin"] and "candidat_slug" not in projs[0]


def test_duplicate_slug_is_rejected():
    with pytest.raises(ValueError, match="en double"):
        seed.prepare([CANDIDAT, CANDIDAT], [])
    with pytest.raises(ValueError, match="en double"):
        seed.prepare([CANDIDAT], [PROJET, PROJET])


def test_missing_slug_is_rejected():
    with pytest.raises(ValueError):
        seed.prepare([{"prenom": "X", "nom": "Y"}], [])


def test_unknown_author_gives_a_warning():
    _, _, warnings = seed.prepare([CANDIDAT], [{**PROJET, "candidat_slugs": ["alice-martin", "ghost"]}])
    assert len(warnings) == 1 and "ghost" in warnings[0]


def test_competence_nodes():
    cands, projs, _ = seed.prepare([CANDIDAT], [{**PROJET, "competences": ["python", "fastapi"]}])
    rows = {r["skill_slug"]: r for r in seed.build_competence_rows(cands, projs)}
    assert rows["python"]["nom"] == "Python" and rows["python"]["domaine"] == "langages"
    assert rows["fastapi"]["nom"] == "fastapi"  # vue seulement dans un projet
    assert "mongodb" in rows  # déclarée par le candidat


def test_example_files_pass_normalization():
    ex_c = json.loads((seed.DATA_DIR / "candidats" / "_exemple.json").read_text(encoding="utf-8"))
    ex_p = json.loads((seed.DATA_DIR / "projets" / "_exemple.json").read_text(encoding="utf-8"))
    _, projs, warnings = seed.prepare([ex_c], ex_p)
    assert warnings == [] and projs[0]["candidat_slugs"] == ["exemple-candidat"]
