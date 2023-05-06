// @ts-nocheck
import Tile from "../layer/Tile.js";
import XYZ from "../source/XYZ.js";
import OSM from "../source/OSM.js";
/**
 * @module ol/user/OnlineTile
 */

/**
 * OnlineTile
 * 一 初始化地图容器
 * 二 绑定接口工具对象返回用户使用
 */
class OnlineTile {

  constructor(map, options) {
    this.map = map;
    this.options = options;
  }

  /**
   * 加载瓦片图层
   * @param {*} _url 
   * @param {*} imageType 
   * @param {*} proj 
   * @returns {Tile}
   * @api
   */
  formatTileLayer(_url, imageType, proj) {
    let tileUrlFunction = (tileCoord) => {
      let z = tileCoord[0];
      let x = Math.abs(tileCoord[1]);
      let y = Math.abs(tileCoord[2]);
      x = x.toString(16);
      y = y.toString(16);
      z = z.toString();
      x = padLeft(x, 8);

      y = padLeft(y, 8);
      z = padLeft(z, 2);
      x = 'C' + x;
      y = 'R' + y;
      z = 'L' + z;
      let url = _url + z.toUpperCase() + "/" + y.toUpperCase() + "/" + x.toUpperCase() + imageType;
      return url;
    };

    return new Tile({
      source: new XYZ({
        tileUrlFunction: tileUrlFunction,
        projection: proj,
        wrapX: false
      })
    });

    function padLeft(str, length) {
      return new Array(length - str.length + 1).join("0") + str;
    }

  }

  /**
   * 设置默认底图
   * @param {*} url 
   * @param {*} imageType 
   * @param {*} proj 
   * @returns {Tile}
   * @api
   */
  setDefaultArcgisTileLayer(url, imageType, proj) {
    this.baselayer = this.formatTileLayer(url, imageType ? imageType : "jpg", proj ? proj : "EPSG:4326");
    return this.baselayer;
  }


  /**
   * 设置默认OSM底图
   * @returns 
   */
  setDefaultOnlineTileLayer() {
    return new Tile({
      source: new OSM({
        wrapX: false
      }),
    });
  }

}

export default OnlineTile;
