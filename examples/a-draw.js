import OnlineMap from '../src/ol/user/OnlineMap.js';
import View from '../src/ol/View.js';
import * as olInteraction from '../src/ol/interaction.js';
import * as olControl from '../src/ol/control.js';

const map = new OnlineMap({
  interactions: olInteraction.defaults({
    doubleClickZoom: false,
    altShiftDragRotate: false,
    shiftDragZoom: false
  }),
  controls: olControl.defaults({
    zoom: false,
    attribution: false,
    rotate: false
  }),
  target: 'map',
  view: new View({
    center: [117, 31],
    zoom: 5,
    projection: 'EPSG:4326',
  }),
  onlineBaseLayer: true
})
document.getElementById('type').onchange = function () {
  let type = this.value;
  map.utils.MouseDraw.drawGraph(type,document.getElementById('formatType').value,false).then((result) => {
    console.log(result);
  })
};
map.utils.MouseDraw.drawGraph(document.getElementById('type').value,document.getElementById('formatType').value,false).then((result) => {
  console.log(result);
});
