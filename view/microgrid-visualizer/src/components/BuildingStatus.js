import LoadStatus from './LoadStatus';
import PropTypes from 'prop-types';

export default function BuildingStatus(props) {
  return <LoadStatus {...props} />;
}

BuildingStatus.propTypes = {
  module: PropTypes.object.isRequired,
  history: PropTypes.object.isRequired,
  currentState: PropTypes.object.isRequired,
};
