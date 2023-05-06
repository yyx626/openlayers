/**
 * @module ol/user/OnlineMap
 */

import Map from '../Map.js';
import AddGraph from '../utils/AddGraph.js';
import BufferDraw from '../utils/BufferDraw.js';
import Common from '../utils/Common.js';
import CoordDraw from '../utils/CoordDraw.js';
import CoordTransform from '../utils/CoordTransform.js';
import EventManage from '../utils/EventManage.js';
import HeatMap from '../utils/HeatMap.js';
import LayerManage from '../utils/LayerManage.js';
import MouseDraw from '../utils/MouseDraw.js';
import OverlayMark from '../utils/OverlayMark.js';
import PickPoint from '../utils/PickPoint.js';
import SpatialQuery from '../utils/SpatialQuery.js';
import OnlineTile from './OnlineTile.js';
import TSBS from '../utils/TSBS.js';
import $ from 'jquery';

/**
 * OnlineMap
 * 一 初始化地图容器
 * 二 绑定接口工具对象返回用户使用
 */
class OnlineMap extends Map {

  constructor(options) {
    super(options);

    //开箱即用工具初始化
    this.utils = {};
    this.utils.AddGraph = new AddGraph(this);
    this.utils.BufferDraw = new BufferDraw(this);
    this.utils.Common = new Common(this);
    this.utils.CoordDraw = new CoordDraw(this);
    this.utils.CoordTransform = new CoordTransform();
    this.utils.EventManage = new EventManage(this);
    this.utils.HeatMap = new HeatMap(this);
    this.utils.LayerManage = new LayerManage(this);
    this.utils.MouseDraw = new MouseDraw(this);
    this.utils.OverlayMark = new OverlayMark(this);
    this.utils.PickPoint = new PickPoint(this);
    this.utils.SpatialQuery = new SpatialQuery();
    this.utils.TSBS = new TSBS(this);

    //当设置使用默认底图时执行
    if (typeof (options.userDefaultBaseLayer) != undefined && options.userDefaultBaseLayer) {
      let url = options.defaultConfigDataUrl ? options.defaultConfigDataUrl : 'http://localhost:8088/site/config.json';
      let _this = this;
      if (this.isFileExisted(url)) {
        this.getLayerConfig(url, (res) => {
          let data = res
          let myTile = new OnlineTile(this);
          let baseLayer = myTile.setDefaultArcgisTileLayer(data.tile, data.format, data.projection);
          _this.addLayer(baseLayer);
        });
      }
    }

    /**
     * 当设置使用在线默认底图(OSM)时执行
     */
    if (typeof (options.onlineBaseLayer) != undefined && options.onlineBaseLayer) {
      let type = options.onlineBaseLayerType ? options.onlineBaseLayerType : 'osm';
      let _this = this;
      let myTile = new OnlineTile(this);
      let baseLayer = myTile.setDefaultOnlineTileLayer();
      _this.addLayer(baseLayer);
    }

  }


  /**
   * 判断项目文件是否存在
   * @param {*} url 
   * @returns {boolean}
   * @api
   */
  isFileExisted(url) {
    var isExists;
    $.ajax({
      url: url,
      async: false,
      type: 'HEAD',
      timeout: 2000,
      error: function () {
        isExists = 0;
      },
      success: function () {
        isExists = 1;
      }
    })
    return isExists == 1 ? true : false;
  }


  /**
   * 获取图层配置
   * @param {*} url 
   * @param {*} callBack 
   * @api
   */
  getLayerConfig(url, callBack) {
    $.ajax({
      url: url,
      async: true,
      dataType: 'JSON',
      success: function (data) {
        if (data && callBack) {
          callBack(data);
        }
      }
    })
  }
}

export default OnlineMap;
