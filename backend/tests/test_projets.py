"""Tests d'acceptation — Endpoints Projets (galerie, R8 fiche détaillée, suppression)."""

from __future__ import annotations

from .conftest import PROJET


class TestListProjets:
    def test_schema_and_filter(self, api, repos):
        repos.projet.get_projets.return_value = ([PROJET], 1)
        data = api.get("/api/projets", params={"competence": "Python"}).json()
        assert set(data) == {"items", "total", "page", "size"}
        assert data["items"][0]["titre"] == "SmartCity Explorer"
        repos.projet.get_projets.assert_awaited_once_with(competence="python", page=1, size=20)


class TestProjetDetail:  # R8
    def test_full_sheet(self, api, repos):
        repos.projet.get_projet_by_slug.return_value = {
            **PROJET,
            "contexte": "TP fil rouge NoSQL",
            "metriques": {"tests_verts": 58},
            "liens": {"github": "https://github.com/alice/smartcity"},
            "images": [],
        }
        resp = api.get("/api/projets/smartcity-explorer")
        data = resp.json()
        assert resp.status_code == 200
        for key in ("projet_slug", "candidat_slugs", "titre", "contexte", "description",
                    "competences", "metriques", "liens", "images"):
            assert key in data
        assert data["metriques"] == {"tests_verts": 58} and data["competences"] == ["python", "mongodb"]
        repos.projet.get_projet_by_slug.assert_awaited_once_with("smartcity-explorer")

    def test_not_found(self, api, repos):
        repos.projet.get_projet_by_slug.return_value = None
        resp = api.get("/api/projets/nope")
        assert resp.status_code == 404 and resp.json() == {"detail": "Projet non trouvé"}


class TestDeleteProjet:
    def test_deletes_in_both_databases(self, api, repos):
        repos.projet.delete_projet.return_value = True
        repos.neo4j.delete_projet.return_value = True
        resp = api.delete("/api/projets/smartcity-explorer")
        assert resp.status_code == 204 and resp.content == b""
        repos.projet.delete_projet.assert_awaited_once_with("smartcity-explorer")
        repos.neo4j.delete_projet.assert_awaited_once_with("smartcity-explorer")

    def test_resumes_after_partial_failure(self, api, repos):
        repos.projet.delete_projet.return_value = False  # déjà supprimé de Mongo
        repos.neo4j.delete_projet.return_value = True
        assert api.delete("/api/projets/x").status_code == 204

    def test_unknown_everywhere_is_404(self, api, repos):
        repos.projet.delete_projet.return_value = False
        repos.neo4j.delete_projet.return_value = False
        assert api.delete("/api/projets/x").status_code == 404
