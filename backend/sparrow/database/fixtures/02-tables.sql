/*
# Database schema

The set of table definitions here builds the fundamental structures
for data in the **Sparrow** system.
*/

CREATE TABLE IF NOT EXISTS researcher (
  id serial PRIMARY KEY,
  name text NOT NULL,
  orcid text UNIQUE
);

/*
The `user` model parallels the
`researcher` model but is used only for application
authentication. We can reset all application access by
truncating this table, without losing data.
*/
CREATE TABLE IF NOT EXISTS "user" ( -- Name must be quoted because it collides with reserved word.
  username text PRIMARY KEY, -- Stores a hashed password
  password text,
  researcher_id integer REFERENCES researcher(id)
);

CREATE TABLE IF NOT EXISTS publication (
  -- A basic model for tracked publications
  id serial PRIMARY KEY,
  doi text,
  title text,
  year integer,
  journal text,
  author text,
  link text,
  -- Additional, unstructured data
  data jsonb
);

/*
# Enums
*/
CREATE TABLE IF NOT EXISTS enum.date_precision (
  id text PRIMARY KEY
);

INSERT INTO enum.date_precision(id) VALUES
  ('year'),
  ('month'),
  ('day')
ON CONFLICT DO NOTHING;


/*
# Vocabularies

Controlled vocabularies for terms defining data
semantics.
*/

CREATE TABLE IF NOT EXISTS vocabulary.parameter (
  id text PRIMARY KEY,
  description text,
  authority text
);

CREATE TABLE IF NOT EXISTS vocabulary.material (
  id text PRIMARY KEY,
  description text,
  authority text,
  type_of text REFERENCES vocabulary.material(id)
);

CREATE TABLE IF NOT EXISTS vocabulary.method (
  id text PRIMARY KEY,
  description text,
  authority text
);


CREATE TABLE IF NOT EXISTS vocabulary.unit (
  id text PRIMARY KEY,
  description text,
  authority text
);

CREATE TABLE IF NOT EXISTS vocabulary.error_metric (
  id text PRIMARY KEY,
  description text,
  authority text
);

-- Conceptually, this could be combined with `method`...
CREATE TABLE IF NOT EXISTS vocabulary.analysis_type (
  id text PRIMARY KEY,
  description text,
  authority text,
  type_of text REFERENCES vocabulary.analysis_type(id)
);

/*
## Projects
*/

CREATE TABLE IF NOT EXISTS project (
  id serial PRIMARY KEY,
  name text NOT NULL,
  description text,
  embargo_date timestamp,
  /*
  The position model incorporated Project is
  shared with Sample.

  A representative named location */
  location_name text,
  location_name_autoset boolean,
  /*
  Order-of-magnitude precision (in meters)
  with which this position
  is known */
  location geometry,
  location_precision integer
);


/*
### Descriptors for types of measurements/techniques
*/

CREATE TABLE IF NOT EXISTS instrument (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  description text
);

CREATE TABLE IF NOT EXISTS datum_type (
  id serial PRIMARY KEY,
  parameter text REFERENCES vocabulary.parameter(id) NOT NULL,
  unit text REFERENCES vocabulary.unit(id) NOT NULL,
  error_unit text REFERENCES vocabulary.unit(id),
  error_metric text REFERENCES vocabulary.error_metric(id),
  is_computed boolean DEFAULT false, -- Can be rebuilt from data IN THE DATABASE
  is_interpreted boolean DEFAULT false, -- Results from a data-reduction process
  description text,
  UNIQUE (parameter, unit, error_unit, error_metric)
);

-- CREATE UNIQUE INDEX datum_type_unique ON datum_type
-- (parameter, unit, coalesce(error_unit, 'NO ERROR'), coalesce(error_metric, 'NO ERROR'));

