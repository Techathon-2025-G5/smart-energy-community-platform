import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import PropTypes from 'prop-types';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

export const DEFAULT_LAT = 39.47428905506321;
export const DEFAULT_LON = -6.375852142621431;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

function ClickMarker({ position, onChange }) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, lon: e.latlng.lng });
    },
  });
  return position ? <Marker position={position} /> : null;
}

export default function MapSelector({ lat, lon, onChange }) {
  const hasCoords =
    lat !== null && lat !== undefined && !Number.isNaN(lat) &&
    lon !== null && lon !== undefined && !Number.isNaN(lon);
  const pos = hasCoords ? [lat, lon] : [DEFAULT_LAT, DEFAULT_LON];
  return (
    <MapContainer center={pos} zoom={5} style={{ height: '200px', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickMarker position={hasCoords ? [lat, lon] : null} onChange={onChange} />
    </MapContainer>
  );
}

MapSelector.propTypes = {
  lat: PropTypes.number,
  lon: PropTypes.number,
  onChange: PropTypes.func.isRequired,
};

MapSelector.defaultProps = {
  lat: DEFAULT_LAT,
  lon: DEFAULT_LON,
};


