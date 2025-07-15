import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import PropTypes from 'prop-types';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

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
  const pos = lat && lon ? [lat, lon] : [0, 0];
  return (
    <MapContainer center={pos} zoom={5} style={{ height: '200px', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <ClickMarker position={lat && lon ? [lat, lon] : null} onChange={onChange} />
    </MapContainer>
  );
}

MapSelector.propTypes = {
  lat: PropTypes.number,
  lon: PropTypes.number,
  onChange: PropTypes.func.isRequired,
};

MapSelector.defaultProps = {
  lat: 0,
  lon: 0,
};