/*

## Sample

An object to be measured
*/
CREATE TABLE IF NOT EXISTS sample (
  id serial PRIMARY KEY,
  name text,
  igsn text UNIQUE,
  material text REFERENCES vocabulary.material(id),
  /* Order-of-magnitude precision (in meters)
     with which this position
     is known */
  location_precision integer DEFAULT 0,
  /* A representative named location */
  location_name text,
  location_name_autoset boolean,
  location geometry,
  /* The elevation column could potentially be recast as a *datum* tied directly
     to the sample. */
  elevation numeric,
  embargo_date timestamp,
  CHECK ((name IS NOT null) OR (igsn IS NOT null))
);
/*
#### Potential issues:

- Samples potentially have several levels of abstraction
  (e.g. different replicates or drillings from the same rock sample)
  (could have a self-referential 'part_of' relation on sample...)
- Samples might belong to several projects

Should the `session` table contain the link to project rather than
the `sample` table? This might be more correct, and samples could still
be linked to projects through a table relationship

## Session

Set of analyses on the same instrument
with the same technique, at the same or
closely spaced in time.

#### Examples:

- An entire Ar/Ar step heating experiment
- A set of detrital single-crystal zircon measurements
- A multi-grain igneous age determination
*/
CREATE TABLE IF NOT EXISTS session (
  id serial PRIMARY KEY,
  /* UUID column to provide a globally unique, immutable reference
     to an analytical dataset. When combined with a lab-specific
     namespace (not yet implemented), this provides an identifier
     that can be traced back to the origin facility, maintaining
     data provenance. This fulfills similar functions to IGSNs and
     DOIs, and the preliminary implementation here can be changed
     for interoperability without affecting the internal organization
     of the *Sparrow* database. */
  uuid uuid DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  sample_id integer REFERENCES sample(id),
  project_id integer REFERENCES project(id)
    ON DELETE SET NULL,
  publication_id integer REFERENCES publication(id)
    ON DELETE SET NULL,
  date timestamp NOT NULL,
  end_date timestamp,
  date_precision text REFERENCES enum.date_precision(id),
  name text, -- This column can store an (optional) internal lab id
  instrument integer REFERENCES instrument(id),
  technique text REFERENCES vocabulary.method(id),
  target text REFERENCES vocabulary.material(id),
  embargo_date timestamp,
  /* A field to store extra, semi-structured session data in a key/value format */
  data jsonb,
  UNIQUE (sample_id, date, instrument, technique)
);

/*
## Single analyses

These two tables will end up needing data-type specific columns

### Analysis

Set of data measured together at one time on one instrument

#### Examples:

- A single EPMA analytical spot
  (different oxides measured on an EPMA are *data* in a single analysis)
- A heating step for Ar/Ar age determination
- A single-crystal zircon age measurement

*/
CREATE TABLE IF NOT EXISTS analysis (
  id serial PRIMARY KEY,
  session_id integer NOT NULL
    REFERENCES session(id)
    ON DELETE CASCADE,
  session_index integer, -- captures ordering within a session
  /* If `session_index` is not set, `analysis_type` allows the
    unique identification of a record within the session */
  analysis_name text,
  -- Should key this to a foreign key table
  analysis_type text REFERENCES vocabulary.analysis_type(id),
  date timestamp,
  material text REFERENCES vocabulary.material(id),
  /* Not really sure that "material" is the best parameterization
     of this concept... */
  is_standard boolean,
  /*
  If set, this means that this is an "accepted" value
  among several related measurements.

  #### Examples:

  - Accepted system for U-Pb single-zircon age
  - Heating steps accepted in the final age analysis
  */
  is_accepted boolean,
  is_bad boolean,
  /* Some analytical results can be interpreted from other data, so we
  should explicitly state that this is the case.

  #### Examples:

  - a detrital zircon age spectrum
    (the `datum` table would contain individual probability values at each age)
  - a multi-zircon igneous age
    (the `datum` table would include jointly-fitted age determinations
     for each relevant system)
  - a calculated plateau age for a stepped-heating Ar-Ar experiment. */
  is_interpreted boolean,
  data jsonb,
  UNIQUE (session_id, session_index, analysis_name)
);


/*
## Link projects, samples, and researchers

If researchers on a project have application user accounts,
they can see data even if embargoed (not yet implemented).
*/
CREATE TABLE IF NOT EXISTS project_researcher (
  project_id integer REFERENCES project(id) ON DELETE CASCADE,
  researcher_id integer REFERENCES researcher(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, researcher_id)
);

CREATE TABLE IF NOT EXISTS project_publication (
  project_id integer REFERENCES project(id) ON DELETE CASCADE,
  publication_id integer REFERENCES publication(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, publication_id)
);

CREATE TABLE IF NOT EXISTS project_sample (
  project_id integer REFERENCES project(id) ON DELETE CASCADE,
  sample_id integer REFERENCES sample(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, sample_id)
);



