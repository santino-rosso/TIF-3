def armar_prompt(datos):
    imagen_base64 = datos.get("imagen", None)
    preferencias = datos.get("preferencias", "")
    restricciones = datos.get("restricciones", "")
    tiempo = datos.get("tiempo", "")
    tipo_comida = datos.get("tipo_comida", "")
    herramientas = datos.get("herramientas", "")
    experiencia = datos.get("experiencia", "")
    ingredientes = datos.get("ingredientes", "")

    if imagen_base64:
        prompt = formato_prompt_image(preferencias, restricciones, tiempo, tipo_comida, herramientas, experiencia)
    else:
        prompt = formato_prompt_text(ingredientes, preferencias, restricciones, tiempo, tipo_comida, herramientas, experiencia)
  
    return prompt, imagen_base64


def formato_prompt_text(ingredientes, preferencias, restricciones, tiempo, tipo_comida, herramientas, experiencia):
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


def formato_prompt_image(preferencias, restricciones, tiempo, tipo_comida, herramientas, experiencia):
    prompt = f"""
    <|begin_of_text|>
    <|start_header_id|>system<|end_header_id|>
    Sos un chef profesional. Solo podés usar ingredientes que sean **visiblemente presentes en la imagen**. Debes evitar las alucinaciones y las suposiciones genéricas. Tu objetivo es generar recetas **reales, creativas y detalladas**, adaptadas al contexto y restricciones del usuario.   <|eot_id|>
    <|begin_of_text|>
    <|start_header_id|>user<|end_header_id|>
    <|image|>

    Observá detalladamente los ingredientes que aparecen en la imagen y generá una receta usando **solamente esos ingredientes**, siguiendo las siguientes indicaciones del usuario:
        
    - Preferencias dietéticas: {preferencias}
    - Restricciones alimentarias: {restricciones}
    - Tiempo disponible: {tiempo} minutos
    - Tipo de comida: {tipo_comida}
    - Herramientas disponibles: {herramientas}
    - Nivel de experiencia del usuario: {experiencia}

    ⚠️ IMPORTANTE: Respondé estrictamente en el siguiente formato. No agregues introducciones, explicaciones, encabezados innecesarios ni adornos. No repitas el nombre de la receta fuera de su lugar. No uses emojis. Indicá las cantidades con **unidades apropiadas para cada alimento** (por ejemplo: “1 zanahoria”, “2 tomates”, “1 hoja de lechuga”, “100 g de pollo”). Evitá medidas poco naturales como “1/2 taza de lechuga”.

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