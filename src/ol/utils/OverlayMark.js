/**
 * @module ol/utils/OverlayMark
 */
import Overlay from '../Overlay.js'

/**
* @classdesc
* 覆盖物
*
* @api
*/
class OverlayMark {

  static overlayNum = 0

  /**
   * 
   * @param {*} map 
   */
  constructor(map) {
    this.map_ = map;
  }

  /**
   * overlay上图
   * @param {*} overlayId overlay唯一标识
   * @param {*} jwd [117,39]
   * @param {*} pos 位置 默认'top-left'
   * @param {*} ele html元素 不能为空
   * @param {*} offset 偏移 [x,y] 默认[0,0]
   * @api
   */
  add(overlayId, jwd, pos, ele, offset) {
    const popup = new Overlay({
      id: overlayId,
      position: jwd,
      positioning: pos ? pos : 'top-left',
      element: ele,
      offset: offset ? offset : [0, 0],
      stopEvent: true
    });
    this.map_.addOverlay(popup);
    OverlayMark.overlayNum++;
  }

  /**
   * 获取指定overlay
   * @param {string} overlayId overlay唯一标识
   * @returns {Overlay}
   * @api
   */
  getOverlay(overlayId) {
    if(overlayId==null || overlayId=="") throw new Error(`overlayId is null or "".`);
    return this.map_.getOverlayById(overlayId);
  }

  /**
   * 获取一组overlay
   * @param {string} overlayId_part overlay Id的子串
   * @returns {Array<Overlay>}
   * @api
   */
  getOverlays(overlayId_part) {
    if(overlayId_part==null || overlayId_part=="") throw new Error(`id_part is null or "".`);
    return this.map_.getOverlays().getArray().filter(item => item.getId() && item.getId().indexOf(overlayId_part) > -1);
  }

  /**
   * 移除指定overlay
   * @param {string} overlayId overlay唯一标识
   * @api
   */
  removeOverlay(overlayId) {
    let overlay = this.getOverlay(overlayId);
    if (overlay != undefined) {
      this.map_.removeOverlay(overlay);
      OverlayMark.overlayNum--;
    }
  }

  /**
   * 移除一组overlay
   * @param {string} overlayId_part overlay Id的子串
   * @api
   */
  removeOverlays(overlayId_part) {
    const overlayArr = this.getOverlays(overlayId_part);
    overlayArr.forEach((v, i) => {
      this.map_.removeOverlay(v);
      OverlayMark.overlayNum--;
    })
  }

  /**
   * 设置覆盖物隐藏/显示
   * @param {string} overlayId_part overlay Id的子串
   * @param {*} toggle true-显示 false-隐藏
   * @api
   */
  setVisible(overlayId_part, toggle) {
    const overlayArr = this.getOverlays(overlayId_part);
    toggle ? overlayArr.forEach(item => item.getElement().parentElement.style.display = 'block') :
      overlayArr.forEach(item => item.getElement().parentElement.style.display = 'none');
  }

}
export default OverlayMark