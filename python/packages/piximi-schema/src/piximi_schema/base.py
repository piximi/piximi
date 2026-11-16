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
        """The JSON-compatible form sent over the wire."""
        return self.model_dump(mode="json", exclude_none=True)
