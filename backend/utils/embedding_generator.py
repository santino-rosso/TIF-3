from sentence_transformers import SentenceTransformer

modelo_embedding = SentenceTransformer('all-mpnet-base-v2')

def generar_embedding(texto: str):
    embedding = modelo_embedding.encode(texto).tolist()
    return embedding
