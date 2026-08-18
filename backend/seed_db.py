"""
Seed de datos de ejemplo para receya_db (TIF-3).

Poblá la base con usuarios de prueba (admin, premium, gratuito, límite alcanzado,
período expirado), recetas con embeddings de 768 dimensiones agrupadas por temática,
favoritos reales y un historial de generaciones coherente con la cuota de cada plan.

Uso:
    cd backend && venv/bin/python seed_db.py

Idempotente: limpia las colecciones seedeadas y las vuelve a crear.
Requiere MongoDB corriendo en MONGO_URI (default mongodb://localhost:27017).
"""
import random
import sys
from datetime import datetime, timedelta, timezone

from passlib.context import CryptContext
from pymongo import MongoClient

MONGO_URI = "mongodb://localhost:27017"
DB_NAME = "receya_db"
EMBEDDING_DIMS = 768

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

AHORA = datetime.now(timezone.utc)

# ---------------------------------------------------------------------------
# Temáticas de recetas: cada una tiene un "centro" de embedding propio, de modo
# que las recetas de la misma temática resulten similares (recomendador) y las
# de temáticas distintas no. La duplicada de "pasta" queda casi idéntica a la
# original para probar la detección de duplicados (similitud > 0.98).
# 8 recetas por temática: con hasta 3 favoritos, quedan >= 5 no favoritas para
# que el top 5 de recomendados quede completo dentro de la temática del usuario.
# ---------------------------------------------------------------------------
TEMATICAS = {
    "pasta":     {"base": 0.91, "recetas": 8, "duplicada": True},
    "asado":     {"base": 0.74, "recetas": 8, "duplicada": False},
    "ensalada":  {"base": 0.52, "recetas": 8, "duplicada": False},
    "postre":    {"base": 0.38, "recetas": 8, "duplicada": False},
    "sopa":      {"base": 0.21, "recetas": 8, "duplicada": False},
    "milanesa":  {"base": 0.63, "recetas": 8, "duplicada": False},
    "pizza":     {"base": 0.83, "recetas": 8, "duplicada": False},
    "pescado":   {"base": 0.45, "recetas": 8, "duplicada": False},
    "desayuno":  {"base": 0.30, "recetas": 8, "duplicada": False},
}


def embedding_tematica(tematica: str, variante: float) -> list:
    """Genera un embedding determinístico de 768 dims para una temática.

    Cada temática tiene un "centro" (base + ruido con semilla fija de temática).
    Una receta es una mezcla centro/propio según la variante:
      - variante ~0.0  -> casi idéntica al centro (duplicado detectable, sim ~1.0)
      - variante ~0.3  -> receta normal de la temática (sim intra-temática ~0.9)
    Temáticas distintas comparten poco -> sim inter-temática muy baja.
    """
    centro_rng = random.Random(tematica)
    propio_rng = random.Random(tematica + f":{variante}")
    base = TEMATICAS[tematica]["base"]
    centro = [base] + [centro_rng.uniform(-1.0, 1.0) for _ in range(EMBEDDING_DIMS - 1)]
    propio = [propio_rng.uniform(-1.0, 1.0) for _ in range(EMBEDDING_DIMS)]
    vector = [(1 - variante) * c + variante * p for c, p in zip(centro, propio)]
    # Normalizar para que la similitud coseno sea comparable
    norm = sum(v * v for v in vector) ** 0.5
    return [v / norm for v in vector]


def armar_receta(
    nombre: str,
    ingredientes: list,
    preparacion: list,
    preferencias: list,
    restricciones: list,
    tiempo: str,
    tipo: str,
    herramientas: list,
    nivel: str,
) -> str:
    """Arma el texto de una receta con la estructura markdown del generador.

    El generador de recetas produce este formato exacto, que el frontend
    parsea en secciones (nombre, ingredientes, preparación, preferencias,
    restricciones, tiempo, tipo, herramientas y nivel de experiencia).
    """
    return (
        f"**Nombre de la receta:** {nombre}\n\n"
        "**Ingredientes:**\n"
        + "\n".join(f"- {ing}" for ing in ingredientes)
        + "\n\n**Preparación:**\n"
        + "\n".join(f"{i}. {paso}" for i, paso in enumerate(preparacion, 1))
        + "\n\n**Preferencias dietéticas:**\n"
        + "\n".join(f"- {pref}" for pref in preferencias)
        + "\n\n**Restricciones alimentarias:**\n"
        + "\n".join(f"- {restr}" for restr in restricciones)
        + f"\n\n**Tiempo de cocina necesario:**\n{tiempo}\n\n"
        + f"**Tipo de comida:**\n{tipo}\n\n"
        + "**Herramientas de cocina utilizadas:**\n"
        + "\n".join(f"- {her}" for her in herramientas)
        + f"\n\n**Nivel de experiencia requerido:**\n{nivel}"
    )


