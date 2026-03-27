import psycopg2
import os

def get_connection():
    # Connexion au conteneur 'db' défini dans le docker-compose
    # Utilise localhost en local, et 'db' quand c'est exécuté dans Docker
    db_host = os.getenv("DB_HOST", "localhost") 
    db_user = os.getenv("DB_USER", "teddy")
    db_password = os.getenv("DB_PASSWORD", "ton_password") # Mot de passe réel depuis ton .env
    db_name = os.getenv("DB_NAME", "ia_mobility")
    
    return psycopg2.connect(
        host=db_host,
        database=db_name,
        user=db_user,
        password=db_password, 
        port="5432"
    )
