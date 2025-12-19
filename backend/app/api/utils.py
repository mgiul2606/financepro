from typing import Type, TypeVar, overload, Callable
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import select, inspect
from sqlalchemy.orm.attributes import InstrumentedAttribute
from fastapi import HTTPException, status

T = TypeVar("T")
TOwner = TypeVar("TOwner")
TOutput = TypeVar("TOutput")

# Cache per le FK: (model, owner_model) -> colonna
_fk_cache: dict[tuple[type, type], InstrumentedAttribute] = {}


# ============================================================================
# get_by_id - Recupera oggetti per ID con validazione
# ============================================================================

@overload
def get_by_id(
    db: Session,
    model: Type[T],
    object_ref: UUID,
    *,
    transform: None = None,
    not_found_detail: str | None = None
) -> T: ...

@overload
def get_by_id(
    db: Session,
    model: Type[T],
    object_ref: list[UUID],
    *,
    transform: None = None,
    not_found_detail: str | None = None
) -> list[T]: ...

@overload
def get_by_id(
    db: Session,
    model: Type[T],
    object_ref: UUID,
    *,
    transform: Callable[[T], TOutput],
    not_found_detail: str | None = None
) -> TOutput: ...

@overload
def get_by_id(
    db: Session,
    model: Type[T],
    object_ref: list[UUID],
    *,
    transform: Callable[[T], TOutput],
    not_found_detail: str | None = None
) -> list[TOutput]: ...

def get_by_id(
    db: Session,
    model: Type[T],
    object_ref: UUID | list[UUID],
    *,
    transform: Callable[[T], TOutput] | None = None,
    not_found_detail: str | None = None
) -> T | list[T] | TOutput | list[TOutput]:
    """
    Recupera uno o più oggetti per ID dal database.
    
    Args:
        db: Sessione database
        model: Modello SQLAlchemy da interrogare
        object_ref: UUID singolo o lista di UUID
        transform: Funzione opzionale per trasformare gli oggetti recuperati
        not_found_detail: Messaggio di errore personalizzato
    
    Returns:
        Oggetto singolo o lista di oggetti (trasformati se specificato)
    
    Raises:
        HTTPException: Se l'oggetto non viene trovato (404)
    """
    if isinstance(object_ref, UUID):
        # Caso singolo
        obj = db.scalars(
            select(model).where(model.id == object_ref)
        ).first()

        if not obj:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=not_found_detail or f"{model.__name__} with id {object_ref} not found"
            )
        
        return transform(obj) if transform else obj
    
    # Caso multiplo
    objs = db.scalars(
        select(model).where(model.id.in_(object_ref))
    ).all()

    if not objs or len(objs) != len(object_ref):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=not_found_detail or f"One or more {model.__name__} object(s) not found"
        )
    
    return [transform(o) for o in objs] if transform else objs


# ============================================================================
# _find_owner_column - Trova la FK tra due modelli
# ============================================================================

def _find_owner_column(
    model: Type[T], 
    owner_model: Type[TOwner]
) -> InstrumentedAttribute:
    """
    Trova la colonna FK che collega model a owner_model.
    Il risultato viene cachato per evitare ispezioni ripetute.
    
    Args:
        model: Modello che contiene la FK
        owner_model: Modello referenziato dalla FK
    
    Returns:
        Colonna (InstrumentedAttribute) che rappresenta la FK
    
    Raises:
        ValueError: Se non esiste una FK tra i due modelli
    """
    cache_key = (model, owner_model)
    
    if cache_key in _fk_cache:
        return _fk_cache[cache_key]
    
    owner_table = owner_model.__tablename__
    mapper = inspect(model)
    
    for column in mapper.columns:
        for fk in column.foreign_keys:
            if fk.column.table.name == owner_table:
                # Cache la colonna come attributo strumentato
                fk_column = getattr(model, column.name)
                _fk_cache[cache_key] = fk_column
                return fk_column
    
    raise ValueError(
        f"No foreign key found from {model.__name__} to {owner_model.__name__}"
    )


# ============================================================================
# children_for - Recupera oggetti validando l'ownership
# ============================================================================

