/**
 * @module ol/utils/TSBS
 */
import { Vector as VectorSource } from '../source.js'
import { Vector as VectorLayer } from '../layer.js'
import Feature from '../Feature.js'
import { Point } from '../geom.js'
import { Circle as CircleStyle, Fill, Stroke, Style, Icon, Text } from '../style.js'
import $ from 'jquery';
import Select from '../interaction/Select.js';
import { click, pointerMove } from '../events/condition.js';
import Overlay from '../Overlay.js'

/**
 * @classdesc
 * 通用上图（除了标绘）接口类
 * 满足大部分上图和图上交互要求(仅限于点数据)
 * 注意：layerid一样的情况  此处没做处理  只能在外部约定layerid避免重复
 *
 * @api
 */
class TSBS {

  /**
  * 
  * @param {*} map 
  */
  constructor(map) {
    this.map_ = map; 

    // 统一字体、大小、加粗样式
    this.font = 'bold 15px Microsoft Yahei';

    //判断是否已经添加事件监听
    this.isListened = false;

    //按模块定义图层标识
    this.mkLayer = {};

    //临时通用
    this.commonLayer = "TSRH_COMMON";

    //记录每个模块的回调
    this.callBackFuns = {};

    //等待上图的标号数据
    this.waitViewDatas = {};

    //记录当前弹框的数目
    this.popupNum = 0;

    //是否开启分层控制显示功能
    this.fckz = false;

    //是否随地图缩放变化
    this.isImgZoom = true;

    //图片缩放比例
    this.imgScale = 1;

    //图层的显示控制
    this.layerShow = {};

    //图层显示状态记录
    this.layerShowState = {};

    //聚合距离设置
    this.clusterDistance = 40;

    //聚合样式记录
    this.styleCache = {};

    //聚合图层记录
    this.clusterLayersListen = {};

    //普通图层记录
    this.vectorLayersListen = {};

    //聚合监听
    this.ClusterObj = null;

    //高亮显示最新记录
    this.HighStyle = {};

    //高亮前样式记录
    this.OldStyle = {};

    //记录最新选中图上目标
    this.lastSelectTarget = null;

    /**
     * 记录是否初始化菜单
     */
    this.isInitRightMenu = false;

    /**
     * 是否重新计算extent避让
     */
    this.isPlanExtent = true;

    /**
     * modify修改几何要素控件
     */
    this.modifyInteraction = null;

    /**
     * 记录所有需要修改的要素集合
     */
    this.allModifyFeatures = {};

    this._selectLayers = {};
    this._selectSingleClick = null,
    this._selectPointerMove = null;
    this._allSelectCallBack = {};

    // 点位动画
    this.flash_overlay = null;
    this.flash_interval = null;

    // overlay 事件阻止控制
    this._stopEvent = false;

    // this.init();
  }

  init() {
    if (!this.isListened) {
      this.initEventListen();
      this.isListened = !this.isListened;
    }
    var zoom = this.map_.getView().getZoom();
    var re = this.map_.getView().getResolution();
    this.imgScale = 1 - re * zoom;
    if (zoom < 6) {
      this.imgScale = 0.5;
    } else if (zoom < 10) {
      this.imgScale = 0.8;
    } else if (zoom < 15) {
      this.imgScale = 1;
    }
  }

  initEventListen() {
    this.map_.getView().on('change:resolution', (evt) => {// 监听放大缩小地图
      var zoom = this.map_.getView().getZoom();
      var re = this.map_.getView().getResolution();
      if (!this.isImgZoom) {//是否允许强制重绘
        return;
      }
      this.imgScale = 1 - re * zoom;
      if (zoom < 6) {
        this.imgScale = 0.4;
      } else if (zoom < 10) {
        this.imgScale = 0.6;
      } else if (zoom < 15) {
        this.imgScale = 1;
      }
      this.reDrawHKQ();
    });
  }

