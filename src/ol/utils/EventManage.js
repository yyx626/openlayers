/**
 * @module ol/utils/EventManage
 */
import Select from "../interaction/Select.js";
import { click, pointerMove } from "../events/condition.js";
/**
 * @classdesc
 * 通用事件管理
 *
 * @api
 */
class EventManage {
  /**
   * 
   * @param {*} map 
   */
  constructor(map) {
    this.map_ = map;
    this._selectLayers = {};
    this._selectSingleClick = null;
    this._selectPointerMove = null;
    this._allSelectCallBack = {};
  }

  /**
   * 所有图层要素选择事件监听
   * 注：要素选择的监听事件必须只有一个（否则会有图层监听混乱的问题）
   * @param {*} layerObj { "key": layerId, "value": layer对象 }
   * @param {*} funCall 回调
   * @api
   */
  allSelectControl(layerObj, funCall) {
    if (this._selectSingleClick != null) {
      this.map_.removeInteraction(this._selectSingleClick);
      this._selectSingleClick = null;
    }
    if (this._selectPointerMove != null) {
      this.map_.removeInteraction(this._selectPointerMove);
      this._selectPointerMove = null;
    }
    if (layerObj) {
      if (!this._selectLayers[layerObj.key]) {
        this._selectLayers[layerObj.key] = layerObj.value;
        this._allSelectCallBack[layerObj.key] = funCall;
      }
    }
    let selectLayers = [];
    Reflect.ownKeys(this._selectLayers).forEach((key) => {
      if (this._selectLayers[key]) {
        selectLayers.push(this._selectLayers[key]);
      }
    })
    //鼠标点击选中事件
    this._selectSingleClick = new Select({
      condition: click,
      layers: selectLayers,
      hitTolerance: 5,
      multi: true,//允许多选
      style: null,
    });
    this._selectSingleClick.on('select', (e) => {
      let features = e.target.getFeatures().getArray();
      if (features != null && features.length > 0) {
        let f = features[0];
        let obj = (f.getProperties().attr ? f.getProperties().attr : f.getProperties().attrObj);
        if (obj && obj.layerid) {
          if (this._allSelectCallBack[obj.layerid]) {
            this._allSelectCallBack[obj.layerid](f, 1, features);
          }
        }
      } else {
        this._callBackAll(-1);
      }
      this._clearSelect();
    });
    this.map_.addInteraction(this._selectSingleClick);
    //鼠标移动选中事件
    this._selectPointerMove = new Select({
      condition: pointerMove,
      layers: selectLayers,
      hitTolerance: 20,
      style: null,
    });
    this._selectPointerMove.on('select', (e) => {
      let features = e.target.getFeatures().getArray();
      if (features != null && features.length > 0) {
        let f = features[0];
        let obj = (f.getProperties().attr ? f.getProperties().attr : f.getProperties().attrObj);
        if (obj && obj.layerid) {
          if (this._allSelectCallBack[obj.layerid]) {
            this._allSelectCallBack[obj.layerid](f, 2);
          }
        }
      } else {
        this._callBackAll(-2);
      }
      this._clearSelect();
    });
    this.map_.addInteraction(this._selectPointerMove);
  }

  /**
   * 鼠标位置为空时通知所有
   * @param {*} type 
   * @api
   */
  _callBackAll(type) {
    if (this._allSelectCallBack) {
      Reflect.ownKeys(this._allSelectCallBack).forEach((key) => {
        if (this._allSelectCallBack[key]) {
          this._allSelectCallBack[key](null, type);
        }
      })
    }
  }

  /**
   * 清除选中
   * @api
   */
  _clearSelect() {
    //通用的select
    if (this._selectSingleClick) {
      this._selectSingleClick.getFeatures().clear()
      // _selectSingleClick.featureOverlay_.getSource().clear();
    }
  }

  /**
   * 地图单击（可能会有问题，建议使用 singleClick）
   * @param {*} callBack 
   * @api
   */
  click(callBack) {
    this.map_.on('click', callBack);
  }
  /**
   * 地图双击
   * @param {*} callBack 
   * @api
   */
  dblClick(callBack) {
    this.map_.on('dblclick', callBack);
  }
  /**
   * 地图单击（真正）
   * @param {*} callBack 
   * @api
   */
  singleClick(callBack) {
    this.map_.on('singleclick', callBack);
  }
  /**
   * 地图移动开始
   * @param {*} callBack 
   * @api
   */
  moveStart(callBack) {
    this.map_.on('movestart', callBack);
  }
  /**
   * 地图移动结束
   * @param {*} callBack 
   * @api
   */
  moveEnd(callBack) {
    this.map_.on('moveend', callBack);
  }
  /**
   * 地图鼠标拖拽
   * @param {*} callBack 
   * @api
   */
  pointerDrag(callBack) {
    this.map_.on('pointerdrag', callBack);
  }
  /**
   * 地图鼠标移动
   * @param {*} callBack 
   * @api
   */
  pointerMove(callBack) {
    this.map_.on('pointermove', callBack);
  }
  /**
   * 地图渲染完成
   * @param {*} callBack 
   * @api
   */
  renderComplete(callBack) {
    this.map_.on('rendercomplete', callBack);
  }
  /**
   * 地图准备渲染
   * @param {*} callBack 
   * @api
   */
  precompose(callBack) {
    this.map_.on('precompose', callBack);
  }
  /**
   * 地图渲染中
   * @param {*} callBack 
   * @api
   */
  postcompose(callBack) {
    this.map_.on('postcompose', callBack);
  }
  /**
   * 地图缩放监听
   * @param {*} callBack 
   * @api
   */
  viewListener(callBack) {
    this.map_.getView().on('change:resolution', callBack);
  }

}
export default EventManage