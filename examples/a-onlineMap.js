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

const points = [{
  id:"1011",
  x:"119",
  y:"29",
  attr:{
    mc:"测试点2"
  },
  img:{
    img:'/resources/img/mark_b.png'
  },
  offset:[0,40]
}
]

map.utils.TSBS.addGraphics("test_layer",points,(type,attr,feature)=>{
  switch (type) {
    case 2:
      map.utils.TSBS.mousePointerPopup(feature);
      break;
    case -2:
      map.utils.TSBS.mousePointerPopup(null);
      break;
  }
},false,false)

document.getElementById("dwBtn").onclick = ()=>{
  map.utils.TSBS.flash([119,29])
}
document.getElementById("tsxdBtn").onclick = ()=>{
  map.utils.PickPoint.selectPoint().then((res)=>{
    console.log(res);
    document.getElementById("res").innerHTML = "coordinate:"+res.coord;
  })
}

map.utils.EventManage.pointerMove((e)=>{
  document.getElementById("sjz").innerHTML = "digital:" + e.coordinate;
  document.getElementById("dfm").innerHTML = "degree:" + JSON.stringify(map.utils.CoordTransform.toDegree(e.coordinate));
})
