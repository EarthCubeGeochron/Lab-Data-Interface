from os import environ
from sparrow.plugins import SparrowCorePlugin
from starlette.routing import Route, Router
from starlette.responses import JSONResponse
from starlette.authentication import requires
from starlette.middleware.authentication import AuthenticationMiddleware
from webargs_starlette import use_annotations
from sparrow.database.models import User
from sparrow.context import app_context
from sparrow.logs import get_logger
from .backend import JWTBackend

log = get_logger(__name__)


def get_backend():
    ctx = app_context()
    return ctx.plugins.get("auth-v2").backend


@use_annotations(location="json")
async def login(request, username: str, password: str):
    db = app_context().database
    backend = get_backend()

    current_user = db.session.query(User).get(username)
    log.debug(current_user)

    if current_user is None:
        response = JSONResponse(dict(login=False, username=None), status_code=401)
        return backend.logout(response)

    if not current_user.is_correct_password(password):
        response = JSONResponse(dict(login=False, username=username), status_code=401)
        return backend.logout(response)

    # access_token = create_access_token(identity=username)
    # refresh_token = create_refresh_token(identity=username)

    resp = JSONResponse(dict(login=True, username=username))
    return backend.set_login_cookies(resp, identity=username)

    # set_access_cookies(resp, access_token)
    # set_refresh_cookies(resp, refresh_token)
    # return resp


def logout(request):
    backend = get_backend()
    response = JSONResponse(dict(login=False))
    return backend.logout(response)


def status(request):
    username = None
    # get_jwt_identity()
    if username:
        resp = JSONResponse(dict(login=True, username=username))
        return resp
    return JSONResponse(dict(login=False))


def refresh(request):
    # JWT refresh token required
    backend = get_backend()
    identity = backend.get_identity(request, type="refresh")
    response = JSONResponse(dict(login=True, refresh=True, username=identity))

    return backend.set_access_cookie(response, identity=identity)


@requires("admin")
def secret(request):
    # JWT required
    return JSONResponse({"answer": 42})


routes = [
    Route("/login", endpoint=login, methods=["POST"]),
    Route("/logout", endpoint=logout, methods=["POST"]),
    Route("/refresh", endpoint=refresh, methods=["POST"]),
    Route("/status", endpoint=status),
    Route("/secret", endpoint=secret),
]


class AuthV2Plugin(SparrowCorePlugin):
    name = "auth-v2"

    backend = JWTBackend(environ.get("SPARROW_SECRET_KEY", ""))

    def on_asgi_setup(self, api):
        api.add_middleware(AuthenticationMiddleware, backend=self.backend)

    def on_api_initialized_v2(self, api):
        api.mount("/auth", Router(routes), name="auth_api")
