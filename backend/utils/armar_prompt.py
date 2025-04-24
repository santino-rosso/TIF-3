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
    """.strip()

    return prompt


def formato_prompt_image(preferencias, restricciones, tiempo, tipo_comida, herramientas, experiencia):
    prompt = f"""
    <|image|>

    Actuá como un chef profesional. Observá **detalladamente** los ingredientes **visibles en la imagen** proporcionada y generá una receta **real, creativa y detallada**.

    ⚠️ **Importante:**
    - SOLO podés usar ingredientes que realmente estén en la imagen. No inventes ni agregues ingredientes adicionales.
    - Indicá las cantidades con **unidades apropiadas para cada alimento** (por ejemplo: “1 zanahoria”, “2 tomates”, “1 hoja de lechuga”, “100 g de pollo”). Evitá medidas poco naturales como “1/2 taza de lechuga”.

    También tené en cuenta esta información del usuario:
    - Preferencias dietéticas: {preferencias}
    - Restricciones alimentarias: {restricciones}
    - Tiempo disponible para cocinar: {tiempo} minutos
    - Tipo de comida deseado: {tipo_comida}
    - Herramientas de cocina disponibles: {herramientas}
    - Nivel de experiencia del usuario en cocina: {experiencia}

    ⚠️ Respondé exclusivamente en el siguiente formato. No agregues introducciones, explicaciones, encabezados como “Respuesta”, “Sugerencia”, ni repitas el nombre de la receta fuera de su lugar. NO uses emojis, ni frases decorativas. NO cambies el orden ni omitas secciones.

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