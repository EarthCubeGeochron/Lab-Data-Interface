/* Manually updating location data from Schaen, et al. */
-- 1. Created table Schaen Table 2 from cleaned paper table

-- 2. Updated rock types in `vocabulary.material`

-- 3.
UPDATE sample SET
  location = ST_SetSRID(ST_MakePoint(lon,lat),4326),
  location_precision = 0,
  material = rock_type,
  location_name = island || ' Island'
FROM method_data.schaen_table_2
WHERE sample_id = id;

-- 4. Named project 'delarof-1', Delarof Islands Magmatic Evolution

-- 5. Linked publication
-- 'Eocene to Pleistocene magmatic evolution of the Delarof Islands, Aleutian Arc' Schaen 10.1002/2015GC006067

-- 6.
UPDATE session SET
  project_id = 'delarof-1'
WHERE sample_id IN (SELECT sample_id FROM method_data.schaen_table_2);

/*
Importing Cretaceous data
*/

UPDATE sample SET
  location = ST_SetSRID(ST_MakePoint(-106.9123,41.6032),4326),
  location_precision = 50000,
  material = 'bentonite',
  location_name = 'Carbon County, WY'
WHERE id = 'D2315';

/* Projects and samples are linked through the analytical sessions,
   so update those */
UPDATE session SET
  project_id = 'cenomanian-turonian-1'
WHERE sample_id = 'D2315';
