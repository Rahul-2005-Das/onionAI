"""Pure, reusable onion count and quality calculation engine."""

from decimal import Decimal, ROUND_DOWN, ROUND_HALF_UP
from typing import TypedDict

from .grading_rules import DEFAULT_GRADING_RULES, GradingRules

CATEGORIES = ("healthy", "damaged", "rotten", "sprouted", "undersized")


class OnionCounts(TypedDict):
    healthy: int
    damaged: int
    rotten: int
    sprouted: int
    undersized: int


def _validate_count(name: str, value: int) -> None:
    if isinstance(value, bool) or not isinstance(value, int):
        raise ValueError(f"{name} must be a whole number")
    if value < 0:
        raise ValueError(f"{name} cannot be negative")


def _round(value: float, decimal_places: int) -> float | int:
    quantum = Decimal("1").scaleb(-decimal_places)
    rounded = Decimal(str(value)).quantize(quantum, rounding=ROUND_HALF_UP)
    if decimal_places == 0:
        return int(rounded)
    return float(rounded)


def _rounded_percentages(total: int, counts: dict[str, int], decimal_places: int) -> dict[str, float | int]:
    scale = 10**decimal_places
    available_units = 100 * scale
    exact_units = {name: Decimal(count * available_units) / Decimal(total) for name, count in counts.items()}
    allocated_units = {
        name: int(units.to_integral_value(rounding=ROUND_DOWN))
        for name, units in exact_units.items()
    }
    remainder = available_units - sum(allocated_units.values())
    allocation_order = sorted(
        counts,
        key=lambda name: (-(exact_units[name] - allocated_units[name]), tuple(counts).index(name)),
    )
    for name in allocation_order[:remainder]:
        allocated_units[name] += 1
    return {
        name: _round(allocated_units[name] / scale, decimal_places)
        for name in counts
    }


def calculate_onion_quality(
    *,
    total: int,
    healthy: int = 0,
    damaged: int = 0,
    rotten: int = 0,
    sprouted: int = 0,
    undersized: int = 0,
    rules: GradingRules = DEFAULT_GRADING_RULES,
) -> dict:
    """Calculate percentages, score and provisional grade from validated counts.

    Category counts may be less than ``total``; the remainder is reported as
    unclassified. They may never exceed it. Thresholds and score weights come
    only from the injected rules configuration.
    """
    counts: OnionCounts = {
        "healthy": healthy,
        "damaged": damaged,
        "rotten": rotten,
        "sprouted": sprouted,
        "undersized": undersized,
    }
    _validate_count("total", total)
    for category, count in counts.items():
        _validate_count(category, count)

    categorized_total = sum(counts.values())
    if categorized_total > total:
        raise ValueError("Category counts cannot exceed total onions")

    unclassified = total - categorized_total
    if total == 0:
        percentages = {category: 0 for category in (*CATEGORIES, "unclassified")}
        return {
            "total": 0,
            **counts,
            "unclassified_count": 0,
            "percentages": percentages,
            "grade_a_percentage": 0,
            "grade_b_percentage": 0,
            "urs_percentage": 0,
            "quality_score": 0,
            "final_grade": "Unclassified",
            "storage_verdict": "unclassified",
            "grading_rules_official": rules.is_official,
            "grading_rules_version": rules.version,
        }

    decimals = rules.percentage_decimals
    percentages = _rounded_percentages(
        total,
        {**counts, "unclassified": unclassified},
        decimals,
    )
    grade_a_percentage = percentages["healthy"]
    urs_percentage = _round((rotten + sprouted) / total * 100, decimals)

    penalty = (
        rotten * rules.rotten_score_penalty
        + sprouted * rules.sprouted_score_penalty
        + damaged * rules.damaged_score_penalty
        + undersized * rules.undersized_score_penalty
    ) / total * 100
    quality_score = max(0, min(100, _round(grade_a_percentage - penalty, 0)))

    if urs_percentage > rules.urs_maximum_percentage or grade_a_percentage < rules.grade_b_minimum_healthy_percentage:
        final_grade = "URS"
        storage_verdict = "fail"
    elif grade_a_percentage < rules.grade_a_minimum_healthy_percentage:
        final_grade = "Grade B"
        storage_verdict = "pass"
    else:
        final_grade = "Grade A"
        storage_verdict = "pass"

    return {
        "total": total,
        **counts,
        "unclassified_count": unclassified,
        "percentages": percentages,
        "grade_a_percentage": grade_a_percentage,
        "grade_b_percentage": max(0, 100 - grade_a_percentage - urs_percentage),
        "urs_percentage": urs_percentage,
        "quality_score": quality_score,
        "final_grade": final_grade,
        "storage_verdict": storage_verdict,
        "grading_rules_official": rules.is_official,
        "grading_rules_version": rules.version,
    }