# Datos estructurados de cada receta: el orden de cada lista es el orden de
# inserción (pasta-0 .. pasta-7, asado-0 .. asado-7, etc.).
RECETAS_DATOS = {
    "pasta": [
        {
            "nombre": "Fideos con salsa fileto",
            "ingredientes": ["fideos", "tomate perita", "ajo", "albahaca fresca", "aceite de oliva", "sal", "azúcar"],
            "preparacion": [
                "Hervir los fideos en abundante agua con sal hasta que estén al dente.",
                "En una sartén, dorar el ajo picado en aceite de oliva.",
                "Agregar el tomate perita triturado, la sal y una pizca de azúcar; cocinar a fuego bajo 20 minutos.",
                "Sumar la albahaca fresca al final y mezclar la salsa con los fideos escurridos.",
                "Servir con queso rallado por encima.",
            ],
            "preferencias": ["Vegetariana", "Sin lactosa"],
            "restricciones": ["Contiene gluten"],
            "tiempo": "35 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Cuchillo de chef", "Tabla de cortar", "Olla", "Sartén", "Colador"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Spaghetti a la carbonara",
            "ingredientes": ["spaghetti", "panceta", "yemas de huevo", "queso pecorino", "pimienta negra", "sal"],
            "preparacion": [
                "Cocinar los spaghetti al dente reservando un poco del agua de cocción.",
                "Dorar la panceta en cubos en una sartén hasta que esté crocante.",
                "Mezclar las yemas con el queso pecorino rallado y abundante pimienta.",
                "Unir los spaghetti con la panceta y la mezcla de yemas fuera del fuego, agregando agua de cocción hasta lograr crema.",
                "Servir inmediatamente con más pecorino rallado.",
            ],
            "preferencias": ["Sin gluten no aplica", "Apta para diabéticos"],
            "restricciones": ["Contiene gluten", "Contiene huevo", "Contiene lácteos"],
            "tiempo": "25 minutos",
            "tipo": "Cena",
            "herramientas": ["Olla", "Sartén", "Bowl grande", "Cuchillo de chef"],
            "nivel": "Intermedio",
        },
        {
            "nombre": "Penne al pomodoro con albahaca",
            "ingredientes": ["penne", "tomates maduros", "ajo", "aceite de oliva", "albahaca fresca", "sal"],
            "preparacion": [
                "Cocinar los penne al dente en agua con sal.",
                "Saltear el ajo en aceite de oliva y agregar los tomates maduros en cubos.",
                "Cocinar la salsa 15 minutos y condimentar con sal.",
                "Incorporar la albahaca fresca y mezclar con los penne.",
            ],
            "preferencias": ["Vegetariana", "Vegana"],
            "restricciones": ["Contiene gluten"],
            "tiempo": "30 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Olla", "Sartén", "Cuchillo de chef", "Tabla de cortar"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Tallarines con bolognesa",
            "ingredientes": ["tallarines frescos", "carne picada", "cebolla", "zanahoria", "vino tinto", "tomate triturado", "aceite de oliva", "sal"],
            "preparacion": [
                "Rehogar la cebolla y la zanahoria picadas en aceite de oliva.",
                "Sumar la carne picada y cocinar hasta que se dore.",
                "Deglasar con vino tinto y agregar el tomate triturado con sal.",
                "Cocinar la salsa a fuego lento 40 minutos.",
                "Hervir los tallarines y servirlos con la salsa bolognesa.",
            ],
            "preferencias": ["Sin lactosa"],
            "restricciones": ["Contiene gluten"],
            "tiempo": "60 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Olla", "Sartén grande", "Cuchillo de chef", "Tabla de cortar"],
            "nivel": "Intermedio",
        },
        {
            "nombre": "Ñoquis de papa con manteca y salvia",
            "ingredientes": ["papas", "harina", "huevo", "manteca", "salvia fresca", "sal"],
            "preparacion": [
                "Hervir las papas y hacerlas puré.",
                "Mezclar el puré con harina, el huevo y la sal hasta formar una masa suave.",
                "Formar los ñoquis y hervirlos hasta que suban a la superficie.",
                "Dorar la manteca con hojas de salvia y saltear los ñoquis en la sartén.",
            ],
            "preferencias": ["Vegetariana"],
            "restricciones": ["Contiene gluten", "Contiene huevo", "Contiene lácteos"],
            "tiempo": "50 minutos",
            "tipo": "Cena",
            "herramientas": ["Olla", "Sartén", "Pisapapas", "Cuchillo de chef"],
            "nivel": "Intermedio",
        },
        {
            "nombre": "Fusilli con crema de roquefort",
            "ingredientes": ["fusilli", "crema de leche", "roquefort", "nuez moscada", "pimienta", "sal"],
            "preparacion": [
                "Cocinar los fusilli al dente y reservar un poco de agua de cocción.",
                "Calentar la crema con el roquefort desmenuzado hasta que se integre.",
                "Condimentar con nuez moscada, pimienta y sal.",
                "Mezclar la salsa con los fusilli y ajustar con agua de cocción si espesa.",
            ],
            "preferencias": ["Apta para diabéticos"],
            "restricciones": ["Contiene gluten", "Contiene lácteos"],
            "tiempo": "25 minutos",
            "tipo": "Cena",
            "herramientas": ["Olla", "Sartén", "Cuchara de madera"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Ravioles de ricota y espinaca",
            "ingredientes": ["masa para ravioles", "ricota", "espinaca", "nuez moscada", "huevo", "salsa fileto", "sal"],
            "preparacion": [
                "Saltear la espinaca y mezclarla con la ricota, el huevo, la nuez moscada y la sal.",
                "Rellenar la masa y formar los ravioles presionando bien los bordes.",
                "Hervirlos hasta que suban y escurrirlos con cuidado.",
                "Servir con salsa fileto caliente.",
            ],
            "preferencias": ["Vegetariana"],
            "restricciones": ["Contiene gluten", "Contiene huevo", "Contiene lácteos"],
            "tiempo": "70 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Olla", "Sartén", "Rodillo", "Bowl grande"],
            "nivel": "Avanzado",
        },
        {
            "nombre": "Lasaña de carne",
            "ingredientes": ["láminas de lasaña", "carne picada", "salsa bolognesa", "salsa blanca", "muzzarella", "queso rallado", "sal"],
            "preparacion": [
                "Precalentar el horno a 180°C y hervir las láminas de lasaña.",
                "En una fuente, alternar capas de láminas, salsa bolognesa, salsa blanca y muzzarella.",
                "Terminar con salsa blanca y queso rallado por encima.",
                "Gratinar al horno 30 minutos y dejar reposar antes de cortar.",
            ],
            "preferencias": ["Apta para diabéticos"],
            "restricciones": ["Contiene gluten", "Contiene lácteos"],
            "tiempo": "90 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Horno", "Fuente para horno", "Olla", "Cuchillo de chef"],
            "nivel": "Intermedio",
        },
    ],
    "asado": [
        {
            "nombre": "Asado de tira a la parrilla",
            "ingredientes": ["tira de asado", "sal gruesa", "carbón", "leña"],
            "preparacion": [
                "Prender el fuego con carbón y esperar a que queden brasas parejas.",
                "Salar la tira de asado con sal gruesa.",
                "Cocinar a fuego medio con el hueso hacia abajo sin moverla.",
                "Girar una sola vez y terminar la cocción con la carne hacia abajo.",
                "Reposar 5 minutos antes de servir.",
            ],
            "preferencias": ["Sin gluten", "Sin lactosa", "Baja en carbohidratos"],
            "restricciones": [],
            "tiempo": "90 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Parrilla", "Pinzas de parrilla", "Cuchillo de chef"],
            "nivel": "Intermedio",
        },
        {
            "nombre": "Matambre a la pizza",
            "ingredientes": ["matambre", "salsa de tomate", "muzzarella", "aceitunas", "orégano", "sal"],
            "preparacion": [
                "Hervir el matambre 30 minutos y luego secarlo.",
                "Condimentar con sal y llevarlo a la parrilla para sellarlo.",
                "Cubrir con salsa de tomate, muzzarella y aceitunas.",
                "Gratinar con la parrilla tapada hasta que el queso se derrita.",
            ],
            "preferencias": ["Sin gluten", "Baja en carbohidratos"],
            "restricciones": ["Contiene lácteos"],
            "tiempo": "60 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Parrilla", "Olla", "Cuchillo de chef"],
            "nivel": "Intermedio",
        },
        {
            "nombre": "Vacío al horno con papas",
            "ingredientes": ["vacío", "papas", "romero", "ajo", "aceite de oliva", "sal gruesa"],
            "preparacion": [
                "Precalentar el horno a 180°C.",
                "Sellar el vacío en una sartén bien caliente.",
                "Envolverlo en papel de aluminio con romero, ajo y sal gruesa.",
                "Hornear 2 horas y destapar los últimos 20 minutos para dorar.",
                "Acompañar con papas rústicas al horno.",
            ],
            "preferencias": ["Sin gluten", "Sin lactosa"],
            "restricciones": [],
            "tiempo": "150 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Horno", "Sartén", "Papel de aluminio", "Cuchillo de chef"],
            "nivel": "Intermedio",
        },
        {
            "nombre": "Choripán con chimichurri",
            "ingredientes": ["chorizos de cerdo", "pan francés", "ajo", "perejil", "vinagre", "aceite de oliva", "orégano", "ají molido"],
            "preparacion": [
                "Mezclar el ajo picado, el perejil, el vinagre, el aceite, el orégano y el ají molido para el chimichurri.",
                "Asar los chorizos a la parrilla girándolos para que se cocinen parejos.",
                "Abrir el pan y tostarlo apenas sobre la parrilla.",
                "Colocar el chorizo en el pan y bañarlo con chimichurri.",
            ],
            "preferencias": ["Sin lactosa"],
            "restricciones": ["Contiene gluten"],
            "tiempo": "40 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Parrilla", "Cuchillo de chef", "Bowl pequeño"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Bondiola braseada a la cerveza",
            "ingredientes": ["bondiola", "cerveza negra", "cebollas", "ajo", "tomillo", "pimienta", "sal"],
            "preparacion": [
                "Dorar la bondiola entera en una olla con un poco de aceite.",
                "Agregar las cebollas en cuartos y el ajo.",
                "Cubrir con cerveza negra, tomillo, pimienta y sal.",
                "Cocinar tapado a fuego bajo 3 horas hasta que se deshaga.",
                "Desmenuzar y servir con la salsa reducida.",
            ],
            "preferencias": ["Sin gluten no aplica", "Sin lactosa"],
            "restricciones": [],
            "tiempo": "210 minutos",
            "tipo": "Cena",
            "herramientas": ["Olla grande", "Cuchillo de chef", "Tabla de cortar"],
            "nivel": "Intermedio",
        },
        {
            "nombre": "Entraña a la parrilla",
            "ingredientes": ["entraña", "sal gruesa", "chimichurri", "papas"],
            "preparacion": [
                "Preparar el fuego con brasas fuertes y parejas.",
                "Salar la entraña y cocinarla vuelta y vuelta sobre el fuego fuerte.",
                "Retirarla apenas rosada en el centro y dejarla reposar.",
                "Cortarla en tiras contra la fibra y servir con chimichurri y papas.",
            ],
            "preferencias": ["Sin gluten", "Sin lactosa", "Baja en carbohidratos"],
            "restricciones": [],
            "tiempo": "30 minutos",
            "tipo": "Cena",
            "herramientas": ["Parrilla", "Pinzas de parrilla", "Cuchillo de chef"],
            "nivel": "Intermedio",
        },
        {
            "nombre": "Pechito de cerdo a la parrilla",
            "ingredientes": ["pechito de cerdo", "sal gruesa", "pimienta", "limón"],
            "preparacion": [
                "Condimentar el pechito con sal gruesa y pimienta.",
                "Cocinar a fuego bajo con el hueso hacia abajo.",
                "Girar y cocinar del otro lado hasta que esté dorado y tierno.",
                "Dejar reposar y servir con limón.",
            ],
            "preferencias": ["Sin gluten", "Sin lactosa"],
            "restricciones": [],
            "tiempo": "120 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Parrilla", "Pinzas de parrilla", "Cuchillo de chef"],
            "nivel": "Intermedio",
        },
        {
            "nombre": "Provoletta",
            "ingredientes": ["provolone", "orégano", "ají molido", "aceite de oliva"],
            "preparacion": [
                "Cortar el provolone en rodajas gruesas.",
                "Llevarlo a la parrilla hasta que se dore de un lado.",
                "Darlo vuelta y dorar el otro lado sin que se derrita del todo.",
                "Servir con orégano, ají molido y un hilo de aceite de oliva.",
            ],
            "preferencias": ["Baja en carbohidratos"],
            "restricciones": ["Contiene lácteos"],
            "tiempo": "15 minutos",
            "tipo": "Entrada",
            "herramientas": ["Parrilla", "Espátula"],
            "nivel": "Principiante",
        },
    ],
    "ensalada": [
        {
            "nombre": "Ensalada César",
            "ingredientes": ["lechuga mantecosa", "pollo a la plancha", "crostones de pan", "queso parmesano", "anchoas", "limón", "mayonesa", "ajo"],
            "preparacion": [
                "Lavar y cortar la lechuga en trozos grandes.",
                "Cocinar el pollo a la plancha y cortarlo en tiras.",
                "Preparar el aderezo mezclando mayonesa, anchoas, ajo y jugo de limón.",
                "Mezclar la lechuga con el pollo, los crostones y el aderezo.",
                "Terminar con parmesano rallado por encima.",
            ],
            "preferencias": ["Apta para diabéticos"],
            "restricciones": ["Contiene gluten", "Contiene huevo", "Contiene lácteos", "Contiene pescado"],
            "tiempo": "25 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Cuchillo de chef", "Tabla de cortar", "Bowl grande"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Ensalada de rúcula con tomate y balsámico",
            "ingredientes": ["rúcula", "tomates cherry", "mozzarella", "reducción de balsámico", "aceite de oliva", "sal"],
            "preparacion": [
                "Lavar y secar la rúcula.",
                "Cortar los tomates cherry por la mitad y la mozzarella en cubos.",
                "Mezclar todo en un bowl con aceite de oliva y sal.",
                "Aliñar con reducción de balsámico justo antes de servir.",
            ],
            "preferencias": ["Vegetariana", "Sin gluten"],
            "restricciones": ["Contiene lácteos"],
            "tiempo": "15 minutos",
            "tipo": "Entrada",
            "herramientas": ["Cuchillo de chef", "Bowl grande"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Ensalada de quinoa con vegetales asados",
            "ingredientes": ["quinoa", "zapallo", "morrón", "cebolla", "aceite de oliva", "limón", "sal"],
            "preparacion": [
                "Cocinar la quinoa y dejar enfriar.",
                "Asar el zapallo, el morrón y la cebolla en el horno con aceite y sal.",
                "Mezclar la quinoa con los vegetales asados.",
                "Aliñar con aceite de oliva y jugo de limón.",
            ],
            "preferencias": ["Vegetariana", "Vegana", "Sin gluten"],
            "restricciones": [],
            "tiempo": "40 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Horno", "Olla", "Fuente para horno", "Bowl grande"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Ensalada griega",
            "ingredientes": ["tomate", "pepino", "aceitunas negras", "cebolla morada", "queso feta", "orégano", "aceite de oliva", "sal"],
            "preparacion": [
                "Cortar el tomate y el pepino en cubos grandes.",
                "Cortar la cebolla morada en plumas finas.",
                "Mezclar todo con las aceitunas y el queso feta en cubos.",
                "Condimentar con orégano, aceite de oliva y sal.",
            ],
            "preferencias": ["Vegetariana", "Sin gluten"],
            "restricciones": ["Contiene lácteos"],
            "tiempo": "15 minutos",
            "tipo": "Entrada",
            "herramientas": ["Cuchillo de chef", "Tabla de cortar", "Bowl grande"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Ensalada de lentejas y atún",
            "ingredientes": ["lentejas cocidas", "atún", "cebolla", "morrón", "huevo duro", "vinagre de vino", "mostaza", "aceite de oliva", "sal"],
            "preparacion": [
                "Mezclar las lentejas con el atún desmenuzado.",
                "Agregar la cebolla y el morrón en cubos pequeños.",
                "Preparar la vinagreta con vinagre, mostaza, aceite y sal.",
                "Mezclar todo y coronar con el huevo duro en rodajas.",
            ],
            "preferencias": ["Sin gluten", "Sin lactosa"],
            "restricciones": ["Contiene huevo", "Contiene pescado"],
            "tiempo": "20 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Cuchillo de chef", "Bowl grande"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Ensalada de espinaca, frutilla y nuez",
            "ingredientes": ["espinaca baby", "frutillas", "nueces", "miel", "aceto balsámico", "aceite de oliva", "sal"],
            "preparacion": [
                "Lavar la espinaca y las frutillas; cortar las frutillas en cuartos.",
                "Tostar las nueces apenas en una sartén.",
                "Mezclar miel, aceto, aceite y sal para el aliño.",
                "Unir todo y aliñar justo antes de servir.",
            ],
            "preferencias": ["Vegetariana", "Sin gluten"],
            "restricciones": ["Contiene frutos secos"],
            "tiempo": "15 minutos",
            "tipo": "Entrada",
            "herramientas": ["Cuchillo de chef", "Bowl grande", "Sartén"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Ensalada de tomate y albahaca",
            "ingredientes": ["tomates", "albahaca fresca", "ajo", "aceite de oliva", "sal gruesa"],
            "preparacion": [
                "Cortar los tomates en rodajas gruesas.",
                "Distribuir hojas de albahaca fresca entre las rodajas.",
                "Frotar un diente de ajo por el plato.",
                "Aliñar con aceite de oliva y sal gruesa.",
            ],
            "preferencias": ["Vegetariana", "Vegana", "Sin gluten"],
            "restricciones": [],
            "tiempo": "10 minutos",
            "tipo": "Entrada",
            "herramientas": ["Cuchillo de chef", "Tabla de cortar"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Ensalada de arroz integral con pollo",
            "ingredientes": ["arroz integral", "pollo desmenuzado", "morrón", "choclo", "yogur natural", "mostaza", "limón", "sal"],
            "preparacion": [
                "Cocinar el arroz integral y dejar enfriar.",
                "Mezclar el arroz con el pollo desmenuzado, el morrón en cubos y el choclo.",
                "Preparar el aderezo con yogur, mostaza, jugo de limón y sal.",
                "Integrar el aderezo y servir frío.",
            ],
            "preferencias": ["Sin gluten"],
            "restricciones": ["Contiene lácteos"],
            "tiempo": "45 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Olla", "Cuchillo de chef", "Bowl grande"],
            "nivel": "Principiante",
        },
    ],
    "postre": [
        {
            "nombre": "Flan casero con dulce de leche",
            "ingredientes": ["huevos", "leche", "azúcar", "esencia de vainilla", "dulce de leche"],
            "preparacion": [
                "Preparar el caramelo con azúcar y volcarlo en el molde.",
                "Batir los huevos con la leche, el azúcar y la vainilla.",
                "Verter la mezcla en el molde y cocinar al baño María en horno a 160°C.",
                "Dejar enfriar y desmoldar.",
                "Servir con dulce de leche por encima.",
            ],
            "preferencias": ["Vegetariana"],
            "restricciones": ["Contiene huevo", "Contiene lácteos"],
            "tiempo": "80 minutos",
            "tipo": "Postre",
            "herramientas": ["Horno", "Molde para flan", "Batidor", "Olla"],
            "nivel": "Intermedio",
        },
        {
            "nombre": "Chocotorta",
            "ingredientes": ["galletitas chocolinas", "queso crema", "dulce de leche", "café", "leche"],
            "preparacion": [
                "Mezclar el queso crema con el dulce de leche hasta integrar.",
                "Remojar las galletitas en café con leche.",
                "Intercalar capas de galletitas y crema en una fuente.",
                "Refrigerar toda la noche y decorar con dulce de leche.",
            ],
            "preferencias": ["Apta para diabéticos no aplica"],
            "restricciones": ["Contiene gluten", "Contiene lácteos"],
            "tiempo": "20 minutos más refrigeración",
            "tipo": "Postre",
            "herramientas": ["Fuente para horno", "Bowl grande", "Espátula"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Lemon pie",
            "ingredientes": ["harina", "manteca", "azúcar", "huevos", "jugo de limón", "leche condensada", "crema de leche"],
            "preparacion": [
                "Preparar la masa sablée con harina, manteca y azúcar; forrar el molde.",
                "Hornear la base hasta que esté dorada.",
                "Mezclar las yemas con leche condensada y jugo de limón; cocinar hasta espesar.",
                "Rellenar la base y cubrir con merengue italiano.",
                "Tostar el merengue en el horno y enfriar.",
            ],
            "preferencias": ["Vegetariana"],
            "restricciones": ["Contiene gluten", "Contiene huevo", "Contiene lácteos"],
            "tiempo": "120 minutos",
            "tipo": "Postre",
            "herramientas": ["Horno", "Batidora", "Molde para tarta", "Olla"],
            "nivel": "Avanzado",
        },
        {
            "nombre": "Tiramisú",
            "ingredientes": ["vainillas", "café", "queso mascarpone", "huevos", "azúcar", "cacao amargo"],
            "preparacion": [
                "Separar las yemas de las claras y batir las yemas con azúcar.",
                "Integrar el mascarpone a las yemas.",
                "Batir las claras a nieve y unirlas con movimientos envolventes.",
                "Empapar las vainillas en café y armar capas en una fuente.",
                "Espolvorear cacao amargo y refrigerar 4 horas.",
            ],
            "preferencias": ["Vegetariana"],
            "restricciones": ["Contiene gluten", "Contiene huevo", "Contiene lácteos"],
            "tiempo": "40 minutos más refrigeración",
            "tipo": "Postre",
            "herramientas": ["Batidora", "Bowl grande", "Fuente para horno"],
            "nivel": "Intermedio",
        },
        {
            "nombre": "Panqueques con dulce de leche",
            "ingredientes": ["harina", "huevos", "leche", "manteca", "azúcar", "dulce de leche repostero"],
            "preparacion": [
                "Batir la harina con los huevos, la leche y una pizca de azúcar hasta lograr una mezcla lisa.",
                "Cocinar panqueques finos en una sartén apenas enmantecada.",
                "Rellenar cada panqueque con dulce de leche repostero y enrollarlo.",
                "Gratinar con azúcar en el horno hasta caramelizar.",
            ],
            "preferencias": ["Vegetariana"],
            "restricciones": ["Contiene gluten", "Contiene huevo", "Contiene lácteos"],
            "tiempo": "45 minutos",
            "tipo": "Postre",
            "herramientas": ["Sartén", "Batidor", "Horno", "Espátula"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Brownie con nueces",
            "ingredientes": ["chocolate", "manteca", "azúcar", "huevos", "harina", "nueces", "sal"],
            "preparacion": [
                "Fundir el chocolate con la manteca a baño María.",
                "Batir los huevos con el azúcar y sumar el chocolate fundido.",
                "Incorporar la harina, la sal y las nueces picadas.",
                "Hornear a 170°C durante 25 minutos; dejar enfriar antes de cortar.",
            ],
            "preferencias": ["Vegetariana"],
            "restricciones": ["Contiene gluten", "Contiene huevo", "Contiene lácteos", "Contiene frutos secos"],
            "tiempo": "45 minutos",
            "tipo": "Postre",
            "herramientas": ["Horno", "Bowl grande", "Batidor", "Fuente para horno"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Cheesecake de frutos rojos",
            "ingredientes": ["galletitas", "manteca", "queso crema", "crema de leche", "azúcar", "frutos rojos", "gelatina"],
            "preparacion": [
                "Procesar las galletitas con manteca y presionar la base en el molde.",
                "Batir el queso crema con la crema y el azúcar.",
                "Hidratar la gelatina e incorporarla a la crema.",
                "Volcar sobre la base y refrigerar 4 horas.",
                "Cubrir con frutos rojos antes de servir.",
            ],
            "preferencias": ["Vegetariana"],
            "restricciones": ["Contiene gluten", "Contiene lácteos"],
            "tiempo": "60 minutos más refrigeración",
            "tipo": "Postre",
            "herramientas": ["Procesadora", "Batidora", "Molde desmontable"],
            "nivel": "Intermedio",
        },
        {
            "nombre": "Ensalada de frutas con menta",
            "ingredientes": ["banana", "manzana", "naranja", "frutillas", "jugo de limón", "menta fresca", "miel"],
            "preparacion": [
                "Cortar todas las frutas en cubos parejos.",
                "Exprimir el jugo de limón por encima para evitar que se oxiden.",
                "Picar la menta fresca y mezclar con un hilo de miel.",
                "Mezclar todo suavemente y servir frío.",
            ],
            "preferencias": ["Vegetariana", "Vegana", "Sin gluten"],
            "restricciones": [],
            "tiempo": "15 minutos",
            "tipo": "Postre",
            "herramientas": ["Cuchillo de chef", "Bowl grande"],
            "nivel": "Principiante",
        },
    ],
    "sopa": [
        {
            "nombre": "Sopa de verduras",
            "ingredientes": ["cebolla", "zanahoria", "zapallo", "papa", "caldo de verduras", "aceite de oliva", "sal", "pimienta"],
            "preparacion": [
                "Rehogar la cebolla en aceite de oliva.",
                "Sumar la zanahoria, el zapallo y la papa en cubos.",
                "Cubrir con caldo de verduras y cocinar 30 minutos.",
                "Procesar hasta obtener textura cremosa y condimentar.",
            ],
            "preferencias": ["Vegetariana", "Vegana", "Sin gluten"],
            "restricciones": [],
            "tiempo": "40 minutos",
            "tipo": "Cena",
            "herramientas": ["Olla", "Procesadora", "Cuchillo de chef"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Caldo de gallina con fideos",
            "ingredientes": ["gallina", "fideos cabello de ángel", "cebolla", "zanahoria", "apio", "puerro", "sal"],
            "preparacion": [
                "Hervir la gallina con las verduras en abundante agua.",
                "Cocinar a fuego bajo 60 minutos y desgrasar.",
                "Colar el caldo y reservar la carne desmenuzada.",
                "Agregar los fideos al caldo y cocinar 8 minutos.",
                "Servir con la carne y las verduras.",
            ],
            "preferencias": ["Sin lactosa"],
            "restricciones": ["Contiene gluten"],
            "tiempo": "90 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Olla grande", "Colador", "Cuchillo de chef"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Crema de calabaza con jengibre",
            "ingredientes": ["zapallo", "jengibre rallado", "cebolla", "crema de leche", "caldo de verduras", "semillas tostadas", "sal"],
            "preparacion": [
                "Rehogar la cebolla con el jengibre rallado.",
                "Sumar el zapallo en cubos y cubrir con caldo.",
                "Cocinar hasta que el zapallo esté tierno y procesar.",
                "Añadir la crema, condimentar y decorar con semillas tostadas.",
            ],
            "preferencias": ["Vegetariana", "Sin gluten"],
            "restricciones": ["Contiene lácteos"],
            "tiempo": "35 minutos",
            "tipo": "Cena",
            "herramientas": ["Olla", "Procesadora", "Rallador"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Sopa de lentejas con chorizo",
            "ingredientes": ["lentejas", "chorizo colorado", "papa", "zanahoria", "cebolla", "pimentón", "caldo", "sal"],
            "preparacion": [
                "Cocinar el chorizo y cortarlo en rodajas.",
                "Rehogar la cebolla y el pimentón en la misma olla.",
                "Sumar las lentejas, la papa, la zanahoria y el caldo.",
                "Cocinar 40 minutos hasta que espesen y agregar el chorizo.",
            ],
            "preferencias": ["Sin gluten", "Sin lactosa"],
            "restricciones": [],
            "tiempo": "60 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Olla grande", "Cuchillo de chef", "Cuchara de madera"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Vichyssoise",
            "ingredientes": ["puerros", "papa", "caldo de verduras", "crema de leche", "manteca", "cebollino", "sal"],
            "preparacion": [
                "Rehogar los puerros en manteca sin que tomen color.",
                "Sumar la papa en cubos y cubrir con caldo.",
                "Cocinar 25 minutos y procesar con la crema.",
                "Enfriar bien y servir con cebollino picado.",
            ],
            "preferencias": ["Vegetariana"],
            "restricciones": ["Contiene lácteos"],
            "tiempo": "45 minutos más refrigeración",
            "tipo": "Entrada",
            "herramientas": ["Olla", "Procesadora", "Cuchillo de chef"],
            "nivel": "Intermedio",
        },
        {
            "nombre": "Sopa de cebolla gratinada",
            "ingredientes": ["cebollas", "caldo", "vino blanco", "pan", "queso gruyere", "manteca", "sal"],
            "preparacion": [
                "Caramelizar las cebollas en manteca a fuego bajo 30 minutos.",
                "Sumar el vino blanco y reducir.",
                "Agregar el caldo y cocinar 15 minutos más.",
                "Servir en cazuelas con pan tostado y queso gratinado al horno.",
            ],
            "preferencias": ["Vegetariana"],
            "restricciones": ["Contiene gluten", "Contiene lácteos"],
            "tiempo": "60 minutos",
            "tipo": "Cena",
            "herramientas": ["Olla", "Horno", "Cazuelas", "Cuchillo de chef"],
            "nivel": "Intermedio",
        },
        {
            "nombre": "Consomé de pollo con verduras",
            "ingredientes": ["pollo", "apio", "zanahoria", "puerro", "laurel", "pimienta", "sal"],
            "preparacion": [
                "Hervir el pollo con el apio, la zanahoria, el puerro y el laurel.",
                "Cocinar a fuego bajo 45 minutos.",
                "Colar el caldo y desmenuzar el pollo.",
                "Servir bien caliente con las verduras en juliana.",
            ],
            "preferencias": ["Sin gluten", "Sin lactosa"],
            "restricciones": [],
            "tiempo": "60 minutos",
            "tipo": "Cena",
            "herramientas": ["Olla grande", "Colador", "Cuchillo de chef"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Minestrone",
            "ingredientes": ["porotos", "papa", "zapallo", "zapallitos", "fideos", "caldo de verduras", "albahaca", "tomate", "sal"],
            "preparacion": [
                "Rehogar la cebolla y el tomate en aceite.",
                "Sumar los porotos, la papa, el zapallo y los zapallitos en cubos.",
                "Cubrir con caldo y cocinar 30 minutos.",
                "Agregar los fideos y cocinar hasta que estén listos.",
                "Terminar con albahaca fresca picada.",
            ],
            "preferencias": ["Vegetariana", "Sin lactosa"],
            "restricciones": ["Contiene gluten"],
            "tiempo": "50 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Olla grande", "Cuchillo de chef", "Cuchara de madera"],
            "nivel": "Principiante",
        },
    ],
    "milanesa": [
        {
            "nombre": "Milanesa de carne clásica",
            "ingredientes": ["bifes de carne", "huevos", "ajo", "perejil", "pan rallado", "aceite", "sal"],
            "preparacion": [
                "Batir los huevos con ajo, perejil y sal.",
                "Pasar los bifes por el huevo y luego por el pan rallado, presionando.",
                "Freír en abundante aceite caliente hasta dorar de ambos lados.",
                "Escurrir en papel absorbente y servir.",
            ],
            "preferencias": ["Sin lactosa"],
            "restricciones": ["Contiene gluten", "Contiene huevo"],
            "tiempo": "30 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Sartén grande", "Bowl", "Cuchillo de chef"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Milanesa a la napolitana",
            "ingredientes": ["milanesas de carne", "salsa de tomate", "jamón", "muzzarella", "orégano", "aceite"],
            "preparacion": [
                "Freír o cocinar las milanesas hasta dorar.",
                "Cubrir cada milanesa con salsa de tomate.",
                "Sumar una feta de jamón y muzzarella.",
                "Gratinar al horno hasta que el queso burbujee y espolvorear orégano.",
            ],
            "preferencias": ["Sin gluten no aplica"],
            "restricciones": ["Contiene gluten", "Contiene lácteos"],
            "tiempo": "35 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Sartén", "Horno", "Fuente para horno"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Milanesa de pollo crocante",
            "ingredientes": ["pechugas de pollo", "pan rallado", "queso parmesano", "huevos", "ajo", "sal", "aceite"],
            "preparacion": [
                "Aplastar las pechugas hasta que queden parejas.",
                "Mezclar el pan rallado con el parmesano y el ajo en polvo.",
                "Pasar las pechugas por huevo y luego por el pan rallado.",
                "Hornear a 200°C hasta que estén doradas y crocantes.",
            ],
            "preferencias": ["Apta para diabéticos"],
            "restricciones": ["Contiene gluten", "Contiene huevo", "Contiene lácteos"],
            "tiempo": "40 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Horno", "Bowl", "Fuente para horno"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Milanesa de berenjena",
            "ingredientes": ["berenjenas", "pan rallado", "huevos", "ajo", "perejil", "salsa de tomate", "albahaca", "sal"],
            "preparacion": [
                "Cortar las berenjenas en rodajas y salarlas para que larguen agua.",
                "Pasarlas por huevo y pan rallado.",
                "Hornear a 200°C hasta dorar.",
                "Servir con salsa de tomate y albahaca fresca.",
            ],
            "preferencias": ["Vegetariana"],
            "restricciones": ["Contiene gluten", "Contiene huevo"],
            "tiempo": "45 minutos",
            "tipo": "Cena",
            "herramientas": ["Horno", "Bowl", "Cuchillo de chef"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Milanesa fugazzeta",
            "ingredientes": ["milanesas de carne", "cebolla", "muzzarella", "aceitunas", "orégano"],
            "preparacion": [
                "Blanquear la cebolla en agua hirviendo unos minutos.",
                "Cocinar las milanesas hasta dorar.",
                "Cubrir con la cebolla escurrida y la muzzarella.",
                "Gratinar hasta que el queso burbujee y agregar aceitunas y orégano.",
            ],
            "preferencias": ["Sin gluten no aplica"],
            "restricciones": ["Contiene gluten", "Contiene lácteos"],
            "tiempo": "30 minutos",
            "tipo": "Cena",
            "herramientas": ["Sartén", "Horno", "Olla"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Milanesa de soja",
            "ingredientes": ["soja texturizada", "huevos", "pan rallado", "ajo", "perejil", "sal", "aceite"],
            "preparacion": [
                "Rehidratar la soja en caldo caliente 15 minutos y escurrir bien.",
                "Condimentar y pasar por huevo y pan rallado.",
                "Freír o llevar al horno hasta dorar.",
                "Servir con limón o ensalada.",
            ],
            "preferencias": ["Vegetariana"],
            "restricciones": ["Contiene gluten", "Contiene huevo"],
            "tiempo": "35 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Sartén", "Bowl", "Colador"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Sándwich de milanesa completo",
            "ingredientes": ["pan de miga", "milanesa", "lechuga", "tomate", "huevo", "jamón", "mayonesa"],
            "preparacion": [
                "Cocinar la milanesa y el huevo.",
                "Tostar el pan de miga apenas.",
                "Armar el sándwich con mayonesa, lechuga, tomate, huevo, jamón y milanesa.",
                "Cortar al medio y servir.",
            ],
            "preferencias": ["Apta para diabéticos no aplica"],
            "restricciones": ["Contiene gluten", "Contiene huevo", "Contiene lácteos"],
            "tiempo": "30 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Sartén", "Cuchillo de chef"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Milanesa de pollo con limón",
            "ingredientes": ["pechugas de pollo", "pan rallado", "huevos", "limón", "perejil", "ajo", "sal", "aceite"],
            "preparacion": [
                "Empanar las pechugas con huevo, ajo, perejil y pan rallado.",
                "Freír u hornear hasta que estén doradas.",
                "Bañar con jugo de limón y perejil picado apenas retiradas del fuego.",
                "Servir caliente.",
            ],
            "preferencias": ["Apta para diabéticos"],
            "restricciones": ["Contiene gluten", "Contiene huevo"],
            "tiempo": "30 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Sartén", "Bowl", "Exprimidor"],
            "nivel": "Principiante",
        },
    ],
    "pizza": [
        {
            "nombre": "Pizza margherita",
            "ingredientes": ["masa de pizza", "salsa de tomate", "muzzarella fresca", "albahaca", "aceite de oliva", "sal"],
            "preparacion": [
                "Estirar la masa y cubrir con salsa de tomate.",
                "Distribuir la muzzarella fresca en cubos.",
                "Hornear a temperatura máxima hasta que la base esté dorada.",
                "Terminar con hojas de albahaca fresca y un hilo de aceite de oliva.",
            ],
            "preferencias": ["Vegetariana"],
            "restricciones": ["Contiene gluten", "Contiene lácteos"],
            "tiempo": "25 minutos",
            "tipo": "Cena",
            "herramientas": ["Horno", "Rodillo", "Piedra para pizza"],
            "nivel": "Intermedio",
        },
        {
            "nombre": "Pizza de muzzarella",
            "ingredientes": ["masa de pizza", "salsa de tomate", "muzzarella", "orégano", "aceite de oliva"],
            "preparacion": [
                "Estirar la masa fina y cubrir con salsa de tomate.",
                "Distribuir abundante muzzarella rallada.",
                "Hornear en horno bien caliente hasta que el queso se derrita.",
                "Espolvorear orégano y servir.",
            ],
            "preferencias": ["Vegetariana"],
            "restricciones": ["Contiene gluten", "Contiene lácteos"],
            "tiempo": "25 minutos",
            "tipo": "Cena",
            "herramientas": ["Horno", "Rodillo", "Piedra para pizza"],
            "nivel": "Intermedio",
        },
        {
            "nombre": "Pizza calabresa",
            "ingredientes": ["masa de pizza", "salsa de tomate", "muzzarella", "longaniza picante", "cebolla", "orégano"],
            "preparacion": [
                "Cubrir la masa con salsa y muzzarella.",
                "Distribuir la longaniza en rodajas y la cebolla en aros.",
                "Hornear a temperatura máxima.",
                "Espolvorear orégano antes de servir.",
            ],
            "preferencias": ["Sin lactosa no aplica"],
            "restricciones": ["Contiene gluten", "Contiene lácteos"],
            "tiempo": "30 minutos",
            "tipo": "Cena",
            "herramientas": ["Horno", "Rodillo", "Cuchillo de chef"],
            "nivel": "Intermedio",
        },
        {
            "nombre": "Fugazzeta rellena",
            "ingredientes": ["masa de pizza", "muzzarella", "cebolla", "aceitunas verdes", "aceite de oliva", "orégano"],
            "preparacion": [
                "Colocar la muzzarella entre dos capas de masa y sellar los bordes.",
                "Blanquear la cebolla y distribuirla por encima.",
                "Hornear hasta que la masa esté dorada.",
                "Agregar aceitunas verdes y orégano al salir del horno.",
            ],
            "preferencias": ["Vegetariana"],
            "restricciones": ["Contiene gluten", "Contiene lácteos"],
            "tiempo": "35 minutos",
            "tipo": "Cena",
            "herramientas": ["Horno", "Rodillo", "Olla"],
            "nivel": "Intermedio",
        },
        {
            "nombre": "Pizza napolitana con anchoas",
            "ingredientes": ["masa de pizza", "salsa de tomate", "muzzarella", "anchoas", "alcaparras", "aceitunas negras", "orégano"],
            "preparacion": [
                "Cubrir la masa con salsa de tomate.",
                "Distribuir muzzarella, anchoas, alcaparras y aceitunas negras.",
                "Hornear a temperatura máxima.",
                "Espolvorear orégano y servir.",
            ],
            "preferencias": ["Sin lactosa no aplica"],
            "restricciones": ["Contiene gluten", "Contiene lácteos", "Contiene pescado"],
            "tiempo": "30 minutos",
            "tipo": "Cena",
            "herramientas": ["Horno", "Rodillo", "Piedra para pizza"],
            "nivel": "Intermedio",
        },
        {
            "nombre": "Pizza de rúcula y parmesano",
            "ingredientes": ["masa de pizza", "salsa de tomate", "muzzarella", "rúcula", "parmesano", "aceite de oliva"],
            "preparacion": [
                "Hornear la masa con salsa y muzzarella.",
                "Sumar la rúcula fresca apenas sale del horno.",
                "Agregar escamas de parmesano.",
                "Terminar con un hilo de aceite de oliva.",
            ],
            "preferencias": ["Vegetariana"],
            "restricciones": ["Contiene gluten", "Contiene lácteos"],
            "tiempo": "25 minutos",
            "tipo": "Cena",
            "herramientas": ["Horno", "Rodillo", "Piedra para pizza"],
            "nivel": "Intermedio",
        },
        {
            "nombre": "Pizza de hongos",
            "ingredientes": ["masa de pizza", "salsa de tomate", "muzzarella", "hongos", "ajo", "perejil", "aceite de oliva"],
            "preparacion": [
                "Saltear los hongos con ajo y perejil en aceite de oliva.",
                "Cubrir la masa con salsa y muzzarella.",
                "Distribuir los hongos salteados.",
                "Hornear a temperatura máxima y servir.",
            ],
            "preferencias": ["Vegetariana"],
            "restricciones": ["Contiene gluten", "Contiene lácteos"],
            "tiempo": "30 minutos",
            "tipo": "Cena",
            "herramientas": ["Horno", "Sartén", "Rodillo"],
            "nivel": "Intermedio",
        },
        {
            "nombre": "Pizza cuatro quesos",
            "ingredientes": ["masa de pizza", "salsa de tomate", "muzzarella", "provolone", "roquefort", "parmesano", "orégano"],
            "preparacion": [
                "Cubrir la masa con una capa fina de salsa de tomate.",
                "Mezclar los cuatro quesos y distribuirlos por encima.",
                "Hornear hasta que la base esté dorada y los quesos fundidos.",
                "Espolvorear orégano y servir.",
            ],
            "preferencias": ["Vegetariana"],
            "restricciones": ["Contiene gluten", "Contiene lácteos"],
            "tiempo": "30 minutos",
            "tipo": "Cena",
            "herramientas": ["Horno", "Rodillo", "Rallador"],
            "nivel": "Intermedio",
        },
    ],
    "pescado": [
        {
            "nombre": "Pechito de merluza a la romana",
            "ingredientes": ["filetes de merluza", "huevos", "harina", "limón", "aceite", "sal", "perejil"],
            "preparacion": [
                "Pasar los filetes por harina y luego por huevo batido.",
                "Freír en aceite caliente hasta dorar.",
                "Escurrir en papel absorbente.",
                "Servir con limón, perejil y ensalada.",
            ],
            "preferencias": ["Sin gluten no aplica", "Sin lactosa"],
            "restricciones": ["Contiene huevo", "Contiene pescado"],
            "tiempo": "25 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Sartén", "Bowl", "Espátula"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Salmón al horno con limón y eneldo",
            "ingredientes": ["salmón", "manteca", "limón", "eneldo", "ajo", "papas", "sal"],
            "preparacion": [
                "Precalentar el horno a 180°C.",
                "Colocar el salmón en una fuente con manteca, limón, eneldo y ajo.",
                "Hornear 20 minutos sin dar vuelta el pescado.",
                "Servir con papas asadas al horno.",
            ],
            "preferencias": ["Sin gluten", "Baja en carbohidratos"],
            "restricciones": ["Contiene pescado", "Contiene lácteos"],
            "tiempo": "35 minutos",
            "tipo": "Cena",
            "herramientas": ["Horno", "Fuente para horno", "Cuchillo de chef"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Atún sellado con sésamo",
            "ingredientes": ["lomo de atún", "sésamo", "soja", "jengibre", "aceite de sésamo", "sal"],
            "preparacion": [
                "Cubrir el atún con semillas de sésamo presionando bien.",
                "Sellar en una sartén bien caliente 1 minuto por lado.",
                "Cortar en láminas contra la fibra.",
                "Servir con salsa de soja y jengibre rallado.",
            ],
            "preferencias": ["Sin gluten no aplica", "Baja en carbohidratos"],
            "restricciones": ["Contiene pescado", "Contiene sésamo"],
            "tiempo": "15 minutos",
            "tipo": "Cena",
            "herramientas": ["Sartén", "Cuchillo de chef", "Tabla de cortar"],
            "nivel": "Intermedio",
        },
        {
            "nombre": "Cazuela de mariscos",
            "ingredientes": ["camarones", "mejillones", "calamares", "tomate", "vino blanco", "azafrán", "ajo", "cebolla", "sal"],
            "preparacion": [
                "Rehogar la cebolla y el ajo en aceite.",
                "Agregar el tomate triturado, el vino blanco y el azafrán.",
                "Sumar los mariscos y cocinar 10 minutos sin revolver de más.",
                "Condimentar y servir bien caliente.",
            ],
            "preferencias": ["Sin gluten", "Sin lactosa"],
            "restricciones": ["Contiene pescado", "Contiene mariscos"],
            "tiempo": "35 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Olla", "Cuchillo de chef", "Cuchara de madera"],
            "nivel": "Intermedio",
        },
        {
            "nombre": "Trucha a la plancha con almendras",
            "ingredientes": ["trucha", "manteca", "almendras", "perejil", "limón", "sal"],
            "preparacion": [
                "Dorar la trucha en una plancha con manteca.",
                "Agregar las almendras fileteadas hasta tostar.",
                "Bañar el pescado con la manteca de almendras y perejil.",
                "Servir con limón.",
            ],
            "preferencias": ["Sin gluten", "Baja en carbohidratos"],
            "restricciones": ["Contiene pescado", "Contiene frutos secos", "Contiene lácteos"],
            "tiempo": "20 minutos",
            "tipo": "Cena",
            "herramientas": ["Plancha", "Espátula", "Cuchillo de chef"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Merluza al horno con papas y pimientos",
            "ingredientes": ["filetes de merluza", "papas", "morrón", "aceite de oliva", "ajo", "vino blanco", "sal", "pimienta"],
            "preparacion": [
                "Cortar las papas en rodajas finas y los morrones en tiras.",
                "Distribuir en la fuente con aceite, ajo y sal.",
                "Colocar los filetes encima y rociar con vino blanco.",
                "Hornear a 190°C durante 30 minutos.",
            ],
            "preferencias": ["Sin gluten", "Sin lactosa"],
            "restricciones": ["Contiene pescado"],
            "tiempo": "45 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Horno", "Fuente para horno", "Cuchillo de chef"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Calamares a la provenzal",
            "ingredientes": ["calamares", "tomate", "ajo", "perejil", "vino blanco", "aceite de oliva", "sal"],
            "preparacion": [
                "Limpiar y cortar los calamares en anillos.",
                "Rehogar el ajo y el perejil en aceite de oliva.",
                "Agregar el tomate triturado y el vino blanco.",
                "Sumar los calamares y cocinar 15 minutos a fuego suave.",
            ],
            "preferencias": ["Sin gluten", "Sin lactosa"],
            "restricciones": ["Contiene pescado", "Contiene mariscos"],
            "tiempo": "30 minutos",
            "tipo": "Cena",
            "herramientas": ["Olla", "Cuchillo de chef", "Cuchara de madera"],
            "nivel": "Intermedio",
        },
        {
            "nombre": "Pescado a la parrilla con hierbas",
            "ingredientes": ["pescado entero", "aceite de oliva", "ajo", "romero", "limón", "sal gruesa"],
            "preparacion": [
                "Untar el pescado con aceite, ajo y romero.",
                "Salar con sal gruesa.",
                "Cocinar sobre brasas suaves 10 minutos por lado.",
                "Servir con limón.",
            ],
            "preferencias": ["Sin gluten", "Sin lactosa", "Baja en carbohidratos"],
            "restricciones": ["Contiene pescado"],
            "tiempo": "25 minutos",
            "tipo": "Almuerzo",
            "herramientas": ["Parrilla", "Pinzas", "Pincel"],
            "nivel": "Intermedio",
        },
    ],
    "desayuno": [
        {
            "nombre": "Tostadas con palta y huevo",
            "ingredientes": ["pan integral", "palta", "huevos", "limón", "sal", "pimienta"],
            "preparacion": [
                "Tostar el pan integral.",
                "Aplastar la palta con jugo de limón, sal y pimienta.",
                "Cocinar los huevos revueltos o poché.",
                "Untar la palta en las tostadas y coronar con el huevo.",
            ],
            "preferencias": ["Vegetariana", "Sin lactosa"],
            "restricciones": ["Contiene gluten", "Contiene huevo"],
            "tiempo": "15 minutos",
            "tipo": "Desayuno",
            "herramientas": ["Tostadora", "Sartén", "Cuchillo de chef"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Yogur con granola y frutas",
            "ingredientes": ["yogur natural", "granola", "frutillas", "banana", "miel"],
            "preparacion": [
                "Servir el yogur en un bowl.",
                "Agregar la granola casera.",
                "Cortar las frutillas y la banana en rodajas.",
                "Terminar con un hilo de miel.",
            ],
            "preferencias": ["Vegetariana"],
            "restricciones": ["Contiene lácteos", "Contiene frutos secos"],
            "tiempo": "10 minutos",
            "tipo": "Desayuno",
            "herramientas": ["Bowl", "Cuchillo de chef"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Omelette de queso y champiñones",
            "ingredientes": ["huevos", "queso", "champiñones", "manteca", "sal", "pimienta"],
            "preparacion": [
                "Saltear los champiñones en manteca.",
                "Batir los huevos con sal y pimienta.",
                "Cocinar el omelette y sumar los champiñones y el queso.",
                "Doblar y servir caliente.",
            ],
            "preferencias": ["Vegetariana", "Baja en carbohidratos"],
            "restricciones": ["Contiene huevo", "Contiene lácteos"],
            "tiempo": "15 minutos",
            "tipo": "Desayuno",
            "herramientas": ["Sartén", "Batidor", "Cuchillo de chef"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Panqueques con frutos rojos",
            "ingredientes": ["harina", "huevos", "leche", "azúcar", "polvo de hornear", "frutos rojos", "miel"],
            "preparacion": [
                "Mezclar la harina con el polvo de hornear y el azúcar.",
                "Batir con los huevos y la leche hasta integrar.",
                "Cocinar panqueques esponjosos en una sartén antiadherente.",
                "Acompañar con frutos rojos y miel.",
            ],
            "preferencias": ["Vegetariana"],
            "restricciones": ["Contiene gluten", "Contiene huevo", "Contiene lácteos"],
            "tiempo": "25 minutos",
            "tipo": "Desayuno",
            "herramientas": ["Sartén", "Batidor", "Bowl"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Licuado verde energético",
            "ingredientes": ["espinaca", "banana", "manzana", "jengibre", "agua", "leche de almendras"],
            "preparacion": [
                "Lavar la espinaca y pelar la banana.",
                "Cortar la manzana en cuartos.",
                "Procesar todo con jengibre, agua y leche de almendras.",
                "Servir bien frío.",
            ],
            "preferencias": ["Vegetariana", "Vegana", "Sin gluten"],
            "restricciones": ["Contiene frutos secos"],
            "tiempo": "10 minutos",
            "tipo": "Desayuno",
            "herramientas": ["Licuadora", "Cuchillo de chef"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Huevos revueltos con cebollín",
            "ingredientes": ["huevos", "crema", "cebollín", "manteca", "sal", "tostadas"],
            "preparacion": [
                "Batir los huevos con la crema y el cebollín picado.",
                "Cocinar a fuego bajo con manteca, moviendo siempre.",
                "Retirar apenas cremosos.",
                "Servir con tostadas.",
            ],
            "preferencias": ["Vegetariana", "Baja en carbohidratos"],
            "restricciones": ["Contiene huevo", "Contiene lácteos", "Contiene gluten"],
            "tiempo": "10 minutos",
            "tipo": "Desayuno",
            "herramientas": ["Sartén", "Batidor", "Cuchillo de chef"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Avena con canela y manzana",
            "ingredientes": ["avena", "leche", "canela", "manzana", "miel", "nueces"],
            "preparacion": [
                "Cocinar la avena en leche a fuego bajo.",
                "Sumar la canela y la manzana en cubos.",
                "Cocinar 5 minutos más hasta que espese.",
                "Servir con miel y nueces picadas.",
            ],
            "preferencias": ["Vegetariana"],
            "restricciones": ["Contiene lácteos", "Contiene gluten", "Contiene frutos secos"],
            "tiempo": "15 minutos",
            "tipo": "Desayuno",
            "herramientas": ["Olla", "Cuchillo de chef"],
            "nivel": "Principiante",
        },
        {
            "nombre": "Café con leche y medialunas",
            "ingredientes": ["café", "leche", "medialunas de manteca"],
            "preparacion": [
                "Preparar el café y calentar la leche.",
                "Espumar la leche con la espumadora.",
                "Servir el café con la leche espumosa.",
                "Acompañar con medialunas tibias.",
            ],
            "preferencias": ["Vegetariana"],
            "restricciones": ["Contiene lácteos", "Contiene gluten"],
            "tiempo": "10 minutos",
            "tipo": "Desayuno",
            "herramientas": ["Espumadora", "Taza", "Horno"],
            "nivel": "Principiante",
        },
    ],
}

# Convertir los datos estructurados al texto markdown final, en el mismo orden
# que los índices usados por favoritos/generaciones (pasta-0 .. pasta-7, etc.).
RECETAS_TEXTO = {
    tematica: [armar_receta(**datos) for datos in lista]
    for tematica, lista in RECETAS_DATOS.items()
}

# ---------------------------------------------------------------------------
# Usuarios de prueba
# ---------------------------------------------------------------------------
USUARIOS = [
    {
        "email": "admin@receya.com",
        "password": "admin123",
        "is_admin": True,
        "tipo_plan": "premium",
        "generaciones_usadas": 3,
        "favoritos": ["pasta-0", "pasta-1"],
        "dias_atras_creacion": 45,
    },
    {
        "email": "premium@receya.com",
        "password": "premium123",
        "is_admin": False,
        "tipo_plan": "premium",
        "generaciones_usadas": 7,
        "favoritos": ["ensalada-0", "ensalada-2", "pescado-1"],
        "dias_atras_creacion": 60,
    },
    {
        "email": "gratuito@receya.com",
        "password": "gratuito123",
        "is_admin": False,
        "tipo_plan": "gratuito",
        "generaciones_usadas": 2,
        "favoritos": ["pizza-1", "pizza-3"],
        "dias_atras_creacion": 20,
    },
    {
        "email": "limite@receya.com",
        "password": "limite123",
        "is_admin": False,
        "tipo_plan": "gratuito",
        "generaciones_usadas": 5,   # límite gratuito alcanzado -> 403 en /generar-receta
        "favoritos": [],
        "dias_atras_creacion": 10,
    },
    {
        "email": "expirado@receya.com",
        "password": "expirado123",
        "is_admin": False,
        "tipo_plan": "gratuito",
        "generaciones_usadas": 5,
        "periodo_expirado": True,   # fecha_fin_periodo en el pasado -> renovación automática
        "favoritos": [],
        "dias_atras_creacion": 40,
    },
    {
        "email": "dulcero@receya.com",
        "password": "dulcero123",
        "is_admin": False,
        "tipo_plan": "premium",
        "generaciones_usadas": 4,
        "favoritos": ["postre-0", "postre-1", "postre-4"],
        "dias_atras_creacion": 25,
    },
    {
        "email": "carnivoro@receya.com",
        "password": "carnivoro123",
        "is_admin": False,
        "tipo_plan": "gratuito",
        "generaciones_usadas": 1,
        "favoritos": ["asado-0", "milanesa-1"],
        "dias_atras_creacion": 15,
    },
    {
        "email": "sinsabor@receya.com",
        "password": "sinsabor123",
        "is_admin": False,
        "tipo_plan": "premium",
        "generaciones_usadas": 0,
        "favoritos": [],            # sin favoritos -> recomendados por $sample aleatorio
        "dias_atras_creacion": 5,
    },
    {
        "email": "delete_test@receya.com",
        "password": "delete123",
        "is_admin": False,
        "tipo_plan": "gratuito",
        "generaciones_usadas": 0,
        "favoritos": [],
        "dias_atras_creacion": 2,
    },
]


def main():
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]

    # --- Limpieza idempotente ---
    for col in ("usuarios", "recetas", "generaciones", "tokens", "planes"):
        db[col].drop()
    print("[ok] colecciones limpiadas")

    # --- Recetas con embeddings ---
    recetas_ids = {}
    for tematica, conf in TEMATICAS.items():
        n = conf["recetas"]
        for i in range(n):
            # Duplicada: segunda receta de su temática, casi idéntica a la original
            if conf["duplicada"] and i == 1:
                variante = 0.0
            # Primera de una temática con duplicada: la "original" (casi centro)
            elif conf["duplicada"] and i == 0:
                variante = 0.01
            else:
                variante = 0.3 + 0.05 * i
            embedding = embedding_tematica(tematica, variante)
            texto = RECETAS_TEXTO[tematica][i]
            doc_id = db["recetas"].insert_one({
                "texto_receta": texto,
                "embedding": embedding,
                "imagen_id": None,
                "fecha": datetime.now().replace(tzinfo=None),
            }).inserted_id
            recetas_ids[f"{tematica}-{i}"] = doc_id
    print(f"[ok] {len(recetas_ids)} recetas con embeddings ({EMBEDDING_DIMS} dims)")

    # --- Usuarios ---
    for u in USUARIOS:
        hashed = pwd_context.hash(u["password"])
        # Período vigente: 15 días atrás hasta 15 días adelante (evita que el
        # fin del período coincida con "ahora", lo que dispararía la renovación)
        inicio = AHORA - timedelta(days=15)
        fin = AHORA - timedelta(days=1) if u.get("periodo_expirado") else AHORA + timedelta(days=15)

        favoritos = [recetas_ids[k] for k in u["favoritos"]]

        db["usuarios"].insert_one({
            "email": u["email"],
            "hashed_password": hashed,
            "is_admin": u["is_admin"],
            "is_active": True,
            "favoritos": favoritos,
            "plan": {
                "tipo_plan": u["tipo_plan"],
                "generaciones_usadas": u["generaciones_usadas"],
                "fecha_inicio_periodo": inicio,
                "fecha_fin_periodo": fin,
                "activo": True,
            },
            "creado_en": AHORA - timedelta(days=u["dias_atras_creacion"]),
        })
    print(f"[ok] {len(USUARIOS)} usuarios creados")

    # --- Generaciones: historial coherente con la cuota de cada usuario ---
    generaciones_por_usuario = {
        "admin@receya.com": 3,
        "premium@receya.com": 7,
        "gratuito@receya.com": 2,
        "limite@receya.com": 5,
        "expirado@receya.com": 5,  # en el período anterior (antes de fecha_inicio_periodo)
        "dulcero@receya.com": 4,
        "carnivoro@receya.com": 1,
        "sinsabor@receya.com": 0,
        "delete_test@receya.com": 0,
    }
    total_gen = 0
    for email, n in generaciones_por_usuario.items():
        usuario = db["usuarios"].find_one({"email": email})
        inicio_periodo = usuario["plan"]["fecha_inicio_periodo"]
        for i in range(n):
            # expirado: generaciones dentro del período VIEJO (antes del inicio actual)
            if email == "expirado@receya.com":
                fecha = inicio_periodo - timedelta(days=1, hours=i)
            else:
                fecha = inicio_periodo + timedelta(hours=i * 36)
            db["generaciones"].insert_one({
                "usuario_email": email,
                "fecha_generacion": fecha,
                "receta_id": str(random.Random(email + str(i)).choice(list(recetas_ids.values()))),
            })
            total_gen += 1
    print(f"[ok] {total_gen} generaciones de historial")

    # --- Planes (espejo; el startup los re-upserta igual) ---
    db["planes"].insert_many([
        {
            "tipo": "gratuito",
            "limite_generaciones_mensual": 5,
            "precio": 0.0,
            "nombre": "Plan Gratuito",
            "descripcion": "Hasta 5 recetas cada 30 días, perfecto para empezar",
        },
        {
            "tipo": "premium",
            "limite_generaciones_mensual": 100,
            "precio": 9.99,
            "nombre": "Plan Premium",
            "descripcion": "Hasta 100 recetas cada 30 días, ideal para apasionados de la cocina",
        },
    ])
    print("[ok] planes de catálogo insertados")

    client.close()
    print("\nSeed completado. Resumen:")
    print("  admin@receya.com / admin123       (admin, premium, favs: pasta)")
    print("  premium@receya.com / premium123   (premium, favs: ensaladas + pescado)")
    print("  gratuito@receya.com / gratuito123 (gratuito 2/5, favs: pizza)")
    print("  limite@receya.com / limite123     (gratuito 5/5 -> /generar-receta 403)")
    print("  expirado@receya.com / expirado123 (período vencido -> se renueva solo)")
    print("  dulcero@receya.com / dulcero123   (premium, favs: postres)")
    print("  carnivoro@receya.com / carnivoro123 (gratuito, favs: asado + milanesas)")
    print("  sinsabor@receya.com / sinsabor123 (sin favoritos -> recomendados aleatorios)")
    print("  delete_test@receya.com / delete123 (gratuito, para probar eliminación)")
    print(f"\nRecetas: {len(recetas_ids)} en {len(TEMATICAS)} temáticas (pasta tiene 1 duplicada)")
    return 0


if __name__ == "__main__":
    sys.exit(main())