import requests

def pv_data_generator(
    lat: float, 
    lon: float, 
    peakpower: float, 
    loss: float, 
    angle: float, 
    aspect: float,
    mountingplace: str = 'free', # 'free' or 'building' 
    pvtechchoice: str = 'crystSi', # 'crystSi', 'CIS', 'CdTe' or 'Unknown'
    year=2023
):
    """
    Realiza una consulta a la API PVGIS (SARAH3) para obtener la energía generada
    por una instalación FV real, hora a hora durante un año completo.

    Parámetros:
        lat (float): Latitud de la ubicación.
        lon (float): Longitud de la ubicación.
        peakpower (float): Potencia pico instalada del sistema (kWp).
        loss (float): Pérdidas del sistema en porcentaje (%).
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
        'peakpower': peakpower,
        'loss': loss,
        'mountingplace': mountingplace,
        'pvtechchoice': pvtechchoice,
        'outputformat': 'json',
        'browser': 1
    }

    response = requests.get(url, params=params)
    if response.status_code != 200:
        raise Exception(f"Error al acceder a PVGIS: código {response.status_code}")

    # Extraer registros horarios
    dataset = response.json().get("outputs", {}).get("hourly", [])

    result = []
    for data in dataset:
        # Usar 'P' como energía generada neta en kWh (valor entregado por PVGIS)
        result.append(round(data["P"], 3))

    return result