  /**
   * 重绘改变图标大小
   * @returns {*}
   * @api
   */
  reDrawHKQ() {

    if (!this.isImgZoom) {//是否允许强制重绘
      return;
    }
    var selectLayers = [];
    $.each(this.mkLayer, (i, v) => {
      if (v && i != 'k') {
        var source = v.getSource();
        this.reDraw(source);
      }
    });
  }
  reDraw(source) {
    if (source) {
      var fs1 = source.getFeatures();
      if (fs1 && fs1.length > 0) {
        for (var i in fs1) {
          if (fs1[i].getStyle()) {
            var ts1 = fs1[i].getStyle().getImage();
            // var text = fs1[i].getStyle().getText();//.
            if (ts1) {
              ts1.setScale(this.imgScale);
            }
            // if (text) {
            //     text.setOffsetY(parseInt(text.getOffsetY())+parseFloat(this.imgScale)*10);
            // }
            fs1[i].changed();
          }
        }
      }
    }
  }

  /**
   * 通用上图
   * @param {*} layerid 图层标识
   * @param {*} points [{id,x,y,attr,img}]
   * @param {*} callBack 回调
   * @param {*} isCluster 是否聚合
   * @param {*} isShowLabel 是否显示label
   * @returns {*}
   * @api
   */
  addGraphics(layerid, points, callBack, isCluster, isShowLabel) {
    if (!layerid || layerid == null || layerid == "") {
      throw new Error("\n关键参数图层ID没有传过来呀！\nThe key parameter layer ID has not been passed!");
    }

    if (!(typeof (callBack) != "undefined" && typeof (callBack) == "function")) {
      throw new Error("\n关键回调函数没有传过来呀！\nThe key callback function has not been passed!");
    }

    var layer;
    if (isCluster) {
      //创建聚合图层
      // layer = this.createClusterLayer(layerid);
      this.clusterLayersListen[layerid] = layer;
    } else {
      //创建普通图层
      layer = this.createLayer(layerid);
      this.vectorLayersListen[layerid] = layer;
    }

    //记录回调函数
    this.callBackFuns[layerid] = callBack;

    if (points && points.length > 0) {
      var fs = [];
      for (var i in points) {
        var p = points[i];
        if (p && p.x != null && p.y != null && p.x != undefined && p.y != undefined) {
          if (!checkKeys(p.attr)) {
            continue;
          }
          var id = layerid + "_" + p.id;
          var f = new Feature({
            geometry: new Point(this.returnNumberJWD(p.x, p.y))
          });
          var imgObj = p.img;
          var imgUrl = imgObj.img;
          var size = imgObj.size;
          var imgBackColor = imgObj.imgColor;
          var imgBorderColor = imgObj.stkColor;
          var txtBackColor = imgObj.txtColor;
          var txtBorderColor = imgObj.txtStkColor;
          var offset = p.offset;
          f.setId(id);
          var lable = p.attr.BDJC || p.attr.bdjc || p.attr.RWBDMC || p.attr.rwbdmc || p.attr.MC || p.attr.mc || p.attr.rwmc;
          f.setStyle(this.imageStyle(imgUrl, size, lable, offset, imgBackColor, imgBorderColor, txtBackColor, txtBorderColor, isShowLabel));
          p.attr.jd = p.x;
          p.attr.wd = p.y;
          p.attr.layerid = layerid;//记录所属图层
          p.attr.image = imgObj;
          if (!p.attr.id) {
            p.attr.id = p.id;
          }
          f.setProperties({ "attr": p.attr, "type": "pointSource" });
          fs.push(f);
        }
      }
      if (fs && fs.length > 0) {
        this.addAdpterSource(layerid, fs);
      }
      //分层控制显示
      this.resolutionChange();
      if (isCluster) {
        //聚合图层事件监听
        // this.initAinimateClusterEvent();
      } else {
        //非聚合事件监听
        this.selectControl(layerid, layer);
      }
    }
    /**
     * 暂时未用到
     * 检查关键字是否传过来
     * (需重写逻辑)
     */
    function checkKeys(data) {
      return true;
    }

    //初始化右键菜单
    // this.rightMenu();
  }