@overload
def children_for(
    db: Session,
    owner_model: Type[TOwner],
    model: Type[T],
    owner_ref: UUID | list[UUID],
    object_ref: UUID,
    *,
    transform: None = None,
    error_detail: str | None = None
) -> T: ...

@overload
def children_for(
    db: Session,
    owner_model: Type[TOwner],
    model: Type[T],
    owner_ref: UUID | list[UUID],
    object_ref: list[UUID] | None = None,
    *,
    transform: None = None,
    error_detail: str | None = None
) -> list[T]: ...

@overload
def children_for(
    db: Session,
    owner_model: Type[TOwner],
    model: Type[T],
    owner_ref: UUID | list[UUID],
    object_ref: UUID,
    *,
    transform: Callable[[T], TOutput],
    error_detail: str | None = None
) -> TOutput: ...

@overload
def children_for(
    db: Session,
    owner_model: Type[TOwner],
    model: Type[T],
    owner_ref: UUID | list[UUID],
    object_ref: list[UUID] | None = None,
    *,
    transform: Callable[[T], TOutput],
    error_detail: str | None = None
) -> list[TOutput]: ...

def children_for(
    db: Session,
    owner_model: Type[TOwner],
    model: Type[T],
    owner_ref: UUID | list[UUID],
    object_ref: UUID | list[UUID] | None = None,
    *,
    transform: Callable[[T], TOutput] | None = None,
    error_detail: str | None = None
) -> T | list[T] | TOutput | list[TOutput]:
    """
    Recupera oggetti verificando che appartengano a uno o più owner specifici.
    Se object_ref non è specificato, recupera tutti gli oggetti dell'owner.
    La FK viene individuata automaticamente ispezionando il modello.
    
    Args:
        db: Sessione database
        owner_model: Modello dell'owner (es. User, Organization)
        model: Modello degli oggetti da recuperare
        owner_ref: ID singolo o lista di ID degli owner
        object_ref: ID singolo, lista di ID o None (tutti gli oggetti)
        transform: Funzione opzionale per trasformare gli oggetti
        error_detail: Messaggio di errore personalizzato
    
    Returns:
        Oggetto singolo o lista (trasformati se specificato)
    
    Raises:
        ValueError: Se non esiste una FK tra model e owner_model o lista vuota
        HTTPException: Se oggetti non esistono o non appartengono all'owner (400)
    """
    # Validazione input
    if object_ref == []:
        raise ValueError("object_ref cannot be an empty list")
    
    # Trova la colonna FK
    owner_column = _find_owner_column(model, owner_model)
    
    # Costruisci query base
    if isinstance(owner_ref, UUID):
        query = select(model).where(owner_column == owner_ref)
    else:
        query = select(model).where(owner_column.in_(owner_ref))
    
    # Caso: recupero singolo oggetto
    if isinstance(object_ref, UUID):
        query = query.where(model.id == object_ref)
        obj = db.scalars(query).first()
        
        if not obj:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_detail or (
                    f"{model.__name__} with id {object_ref} is invalid "
                    f"or not owned by the specified {owner_model.__name__}"
                )
            )
        
        return transform(obj) if transform else obj
    
    # Caso: recupero multiplo o tutti gli oggetti
    if object_ref is not None:
        query = query.where(model.id.in_(object_ref))
    
    valid_objs = db.scalars(query).all()
    
    # Validazione: se sono stati richiesti ID specifici, devono essere tutti trovati
    if object_ref is not None and len(valid_objs) != len(object_ref):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_detail or (
                f"One or more {model.__name__} are invalid "
                f"or not owned by the specified {owner_model.__name__}"
            )
        )
    
    return [transform(o) for o in valid_objs] if transform else valid_objs


# ============================================================================
# Utility per testing/debug
# ============================================================================

def clear_fk_cache() -> None:
    """Svuota la cache delle FK (utile per testing)."""
    _fk_cache.clear()

def get_fk_cache_info() -> dict[str, str]:
    """Restituisce informazioni sulla cache FK (utile per debug)."""
    return {
        f"{model.__name__} -> {owner.__name__}": col.key
        for (model, owner), col in _fk_cache.items()
    }