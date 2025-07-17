import batteryImg from '../assets/battery.png';
import batterySoc0Img from '../assets/battery_soc_0.png';
import batterySoc25Img from '../assets/battery_soc_25.png';
import batterySoc50Img from '../assets/battery_soc_50.png';
import batterySoc75Img from '../assets/battery_soc_75.png';
import batterySoc100Img from '../assets/battery_soc_100.png';

export function getBatteryImage(soc) {
  if (typeof soc !== 'number') return batteryImg;
  let value = soc;
  if (value > 1) value /= 100; // handle 0-100 range
  if (value < 0.1) return batterySoc0Img;
  if (value < 0.3) return batterySoc25Img;
  if (value < 0.6) return batterySoc50Img;
  if (value < 0.9) return batterySoc75Img;
  return batterySoc100Img;
}
