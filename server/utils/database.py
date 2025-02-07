import sqlite3

class Database:
    def __init__(self, db_path: str = "database.db"):
        self.db_path = db_path
        self.conn = sqlite3.connect(self.db_path)
        self.cursor = self.conn.cursor()
        self._create_tables()

    def _create_tables(self):
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS data (
                id INTEGER PRIMARY KEY,
                content TEXT
            )
        ''')
        self.conn.commit()

    def get_data(self):
        self.cursor.execute("SELECT * FROM data")
        return self.cursor.fetchall()

    def insert_data(self, content: str):
        self.cursor.execute("INSERT INTO data (content) VALUES (?)", (content,))
        self.conn.commit()

    def close(self):
        self.conn.close()
