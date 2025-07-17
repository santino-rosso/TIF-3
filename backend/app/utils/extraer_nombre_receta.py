def extraer_nombre(texto_receta: str) -> str:
    try:
        lineas = texto_receta.split('\n')
        
        for linea in lineas:
            linea = linea.strip()
            if not linea:
                continue
                
            # Buscar específicamente la línea que contiene el nombre de la receta
            if 'nombre de la receta' in linea.lower():
                # Extraer el título removiendo asteriscos, dos puntos y la etiqueta
                titulo = linea.replace('**', '').replace(':', '').strip()
                nombre = titulo.replace('nombre de la receta', '', 1).strip()
                if nombre:  # Verificar que no esté vacío
                    return nombre
        
        # Si no encontramos "nombre de la receta", buscar la primera línea que parezca un título
        for linea in lineas:
            linea = linea.strip()
            if linea and not linea.startswith('-') and not linea.startswith('*') and len(linea) < 80:
                # Probable que sea el título de la receta
                return linea.replace('**', '').replace(':', '').strip()
        
        # Como último recurso, usar un nombre genérico
        return "Delicious homemade dish"
        
    except Exception as e:
        return "Delicious homemade dish"