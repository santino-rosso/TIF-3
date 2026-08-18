from pydantic import BaseModel, Field


class PaymentData(BaseModel):
    card_number: str = Field(min_length=16, max_length=16)
    exp_month: int = Field(ge=1, le=12)
    exp_year: int = Field(ge=2024)
    cvc: str = Field(min_length=3, max_length=3)
