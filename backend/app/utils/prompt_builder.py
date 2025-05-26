from app.models.receta_model import DatosReceta

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

def formato_prompt_validar_receta(receta_texto: str, datos_usuario: DatosReceta) -> str:
    prompt = f"""
        Eres un chef profesional y nutricionista experto. 
        
        Tu tarea es analizar la receta proporcionada y asegurarte de que cumpla con todos los requisitos del usuario. Si encuentras problemas, 
        debes ADAPTAR la receta para que se ajuste perfectamente a las necesidades del usuario.
        
        ## Receta a analizar:
        {receta_texto}
        
        ## Requisitos del usuario:
        """
        
    # Agregar solo los requisitos que el usuario especificó
    if datos_usuario.ingredientes and datos_usuario.ingredientes != "desconocido":
        prompt += f"\n- Ingredientes disponibles: {datos_usuario.ingredientes}"
    if datos_usuario.preferencias and datos_usuario.preferencias != "desconocido":
        prompt += f"\n- Preferencias dietéticas: {datos_usuario.preferencias}"
    if datos_usuario.restricciones and datos_usuario.restricciones != "desconocido":
        prompt += f"\n- Restricciones alimentarias: {datos_usuario.restricciones}"
    if datos_usuario.tiempo and datos_usuario.tiempo != "desconocido":
        prompt += f"\n- Tiempo disponible: {datos_usuario.tiempo} minutos"
    if datos_usuario.tipo_comida and datos_usuario.tipo_comida != "desconocido":
        prompt += f"\n- Tipo de comida: {datos_usuario.tipo_comida}"
    if datos_usuario.herramientas and datos_usuario.herramientas != "desconocido":
        prompt += f"\n- Herramientas disponibles: {datos_usuario.herramientas}"
    if datos_usuario.experiencia and datos_usuario.experiencia != "desconocido":
        prompt += f"\n- Nivel de experiencia: {datos_usuario.experiencia}"
            
    prompt += """        
        ## Instrucciones:
        1. Analiza si la receta cumple con TODOS los requisitos especificados por el usuario.
        2. Si detectas problemas (ingredientes no disponibles, restricciones no respetadas, tiempo inadecuado, etc.), 
           MODIFICA la receta para que cumpla con todos los requisitos.
        3. No elimines secciones completas innecesariamente.
        4. No agregues explicaciones, introducciones o emojis adicionales.
        5. Presta especial atención a:
            5.1. Usar solo los ingredientes disponibles
            5.2. Respetar las restricciones alimentarias
            5.3. Ajustarse a las preferencias dietéticas
            5.4. Poder prepararse en el tiempo indicado
            5.5. Requerir solo las herramientas disponibles
            5.6. Ajustarse al nivel de experiencia indicado
            5.7. Corresponder con el tipo de comida solicitado
        6. Mantene el formato exacto de la receta con todas sus secciones, incluyendo:
            - Nombre de la receta
            - Ingredientes
            - Preparación
            - Preferencias dietéticas
            - Restricciones alimentarias
            - Tiempo de cocina necesario
            - Tipo de comida
            - Herramientas de cocina utilizadas
            - Nivel de experiencia requerido

        ## IMPORTANTE: Devolve SOLO la receta final:
        - Si la receta original ya cumple con todos los requisitos, devolve la misma receta sin cambios.
        - Si la receta necesita adaptación, devolve la versión adaptada siguiendo el mismo formato.
        - No incluyas explicaciones adicionales ni comentarios sobre los cambios realizados.
        """
    prompt = prompt.strip()
    return prompt