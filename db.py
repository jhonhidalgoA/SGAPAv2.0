import pymysql.cursors
from config import Config

def get_connection():
    connection = pymysql.connect(
        host=Config.MYSQL_HOST,
        user=Config.MYSQL_USER,
        password=Config.MYSQL_PASSWORD,
        database=Config.MYSQL_DB,
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )
    return connection



