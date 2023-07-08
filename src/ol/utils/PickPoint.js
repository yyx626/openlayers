/**
 * @module ol/utils/PickPoint
 */

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
    this.drawObj_ = map.utils.MouseDraw;
  }

  /**
   * 图上选点
   * @param {*} options 点样式
   * @param {Boolean} clearLast 是否清除上一次选点（清除图层上所有）
   * @returns {Promise} resolve({ <feature>feature, coord })
   * @api
   */
  selectPoint(options, clearLast) {
    return new Promise((resolve, reject) => {
      let styleOpt;
      if(!options || options === null || options === undefined ){
        styleOpt = {};
      }else{
        styleOpt = options;
      }
      let isClear;
      if(!clearLast || clearLast === null || clearLast === undefined ){
        isClear = true;
      }else{
        isClear = clearLast;
      }
      this.drawObj_.drawGraph('Point', null, isClear).then((p) => {
        p.feature.setStyle(pointStyle(styleOpt));
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

