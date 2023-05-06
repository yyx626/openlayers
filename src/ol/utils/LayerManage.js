/**
 * @module ol/utils/LayerManage
 */
import { Vector as VectorSource } from '../source.js'
import { Vector as VectorLayer } from '../layer.js'

/**
 * @classdesc
 * 图层管理
 *
 * @api
 */
class LayerManage{

  static layerNum = 0

  /**
   * 
   * @param {*} map 
   */
  constructor(map) {
    this.map_ = map;
  }

  /**
   * 新建图层
   * @param {string} id 图层ID
   * @param {*} zIndex 层级
   * @returns {VectorLayer}
   * @api
   */
  addLayer(id, zIndex) {
    if (this.getLayer(id) != undefined) {
      throw new Error(`${id} layer already exists.`);
    } else {
      let vectorLayer = new VectorLayer({
        source: new VectorSource({ wrapX: false }),
        zIndex: zIndex ? zIndex : 1
      });
      vectorLayer.set("Id", id);
      this.map_.addLayer(vectorLayer);
      LayerManage.layerNum++;
      return vectorLayer;
    }
  }

  /**
   * 获取唯一图层
   * @param {string} id 图层ID
   * @returns {VectorLayer}
   * @api
   */
  getLayer(id) {
    return this.map_.getAllLayers().find(item => {
      return item.get("Id") && item.get("Id") == id
    });
  }

  /**
   * 获取一组图层
   * @param {string} id_part 图层ID的子串
   * @returns {Array}
   * @api
   */
  getLayers(id_part) {
    return this.map_.getAllLayers().filter(item => item.get("Id") && item.get("Id").indexOf(id_part) > -1);
  }

  /**
   * 删除唯一图层
   * @param {string} id 图层ID
   * @api
   */
  removeLayer(id) {
    let layer = this.getLayer(id);
    if (layer != undefined) {
      this.map_.removeLayer(layer);
      LayerManage.layerNum--;
    }
  }

  /**
   * 删除一组图层
   * @param {*} id_part 图层ID的子串
   * @api
   */
  removeLayers(id_part) {
    this.getLayers(id_part).forEach((v, i) => {
      this.map_.removeLayer(v);
      LayerManage.layerNum--;
    })
  }

  /**
   * 设置指定图层显示/隐藏
   * @param {string} id 图层ID
   * @param {boolean} toggle true-显示 false-隐藏
   * @api
   */
  setLayerVisible(id, toggle) {
    let layer = this.getLayer(id);
    layer != undefined ? layer.setVisible(toggle) : "";
  }

  /**
   * 设置一组图层显示/隐藏
   * @param {string} id_part 图层Id的子串
   * @param {boolean} toggle true-显示 false-隐藏
   * @api
   */
  setLayersVisible(id_part, toggle) {
    this.getLayers(id_part).forEach((v, i) => {
      v.setVisible(toggle);
    })
  }

  /**
   * 清除图层上所有
   * @param {string} id 图层ID
   * @api
   */
  clearAll(id) {
    let layer = this.getLayer(id);
    layer != undefined ? layer.getSource().clear() : "";
  }

  /**
   * 获取图层Source
   * @param {string} id 图层ID
   * @returns {VectorSource}
   * @api
   */
  getSource(id) {
    let layer = this.getLayer(id);
    return layer != undefined ? layer.getSource() : "";
  }


}
export default LayerManage