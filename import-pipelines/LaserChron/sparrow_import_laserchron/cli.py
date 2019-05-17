#!/usr/bin/env python

from os import environ
from click import command, option, echo, secho, style
from pathlib import Path
from sparrow import Database
from sparrow.import_helpers import SparrowImportError, working_directory
from itertools import chain

from .extract_datatable import import_datafile
from .laserchron_importer import LaserchronImporter

def extract_data(db, stop_on_error=False):
    path = Path('.')
    files = chain(path.glob("**/*.xls"), path.glob("**/*.xls[xm]"))
    for f in files:
        try:
            secho(str(f), dim=True)
            imported = import_datafile(db, f)
            db.session.commit()
            if not imported:
                secho("Already imported", fg='green', dim=True)
        except (SparrowImportError, NotImplementedError) as e:
            if stop_on_error: raise e
            db.session.rollback()
            secho(str(e), fg='red')

@command()
@option('--stop-on-error', is_flag=True, default=False)
@option('--verbose','-v', is_flag=True, default=False)
@option('--extract/--no-extract', default=False)
@option('--normalize/--no-normalize', default=True)
@option('--redo', default=False, is_flag=True)
def cli(stop_on_error=False, verbose=False, extract=False, normalize=True, redo=False):
    """
    Import LaserChron files
    """
    varname = "LASERCHRON_DATA_DIR"
    env = environ.get(varname, None)
    if env is None:
        v = style(varname, fg='cyan', bold=True)
        echo(f"Environment variable {v} is not set.")
        secho("Aborting", fg='red', bold=True)
        return
    path = Path(env)
    assert path.is_dir()

    db = Database()
    if extract:
        with working_directory(path):
            extract_data(db)
    if normalize:
        importer = LaserchronImporter(db)
        importer.import_all(redo=redo)
