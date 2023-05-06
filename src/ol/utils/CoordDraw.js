/**
 * @module ol/utils/CoordDraw
 */
import { Point, LineString, Polygon, Circle } from '../geom.js'
import Feature from '../Feature.js'

import LayerManage from './LayerManage.js'

/**
 * @classdesc
 * 根据坐标绘制
 *
 * @api
 */
class CoordDraw {
  /**
   * 
   * @param {*} map 
   */
  constructor(map) {
    this.map_ = map;
    this.layerManage_ = new LayerManage(this.map_);
  }

  /**
   * 根据坐标绘制点
   * @param {string} layerId 图层ID 唯一标识
   * @param {array} coordArr [[jd,wd],[jd,wd],[jd,wd]...]
   * @param {Boolean} clearLast 是否清除上一次上图
   * @returns {Promise} resolve(feature)
   * @api
   */
  point(layerId, coordArr, clearLast) {
    return new Promise((resolve, reject) => {
      let layer = this.layerManage_.getLayer(layerId);
      if (layer == undefined) {
        layer = this.layerManage_.addLayer(layerId);
      }
      clearLast ? layer.getSource().clear() : null;
      const fs = new Array();
      coordArr.forEach((v) => {
        fs.push(new Feature(new Point(v)))
      });
      layer.getSource().addFeatures(fs);
      resolve(fs);
    });
  }
  /**
   * 根据坐标绘制线
   * @param {string} layerId 图层ID 唯一标识
   * @param {array} coordArr [[jd,wd],[jd,wd],[jd,wd]...]
   * @param {Boolean} clearLast 是否清除上一次上图
   * @returns {Promise} resolve(feature)
   * @api
   */
  lineString(layerId, coordArr, clearLast) {
    return new Promise((resolve, reject) => {
      let layer = this.layerManage_.getLayer(layerId);
      if (layer == undefined) {
        layer = this.layerManage_.addLayer(layerId);
      }
      clearLast ? layer.getSource().clear() : null;
      coordArr.length < 2 ? reject('请至少输入两点坐标') : null;
      let f = new Feature(new LineString(coordArr));
      layer.getSource().addFeature(f);
      resolve(f);
    });
  }
  /**
   * 根据坐标和半径绘制圆
   * @param {string} layerId 图层ID 唯一标识
   * @param {array} centerPoint 
   * @param {number} radius 半径km
   * @param {boolean} clearLast 是否清除上一次上图
   * @returns {Promise} resolve(feature)
   * @api
   */
  circle(layerId, centerPoint, radius, clearLast) {
    return new Promise((resolve, reject) => {
      let layer = this.layerManage_.getLayer(layerId);
      if (layer == undefined) {
        layer = this.layerManage_.addLayer(layerId);
      }
      clearLast ? layer.getSource().clear() : null;
      let metersPerUnit = this.map_.getView().getProjection().getMetersPerUnit();
      let circleRadius = radius / metersPerUnit * 1000;
      let f = new Feature(new Circle(centerPoint, circleRadius));
      layer.getSource().addFeature(f);
      resolve(f);
    });
  }
  /**
   * 根据坐标绘制多边形
   * @param {string} layerId 图层ID 唯一标识
   * @param {array} coordArr [[jd,wd],[jd,wd],[jd,wd]...]
   * @param {Boolean} clearLast 是否清除上一次上图
   * @returns {Promise} resolve(feature)
   * @api
   */
  polygon(layerId, coordArr, clearLast) {
    return new Promise((resolve, reject) => {
      let layer = this.layerManage_.getLayer(layerId);
      if (layer == undefined) {
        layer = this.layerManage_.addLayer(layerId);
      }
      clearLast ? layer.getSource().clear() : null;
      coordArr.length < 3 ? reject('至少输入三点坐标') : null;
      let f = new Feature(new Polygon([coordArr]));
      layer.getSource().addFeature(f);
      resolve(f);
    })
  }
}
export default CoordDraw