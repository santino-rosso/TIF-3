def armar_prompt(datos):
    ingredientes = datos.get("ingredientes", "")
    preferencias = datos.get("preferencias", "")
    restricciones = datos.get("restricciones", "")
    tiempo = datos.get("tiempo", "")
    tipo_comida = datos.get("tipo_comida", "")
    herramientas = datos.get("herramientas", "")
    experiencia = datos.get("experiencia", "")

    prompt = f"""
    Actuá como un chef profesional especializado en crear recetas personalizadas.

    Generá una receta **real, creativa y detallada** basada en la siguiente información del usuario:

    - Ingredientes disponibles: {ingredientes}
    - Preferencias dietéticas: {preferencias}
    - Restricciones alimentarias: {restricciones}
    - Tiempo disponible para cocinar: {tiempo} minutos
    - Tipo de comida: {tipo_comida}
    - Herramientas de cocina disponibles: {herramientas}
    - Nivel de experiencia del usuario en la cocina: {experiencia}

    Respondé con el siguiente formato **estricto** y no agregues nada más fuera de él. No uses emojis ni frases decorativas:

    **Nombre de la receta:** [nombre creativo]

    **Ingredientes:**
    - ingrediente 1
    - ingrediente 2
    - ...

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
    """.strip()

    return prompt

