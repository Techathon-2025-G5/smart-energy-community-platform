import requests
import json
from datetime import datetime

def obtener_datos_generacion(
    lat, lon, kwp, perdidas, angle, aspect,
    mountingplace, pvtechchoice, year=2023
):
    """
    Realiza una consulta a la API PVGIS (SARAH3) para obtener la energía generada
    por una instalación FV real, hora a hora durante un año completo.

    Parámetros:
        lat (float): Latitud de la ubicación.
        lon (float): Longitud de la ubicación.
        kwp (float): Potencia pico instalada del sistema (kWp).
        perdidas (float): Pérdidas del sistema en porcentaje (%).
        angle (float): Inclinación de los módulos (º).
        aspect (float): Acimut de orientación (º, 0 = sur).
        mountingplace (str): Tipo de instalación ('free' o 'building').
        pvtechchoice (str): Tecnología del panel ('crystSi', 'CIS', 'CdTe', etc.).
        year (int): Año de simulación (2023 por defecto).

    Retorna:
        list[dict]: Lista de registros con 'datetime' y 'energia_generada_kWh'.
    """
    url = "https://re.jrc.ec.europa.eu/api/seriescalc"
    params = {
        'lat': lat,
        'lon': lon,
        'startyear': year,
        'endyear': year,
        'usehorizon': 1,
        'angle': angle,
        'aspect': aspect,
        'pvcalculation': 1,
        'peakpower': kwp,
        'loss': perdidas,
        'mountingplace': mountingplace,
        'pvtechchoice': pvtechchoice,
        'outputformat': 'json',
        'browser': 1
    }

    response = requests.get(url, params=params)
    if response.status_code != 200:
        raise Exception(f"Error al acceder a PVGIS: código {response.status_code}")

    # Extraer registros horarios
    datos = response.json().get("outputs", {}).get("hourly", [])
    resultado = []

    for entrada in datos:
        # Convertir fecha al formato ISO 8601
        fecha_raw = entrada["time"].split(":")[0]
        hora_raw = entrada["time"].split(":")[1][:2]
        dt = datetime.strptime(fecha_raw + hora_raw, "%Y%m%d%H")

        # Usar 'P' como energía generada neta en kWh (valor entregado por PVGIS)
        resultado.append({
            "datetime": dt.isoformat(),
            "energia_generada_kWh": round(entrada["P"], 3)
        })

    return resultado

# === ENTRADA DEL USUARIO Y EJECUCIÓN PRINCIPAL ===
try:
    # Solicitar parámetros técnicos al usuario
    lat = float(input("Latitud (ej: 40.4168): "))
    lon = float(input("Longitud (ej: -3.7038): "))
    kwp = float(input("Potencia pico instalada (kWp): "))
    perdidas = float(input("Pérdidas del sistema (%) [14 por defecto]: ") or 14)
    acimut = float(input("Acimut (º, 0 = sur) [0 por defecto]: ") or 0)
    inclinacion = float(input("Inclinación del panel (º) [35 por defecto]: ") or 35)

    # Tipo de montaje: campo abierto o sobre edificio
    montaje = input("Tipo de montaje ('free' o 'building') [free por defecto]: ") or "free"
    if montaje not in ["free", "building"]:
        raise ValueError("El tipo de montaje debe ser 'free' o 'building'.")

    # Tecnología del panel
    tecnologia = input("Tecnología del panel ('crystSi', 'CIS', 'CdTe') [crystSi por defecto]: ") or "crystSi"
    if tecnologia not in ["crystSi", "CIS", "CdTe", "Unknown"]:
        raise ValueError("Tecnología no válida. Usa 'crystSi', 'CIS', 'CdTe' o 'Unknown'.")

    # Obtener datos desde PVGIS
    datos_generacion = obtener_datos_generacion(
        lat=lat, lon=lon, kwp=kwp, perdidas=perdidas,
        angle=inclinacion, aspect=acimut,
        mountingplace=montaje, pvtechchoice=tecnologia
    )

    # Guardar salida en archivo JSON
    with open("salida_generacion_minimal.json", "w") as f:
        json.dump(datos_generacion, f, indent=2)

    print("✅ Archivo generado: salida_generacion_minimal.json")

    import os
    print(f"📁 Ruta del archivo: {os.path.abspath('salida_generacion_minimal.json')}")


except Exception as e:
    print(f"❌ Error: {e}")
