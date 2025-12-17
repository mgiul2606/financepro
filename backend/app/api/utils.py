from typing import Type, TypeVar
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import select
from fastapi import HTTPException, status

T = TypeVar("T")
TOwner = TypeVar("TOwner")

# Cache per le FK: (model, owner_model) -> nome_colonna
_fk_cache: dict[tuple[type, type], str] = {}


def get_by_id(
    db: Session,
    model: Type[T],
    object_id: UUID,
    *,
    not_found_detail: str | None = None
) -> T:
    obj = db.scalars(
        select(model).where(model.id == object_id)
    ).first()

    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=not_found_detail or f"{model.__name__} with id {object_id} not found"
        )

    return obj

def _find_owner_column(model: Type[T], owner_model: Type[TOwner]):
    """
    Trova la colonna FK che collega model a owner_model.
    Il risultato viene cachato per evitare ispezioni ripetute.
    """
    cache_key = (model, owner_model)
    
    if cache_key in _fk_cache:
        return getattr(model, _fk_cache[cache_key])
    
    owner_table = owner_model.__tablename__
    
    for column in model.columns:
        for fk in column.foreign_keys:
            if fk.column.table.name == owner_table:
                _fk_cache[cache_key] = column.name
                return column
    
    raise ValueError(
        f"No foreign key found from {model.__name__} to {owner_model.__name__}"
    )

def get_children(
        db: Session,
        owner_model: Type[TOwner],
        model: Type[T],
        owner_id: UUID,
        object_ids: list[UUID] | None = None,
        *,
        error_detail: str | None = None
) -> list[T]:
    """
    Recupera oggetti verificando che appartengano a un owner specifico.
    Se non sono indicati degli object_ids sono individuati tutti gli oggetti disponibili per quell'owner.
    La FK viene individuata automaticamente ispezionando il modello.
    
    Args:
        db: Sessione database
        owner_model: Modello dell'owner (es. User, Organization)
        model: Modello degli oggetti da recuperare
        owner_id: ID dell'owner
        object_ids: Lista di ID degli oggetti da verificare (opzionale)
        error_detail: Messaggio di errore personalizzato
    
    Returns:
        Lista degli oggetti validati
    
    Raises:
        ValueError: Se non esiste una FK tra model e owner_model
        HTTPException: Se uno o più oggetti non esistono o non appartengono all'owner
    """
    if object_ids == []:
        raise ValueError("object_ids non può essere una lista vuota")
    
    owner_column = _find_owner_column(model, owner_model)
    
    query = select(model).where(owner_column == owner_id)

    if object_ids is not None:
        query = query.where(model.id.in_(object_ids))

    valid_objs = db.scalars(query).all()
    
    if len(valid_objs) != len(object_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_detail or (
                f"One or more {model.__name__} are invalid "
                f"or not owned by the current {owner_model.__name__}"
            )
        )
    
    return list(valid_objs)

def get_children_ids(
        db: Session,
        owner_model: Type[TOwner],
        model: Type[T],
        owner_id: UUID,
        object_ids: list[UUID] | None = None,
        *,
        error_detail: str | None = None
) -> list[T]:
    """
    Recupera gli id degli oggetti verificando che appartengano a un owner specifico.
    La FK viene individuata automaticamente ispezionando il modello.
    
    Args:
        db: Sessione database
        owner_model: Modello dell'owner (es. User, Organization)
        model: Modello degli oggetti da recuperare
        owner_id: ID dell'owner
        object_ids: Lista di ID degli oggetti da verificare
        error_detail: Messaggio di errore personalizzato
    
    Returns:
        Lista degli id degli oggetti validati
    
    Raises:
        ValueError: Se non esiste una FK tra model e owner_model
        HTTPException: Se uno o più oggetti non esistono o non appartengono all'owner
    """
    objs = get_children(db, owner_model, model, owner_id, object_ids, error_detail=error_detail)
    return [o.id for o in objs]

def get_children_from_list(
        db: Session,
        owner_model: Type[TOwner],
        model: Type[T],
        owner_ids: list[UUID],
        object_ids: list[UUID] | None = None,
        *,
        error_detail: str | None = None
) -> list[T]:
    """
    Recupera oggetti verificando che appartengano a un owner tra quelli indicati nella owner_list (owner_ids).
    Se non sono indicati degli object_ids sono individuati tutti gli oggetti disponibili per quell'owner.
    La FK viene individuata automaticamente ispezionando il modello.
    
    Args:
        db: Sessione database
        owner_model: Modello dell'owner (es. User, Organization)
        model: Modello degli oggetti da recuperare
        owner_ids: gli ID ammessi per gli owner
        object_ids: Lista di ID degli oggetti da verificare (opzionale)
        error_detail: Messaggio di errore personalizzato
    
    Returns:
        Lista degli oggetti validati
    
    Raises:
        ValueError: Se non esiste una FK tra model e owner_model
        HTTPException: Se uno o più oggetti non esistono o non appartengono all'owner
    """
    if object_ids == []:
        raise ValueError("object_ids non può essere una lista vuota")
    
    owner_column = _find_owner_column(model, owner_model)
    
    query = select(model).where(owner_column.in_(owner_ids))

    if object_ids is not None:
        query = query.where(model.id.in_(object_ids))

    valid_objs = db.scalars(query).all()
    
    if len(valid_objs) != len(object_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_detail or (
                f"One or more {model.__name__} are invalid "
                f"or not owned by the current {owner_model.__name__}"
            )
        )
    
    return list(valid_objs)

def get_children_ids_from_list(
        db: Session,
        owner_model: Type[TOwner],
        model: Type[T],
        owner_ids: list[UUID],
        object_ids: list[UUID] | None = None,
        *,
        error_detail: str | None = None
) -> list[T]:
    """
    Recupera gli id degli oggetti verificando che appartengano a un owner specifico.
    La FK viene individuata automaticamente ispezionando il modello.
    
    Args:
        db: Sessione database
        owner_model: Modello dell'owner (es. User, Organization)
        model: Modello degli oggetti da recuperare
        owner_ids: ID ammessi per l'owner
        object_ids: Lista di ID degli oggetti da verificare
        error_detail: Messaggio di errore personalizzato
    
    Returns:
        Lista degli id degli oggetti validati
    
    Raises:
        ValueError: Se non esiste una FK tra model e owner_model
        HTTPException: Se uno o più oggetti non esistono o non appartengono all'owner
    """
    objs = get_children_from_list(db, owner_model, model, owner_ids, object_ids, error_detail=error_detail)
    return [o.id for o in objs]

# Utility opzionale per testing/debug
def clear_fk_cache() -> None:
    """Svuota la cache delle FK (utile per testing)."""
    _fk_cache.clear()

def get_fk_cache_info() -> dict[str, str]:
    """Restituisce info sulla cache (utile per debug)."""
    return {
        f"{model.__name__} -> {owner.__name__}": col_name
        for (model, owner), col_name in _fk_cache.items()
    }