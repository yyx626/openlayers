/**
 * @module ol/utils/Common
 */

/**
 * @classdesc
 * 通用方法（定位...）
 *
 * @api
 */
class Common {

  /**
   * 
   * @param {*} map 
   */
  constructor(map) {
    this.map_ = map;
  }

  /**
   * 定位到具体图形
   * @param {*} feature 
   * @param {*} maxZoom 定位最大缩放级别 默认 6
   * @param {*} duration 定位动画时间 默认 1000毫秒
   * @param {*} padding [上，右，下，左]
   * @api
   */
  dwByFeature(feature, maxZoom, duration, padding) {
    if (feature) {
      let extent = feature.getGeometry().getExtent();
      this.map_.getView().fit(extent, {
        size: this.map_.getSize(),
        maxZoom: maxZoom ? maxZoom : 6,
        padding: padding ? padding : [0, 0, 0, 0],
        duration: duration ? duration : 1000
      })
    }
  }

  /**
   * 定位到合适图层显示
   * @param {*} extent [xmin,ymin,xmax,ymax]
   * @param {*} maxZoom 定位最大缩放级别 默认 6
   * @param {*} duration 定位动画时间 默认 1000ms
   * @param {*} padding [上，右，下，左]
   * @api
   */
  dwByExtent(extent, maxZoom, duration, padding) {
    if (extent) {
      this.map_.getView().fit(extent, {
        size: this.map_.getSize(),
        maxZoom: maxZoom ? maxZoom : 6,
        padding: padding ? padding : [0, 0, 0, 0],
        duration: duration ? duration : 1000
      })
    }
  }
}

export default Common;