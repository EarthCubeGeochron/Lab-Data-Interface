
export SPARROW_LAB_NAME="Sparrow Test Lab"

# Change the SPARROW_ENV to production for smaller development bundles
export SPARROW_ENV="development"
export COMPOSE_PROJECT_NAME="sparrow_test"

# Find plugins and overrides
export SPARROW_PLUGIN_DIR="$SPARROW_CONFIG_DIR/backend-plugins"
export SPARROW_SITE_CONTENT="$SPARROW_CONFIG_DIR/frontend-plugins"
export SPARROW_COMPOSE_OVERRIDES="$SPARROW_CONFIG_DIR/addons/docker-compose.pgweb.yaml"

export SPARROW_SECRET_KEY="testkey"
# Required for default maps. Mapbox's APIs have a generous free tier.
export MAPBOX_API_TOKEN="pk.eyJ1IjoiamN6YXBsZXdza2kiLCJhIjoiY2tnaHM0NW9rMWVlZDJ5cGQ2cmNxM3V0NSJ9.GRNBlLxE_7SBXFFvzJdv4w"


# Get "secret" config values from an overrides file, if applicable.
overrides="$SPARROW_CONFIG_DIR/sparrow-config.overrides.sh"
[ -f "$overrides" ] && source "$overrides"
