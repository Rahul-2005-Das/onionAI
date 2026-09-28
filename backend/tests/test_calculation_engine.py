import pytest
from fastapi.testclient import TestClient

from backend.app.calculation_engine import calculate_onion_quality
from backend.app.grading_rules import GradingRules
from backend.app.main import app
from backend.app.schemas import CalculationInput


def test_category_percentages_use_total_and_include_unclassified():
    result = calculate_onion_quality(
        total=100,
        healthy=40,
        damaged=15,
        rotten=10,
        sprouted=20,
        undersized=10,
    )

    assert result["percentages"] == {
        "healthy": 40,
        "damaged": 15,
        "rotten": 10,
        "sprouted": 20,
        "undersized": 10,
        "unclassified": 5,
    }
    assert result["grade_a_percentage"] == 40
    assert result["urs_percentage"] == 30
    assert result["unclassified_count"] == 5
    assert result["grading_rules_official"] is False


def test_percentages_round_half_up_consistently():
    result = calculate_onion_quality(total=8, healthy=1, damaged=3, rotten=4)

    assert result["percentages"]["healthy"] == 13
    assert result["percentages"]["damaged"] == 37
    assert result["percentages"]["rotten"] == 50
    assert sum(result["percentages"].values()) == 100
    assert result["grade_a_percentage"] == 13


def test_zero_onions_returns_safe_unclassified_result():
    result = calculate_onion_quality(total=0)

    assert result["percentages"] == {
        "healthy": 0,
        "damaged": 0,
        "rotten": 0,
        "sprouted": 0,
        "undersized": 0,
        "unclassified": 0,
    }
    assert result["quality_score"] == 0
    assert result["unclassified_count"] == 0
    assert result["final_grade"] == "Unclassified"
    assert result["storage_verdict"] == "unclassified"


@pytest.mark.parametrize(
    ("total", "counts"),
    [
        (-1, {}),
        (3, {"healthy": -1}),
        (3, {"damaged": -1}),
        (3, {"rotten": -1}),
        (3, {"sprouted": -1}),
        (3, {"undersized": -1}),
        (2, {"healthy": 2, "rotten": 1}),
    ],
)
def test_invalid_counts_are_rejected(total, counts):
    with pytest.raises(ValueError):
        calculate_onion_quality(total=total, **counts)


def test_missing_api_categories_default_safely_to_zero():
    request = CalculationInput(total=4, healthy=2)

    assert request.model_dump() == {
        "total": 4,
        "healthy": 2,
        "damaged": 0,
        "rotten": 0,
        "sprouted": 0,
        "undersized": 0,
    }


def test_api_returns_engine_calculation_and_rules_disclosure():
    with TestClient(app) as client:
        response = client.post(
            "/api/v1/assessments/calculate",
            json={"total": 10, "healthy": 8, "damaged": 1, "rotten": 1},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["grade_a_percentage"] == 80
    assert payload["urs_percentage"] == 10
    assert payload["grading_rules_official"] is False
    assert payload["final_grade"] == "Grade A"


def test_grade_thresholds_can_be_replaced_without_changing_engine():
    confirmed_rules = GradingRules(
        version="confirmed-test-rules",
        is_official=True,
        grade_a_minimum_healthy_percentage=60,
        grade_b_minimum_healthy_percentage=30,
        urs_maximum_percentage=40,
    )
    result = calculate_onion_quality(total=10, healthy=6, damaged=4, rules=confirmed_rules)

    assert result["final_grade"] == "Grade A"
    assert result["grading_rules_official"] is True
    assert result["grading_rules_version"] == "confirmed-test-rules"