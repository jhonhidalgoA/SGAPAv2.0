# /utils/consecutivo.py

def obtener_siguiente_consecutivo(tipo_documento):
    """
    Devuelve el siguiente número consecutivo para un tipo de documento dado.
    Si no hay registros, empieza desde 1.
    """
    from db import get_connection as get_db

    db = get_db()
    cursor = db.cursor()

    try:
        cursor.execute("""
            SELECT MAX(consecutivo) AS max_consecutivo 
            FROM pdf_consecutivos 
            WHERE tipo_documento = %s
        """, (tipo_documento,))
        
        resultado = cursor.fetchone()

        if resultado is None:
            nuevo_consecutivo = 1
        else:
            # Manejar según tipo de cursor (dict o tuple)
            if isinstance(resultado, dict):
                ultimo = resultado.get('max_consecutivo')
            else:
                ultimo = resultado[0] if len(resultado) > 0 else None
            
            nuevo_consecutivo = (ultimo or 0) + 1

        # Guardar el nuevo consecutivo
        cursor.execute("""
            INSERT INTO pdf_consecutivos (tipo_documento, consecutivo)
            VALUES (%s, %s)
        """, (tipo_documento, nuevo_consecutivo))
        db.commit()

        return nuevo_consecutivo

    except Exception as e:
        db.rollback()
        raise Exception(f"Error al generar el consecutivo: {str(e)}")
    finally:
        cursor.close()
        db.close()