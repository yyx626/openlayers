/**
 * @module ol/utils/HeatMap
 */
import VectorSource from '../source/Vector.js';
import { Heatmap as HeatmapLayer } from '../layer.js';

/**
 * @classdesc
 * 热力图
 *
 * @api
 */
class HeatMap {
  /**
   * 
   * @param {*} map 
   */
   constructor(map) {
    this.map_ = map;
    this.layer_ = null;
  }

  /**
   * 热力图
   * @param {string} layerId 图层Id
   * @param {array} features 
   * @param {string} weight 权重属性名（开启加权热力图） null或undefined加载普通热力图
   * @param {*} blur 
   * @param {*} radius 
   * @api
   */
  addHeatLayer(layerId,features, weight, blur, radius) {
    let max = -1;
    features.forEach(f => {
      if (parseFloat(f.get(weight)) > max) {
        max = parseFloat(f.get(weight));
      }
    });
    this.layer_ = new HeatmapLayer({
      source: new VectorSource({
        features: features,
        wrapX: false
      }),
      zIndex: 1,
      blur: parseInt(blur ? blur : 20),
      radius: parseInt(radius ? radius : 15),
      weight: weight && function (feature) {
        const number = feature.get(weight);
        return parseFloat(number) / max;
      },
    });
    this.layer_.set("Id", layerId);
    this.map_.addLayer(this.layer_);
  }

}
export default HeatMap