  /**
   * 上图 要素集合
   * @param {*} layerid 
   * @param {*} fs 
   * @api
   */
  addAdpterSource(layerid, fs) {
    var source = this.getSource(layerid);
    if (source) {
      source.addFeatures(fs);
    }
  }

  /**
   * 经纬度格式化
   * @param {*} jd 
   * @param {*} wd 
   * @returns {*}
   * @api
   */
  returnNumberJWD(jd, wd) {
    return [parseFloat(jd + ""), parseFloat(wd + "")];
  }

  /**
   * 点状图片样式获取
   * @param {*} src 图片地址
   * @param {*} size 图标缩放比例
   * @param {*} lable 注记
   * @param {*} offset 注记偏移
   * @param {*} imgBackColor 图片背景颜色
   * @param {*} imgBorderColor 图片描边颜色
   * @param {*} txtBackColor 文字背景颜色
   * @param {*} txtBorderColor 文字描边颜色
   * @param {*} isShowLabel 是否显示label
   * @returns {Style}
   * @api
   */
  imageStyle(src, size, lable, offset, imgBackColor, imgBorderColor, txtBackColor, txtBorderColor, isShowLabel) {
    var imgUrl;
    imgBackColor = imgBackColor ? imgBackColor : "#fff";
    imgBorderColor ? imgBorderColor : imgBackColor;
    txtBackColor = txtBackColor ? txtBackColor : "#000000";
    txtBorderColor = txtBorderColor ? txtBorderColor : "#ffffff";
    if (!src) {
      imgUrl = "/resources/img/mark_b.png";//默认图片
      //new test
      var style = new Style({
        image: new CircleStyle({
          fill: new Fill({
            color: imgBackColor
          }),
          stroke: new Stroke({
            color: imgBorderColor,
            width: 2
          }),
          radius: 4
        }),
        text: new Text({
          font: this.font,
          offsetX: offset ? offset[0] : 0,
          offsetY: offset ? offset[1] : 25,
          scale: 1,
          textAlign: "center",
          textBaseline: "bottom",
          fill: new Fill({
            color: txtBackColor
          }),
          stroke: new Stroke({
            color: txtBorderColor,
            width: 1
          }),
          text: isShowLabel ? (lable ? lable.replace("<br />", "-") : "") :""
        })
      });
      return style;
    } else {
      imgUrl = src;
    }
    var style = new Style({
      image: new Icon({
        anchor: [0.5, 0.5],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        scale: size ? size : this.imgScale,
        opacity: 1,
        color: imgBackColor,
        src: imgUrl
      }),
      text: new Text({
        font: this.font,
        offsetX: offset ? offset[0] : 0,
        offsetY: offset ? offset[1] : 25,
        scale: 1,//this.imgScale,
        textAlign: "center",
        textBaseline: "bottom",
        fill: new Fill({
          color: txtBackColor
        }),
        stroke: new Stroke({
          color: txtBorderColor,
          width: 1
        }),
        text: isShowLabel ? (lable ? lable.replace("<br />", "-") : "") : ""
      })
    });
    return style;
  }

  /**
   * 重绘监听
   * 标号重新绘制
   * 军标级别分层显示控制
   */
  resolutionChange() {
    if (this.fckz) {
    }
  }

  /**
   * 初始化selectControl
   * @param {*} layerid 
   * @param {*} layer 
   * @returns {boolean}
   * @api
   */
  selectControl(layerid, layer) {
    //用通用事件监听
    if (layerid && layer) {
      var layerObj = { "key": layerid, "value": layer };
      if (typeof (this.allSelectControl) != "undefined") {
        this.allSelectControl(layerObj,  (f, type)=> {
          if (type === 1) {//鼠标点击
            this.selectCallBack(1,f);
          } else if (type === 2) {//鼠标移动
            //设置记录选中目标
            this.lastSelectTarget = f;
            this.selectCallBack(2,f);
          } else if (type === -1) {//鼠标点击 空
          } else if (type === -2) {//鼠标移动 空
            this.selectCallBack(-2,this.lastSelectTarget);
            this.lastSelectTarget = null;
          }
        });
      }
    }
    return false;
  }

