/**
 * @module ol/utils/MouseDraw
 */
import { createBox } from '../interaction/Draw.js'
import { Draw } from '../interaction.js'
import { getArea, getLength } from '../sphere.js'
import { Point, LineString, Polygon, Circle } from '../geom.js'
import { unByKey } from '../Observable.js'

import { DRAW_STYLE, RESULT_STYLE } from './GetStyle.js'

/**
 * @classdesc
 * 鼠标绘制
 *
 * @api
 */
class MouseDraw {

  static graphId = 0;
  /**
   * 
   * @param {*} map 
   */
  constructor(map) {
    this.map_ = map;
    this.layerManage_ = map.utils.LayerManage;
    this.draw_ = null;
    this.sketch_ = null;
  }

  formatLength = function (line, formatType) {
    var sourceproj = this.map_.getView().getProjection()
    let length;
    if (formatType == 1) {
      length = getLength(line, {
        projection: sourceproj,
      })
    }
    if (formatType == 2) {
      length = line.getLength() * 100000
    }
    let output;
    if (length > 1000) {
      output = Math.round((length / 1000) * 100) / 100 + ' ' + 'km'
    } else {
      output = Math.round(length * 100) / 100 + ' ' + 'm'
    }
    return output;
  }
  formatArea (polygon, formatType) {
    let sourceproj = this.map_.getView().getProjection()
    let area;
    if (formatType == 1) {
      area = getArea(polygon, {
        projection: sourceproj,
      })
    }
    if (formatType == 2) {
      area = polygon.getArea() * 10000000000
    }
    let output;
    if (area > 10000) {
      output = Math.round((area / 1000000) * 100) / 100 + ' ' + 'km²'
    } else {
      output = Math.round(area * 100) / 100 + ' ' + 'm²'
    }
    return output;
  }

  formatCircle (circle) {
    const area = Math.PI * Math.pow(circle.getRadius(), 2);
    let output = Math.round(area * 10000000000);
    return output > 1000000 ? (Math.round(area * 10000000000) / 1000000).toFixed(2) + ' km²' : Math.round(area * 10000000000) + ' m²';
  }

  /**
   * 绘制图形
   * @param {string} drawType 绘制类型 None|Point|LineString|Polygon|Circle|Rectangle|FreePolygon
   * @param {string} formatType 1--球面面积 2--平面面积
   * @param {boolean} clearLast 是否清除上一次绘制结果（注：清除图层全部绘制图形）
   * @returns {Promise} resolve({id,feature,output,coord}，其中id为feature的唯一标识，output是绘制图形的长度或面积，coord为图形中心坐标或线段终点坐标)
   * @api
   */
  drawGraph(drawType, formatType, clearLast) {
    return new Promise((resolve, reject) => {
      if (this.draw_ != null) this.map_.removeInteraction(this.draw_);
      let layer = this.layerManage_.getLayer("MouseDraw_layer");
      if (layer == undefined) {
        layer = this.layerManage_.addLayer("MouseDraw_layer");
      }
      layer.setStyle(RESULT_STYLE);
      clearLast ? layer.getSource().clear() : "";
      let fmType = formatType ? formatType : 2;
      let drawResult = {}
      if (drawType === "Point" || drawType === "LineString" || drawType === "Polygon" || drawType === "Circle") {
        this.draw_ = new Draw({
          source: layer.getSource(),
          type: drawType,
          style: DRAW_STYLE
        });
      }
      else if (drawType === "Rectangle") {
        this.draw_ = new Draw({
          source: layer.getSource(),
          type: "Circle",
          geometryFunction: createBox(),
          style: DRAW_STYLE
        });
      }
      else if (drawType === "FreePolygon") {
        this.draw_ = new Draw({
          source: layer.getSource(),
          type: "Polygon",
          freehand: true,
          style: DRAW_STYLE
        });
      }else if(drawType === "None"){
        layer.getSource().clear();
        // resolve("clear");
        return;
      }
      else {
        reject('Wrong draw type!');
      }
      this.map_.addInteraction(this.draw_);
      let listener;
      this.draw_.setActive(true);
      this.draw_.on('drawstart', evt => {
        this.sketch_ = evt.feature;
        listener = this.sketch_.getGeometry().on('change', evt => {
          const geom = evt.target;
          if (geom instanceof Polygon) {
            drawResult.output = this.formatArea(geom, fmType);
            drawResult.coord = geom.getInteriorPoint().getCoordinates();
          } else if (geom instanceof LineString) {
            drawResult.output = this.formatLength(geom, fmType);
            drawResult.coord = geom.getLastCoordinate();
          } else if (geom instanceof Circle) {
            drawResult.output = this.formatCircle(geom);
            drawResult.coord = geom.getCenter();
          } else if (geom instanceof Point) {
            drawResult;
          }

        })
      })
      this.draw_.on('drawend', evt => {
        let id = MouseDraw.graphId;
        evt.feature.setId(`draw_${id.toString()}`);
        MouseDraw.graphId++;
        drawResult.feature = evt.feature;
        drawResult.id = `draw_${id.toString()}`
        this.draw_.setActive(false);
        this.map_.removeInteraction(this.draw_);
        this.sketch_ = null;
        unByKey(listener);
        resolve(drawResult);
      })

    })
  }
}

export default MouseDraw


