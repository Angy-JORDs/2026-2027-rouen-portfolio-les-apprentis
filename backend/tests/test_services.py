"""Tests des services avec de faux repositories (aucune base nécessaire).

Ces tests sont ignorés tant que les modèles Pydantic (portfolio_api.models) ne sont pas écrits :
ils s'activeront automatiquement dès que CandidatOut, ProjetOut, Page… existeront.
"""

from __future__ import annotations

import pytest

candidat_service = pytest.importorskip(
    "portfolio_api.services.candidat_service", reason="modèles Pydantic pas encore écrits", exc_type=ImportError
)
graph_service = pytest.importorskip(
    "portfolio_api.services.graph_service", reason="modèles Pydantic pas encore écrits", exc_type=ImportError
)
projet_service = pytest.importorskip(
    "portfolio_api.services.projet_service", reason="modèles Pydantic pas encore écrits", exc_type=ImportError
)

CandidatService = candidat_service.CandidatService
GraphService = graph_service.GraphService
ProjetService = projet_service.ProjetService


# --------------------------------------------------------------------------- données

JOEL = {
    "candidat_slug": "joel-diangon",
    "prenom": "Joël",
    "nom": "Diangon",
    "titre": "Apprenti ingénieur Data & IA",
    "bio": None,
    "liens": {},
    "experiences": [
        {"entreprise": "Afriland First Bank", "poste": "Junior Data Analyst", "debut": "2023-06", "fin": "2023-08",
         "description": "Scoring clients.", "competences": ["power-bi"]},
        {"entreprise": "De Rijke", "poste": "Apprenti Data & IA", "debut": "2025-10", "fin": None,
         "description": "Dashboards.", "competences": ["power-bi"]},
    ],
    "formations": [{"ecole": "ESIGELEC", "diplome": "Ingénieur Big Data", "debut": "2024-09", "fin": "2027-09"}],
    "competences": [{"skill_slug": "python", "nom": "Python", "domaine": "langages", "niveau": 4}],
}

PROJET = {
    "projet_slug": "scoring-clients",
    "candidat_slugs": ["joel-diangon"],
    "titre": "Scoring clients",
    "contexte": "Stage",
    "description": "Modèle de scoring.",
    "date_debut": None,
    "date_fin": None,
    "competences": ["python", "machine-learning"],
    "metriques": {},
    "liens": {},
    "images": [],
}


# --------------------------------------------------------------------------- faux repositories

class FakeCandidatRepo:
    def __init__(self, docs=(JOEL,)):
        self.docs = {d["candidat_slug"]: d for d in docs}
        self.last_skip = None

    async def get_by_slug(self, slug):
        return self.docs.get(slug)

    async def list_candidats(self, skip, limit):
        self.last_skip = skip
        rows = [{k: d[k] for k in ("candidat_slug", "prenom", "nom", "titre")} for d in self.docs.values()]
        return rows[skip : skip + limit], len(rows)


class FakeProjetRepo:
    def __init__(self, docs=(PROJET,)):
        self.docs = {d["projet_slug"]: d for d in docs}

    async def find_by_candidat(self, slug, competence, skip, limit):
        rows = [d for d in self.docs.values() if slug in d["candidat_slugs"]
                and (competence is None or competence in d["competences"])]
        return rows[skip : skip + limit], len(rows)

    async def count_by_candidat(self, slug):
        return sum(slug in d["candidat_slugs"] for d in self.docs.values())

    async def count_competences(self, slug):
        return [{"skill_slug": "python", "nombre_projets": 1}, {"skill_slug": "machine-learning", "nombre_projets": 1}]

    async def search(self, competence, skip, limit):
        rows = [d for d in self.docs.values() if competence is None or competence in d["competences"]]
        return rows[skip : skip + limit], len(rows)

    async def get_by_slug(self, slug):
        return self.docs.get(slug)

    async def find_by_slugs(self, slugs):
        return [self.docs[s] for s in slugs if s in self.docs]

    async def delete(self, slug):
        return self.docs.pop(slug, None) is not None


class FakeNeo4jRepo:
    def __init__(self):
        self.projets = {"scoring-clients": {"projet_slug": "scoring-clients", "titre": "Scoring clients"}}

    async def get_projet(self, slug):
        return self.projets.get(slug)

    async def similar_projets(self, slug, limit):
        return [{"projet_slug": "reporting", "titre": "Reporting", "competences": ["python", "sql"]}][:limit]

    async def get_candidat(self, slug):
        return {"candidat_slug": slug, "prenom": "Joël", "nom": "Diangon"} if slug in ("joel-diangon", "sans-projet") else None

    async def candidat_graph(self, slug):
        if slug == "sans-projet":
            return []
        return [
            {"projet_slug": "scoring-clients", "projet_titre": "Scoring clients", "skill_slug": "python", "skill_nom": "Python"},
            {"projet_slug": "scoring-clients", "projet_titre": "Scoring clients", "skill_slug": "machine-learning", "skill_nom": "Machine Learning"},
            {"projet_slug": "reporting", "projet_titre": "Reporting", "skill_slug": "python", "skill_nom": "Python"},
            {"projet_slug": "projet-vide", "projet_titre": "Projet vide", "skill_slug": None, "skill_nom": None},
        ]

    async def get_competence(self, slug):
        return {"skill_slug": slug, "nom": "Python"} if slug == "python" else None

    async def candidats_by_competence(self, slug):
        return [{"candidat_slug": "joel-diangon", "prenom": "Joël", "nom": "Diangon", "nb_projets": 2}]

    async def projets_by_competence(self, slug):
        return ["scoring-clients", "absent-de-mongo"]

    async def delete_projet(self, slug):
        return self.projets.pop(slug, None) is not None


