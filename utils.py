import secrets

def generate_session_token():
    return secrets.token_hex(32)  # Token único de 64 caracteres