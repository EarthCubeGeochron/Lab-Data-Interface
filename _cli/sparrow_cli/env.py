import sys
from os import environ, path
from click import secho
from rich import print

def prepare_docker_environment():
    if environ.get("_SPARROW_ENV_PREPARED", "0") == "1":
        return
    # Convey that we have already prepared the environment
    environ["_SPARROW_ENV_PREPARED"] = "1"

    # ENVIRONMENT VARIABLE DEFAULTS
    # Set variables that might not be created in the config file
    # to default values
    # NOTE: much of this has been moved to `docker-compose.yaml`
    environ.setdefault("SPARROW_BASE_URL", "/")
    environ.setdefault("SPARROW_LAB_NAME", "")

    prepare_compose_overrides()


def is_defined(envvar):
    return environ.get(envvar) is not None


def prepare_compose_overrides():
    base = environ["SPARROW_PATH"]
    main = path.join(base, "docker-compose.yaml")

    compose_files = [main]

    is_production = environ.get("SPARROW_ENV", "development") == "production"

    # Use certbot for SSL  if certain conditions are met
    use_certbot = (
        is_production and is_defined("CERTBOT_EMAIL") and is_defined("SPARROW_DOMAIN")
    )

    if use_certbot:
        compose_files.append(path.join(base, "docker-compose.certbot.yaml"))
    else:
        compose_files.append(path.join(base, "docker-compose.base.yaml"))

    if is_production:
        compose_files.append(path.join(base, "docker-compose.production.yaml"))

    # Overrides should now be formatted as a COMPOSE_FILE colon-separated list
    overrides = environ.get("SPARROW_COMPOSE_OVERRIDES", "")
    if overrides.startswith("-f "):
        secho(
            "You are using an old signature for the SPARROW_COMPOSE_OVERRIDES "
            "environment variable. This option must now be formatted as a "
            "colon-separated path similar to the COMPOSE_FILE docker-compose "
            "configuration parameter (https://docs.docker.com/compose/reference/envvars/#compose_file)",
            fg="red",
            err=True,
        )
    elif overrides != "":
        compose_files += overrides.split(":")

    environ["COMPOSE_FILE"] = ":".join(compose_files)


def validate_environment():
    # Check for failing environment
    if environ.get("SPARROW_SECRET_KEY") is None:
        print(
            "[red]You [underline]must[/underline] set [bold]SPARROW_SECRET_KEY[/bold]. Exiting..."
        )
        sys.exit(1)
