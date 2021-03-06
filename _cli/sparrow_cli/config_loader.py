import sys
import os
from envbash import load_envbash


def envbash_init_hack():
    """
    This is a hack to support the "envbash" module, which allows
    reading environment variables from a bash script.

    Envbash has problems with working under PyInstaller due
    to its use of subprocess.Popen code referencing the python interpreter
    with sys.executable:
    https://pyinstaller.readthedocs.io/en/stable/runtime-information.html#using-sys-executable-and-sys-argv-0
    The sparrow executable is called as the Python interpreter when we are bundled.
    If we don't include this circuit-breaker, the program creates an infinite loop
    of trying to bootstrap.

    SOLUTION: Envbash internally executes a Python one-liner to dump environment variables.
    We execute this code block directly and then bail, mimicking python invoked from the
    command line. The dump-environment command needs to be invoked before any
    further CLI initialization happens.
    NOTE: we could go further and make this a general way to execute Python code,
    but this might have security implications.
    """
    if (
        getattr(sys, "frozen", False)
        and len(sys.argv) == 3
        and sys.argv[1] == "-c"
        and sys.argv[2] == "import os; print(repr(dict(os.environ)))"
    ):
        print(repr(dict(os.environ)))
        sys.exit(0)


def load_config(cfg):
    envbash_init_hack()
    return load_envbash(cfg)
