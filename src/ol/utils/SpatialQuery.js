/**
 * @module ol/utils/SpatialQuery
 */

import { Polygon } from '../geom.js'

/**
 * @classdesc
 * 空间查询
 *
 * @api
 */
class SpatialQuery {
  /**
   * 判断点是否在多边形内部
   * @param {*} point 
   * @param {*} polygon 
   * @returns {boolean}
   * @api
   */
  isPointIn(point, polygon) {
    return polygon.intersectsCoordinate(point.getCoordinates());
  }

  /**
   * 查询在指定范围内的点
   * @param {array} pointFeaturesArr 点 feature Array
   * @param {*} polygon 
   * @returns {array}
   * @api
   */
  getInsidePoints(pointFeaturesArr, polygon) {
    const insidePoints = new Array();
    pointFeaturesArr.forEach((f) => {
      this.isPointIn(f.getGeometry(), polygon.getGeometry()) ? insidePoints.push(f) : null;
    })
    return insidePoints;
  }

  /**
   * 查询两个多边形的空间关系
   * @param {Polygon} geomA 多边形A
   * @param {Polygon} geomB 多边形B
   * @returns {string} 相离 | 相交 | A包含B | B包含A
   * @api
   */
  judgePolygon(geomA, geomB) {
    // A是否至少有一点在B中
    let boola = geomA.getCoordinates()[0].some(item => {
      return geomB.containsXY(item[0], item[1]);
    });
    // A是否全部点在B中
    let boolaAll = geomA.getCoordinates()[0].every(item => {
      return geomB.containsXY(item[0], item[1]);
    });
    // B是否至少有一点在A中
    let boolb = geomB.getCoordinates()[0].some(item => {
      return geomA.containsXY(item[0], item[1]);
    });
    // B是否全部点在A中
    let boolbAll = geomB.getCoordinates()[0].every(item => {
      return geomA.containsXY(item[0], item[1]);
    });
    if (!boola && !boolb) {
      return '相离';
    } else if (boolbAll) {
      return 'A包含B';
    } else if (boolaAll) {
      return 'B包含A';
    } else if (boola && boolb || !boola && boolb || !boolb && boola) {
      return '相交';
    }
  }

}
export default SpatialQuery