from hashlib import md5

class SparrowImportError(Exception):
    pass

def md5hash(fname):
    """
    Compute the md5 hash of a file (given by its name)
    """
    hash = md5()
    with open(fname, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash.update(chunk)
    return hash.hexdigest()

def ensure_sequence(possible_iterator):
    try:
        return iter(possible_iterator)
    except TypeError:
        return [possible_iterator]
