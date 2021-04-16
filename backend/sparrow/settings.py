from starlette.config import Config

config = Config()

echo = config("SPARROW_ECHO_SQL", default="false").lower() in ["true"] 

LAB_NAME = config("SPARROW_LAB_NAME", default="Test lab")
DATABASE = config("SPARROW_DATABASE", default="postgresql+psycopg2:///sparrow")
BASE_URL = config("SPARROW_BASE_URL", default="/")
ECHO_SQL = echo

SECRET_KEY = config("SPARROW_SECRET_KEY", None)
if SECRET_KEY is None:
    raise KeyError("Environment variable `SPARROW_SECRET_KEY` must be set")
