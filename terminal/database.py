# database.py
import mysql.connector
from mysql.connector import Error

class Database:
    def __init__(self, config):
        self.config = config
        self.connection = None

    def connect(self):
        """Establish connection to the MySQL database."""
        try:
            self.connection = mysql.connector.connect(**self.config)
            return True
        except Error as e:
            print(f"\n[!] Error connecting to MySQL: {e}")
            return False

    def disconnect(self):
        """Close the database connection."""
        if self.connection and self.connection.is_connected():
            self.connection.close()

    def fetch_data(self, query, params=None):
        """Execute a SELECT query and return the results and column headers."""
        if not self.connection or not self.connection.is_connected():
            return None, None

        try:
            cursor = self.connection.cursor()
            cursor.execute(query, params or ())
            rows = cursor.fetchall()
            headers = [i[0] for i in cursor.description]
            cursor.close()
            return rows, headers
        except Error as e:
            print(f"\n[!] Database error: {e}")
            return None, None