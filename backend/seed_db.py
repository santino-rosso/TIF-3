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


RECETAS_TEXTO = {
    "pasta": [
        "Fideos con salsa fileto: hervís los fideos en abundante agua con sal, "
        "y en paralelo prepará una salsa con tomate perita, ajo y albahaca "
        "fresca. Serví con queso rallado.",
        "Spaghetti a la carbonara: dorá panceta en una sartén, mezclá yemas con "
        "queso pecorino y pimienta, y uní todo fuera del fuego con el agua de "
        "cocción.",
        "Penne al pomodoro con albahaca: salteá penne al dente con salsa de "
        "tomates maduros, ajo, aceite de oliva y hojas de albahaca fresca.",
        "Tallarines con bolognesa: cociná una salsa lenta de carne picada con "
        "cebolla, zanahoria, vino tinto y tomate; serví sobre tallarines frescos.",
        "Ñoquis de papa con manteca y salvia: hacé la masa con papa, harina y "
        "huevo, hervílos y saltealos con manteca dorada y hojas de salvia.",
        "Fusilli con crema de roquefort: cociná los fusilli y mezclalos con "
        "una salsa de crema, roquefort y nuez moscada.",
        "Ravioles de ricota y espinaca: rellená la masa con ricota, espinaca "
        "salteada y nuez moscada; serví con salsa fileto.",
        "Lasaña de carne: alterná capas de masa, salsa bolognesa y salsa "
        "blanca con muzzarella; gratiná al horno.",
    ],
    "asado": [
        "Asado de tira a la parrilla: salá la tira, prendé el fuego con carbón, "
        "cociná a fuego medio con el hueso hacia abajo y girá una sola vez.",
        "Matambre a la pizza: herví el matambre, condimentalo y gratiná con "
        "salsa, muzzarella y aceitunas en la parrilla.",
        "Vacío al horno con papas: sellá el vacío, hornealo envuelto en papel "
        "de aluminio con romero y acompañá con papas rusticas.",
        "Choripán con chimichurri: asá chorizos de cerdo a la parrilla, "
        "abrí el pan y bañalos con chimichurri de ajo, perejil y vinagre.",
        "Bondiola braseada a la cerveza: dorá la bondiola, cocinala en cerveza "
        "negra con cebollas y especias hasta que se deshaga.",
        "Entraña a la parrilla: cociná la entraña vuelta y vuelta sobre fuego "
        "fuerte, salala y servila con chimichurri y papas.",
        "Pechito de cerdo a la parrilla: cociná el pechito a fuego bajo con "
        "el hueso hacia abajo hasta que quede dorado y tierno.",
        "Provoletta: dorá el provolone a la parrilla y servilo con orégano "
        "y ají molido.",
    ],
    "ensalada": [
        "Ensalada César: mezclá lechuga mantecosa con pollo a la plancha, "
        "crostones de pan, queso parmesano y aderezo de anchoas y limón.",
        "Ensalada de rúcula con tomate y balsámico: lavá la rúcula, sumá "
        "tomates cherry, mozzarella en cubos y reducción de balsámico.",
        "Ensalada de quinoa con vegetales asados: mezclá quinoa cocida con "
        "zapallo, morrón y cebolla asados, y aliñá con aceite y limón.",
        "Ensalada griega: combiná tomate, pepino, aceitunas negras, cebolla "
        "morada y queso feta con orégano y aceite de oliva.",
        "Ensalada de lentejas y atún: mezclá lentejas cocidas con atún, "
        "cebolla, morrón, huevo duro y vinagreta de mostaza.",
        "Ensalada de espinaca, frutilla y nuez: mezclá espinaca baby con "
        "frutillas, nueces y un aliño de miel y aceto.",
        "Ensalada de tomate y albahaca: rodajas de tomate con hojas de "
        "albahaca, ajo, aceite de oliva y sal gruesa.",
        "Ensalada de arroz integral con pollo: combiná arroz integral, pollo "
        "desmenuzado, morrón, choclo y aderezo de yogur.",
    ],
    "postre": [
        "Flan casero con dulce de leche: cociná el flan al baño María, "
        "dejalo enfriar y servilo con dulce de leche y crema.",
        "Chocotorta: intercalá capas de galletitas chocolinas con crema de "
        "queso y dulce de leche; refrigerá toda la noche.",
        "Lemon pie: prepará una base de masa sablée, relleno de crema de limón "
        "y merengue italiano bien tostado.",
        "Tiramisú: intercalá vainillas empapadas en café con crema de mascarpone "
        "y cacao amargo espolvoreado.",
        "Panqueques con dulce de leche: cociná panqueques finos, rellenalos con "
        "dulce de leche repostero y gratiná con azúcar.",
        "Brownie con nueces: fundí chocolate y manteca, sumá azúcar, huevos "
        "y nueces; horneá y serví con helado.",
        "Cheesecake de frutos rojos: base de galletitas, relleno cremoso de "
        "queso y cobertura de frutos rojos.",
        "Ensalada de frutas con menta: cortá banana, manzana, naranja y "
        "frutillas; aliñá con jugo de limón y menta.",
    ],
    "sopa": [
        "Sopa de verduras: rehogá cebolla, zanahoria y zapallo, sumá caldo, "
        "cociná 30 minutos y procesá hasta obtener textura cremosa.",
        "Caldo de gallina con fideos: herví la gallina con verduras, "
        "condimentá y agregá fideos cabello de ángel al final.",
        "Crema de calabaza con jengibre: cociná zapallo con jengibre rallado "
        "y cebolla, procesá con crema y decorá con semillas tostadas.",
        "Sopa de lentejas con chorizo: cociná lentejas con chorizo colorado, "
        "papa, zanahoria y pimentón hasta espesar.",
        "Vichyssoise: herví puerros y papa en caldo, procesá con crema y "
        "serví bien fría con cebollino picado.",
        "Sopa de cebolla gratinada: caramelizá cebollas, sumá caldo y vino "
        "blanco, y gratiná con queso y pan tostado.",
        "Consomé de pollo con verduras: herví el pollo con apio, zanahoria "
        "y puerro; colá y serví bien caliente.",
        "Minestrone: cociná porotos, papa, zapallo, zapallitos y fideos en "
        "caldo de verduras con albahaca.",
    ],
    "milanesa": [
        "Milanesa de carne clásica: pasá los bifes por huevo batido con ajo y "
        "perejil, empanalos con pan rallado y freílos en abundante aceite.",
        "Milanesa a la napolitana: cociná las milanesas, cubrilas con salsa, "
        "jamón y muzzarella, y gratiná al horno.",
        "Milanesa de pollo crocante: empaná pechugas con pan rallado y "
        "queso parmesano, y hornealas hasta dorar.",
        "Milanesa de berenjena: empaná rodajas de berenjena y cocinalas al "
        "horno; servilas con salsa de tomate y albahaca.",
        "Milanesa fugazzeta: cubrí las milanesas con cebolla blanqueada y "
        "muzzarella, y gratiná hasta que burbujee.",
        "Milanesa de soja: rehidratá la soja texturizada, empanala con huevo "
        "y pan rallado, y freíla o hacela al horno.",
        "Sándwich de milanesa completo: pan de miga con milanesa, lechuga, "
        "tomate, huevo, jamón y mayonesa.",
        "Milanesa de pollo con limón: empaná las pechugas y bañalas con jugo "
        "de limón y perejil antes de servir.",
    ],
    "pizza": [
        "Pizza margherita: estirá la masa, cubrí con salsa de tomate, "
        "muzzarella fresca y albahaca; horneá a temperatura máxima.",
        "Pizza de muzzarella: masa fina con salsa, abundante muzzarella y "
        "orégano; cociná en horno bien caliente.",
        "Pizza calabresa: cubrí la masa con salsa, muzzarella y rodajas de "
        "longaniza picante con cebolla.",
        "Fugazzeta rellena: masa rellena de muzzarella, cebolla en aros "
        "blanqueada y aceitunas verdes por encima.",
        "Pizza napolitana con anchoas: salsa de tomate, muzzarella, anchoas, "
        "alcaparras y aceitunas negras.",
        "Pizza de rúcula y parmesano: horneá la masa con muzzarella y sumá "
        "rúcula fresca y escamas de parmesano al final.",
        "Pizza de hongos: cubrí con salsa, muzzarella y hongos salteados "
        "con ajo y perejil.",
        "Pizza cuatro quesos: muzzarella, provolone, roquefort y parmesano "
        "sobre base de salsa de tomate.",
    ],
    "pescado": [
        "Pechito de merluza a la romana: pasá los filetes por huevo y harina, "
        "freílos y acompañá con ensalada y limón.",
        "Salmón al horno con limón y eneldo: horneá el salmón con manteca, "
        "limón, eneldo y ajo; serví con papas asadas.",
        "Atún sellado con sésamo: sellá el atún con costra de sésamo y "
        "servilo apenas rosado con soja y jengibre.",
        "Cazuela de mariscos: cociná camarones, mejillones y calamares en "
        "salsa de tomate, vino blanco y azafrán.",
        "Trucha a la plancha con almendras: dorá la trucha y bañala con "
        "manteca, almendras fileteadas y perejil.",
        "Merluza al horno con papas y pimientos: horneá los filetes con "
        "papas, morrones y un chorrito de aceite de oliva.",
        "Calamares a la provenzal: cociná los anillos de calamar en salsa "
        "de tomate con ajo, perejil y vino blanco.",
        "Pescado a la parrilla con hierbas: untá el pescado con aceite, ajo "
        "y romero; cociná sobre brasas suaves.",
    ],
    "desayuno": [
        "Tostadas con palta y huevo: tostá pan integral, aplastá palta con "
        "limón y sumá huevo revuelto o poché por encima.",
        "Yogur con granola y frutas: serví yogur natural con granola casera, "
        "frutillas, banana y miel.",
        "Omelette de queso y champiñones: batí huevos, sumá queso y "
        "champiñones salteados; doblá y serví caliente.",
        "Panqueques con frutos rojos: cociná panqueques esponjosos y "
        "acompañalos con frutos rojos y miel o sirope de arce.",
        "Licuado verde energético: procesá espinaca, banana, manzana, "
        "jengibre y agua o leche de almendras.",
        "Huevos revueltos con cebollín: batí los huevos con crema y cebollín, "
        "cocinalos a fuego bajo y serví con tostadas.",
        "Avena con canela y manzana: cociná avena en leche con canela, "
        "manzana en cubos y un toque de miel.",
        "Café con leche y medialunas: prepará el café con leche espumosa y "
        "acompañá con medialunas de manteca.",
    ],
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