  allSelectControl(layerObj, funCall) {
    //如果当前是绘制状态则返回
    // if (CinaGisInterfaceInner.Draw.getDrawState()) {
    //     return;
    // }
    // //添加测量状态
    // if (CinaGIS.Measure.getDrawState()) {
    //     return;
    // }
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
    var selectLayers = [];
    $.each(this._selectLayers,  (i, v)=> {
      if (v) {
        selectLayers.push(v);
      }
    });
    //鼠标点击选中事件
    this._selectSingleClick = new Select({
      condition: click,
      layers: selectLayers,
      hitTolerance: 5,
      multi: true,//允许多选
      style: null
    });
    this._selectSingleClick.on('select',  (e)=> {
      var features = e.target.getFeatures().array_;
      if (features != null && features.length > 0) {
        var f = features[0];
        var obj = (f.getProperties().attr ? f.getProperties().attr : f.getProperties().attrObj);
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
      style: null
    });
    this._selectPointerMove.on('select',  (e)=> {
      var features = e.target.getFeatures().array_;
      if (features != null && features.length > 0) {
        var f = features[0];
        var obj = (f.getProperties().attr ? f.getProperties().attr : f.getProperties().attrObj);
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
   */
  _callBackAll(type) {
    if (this._allSelectCallBack) {
      $.each(this._allSelectCallBack,  (i, v) =>{
        if (v) {
          v(null, type);
        }
      });
    }
  }

  _clearSelect() {
    //通用的select
    if (this._selectSingleClick) {
      // _selectSingleClick.featureOverlay_.getSource().clear();
      this._selectSingleClick.getFeatures().clear();
    }
  }

  /**
   * 选择回调
   * @param {*} type
   * @param {*} f 
   * @returns {*}
   * @api
   */
  selectCallBack(type,f) {
    this.clearSelect();
    var attr = f.getProperties().attr;
    //分组回调时，组内每个位置信息重新赋值 popup 防止位置信息不正常
    attr.jd = f.getGeometry().getCoordinates()[0];
    attr.wd = f.getGeometry().getCoordinates()[1];

    if (attr && attr.layerid) {
      if (this.callBackFuns[attr.layerid]) {
        this.callBackFuns[attr.layerid](type,attr,f);
        this.clearSelect();
        return;
      }
    }
    alert("此方法需要重写!")
  }

  /**
   * 清除选中
   */
  clearSelect() {
    // if (this.selectSingleClick) {
    //   this.selectSingleClick.featureOverlay_.getSource().clear();
    // }
    //通用的select
    if (this._selectSingleClick) {
      // _selectSingleClick.featureOverlay_.getSource().clear();
      this._selectSingleClick.getFeatures().clear()
    }
  }

  /**
   * 创建图层
   * @param {*} layerid 
   * @returns {VectorLayer}
   * @api
   */
  createLayer(layerid) {
    var layer = this.mkLayer[layerid];
    if (!layer) {
      layer = new VectorLayer({
        source: new VectorSource({ wrapX: false })
      });
      layer.setZIndex(9999);
      this.map_.addLayer(layer);
      this.mkLayer[layerid] = layer;
    }
    return layer;
  }

  /**
   * 根据图层ID获取图层
   * @param {*} layerid 
   * @returns {VectorSource}
   * @api
   */
  getSource(layerid) {
    // var layer = this.mkLayer[layerid];
    // if (layer instanceof ol.layer.AnimatedCluster) {
    //   return layer.getSource().getSource();
    // } else if (layer instanceof VectorLayer) {
    //   return layer.getSource();
    // }
    // return null;
    var layer = this.mkLayer[layerid];
    if (layer instanceof VectorLayer) {
      return layer.getSource();
    }
    return null;
  }

  /**
   * 鼠标移入tip显示f
   * @param {*} f 
   * @api
   */
  mousePointerPopup(f) {
    var key = "mousePointerPopup";
    if (f) {
      var kzmc = f.getProperties().attr.bdfh ? f.getProperties().attr.bdfh : f.getProperties().attr.mc;
      kzmc = kzmc ? kzmc : f.getProperties().attr.MC;
      kzmc = kzmc ? kzmc : f.getProperties().attr.rwmc;
      var mc = kzmc ? kzmc : "显示部队番号";
      var tipDiv = document.createElement("div");
      tipDiv.innerHTML = "<div class='fl'>" + mc + "</div>";
      this.removeP(key);
      var marker = new Overlay({
        id: key,
        position: f.getGeometry().getCoordinates(),
        positioning: 'center-center',
        element: this.eleFun3(key, $(tipDiv).html(), 0, 80),
        stopEvent: this._stopEvent,
        offset: [0, -50]
      });
      this.map_.addOverlay(marker);
      $(marker.getElement()).css({ "position": "relative" });
    } else {
      this.removeP(key)
    }
  }

  removeP(key){
    var overlay = this.map_.getOverlayById(key);
    if (overlay) {
      this.map_.removeOverlay(overlay);
    }
  }
  /**
   * 弹弹弹
   * @param {*} kzAttr 无需自己定义直接扔过来
   * @param {*} eleFun 必须 （和pageUrl2选1） 获取弹框内容函数
   * @param {*} pageUrl 必须 (和eleFun2选1) 详情页地址
   * @param {*} title 标题
   * @param {*} w 窗体宽度
   * @param {*} h 窗体高度
   * @param {*} offset [x,y] 偏移
   * @returns {*}
   * @api
   */
  showPopup(kzAttr, eleFun, pageUrl, title, w, h, offset) {
    var jd = kzAttr.jd;
    var wd = kzAttr.wd;
    var id = kzAttr.layerid + "_" + kzAttr.id;
    //zxf 后期恢复
    //			var isAlreadyPopup = this.isAlreadyPopup(id);
    //			if (isAlreadyPopup) {
    //				return;
    //			}
    this.removePopup(id);

    var xqTypeObj = {};
    if (!eleFun && !pageUrl) {
      alert("至少提供一种方式显示详情");
      return;
    }
    if (pageUrl) {
      xqTypeObj.value = pageUrl;
      xqTypeObj.type = "url";
    } else {
      xqTypeObj.value = eleFun;
      xqTypeObj.type = "ele";
    }
    var marker = new Overlay({
      id: id,
      position: [jd, wd],
      positioning: 'center-center',
      element: this.eleFun(id, [jd, wd], xqTypeObj, w, h, title),
      stopEvent: this._stopEvent,
      offset: offset ? offset : [10,10]
    });
    this.map_.addOverlay(marker);
    //避免窗口被遮挡
    // _animateFitPopup(marker, w, h);
    //table style add
    // this.setTableStyle();
    //记录弹框数目
    this.popupNum++;
  }

  /**
   * 弹框内容生成
   * @param {*} id 
   * @param {*} coordinate 
   * @param {*} xqTypeObj 
   * @param {*} w 
   * @param {*} h 
   * @param {*} title 
   * @returns {HTMLDivElement}
   * @api
   */
  eleFun(id, coordinate, xqTypeObj, w, h, title) {
    w = w ? w : 500;
    h = h ? h : 0;
    var titleMC = title ? title : "详情";
    var tipDiv = document.createElement("div");
    tipDiv.style.position = "absolute";
    tipDiv.style.zIndex = (999 + this.popupNum).toString();
    //tipDiv.style.backgroundColor = "rgba(242, 244, 241, 1)";
    tipDiv.style.opacity = "1";
    tipDiv.style.display = "block";
    // tipDiv.style.width = 470 + "px";
    tipDiv.style.width = w + "px";
    tipDiv.style.height = h + "px";
    // tipDiv.style.border = "2px solid #259de3";
    $(tipDiv).css({
      "border-bottom-left-radius": "5px",
      "border-bottom-right-radius": "5px"
    });

    var tipDivTitle = document.createElement("div");
    // tipDivTitle.style.position = "absolute";
    // tipDivTitle.style.top = "-32px";
    // tipDivTitle.style.left = "-2px";
    //tipDivTitle.style.zIndex = 999;
    tipDivTitle.style.opacity = "1";
    tipDivTitle.style.display = "block";
    tipDivTitle.style.width = "100%";
    tipDivTitle.style.height = "30px";
    tipDivTitle.style.lineHeight = "30px";
    tipDivTitle.style.textIndent = "10px";
    tipDivTitle.style.backgroundColor = "#217F9B";
    tipDivTitle.style.border = "2px solid #259de3";
    tipDivTitle.style.color = "#fff";
    tipDivTitle.style.fontSize = "14px";
    $(tipDivTitle).css({
      "border-top-left-radius": "5px",
      "border-top-right-radius": "5px"
    });
    var titleDiv = '<div><span style="vertical-align:middle">' + titleMC + '</span>' +
      '<a style="font-size:34px;cursor:pointer;float:right;color: white" onClick=removePopup("' + id + '")>×</a></div>';

    tipDivTitle.innerHTML = titleDiv;

    if (xqTypeObj.type === "url") {//url iframe方式
      tipDiv.innerHTML = "<iframe id=" + id + " name=" + id + " src=" + xqTypeObj.value + " style='height:100%;width:100%;'></iframe>"
    } else {//插入 element 方式
      tipDiv.innerHTML = "<div id='tablePopup' style='text-align:center;padding-top:10px;background: rgba(3,89,107,0.90);color: #fff;border-radius: 0 0 3px 3px;'>" + xqTypeObj.value().replace("undefined", "") + "<div>";
    }

    $(tipDiv).prepend(tipDivTitle);
    //格式化easyui 防止不生效
    // $.parser.parse($(tipDiv));
    //注意 以后要修改逻辑20200703
    if ($(tipDiv).find("#bd_start").length > 0) {
      var tm = new Date();
      var tm_s = tm.getFullYear() + "-" + (tm.getMonth() < 9 ? "0" + (tm.getMonth() + 1) : (tm.getMonth() + 1)) + "-" + (tm.getDate() < 10 ? "0" + tm.getDate() : tm.getDate()) + " "
        + "00:00:00";
      var tm_e = tm.getFullYear() + "-" + (tm.getMonth() < 9 ? "0" + (tm.getMonth() + 1) : (tm.getMonth() + 1)) + "-" + (tm.getDate() < 10 ? "0" + tm.getDate() : tm.getDate()) + " "
        + (tm.getHours() < 10 ? "0" + tm.getHours() : tm.getHours()) + ":" + (tm.getMinutes() < 10 ? "0" + tm.getMinutes() : tm.getMinutes())
        + ":" + (tm.getSeconds() < 10 ? "0" + tm.getSeconds() : tm.getSeconds());
      $(tipDiv).find("#bd_start").datetimebox("setValue", tm_s);
      $(tipDiv).find("#bd_end").datetimebox("setValue", tm_e)
    }
    return tipDiv;
  }

  /**
   * 弹框内容生成
   * @param {*} id 
   * @param {*} html 
   * @param {*} w 
   * @param {*} h 
   * @param {*} title 
   * @returns {HTMLDivElement}
   * @api
   */
  eleFun3(id, html, w, h, title) {
    w = w ? w : 500;
    h = h ? h : 500;
    var tipDiv = document.createElement("div");
    tipDiv.style.position = "absolute";
    tipDiv.style.opacity = "1";
    tipDiv.style.display = "block";
    tipDiv.style.width = 'auto';
    tipDiv.style.zIndex = "100";
    //tipDiv.style.border = "2px solid #259de3";
    var html_ =
      "    <div class='fl'  style=\"padding:4px 8px;border:1px solid rgba(19, 144, 250, .8);background:rgba(1, 12, 22, .9);box-shadow: 0 0 10px #008bff inset;color:#ffffff;\">"
      + html +
      "    </div>";
    tipDiv.innerHTML = html_;
    return tipDiv;
  }

  /**
   * 显示隐藏POPUP
   * @param {*} layerId 
   * @param {*} isShow 
   * @api
   */
  showOrHidePopup(layerId, isShow) {
    var popups = this.map_.getOverlays().array_;
    if (popups.length > 0) {
      for (var i in popups) {
        var p = popups[i];
        var id = p.getId();
        if (id.indexOf(layerId + "_") != -1) {
          if (isShow) {
            $(p.getElement()).show();
          } else {
            $(p.getElement()).hide();
          }
        }
      }
    }
  }

  /**
   * 显示隐藏POPUP(根据唯一ID)
   * @param {*} id 
   * @param {*} isShow 
   * @api
   */
  showOrHidePopupID(id, isShow) {
    var overLay = this.map_.getOverlayById(id);
    if (overLay) {
      if (isShow) {
        $(overLay.getElement()).show();
      } else {
        $(overLay.getElement()).hide();
      }
    }
  }

  /**
   * 清除popu弹框
   * @param {*} id 
   * @api
   */
  removePopup(id) {
    if (id) {
      var popup = this.map_.getOverlayById(id);
      if (popup) {
        this.map_.removeOverlay(popup);
        //记录弹框数目
        this.popupNum--;
      }
    }
  }

  /**
   * 清除popu弹框
   * 如果id不传则移除所有POPUP
   * 否则只移除一个（匹配）
   * @param {*} layerid 
   * @param {*} id 
   * @api
   */
  removePopups(layerid, id) {
    if (id) {
      var popup = this.map_.getOverlayById(id);
      if (popup) {
        this.map_.removeOverlay(popup);
        //记录弹框数目
        this.popupNum--;
      }
    } else {
      var popups = this.map_.getOverlays().array_;
      if (popups.length > 0) {
        for (var i = popups.length - 1; i >= 0; i--) {
          var popup = popups[i];
          if (popup) {
            var key = popup.getId();
            if (key && key.indexOf(layerid) != -1) {
              this.map_.removeOverlay(popup);
              //记录弹框数目
              this.popupNum--;
            }
          }
        }
      }
    }
  }

  /**
   * 清除所有
   */
  clearAll() {
    var layers = this.mkLayer;
    $.each(layers,  (i, layers)=> {
      this.removeGraphic(i);
    })
  }

  /**
   * 清除所有
   * 如果id不传则移除整个图层
   * 否则只移除一个（匹配）
   * @param {*} layerid 
   * @param {*} id 
   * @api
   */
  removeGraphic(layerid, id) {
    var source = this.getSource(layerid);
    if (source) {
      if (id) {
        var f = source.getFeatureById(layerid + "_" + id);
        if (f) {
          source.removeFeature(f);
          this.removePopup(layerid + "_" + id);
        }
      } else {
        source.clear();
        this.removePopups(layerid);
      }
    }
  }

  /**
   * 清除popu弹框
   * @param {*} id 
   * @returns {boolean}
   * @api
   */
  isAlreadyPopup(id) {
    if (id) {
      var popup = this.map_.getOverlayById(id);
      if (popup) {
        return true;
      }
    }
    return false;
  }

  /**
   * 定位
   * @param {*} jd 
   * @param {*} wd 
   * @param {*} zoom 
   * @api
   */
  dw(jd, wd, zoom) {
    if (zoom == undefined || zoom == null || zoom <= 0) {
      zoom = 21;
    }
    if (jd && wd) {
      var extent = [jd, wd, jd, wd];
      this.map_.getView().fit(extent, {
        size: this.map_.getSize(),
        maxZoom: zoom,
        duration: 1000
      })
    }
  }

  /**
   * 定位居中
   * @param {*} feature 
   * @api
   */
  dw2(feature) {
    if (feature) {
      var extent = feature.getGeometry().getExtent();
      this.map_.getView().fit(extent, {
        size: this.map_.getSize(),
        maxZoom: this.map_.getView().getZoom() > 7 ? this.map_.getView().getZoom() : 7,
        /*maxZoom:CinaGIS.MapObje ct.getView().getZoom(),*/
        duration: 1000
      })
    }
  }

  /**
   * 定位图层
   * @param {*} layerid 
   * @param {*} zoom 
   * @param {*} padding 
   * @api
   */
  dw3(layerid, zoom, padding) {
    if (layerid) {
      var layer = this.mkLayer[layerid];
      if (layer.getSource().getFeatures().length > 0) {
        var extent = layer.getSource().getExtent();
        // this.testtest(extent);
        // if(this.isPlanExtent){
        // 	extent = this.rePlanExtent(extent);
        // }
        this.map_.getView().fit(extent, {
          size: this.map_.getSize(),
          padding: padding ? padding : [166, 0, 0, 620],// top, right, bottom and left
          maxZoom: zoom ? zoom : 7,
          duration: 1000
        })
      }
    }
  }

  /**
   * 定位图层
   * @param {*} layerid 
   * @param {*} zoom 
   * @api
   */
  dw3Copy(layerid, zoom) {
    if (layerid) {
      var layer = this.mkLayer[layerid];
      if (layer.getSource().getFeatures().length > 0) {
        var extent = layer.getSource().getExtent();
        this.map_.getView().fit(extent, {
          size: this.map_.getSize(),
          maxZoom: zoom ? zoom : 7,
          duration: 1000
        })
      }
    }
  }

  /**
   * 定位图层
   * @param {*} layerid 
   * @param {*} id 
   * @param {*} zoom 
   * @api 
   */
  dw5(layerid, id, zoom) {
    var source = this.getSource(layerid);
    if (source) {
      var key = layerid + "_" + id;
      var feature = source.getFeatureById(key);
      if (feature) {
        var extent = feature.getGeometry().getExtent();
        this.map_.getView().fit(extent, {
          size: this.map_.getSize(),
          padding: [166, 0, 0, 620],// top, right, bottom and left
          maxZoom: zoom ? zoom : 7,
          duration: 1000
        });
      }
    }
  }

  /**
   * 定位图层
   * @param {*} layerid 
   * @param {*} id 
   * @param {*} zoom
   * @api 
   */
  dw6(layerid, id, zoom) {
    var source = this.getSource(layerid);
    if (source) {
      var key = layerid + "_" + id;
      var feature = source.getFeatureById(key);
      if (feature) {
        var extent = feature.getGeometry().getExtent();
        // @ts-ignore
        this.flash(feature.getGeometry().getCoordinates());
        this.map_.getView().fit(extent, {
          size: this.map_.getSize(),
          maxZoom: zoom ? zoom : 7,
          duration: 1000
        });
      }
    }
  }

  /**
   * 点位动画
   * @param {*} position 
   * @param {*} size 
   * @api
   */
  flash(position, size) {
    if (this.flash_interval) {
      window.clearInterval(this.flash_interval);
    }
    if (this.flash_overlay) {
      this.map_.removeOverlay(this.flash_overlay);
      this.flash_overlay = null;
    }
    // var flash_div = document.getElementById('css_animation');
    var flash_div = document.createElement('div');
    flash_div.className = 'css_animation';
    flash_div.style.display = 'block';
    this.flash_overlay = new Overlay({
      element: flash_div,
      positioning: 'center-center'
    });
    this.map_.addOverlay(this.flash_overlay);
    this.flash_overlay.setPosition(position);

    var flashNum = 0;
    this.flash_interval = window.setInterval( ()=> {
      if (flashNum >= 40) {
        window.clearInterval(this.flash_interval);
        if (this.flash_overlay) {
          this.flash_overlay.setPosition(undefined);
        }
      }
      flashNum++;
    }, 200);
  }
}

export default TSBS;