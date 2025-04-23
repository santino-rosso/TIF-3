import base64

def imagen_base64(imagen):
    # Abre la imagen y convierte a base64
    with open(imagen, 'rb') as img_file:
        img_base64 = base64.b64encode(img_file.read()).decode('utf-8')

    return img_base64