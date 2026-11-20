"""Tests d'acceptation — Endpoints Candidats (R1, R2, R3).

Contrat API (schémas, codes HTTP) vérifié avec les vrais services et des repositories simulés :
aucune base de données n'est nécessaire.
"""

from __future__ import annotations

from .conftest import CANDIDAT, PROJET


class TestListCandidats:
    def test_response_schema(self, api, repos):
        repos.candidat.get_candidats.return_value = ([CANDIDAT], 4)
        data = api.get("/api/candidats", params={"page": 1, "size": 2}).json()
        assert set(data) == {"items", "total", "page", "size"}
        assert data["total"] == 4 and data["items"][0]["candidat_slug"] == "alice-martin"
        repos.candidat.get_candidats.assert_awaited_once_with(page=1, size=2)

    def test_invalid_pagination_is_422(self, api):
        assert api.get("/api/candidats", params={"page": 0}).status_code == 422
        assert api.get("/api/candidats", params={"size": 1000}).status_code == 422


class TestCandidatDetail:  # R1
    def test_profile_and_timeline(self, api, repos):
        repos.candidat.get_candidat_by_slug.return_value = CANDIDAT
        resp = api.get("/api/candidats/alice-martin")
        assert resp.status_code == 200
        data = resp.json()
        for key in ("candidat_slug", "prenom", "nom", "experiences", "formations", "competences", "timeline"):
            assert key in data
        assert [t["type"] for t in data["timeline"]] == ["experience", "formation"]

    def test_not_found(self, api, repos):
        repos.candidat.get_candidat_by_slug.return_value = None
        resp = api.get("/api/candidats/personne")
        assert resp.status_code == 404
        assert resp.json() == {"detail": "Candidat non trouvé"}


class TestCandidatProjets:  # R2
    def test_filter_and_pagination(self, api, repos):
        repos.candidat.get_candidat_by_slug.return_value = CANDIDAT
        repos.projet.get_projets.return_value = ([PROJET], 41)

        resp = api.get(
            "/api/candidats/alice-martin/projets",
            params={"competence": "MongoDB", "page": 3, "size": 10},
        )

        data = resp.json()
        assert resp.status_code == 200
        assert (data["total"], data["page"], data["size"]) == (41, 3, 10)
        assert data["items"][0]["projet_slug"] == "smartcity-explorer"
        repos.projet.get_projets.assert_awaited_once_with(
            candidat_slug="alice-martin", competence="mongodb", page=3, size=10
        )

    def test_unknown_candidat(self, api, repos):
        repos.candidat.get_candidat_by_slug.return_value = None
        assert api.get("/api/candidats/x/projets").status_code == 404


class TestCandidatStats:  # R3
    def test_stats_schema(self, api, repos):
        repos.candidat.get_candidat_by_slug.return_value = CANDIDAT
        repos.projet.get_competence_stats.return_value = [{"skill_slug": "python", "nombre_projets": 3}]
        repos.projet.count_projets_candidat.return_value = 3

        data = api.get("/api/candidats/alice-martin/stats").json()

        assert data["total_projets"] == 3
        assert data["competences"][0] == {
            "skill_slug": "python", "nom": "Python", "domaine": "langages", "niveau": 4, "nombre_projets": 3,
        }

    def test_unknown_candidat(self, api, repos):
        repos.candidat.get_candidat_by_slug.return_value = None
        assert api.get("/api/candidats/x/stats").status_code == 404
