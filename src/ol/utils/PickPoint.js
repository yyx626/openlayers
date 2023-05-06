/**
 * @module ol/utils/PickPoint
 */

import MouseDraw from './MouseDraw.js';
import { pointStyle } from './GetStyle.js';

/**
 * @classdesc
 * 图上选点
 *
 * @api
 */
class PickPoint {
  /**
   * 
   * @param {*} map 
   */
  constructor(map) {
    this.map_ = map;
    this.drawObj_ = new MouseDraw(this.map_);
  }

  /**
   * 图上选点
   * @param {string} layerId 图层ID
   * @param {*} options 点样式
   * @param {Boolean} clearLast 是否清除上一次选点（清除图层上所有）
   * @returns {Promise} resolve({ <feature>feature, coord })
   * @api
   */
  selectPoint(layerId, options, clearLast) {
    return new Promise((resolve) => {
      this.drawObj_.drawGraph(layerId, 'Point', clearLast).then((p) => {
        p.feature.setStyle(pointStyle(options));
        let coord = p.feature.getGeometry().getCoordinates();
        resolve({
          feature: p.feature,
          coord: coord.map(item => parseFloat(item.toFixed(6)))
        });
      })
    })
  }
}
export default PickPoint

