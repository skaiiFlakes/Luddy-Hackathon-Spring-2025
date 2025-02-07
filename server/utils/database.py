import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

class Database:
    def __init__(self):
        # Read database credentials from environment variables
        self.conn = psycopg2.connect(os.getenv("DATABASE_URL"))
        self.cursor = self.conn.cursor()
        self._create_tables()

    def _create_tables(self):
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS data (
                id SERIAL PRIMARY KEY,
                content TEXT NOT NULL
            )
        ''')
        self.conn.commit()

    def get_data(self):
        self.cursor.execute("SELECT * FROM data")
        return self.cursor.fetchall()

    def insert_data(self, content: str):
        self.cursor.execute("INSERT INTO data (content) VALUES (%s) RETURNING id;", (content,))
        inserted_id = self.cursor.fetchone()[0]
        self.conn.commit()
        return inserted_id

    def close(self):
        self.cursor.close()
        self.conn.close()

if __name__ == "__main__":
    database = Database()
    database.close()
