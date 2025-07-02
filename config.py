import os
from dotenv import load_dotenv

load_dotenv()
class Config:    
    SECRET_KEY = os.environ.get('FLASK_SECRET_KEY') or 'fallback_secret_key_for_dev'
    MYSQL_HOST = os.environ.get('MYSQL_HOST')
    MYSQL_USER = os.environ.get('MYSQL_USER')
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD')
    MYSQL_DB = os.environ.get('MYSQL_DB')
    MYSQL_CURSORCLASS = 'DictCursor'
