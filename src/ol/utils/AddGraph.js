/**
 * @module ol/utils/AddGraph
 */
import { Circle, Stroke, Style } from '../style.js';
import Feature from '../Feature.js'
import { Point, LineString, Polygon } from '../geom.js'
import { Modify } from '../interaction.js'
import { getVectorContext } from '../render.js';

import { pointStyle, commonStyle } from './GetStyle.js'

/**
 * @classdesc
 * 点、线、面上图
 *
 * @api
 */
class AddGraph {

  /**
   * 
   * @param {*} map 
   */
  constructor(map) {
    this.map_ = map;
    this.layerManage_ = map.utils.LayerManage;
  }

  /**
   * 点上图
   * @param {string} layerId 图层Id
   * @param {*} id 点唯一标识
   * @param {*} jwd 经纬度 [jd,wd]
   * @param {*} options 
   * @param {*} attr 属性
   * @returns {Promise} resolve(feature)
   * @api
   */
  addPoint(layerId, id, jwd, options, attr) {
    return new Promise((resolve, reject) => {
      let f = new Feature({
        geometry: new Point(jwd)
      });
      f.setId(id.toString());
      f.setStyle(pointStyle(options));
      if (attr) {
        attr.layerid = layerId;
        f.setProperties({ "attr": attr });
      } else {
        let attr1 = {}
        attr1.layerid = layerId;
        f.setProperties({ "attr": attr1 });
      }
      let layer = this.layerManage_.getLayer(layerId);
      if (layer == undefined) {
        layer = this.layerManage_.addLayer(layerId);
      }
      layer.getSource().addFeature(f);
      // isModify ? this.modifyFeature() : null
      resolve(f);
    });
  }

  /**
   * 添加闪烁点
   * @param {string} layerId 图层Id
   * @param {Array} features 点集合
   * @param {number} radius 闪烁半径
   * @api
   */
  addFlashPoint(layerId, features, radius) {
    let layer = this.layerManage_.getLayer(layerId);
    if (layer == undefined) {
      layer = this.layerManage_.addLayer(layerId);
    }
    layer.getSource().addFeatures(features);
    layer.on('postrender', (evt) => {
      if (radius >= 20) radius = 0;
      let opacity = (20 - radius) * (1 / 20);//不透明度
      let pointStyle = new Style({
        image: new Circle({
          radius: radius,
          stroke: new Stroke({
            color: `rgba(255,0,0)`,
            width: 3 - radius / 10 //设置宽度
          })
        })
      });
      //获取矢量要素上下文
      let vectorContext = getVectorContext(evt);
      vectorContext.setStyle(pointStyle);
      features.forEach((feature) => {
        vectorContext.drawGeometry(feature.getGeometry());
      });
      radius = radius + 0.3; //调整闪烁速度
      //请求地图渲染（在下一个动画帧处）
      this.map_.render();
    })
  }

  /**
   * 线上图
   * @param {string} layerId 图层Id
   * @param {*} id 线唯一标识
   * @param {array} coordArr [[jd,wd],[jd,wd],[jd,wd]...]
   * @param {*} options 上图样式
   * @param {*} attr 属性
   * @returns {Promise} resolve(feature)
   * @api
   */
  addLine(layerId, id, coordArr, options, attr) {
    return new Promise((resolve, reject) => {
      coordArr.length < 2 ? reject('Two points at least.') : '';
      let f = new Feature({
        geometry: new LineString(coordArr),
      });
      f.setId(id);
      options ? f.setStyle(commonStyle(options)) : '';
      if (attr) {
        attr.layerid = layerId;
        f.setProperties({ "attr": attr });
      } else {
        let attr1 = {}
        attr1.layerid = layerId;
        f.setProperties({ "attr": attr1 });
      }
      let layer = this.layerManage_.getLayer(layerId);
      if (layer == undefined) {
        layer = this.layerManage_.addLayer(layerId);
      }
      layer.getSource().addFeature(f);
      resolve(f);
    });
  }

  /**
   * 面上图
   * @param {string} layerId 图层Id
   * @param {*} id 面唯一标识
   * @param {Array} coordArr [[jd,wd],[jd,wd],[jd,wd]...]
   * @param {*} options 上图样式
   * @param {*} attr 属性
   * @returns {Promise} resolve(feature)
   * @api
   */
  addPolygon(layerId, id, coordArr, options, attr) {
    return new Promise((resolve, reject) => {
      coordArr.length < 3 ? reject('Three points at least.') : '';
      let f = new Feature({
        geometry: new Polygon([coordArr]),
      });
      f.setId(id);
      options ? f.setStyle(commonStyle(options)) : '';
      if (attr) {
        attr.layerid = layerId;
        f.setProperties({ "attr": attr });
      } else {
        let attr1 = {}
        attr1.layerid = layerId;
        f.setProperties({ "attr": attr1 });
      }
      let layer = this.layerManage_.getLayer(layerId);
      if (layer == undefined) {
        layer = this.layerManage_.addLayer(layerId);
      }
      layer.getSource().addFeature(f);
      resolve(f);
    });
  }

  /**
   * 修改
   * @param {String} layerId 图层Id
   * @api
   */
  modifyFeature(layerId) {
    let layer = this.layerManage_.getLayer(layerId);
    let modify = new Modify({
      source: layer.getSource(),
      hitDetection: layer
    });
    this.map_.addInteraction(modify);
    modify.on('modifyend', (e) => {
      let features = e.features.getArray();
      if (features.length > 0) {
        // @ts-ignore
        let coor = features[0].getGeometry().getCoordinates();
        console.log(coor);
      }
    })
  }


}
export default AddGraph