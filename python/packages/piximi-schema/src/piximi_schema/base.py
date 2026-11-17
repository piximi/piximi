from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class WireModel(BaseModel):
    """Base for everything that crosses the wire.

    Fields are ``snake_case`` in Python and ``camelCase`` on the wire, matching
    the frontend's domain types field for field. Undeclared fields are
    rejected so the generated TypeScript interfaces can be closed, and an
    optional field left unset is omitted rather than sent as ``null``.
    """

    model_config = ConfigDict(
        alias_generator=to_camel,
        validate_by_name=True,
        validate_by_alias=True,
        serialize_by_alias=True,
        extra="forbid",
    )

    def to_wire(self) -> dict:
        """The form sent over the wire: camelCase keys, unset optionals
        omitted, and ``bytes`` left as bytes for msgpack (JSON mode would
        try to decode them as text). Enums are str/int subclasses, so both
        msgpack and ``json.dumps`` take the result as is."""
        return self.model_dump(mode="python", by_alias=True, exclude_none=True)
