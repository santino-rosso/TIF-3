from app.models.receta import DatosReceta

def formato_prompt_generar_receta(datos: DatosReceta) -> str:
    preferencias = datos.preferencias
    restricciones = datos.restricciones
    tiempo = datos.tiempo
    tipo_comida = datos.tipo_comida
    herramientas = datos.herramientas
    experiencia = datos.experiencia
    ingredientes = datos.ingredientes
    
    prompt = f"""
    Sos un chef profesional y nutricionista. Tu tarea es generar recetas **reales, creativas y detalladas** únicamente a partir de los ingredientes proporcionados por el usuario. No inventes ingredientes, no repitas ni adornes con frases decorativas. Respondé en el formato estricto que se detalla a continuación.

    Generá una receta basada en la siguiente información:

    - Ingredientes disponibles: {ingredientes}"""

    if preferencias and preferencias != "desconocido":
        prompt += f"\n    - Preferencias dietéticas: {preferencias}"
    if restricciones and restricciones != "desconocido":
        prompt += f"\n    - Restricciones alimentarias: {restricciones}"
    if tiempo and tiempo != "desconocido":
        prompt += f"\n    - Tiempo disponible para cocinar: {tiempo} minutos"
    if tipo_comida and tipo_comida != "desconocido":
        prompt += f"\n    - Tipo de comida: {tipo_comida}"
    if herramientas and herramientas != "desconocido":
        prompt += f"\n    - Herramientas de cocina disponibles: {herramientas}"
    if experiencia and experiencia != "desconocido":
        prompt += f"\n    - Nivel de experiencia del usuario en la cocina: {experiencia}"

    prompt += """
    ⚠️ IMPORTANTE: Respondé **exclusivamente** en el siguiente formato. No agregues explicaciones, introducciones, repeticiones ni emojis.
    
    **Nombre de la receta:** [nombre creativo]

    **Ingredientes:**
    - ingrediente 1
    - ingrediente 2
    ...

    **Preparación:**
    1. Paso uno
    2. Paso dos
    ...

    **Preferencias dietéticas:**
    - [adaptadas al usuario si corresponde]

    **Restricciones alimentarias:**
    - [adaptadas al usuario si corresponde]

    **Tiempo de cocina necesario:**
    [duración en minutos respectando el tiempo disponible del usuario si corresponde]

    **Tipo de comida:**
    [adaptada al usuario si corresponde]

    **Herramientas de cocina utilizadas:**
    - herramienta 1
    - herramienta 2
    ...
    [adaptadas al usuario si corresponde]

    **Nivel de experiencia requerido:**
    [nivel sugerido adaptado al usuario si corresponde]
    """.strip()

    return prompt


def formato_prompt_detectar_ingredientes():
    prompt = """
    Sos un experto en cocina y visión artificial. Tu tarea es observar una imagen y listar únicamente los ingredientes que ves de forma precisa. No adivines ingredientes que no estén claros. No agregues frases decorativas ni explicaciones. **Genera la lista de ingredientes una sola vez y detente.**

    ⚠️ IMPORTANTE: Listá únicamente ingredientes reconocibles. Cada ingrediente en una línea nueva. Sin numeraciones ni puntos.
    
    **Lista de ingredientes:**
    - ingrediente 1
    - ingrediente 2
    - ingrediente 3
    ...
    """.strip()

    return prompt
