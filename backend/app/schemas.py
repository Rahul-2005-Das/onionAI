from typing import Literal

from pydantic import BaseModel, Field, StrictInt, model_validator

Category = Literal["healthy", "damaged", "rotten", "sprouted", "undersized"]


class DetectionResult(BaseModel):
    category: Category
    confidence: float = Field(ge=0, le=1)
    bbox: tuple[float, float, float, float]

    @model_validator(mode="after")
    def validate_bbox(self):
        x, y, width, height = self.bbox
        if min(x, y, width, height) < 0 or max(x, y, width, height) > 1:
            raise ValueError("Bounding box coordinates must be normalized")
        if x + width > 1 or y + height > 1:
            raise ValueError("Bounding box must stay within the image")
        return self


class CalculationInput(BaseModel):
    total: StrictInt = Field(ge=0)
    healthy: StrictInt = Field(default=0, ge=0)
    damaged: StrictInt = Field(default=0, ge=0)
    rotten: StrictInt = Field(default=0, ge=0)
    sprouted: StrictInt = Field(default=0, ge=0)
    undersized: StrictInt = Field(default=0, ge=0)

    @model_validator(mode="after")
    def validate_counts_fit_total(self):
        category_total = self.healthy + self.damaged + self.rotten + self.sprouted + self.undersized
        if category_total > self.total:
            raise ValueError("Category counts cannot exceed total onions")
        return self


class CalculationResponse(BaseModel):
    total: int = Field(ge=0)
    healthy: int = Field(ge=0)
    damaged: int = Field(ge=0)
    rotten: int = Field(ge=0)
    sprouted: int = Field(ge=0)
    undersized: int = Field(ge=0)
    unclassified_count: int = Field(ge=0)
    percentages: dict[str, float]
    grade_a_percentage: float = Field(ge=0, le=100)
    grade_b_percentage: float = Field(ge=0, le=100)
    urs_percentage: float = Field(ge=0, le=100)
    quality_score: float = Field(ge=0, le=100)
    final_grade: Literal["Grade A", "Grade B", "URS", "Unclassified"]
    storage_verdict: Literal["pass", "fail", "unclassified"]
    grading_rules_official: bool
    grading_rules_version: str

    @model_validator(mode="after")
    def validate_count_totals(self):
        category_total = self.healthy + self.damaged + self.rotten + self.sprouted + self.undersized
        if category_total + self.unclassified_count != self.total:
            raise ValueError("Category and unclassified counts must equal total onions")
        return self


class AnalysisResponse(CalculationResponse):
    detections: list[DetectionResult]
    mode: Literal["demo", "model"]

    @model_validator(mode="after")
    def validate_count_totals(self):
        category_total = self.healthy + self.damaged + self.rotten + self.sprouted + self.undersized
        if self.total != category_total:
            raise ValueError("Total must equal the sum of category counts")
        if self.unclassified_count != 0:
            raise ValueError("Image detections must be assigned to a category")
        if len(self.detections) > self.total:
            raise ValueError("Returned detection details cannot exceed the total")
        return self