CREATE TABLE IF NOT EXISTS datum (
  id serial PRIMARY KEY,
  analysis integer REFERENCES analysis(id)
    ON DELETE CASCADE NOT NULL,
  type integer REFERENCES datum_type(id) NOT NULL,
  value numeric NOT NULL,
  error numeric,
  is_bad boolean,
  /*
  If set, this means that this is an "accepted" value
  among several related measurements.

  #### Examples:

  - Accepted system for U-Pb single-zircon age
  */
  is_accepted boolean,
  /*
  There should not be more than one datum of a single type per analysis
  */
  UNIQUE (analysis, type)
);

/*
## Attributes

Text attributes associated with analyses (e.g.
standard names, calibration types). These should
be numerical, unitless values.
*/
CREATE TABLE IF NOT EXISTS attribute (
  id serial PRIMARY KEY,
  parameter text REFERENCES vocabulary.parameter(id) NOT NULL,
  value text NOT NULL,
  UNIQUE (value, parameter)
);

CREATE TABLE IF NOT EXISTS __analysis_attribute (
  analysis_id integer NOT NULL REFERENCES analysis(id),
  attribute_id integer NOT NULL REFERENCES attribute(id),
  PRIMARY KEY (analysis_id, attribute_id)
);

CREATE TABLE IF NOT EXISTS __session_attribute (
  session_id integer NOT NULL REFERENCES session(id),
  attribute_id integer NOT NULL REFERENCES attribute(id),
  PRIMARY KEY (session_id, attribute_id)
);

/*
## Analytical constants

Constants, etc. used in measurements, and their relationships
to individual analyses, etc.

Right now, we support linking these parameters at the analysis
level. Some coarser (e.g. a table for analytical process) or finer
(linked parameters for each datum) abstraction might be desired.

In many ways, the column layout mirrors that of the datum table,
with the exception that there is a many-to-many link on the data.
*/
CREATE TABLE IF NOT EXISTS constant (
  /* Analytical parameters, calibration types, etc.
  that remain constant across many sessions
  (e.g. decay constants, assumed physical parameters). */
  id serial PRIMARY KEY,
  value numeric NOT NULL,
  error numeric,
  type integer REFERENCES datum_type(id) NOT NULL,
  description text
);

CREATE TABLE IF NOT EXISTS __analysis_constant (
  analysis_id integer NOT NULL REFERENCES analysis(id),
  constant_id integer NOT NULL REFERENCES constant(id),
  PRIMARY KEY (analysis_id, constant_id)
);

/*
## Data files
*/

CREATE TABLE IF NOT EXISTS data_file_type (
  id text PRIMARY KEY,
  description text
);

CREATE TABLE IF NOT EXISTS data_file (
  /*
  Original measurement data file information
  */
  file_hash uuid PRIMARY KEY, -- MD5 hash of data file contents
  file_mtime timestamp,
  basename text,
  file_path text UNIQUE,
  type_id text REFERENCES data_file_type(id)
);

CREATE TABLE IF NOT EXISTS data_file_link (
  /*
  Foreign key columns to link to data that was imported from
  this file; this should be done at the appropriate level (e.g.
  sample, analysis, session) that fits the data file in question.

  The linked data file is then considered the *primary source*
  for all data corresponding to this model.

  Note: this table and its assumptions are part of the import
  process and could change significantly at this early stage.
  */
  id serial PRIMARY KEY,
  file_hash uuid NOT NULL
    REFERENCES data_file(file_hash)
    ON DELETE CASCADE,
  date timestamp NOT NULL DEFAULT now(),
  error text,
  session_id integer
    UNIQUE
    REFERENCES session(id)
    ON DELETE CASCADE,
  analysis_id integer
    UNIQUE
    REFERENCES analysis(id)
    ON DELETE CASCADE,
  sample_id integer
    UNIQUE
    REFERENCES sample(id)
    ON DELETE CASCADE,
  /* Only one of the linked data file columns should be
     set at a time (a data file can only be packaged at
     one level, even if it encompasses information about
     other entities)
  */
  CHECK (
      (session_id IS NOT NULL)::int
    + (analysis_id IS NOT NULL)::int
    + (sample_id IS NOT NULL)::int <= 1
  )
);
