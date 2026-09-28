"""Editable draft grading rules; these values are not official SIH standards."""

from dataclasses import dataclass


@dataclass(frozen=True)
class GradingRules:
    version: str = "draft-1"
    is_official: bool = False
    grade_a_minimum_healthy_percentage: float = 75
    grade_b_minimum_healthy_percentage: float = 50
    urs_maximum_percentage: float = 20
    rotten_score_penalty: float = 1.5
    sprouted_score_penalty: float = 0.7
    damaged_score_penalty: float = 0.4
    undersized_score_penalty: float = 0.2
    percentage_decimals: int = 0

    def __post_init__(self) -> None:
        if not 0 <= self.grade_b_minimum_healthy_percentage <= self.grade_a_minimum_healthy_percentage <= 100:
            raise ValueError("Healthy percentage thresholds must be ordered between 0 and 100")
        if not 0 <= self.urs_maximum_percentage <= 100:
            raise ValueError("URS percentage threshold must be between 0 and 100")
        if any(
            penalty < 0
            for penalty in (
                self.rotten_score_penalty,
                self.sprouted_score_penalty,
                self.damaged_score_penalty,
                self.undersized_score_penalty,
            )
        ):
            raise ValueError("Score penalties cannot be negative")
        if not 0 <= self.percentage_decimals <= 4:
            raise ValueError("Percentage decimals must be between 0 and 4")


# Replace these draft values only after SIH/domain grading rules are confirmed.
DEFAULT_GRADING_RULES = GradingRules()