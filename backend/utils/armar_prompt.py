def formato_prompt_generar_receta(datos):
    preferencias = datos.get("preferencias", "")
    restricciones = datos.get("restricciones", "")
    tiempo = datos.get("tiempo", "")
    tipo_comida = datos.get("tipo_comida", "")
    herramientas = datos.get("herramientas", "")
    experiencia = datos.get("experiencia", "")
    ingredientes = datos.get("ingredientes", "")
    
    prompt = f"""
    <|begin_of_text|>
    <|start_header_id|>system<|end_header_id|>
    Sos un chef profesional y nutricionista. Tu tarea es generar recetas **reales, creativas y detalladas** únicamente a partir de los ingredientes proporcionados por el usuario. No inventes ingredientes, no repitas ni adornes con frases decorativas. Respondé en el formato estricto que se detalla a continuación.
    <|eot_id|>
    <|start_header_id|>user<|end_header_id|>

    Generá una receta basada en la siguiente información:

    - Ingredientes disponibles: {ingredientes}
    - Preferencias dietéticas: {preferencias}
    - Restricciones alimentarias: {restricciones}
    - Tiempo disponible para cocinar: {tiempo} minutos
    - Tipo de comida: {tipo_comida}
    - Herramientas de cocina disponibles: {herramientas}
    - Nivel de experiencia del usuario en la cocina: {experiencia}

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
    - [adaptado al usuario]

    **Restricciones alimentarias:**
    - [respetadas]

    **Tiempo de cocina necesario:**
    [duración en minutos]

    **Tipo de comida:**
    [tipo]

    **Herramientas de cocina utilizadas:**
    - herramienta 1
    - herramienta 2

    **Nivel de experiencia requerido:**
    [nivel sugerido]

    **Fin de la receta.**
    <|eot_id|>
    <|start_header_id|>assistant<|end_header_id|>
    """.strip()

    return prompt


def formato_prompt_detectar_ingredientes():
    prompt = """
    <|begin_of_text|>
    <|start_header_id|>system<|end_header_id|>
    Sos un experto en cocina y visión artificial. Tu tarea es observar una imagen y listar únicamente los ingredientes que ves de forma precisa. No adivines ingredientes que no estén claros. No agregues frases decorativas ni explicaciones. **Genera la lista de ingredientes una sola vez y detente.**
    <|eot_id|>
    <|start_header_id|>user<|end_header_id|>

    ⚠️ IMPORTANTE: Listá únicamente ingredientes reconocibles. Cada ingrediente en una línea nueva. Sin numeraciones ni puntos.
    
    **Lista de ingredientes:**
    - ingrediente 1
    - ingrediente 2
    - ingrediente 3
    ...
    <|eot_id|>
    <|start_header_id|>assistant<|end_header_id|>
    """.strip()

    return prompt
