from marshmallow_sqlalchemy import ModelConverter
# We need to use marshmallow_sqlalchemy's own implementation
# of the 'Nested' field in order to pass along the SQLAlchemy session
# to nested schemas.
# See https://github.com/marshmallow-code/marshmallow-sqlalchemy/issues/67
from marshmallow_sqlalchemy.fields import Related

import geoalchemy2 as geo
from sqlalchemy.orm import RelationshipProperty
from sqlalchemy.types import Integer
from sqlalchemy.dialects import postgresql

from ..database.mapper.util import trim_postfix
from .fields import Geometry, Enum, JSON, SmartNested
from .util import to_schema_name


# Control how relationships can be resolved
allowed_collections = {
    'sample': ['session', 'material'],
    'session': 'all',
    'analysis': ['datum', 'attribute', 'constant', 'analysis_type', 'material'],
    'attribute': ['parameter', 'unit'],
    'project': ['researcher', 'publication', 'session'],
    'datum': ['datum_type'],
    'datum_type': [
        'parameter',
        'unit',
        'error_unit',
        'error_metric'
    ]
}


def allow_nest(outer, inner):
    if outer == inner:
        # Tables can always nest themselves
        return True
    coll = allowed_collections.get(outer, [])
    if coll == 'all':
        return True
    return inner in coll

class SparrowConverter(ModelConverter):
    # Make sure that we can properly convert geometries
    # and geographies
    SQLA_TYPE_MAPPING = dict(
        list(ModelConverter.SQLA_TYPE_MAPPING.items())
        + list({
            geo.Geometry: Geometry,
            geo.Geography: Geometry,
            postgresql.JSON: JSON,
            postgresql.JSONB: JSON
            }.items()
        ))

    def _get_key(self, prop):
        # Only change columns for relationship properties
        if not isinstance(prop, RelationshipProperty):
            return prop.key

        # Relationship with a single local column should be named for its
        # column (less '_id' postfix)
        if hasattr(prop, 'local_columns') and len(prop.local_columns) == 1:
            col_name = list(prop.local_columns)[0].name
            if col_name != 'id':
                return trim_postfix(col_name, "_id")

        # One-to-many models should have the field
        # named after the local column
        if prop.secondary is None and not prop.uselist:
            return prop.key
        # Otherwise, we go with the name of the target model.
        return prop.target.name

    def fields_for_model(self, model, **kwargs):
        fields = super().fields_for_model(model, **kwargs)
        return {k: v for k, v in fields.items() if v is not None}

    def _should_exclude_field(self, prop, fields=None, exclude=None):
        if fields and prop.key not in fields:
            return True
        if exclude and prop.key in fields:
            return True

        if not isinstance(prop, RelationshipProperty):
            return False

        # ## Deal with relationships here #

        if prop.target.name == 'data_file_link':
            # Data files are currently exclusively dealt with internally...
            # (this may change)
            return True

        # # Exclude field based on table name
        this_table = prop.parent.tables[0]
        other_table = prop.target

        if prop.target == this_table and prop.uselist:
            # Don't allow self-referential collections
            return True

        if prop.uselist and not allow_nest(this_table.name, prop.target.name):
            # Disallow list fields that aren't related (these usually don't have
            # corresponding local columns)
            return True

        return False

    def _get_field_kwargs_for_property(self, prop):
        # Somewhat ugly method, mostly to decide if field is dump_only or required
        kwargs = super()._get_field_kwargs_for_property(prop)
        kwargs['data_key'] = self._get_key(prop)

        kwargs['allow_nan'] = True

        if isinstance(prop, RelationshipProperty): # Relationship property
            cols = list(getattr(prop, 'local_columns', []))
            kwargs['required'] = False
            for col in cols:
                if not col.nullable:
                    kwargs['required'] = True
            if prop.uselist:
                kwargs['required'] = False

            return kwargs

        for col in prop.columns:
            is_integer = isinstance(col.type, Integer)
            # Special case for audit columns
            if col.name == 'audit_id' and is_integer:
                kwargs['dump_only'] = True
                return kwargs

            if is_integer and col.primary_key:
                # Integer primary keys should be dump-only, probably
                # We could probably check for a default sequence
                # if we wanted to be general...
                kwargs['dump_only'] = True
            elif not col.nullable:
                kwargs['required'] = True

            if isinstance(col.type, postgresql.UUID):
                kwargs['dump_only'] = True
                kwargs['required'] = False

            dump_only = kwargs.get('dump_only', False)
            if not dump_only and not col.nullable:
                kwargs['required'] = True
            if dump_only:
                kwargs['required'] = False
            if col.default is not None:
                kwargs['required'] = False

        return kwargs

    def _related_entity(self, prop):
        # If this is a relationship, return related entity
        if isinstance(prop, RelationshipProperty):
            return prop.mapper.entity
        return None

    def property2field(self, prop, **kwargs):
        if not isinstance(prop, RelationshipProperty):
            return super().property2field(prop, **kwargs)

        # The "name" is actually the name of the related model, NOT the name
        # of field
        cls = self._related_entity(prop)
        name = to_schema_name(cls.__name__)

        field_kwargs = self._get_field_kwargs_for_property(prop)
        field_kwargs.update(**kwargs)

        this_table = prop.parent.tables[0]
        if not allow_nest(this_table.name, prop.target.name):
            # Fields that are not allowed to be nested
            return Related(name, **field_kwargs)
        if prop.target.schema == 'enum':
            # special carve-out for enums represented as foreign keys
            # (these should be stored in the 'enum' schema):
            return Enum(name, **field_kwargs)

        # Ignore fields that reference parent models in a nesting relationship
        exclude = []
        for p in cls.__mapper__.relationships:
            if self._should_exclude_field(p):
                continue
            id_ = self._get_field_name(p)
            if p.mapper.entity == prop.parent.entity:
                exclude.append(id_)

        return SmartNested(name, many=prop.uselist, exclude=exclude, **field_kwargs)