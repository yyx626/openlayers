/**
 * @module ol/utils/MouseDraw
 */
import { createBox } from '../interaction/Draw.js'
import { Draw } from '../interaction.js'
import { getArea, getLength } from '../sphere.js'
import { Point, LineString, Polygon, Circle } from '../geom.js'
import { unByKey } from '../Observable.js'

import LayerManage from './LayerManage.js'
import { DRAW_STYLE, RESULT_STYLE } from './GetStyle.js'

const formatLength = function (line) {
  const length = getLength(line);
  let output = Math.round(length * 100000);
  return output > 1000 ? (Math.round(length * 100000) / 1000).toFixed(2) + ' km' : Math.round(length * 100000) + ' m';
}

const formatArea = function (polygon) {
  const area = getArea(polygon);
  let output = Math.round(area * 10000000000);
  return output > 1000000 ? (Math.round(area * 10000000000) / 1000000).toFixed(2) + ' km²' : Math.round(area * 10000000000) + ' m²';
}

const formatCircle = function (circle) {
  const area = Math.PI * circle.getRadius() * circle.getRadius();
  let output = Math.round(area * 10000000000);
  return output > 1000000 ? (Math.round(area * 10000000000) / 1000000).toFixed(2) + ' km²' : Math.round(area * 10000000000) + ' m²';
}


let draw, sketch;

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
    this.layerManage_ = new LayerManage(this.map_);
  }

  /**
   * 绘制图形
   * @param {string} layerId 图层ID(唯一标识)
   * @param {string} drawType 绘制类型 Point|LineString|Polygon|Circle|Rectangle|Qumian
   * @param {boolean} clearLast 是否清除上一次绘制结果（注：清除图层全部绘制图形）
   * @returns {Promise} resolve({id,feature,output,coord}，其中id为feature的唯一标识，output是绘制图形的长度或面积，coord为图形中心坐标或线段终点坐标)
   * @api
   */
  drawGraph(layerId, drawType, clearLast) {
    return new Promise((resolve, reject) => {
      if (draw != null) this.map_.removeInteraction(draw);
      let layer = this.layerManage_.getLayer(layerId);
      if (layer == undefined) {
        layer = this.layerManage_.addLayer(layerId);
      }
      layer.setStyle(RESULT_STYLE);
      clearLast ? layer.getSource().clear() : "";
      let drawResult = {}
      if (drawType === "Point" || drawType === "LineString" || drawType === "Polygon" || drawType === "Circle") {
        draw = new Draw({
          source: layer.getSource(),
          type: drawType,
          style: DRAW_STYLE
        });
        this.map_.addInteraction(draw);
      }
      else if (drawType === "Rectangle") {
        draw = new Draw({
          source: layer.getSource(),
          type: "Circle",
          geometryFunction: createBox(),
          style: DRAW_STYLE
        });
        this.map_.addInteraction(draw);
      }
      else if (drawType === "Qumian") {
        draw = new Draw({
          source: layer.getSource(),
          type: "Polygon",
          freehand: true,
          style: DRAW_STYLE
        });
        this.map_.addInteraction(draw);
      }
      else {
        reject('Wrong draw type!');
      }
      let listener;
      draw.setActive(true);
      draw.on('drawstart', evt => {
        sketch = evt.feature;
        listener = sketch.getGeometry().on('change', evt => {
          const geom = evt.target;
          if (geom instanceof Polygon) {
            drawResult.output = formatArea(geom);
            drawResult.coord = geom.getInteriorPoint().getCoordinates();
          } else if (geom instanceof LineString) {
            drawResult.output = formatLength(geom);
            drawResult.coord = geom.getLastCoordinate();
          } else if (geom instanceof Circle) {
            drawResult.output = formatCircle(geom);
            drawResult.coord = geom.getCenter();
          } else if (geom instanceof Point) {
            drawResult;
          }

        })
      })
      draw.on('drawend', evt => {
        let id = MouseDraw.graphId;
        evt.feature.setId(`draw_${id.toString()}`);
        MouseDraw.graphId++;
        drawResult.feature = evt.feature;
        drawResult.id = `draw_${id.toString()}`
        draw.setActive(false);
        this.map_.removeInteraction(draw);
        sketch = null;
        unByKey(listener);
        resolve(drawResult);
      })

    })
  }
}

export default MouseDraw


