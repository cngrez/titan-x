from pydantic import BaseMode, Field, field_validator
from typing import Optional

class CreateBodyMetricsRequest(BaseMode): 
    weight: float = Field(..., gt=0, description="Weight in kilograms")
    body_fat_percentage: Optional[float] = Field(None, ge=0, le=100, description="Body fat percentage")
    muscle_mass: Optional[float] = Field(None, ge=0, le=100, description="Muscle mass percentage")
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes")
    
    @field_validator("body_fat_percentage", "muscle_mass")
    @classmethod
    def validate_percentage(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError("Percentage values must be between 0 and 100")
        return v
    
    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v):
        if v is not None and len(v) > 500:
            raise ValueError("Notes must be 500 characters or less")
        return v
    
class UpdateBodyMetricsRequest(BaseMode): 
    weight: float = Field(..., gt=0, description="Weight in kilograms")
    body_fat_percentage: Optional[float] = Field(None, ge=0, le=100, description="Body fat percentage")
    muscle_mass: Optional[float] = Field(None, ge=0, le=100, description="Muscle mass percentage")
    notes: Optional[str] = Field(None, max_length=500, description="Additional notes")
    
    @field_validator("body_fat_percentage", "muscle_mass")
    @classmethod
    def validate_percentage(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError("Percentage values must be between 0 and 100")
        return v
    
    @field_validator("notes")
    @classmethod
    def validate_notes(cls, v):
        if v is not None and len(v) > 500:
            raise ValueError("Notes must be 500 characters or less")
        return v
    
class BodyMetricResponse(BaseMode):
    id: int
    weight: float
    body_fat_percentage: Optional[float]
    muscle_mass: Optional[float]
    notes: Optional[str]
    created_at: str
        
        
    
    