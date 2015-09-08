import React, { PropTypes } from 'react';
import ContainerViewer from './ContainerViewer';
import DeviceOrientationControls from './DeviceOrientationControls';
import TouchControls from './TouchControls';
import StereoViewer from './StereoViewer';
import SphereMenu3D from './scenes/SphereMenu3D';

var CavecamCardboardViewer = React.createClass({
  propTypes: {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    running: PropTypes.bool.isRequired,

    sceneMode: PropTypes.oneOf(['SphereMenu', 'PanoramaView']).isRequired,

    // splitMode only applies to PanoramaView.
    splitMode: PropTypes.oneOf(['Vertical', 'Horizontal', 'None']),

    // TODO: only DeviceOrientation works for now.
    controlMode: PropTypes.oneOf(['Touch', 'DeviceOrientation']).isRequired,

    cavecams: PropTypes.array,

    onSelectCavecam: PropTypes.func,

    style: PropTypes.object
  },

  render() {
    const { width, height, running, cavecams, onSelectCavecam, style } = this.props;
    const { sceneMode, controlMode, splitMode } = this.props;

    let activeViewer;
    if (sceneMode === 'SphereMenu') {
      activeViewer = (
        <StereoViewer>
          <SphereMenu3D items={cavecams} onSelect={onSelectCavecam} />
        </StereoViewer>
      );
    } else if (sceneMode === 'PanoramaView') {
      // TODO:
      activeViewer = null;
    }

    let activeControl;
    if (controlMode === 'Touch') {
      activeControl = (
        <TouchControls enabled={true} />
      );
    } else if (controlMode === 'DeviceOrientation') {
      activeControl = (
        <DeviceOrientationControls enabled={true} />
      );
    }

    return (
      <ContainerViewer width={width} height={height} running={running} style={style}>
        {activeViewer}
        {activeControl}
      </ContainerViewer>
    );
  }

});

export default CavecamCardboardViewer;