# --------------------------------------------------------------------------- CandidatService

async def test_detail_timeline_fusionnee_et_triee():
    out = await CandidatService(FakeCandidatRepo(), FakeProjetRepo()).get_candidat_detail("joel-diangon")
    assert [(i.type, i.debut) for i in out.timeline] == [
        ("experience", "2025-10"), ("formation", "2024-09"), ("experience", "2023-06")
    ]
    assert out.timeline[1].organisation == "ESIGELEC"
    assert out.timeline[1].description is None


async def test_candidat_inconnu_renvoie_none():
    service = CandidatService(FakeCandidatRepo(), FakeProjetRepo())
    assert await service.get_candidat_detail("inconnu") is None
    assert await service.get_candidat_projets("inconnu") is None
    assert await service.get_candidat_stats("inconnu") is None


async def test_projets_filtre_et_pagination():
    service = CandidatService(FakeCandidatRepo(), FakeProjetRepo())
    page = await service.get_candidat_projets("joel-diangon", competence="python")
    assert page.total == 1 and page.items[0].projet_slug == "scoring-clients"
    vide = await service.get_candidat_projets("joel-diangon", competence="neo4j")
    assert vide.total == 0 and vide.items == []


async def test_liste_calcule_le_skip():
    repo = FakeCandidatRepo()
    page = await CandidatService(repo, FakeProjetRepo()).search_candidats(page=3, size=10)
    assert repo.last_skip == 20
    assert (page.page, page.size) == (3, 10)


async def test_stats_competence_non_declaree():
    out = await CandidatService(FakeCandidatRepo(), FakeProjetRepo()).get_candidat_stats("joel-diangon")
    assert out.total_projets == 1
    python, ml = out.competences
    assert (python.nom, python.niveau) == ("Python", 4)
    assert (ml.nom, ml.domaine, ml.niveau) == ("machine-learning", None, None)


# --------------------------------------------------------------------------- GraphService

def _graph_service():
    return GraphService(FakeNeo4jRepo(), FakeProjetRepo())


async def test_similaires():
    out = await _graph_service().get_similar_projets("scoring-clients", limit=5)
    assert out.similaires[0].competences_communes == 2
    assert await _graph_service().get_similar_projets("inconnu") is None


async def test_graphe_sans_doublons():
    out = await _graph_service().get_candidat_graph("joel-diangon")
    ids = [n.id for n in out.nodes]
    assert len(ids) == len(set(ids))
    assert set(ids) == {
        "candidat:joel-diangon", "projet:scoring-clients", "projet:reporting", "projet:projet-vide",
        "competence:python", "competence:machine-learning",
    }
    assert out.nodes[0].label == "Joël Diangon"
    assert sum(link.type == "REALISE" for link in out.links) == 3
    assert sum(link.type == "UTILISE" for link in out.links) == 3


async def test_graphe_candidat_sans_projet():
    out = await _graph_service().get_candidat_graph("sans-projet")
    assert len(out.nodes) == 1 and out.links == []
    assert await _graph_service().get_candidat_graph("inconnu") is None


async def test_candidats_par_competence():
    out = await _graph_service().get_candidats_by_competence("python")
    assert out.nom == "Python" and out.candidats[0].nb_projets == 2
    assert await _graph_service().get_candidats_by_competence("inconnue") is None


async def test_projets_par_competence_ignore_les_projets_absents_de_mongo():
    out = await _graph_service().get_projets_by_competence("python")
    assert [p.projet_slug for p in out.projets] == ["scoring-clients"]
    assert await _graph_service().get_projets_by_competence("inconnue") is None


# --------------------------------------------------------------------------- ProjetService

async def test_galerie_et_detail():
    service = ProjetService(FakeProjetRepo(), FakeNeo4jRepo())
    page = await service.search_projets(competence="machine-learning")
    assert page.total == 1
    assert (await service.get_projet_detail("scoring-clients")).titre == "Scoring clients"
    assert await service.get_projet_detail("inconnu") is None


async def test_suppression_dans_les_deux_bases():
    mongo, neo4j = FakeProjetRepo(), FakeNeo4jRepo()
    service = ProjetService(mongo, neo4j)
    assert await service.delete_projet("scoring-clients") is True
    assert "scoring-clients" not in mongo.docs and "scoring-clients" not in neo4j.projets
    assert await service.delete_projet("scoring-clients") is False  # plus nulle part -> 404


async def test_suppression_rejouable_si_reste_dans_une_seule_base():
    mongo, neo4j = FakeProjetRepo(docs=()), FakeNeo4jRepo()  # absent de Mongo, présent dans Neo4j
    assert await ProjetService(mongo, neo4j).delete_projet("scoring-clients") is True
    assert "scoring-clients" not in neo4j.projets
