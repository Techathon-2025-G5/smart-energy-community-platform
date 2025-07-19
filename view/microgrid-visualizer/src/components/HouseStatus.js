import LoadStatus from './LoadStatus';
import PropTypes from 'prop-types';

export default function HouseStatus(props) {
  return <LoadStatus {...props} />;
}

HouseStatus.propTypes = {
  module: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  currentState: PropTypes.object.isRequired,
};
