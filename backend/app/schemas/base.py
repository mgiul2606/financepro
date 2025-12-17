# app/schemas/base.py
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

class CamelCaseModel(BaseModel):
    """Base model che converte automaticamente da snake_case a camelCase"""
    
    model_config = ConfigDict(
        # Genera automaticamente alias in camelCase per tutti i campi
        alias_generator=to_camel,
        
        # Permette di popolare il modello sia con snake_case che camelCase
        populate_by_name=True,
        
        # Serializza sempre usando gli alias (camelCase)
        serialize_by_alias=True,
    )