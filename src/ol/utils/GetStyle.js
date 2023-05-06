/**
 * @module ol/utils/GetStyle
 */

import { Circle as CircleStyle, Fill, Stroke, Style, Icon, Text } from '../style.js'

/**
   * 图形样式选项
   * @typedef {Object} StyleOptions
   * @property {string | undefined} img 点图标路径
   * @property {Number} imgScale 点图标比例
   * @property {Array} size 点图标尺寸
   * @property {Array.<number>} anchor (默认 [0.5, 0.5]) 
   * @property {Array.<number>} offset 点图标偏移  (默认 [0, 0])
   * @property {string} fill 面填充颜色 'rgba(0,0,0,0.5) | rgb(0,0,0) | #fff'
   * @property {string} stroke 线颜色 'rgba(0,0,0,0.5) | rgb(0,0,0) | #fff'
   * @property {number} width 线宽度 1
   * @property {string | undefined} text label文字内容
   * @property {string | undefined} font 字体大小及样式 默认'10px sans-serif'
   * @property {number | undefined} textScale label 比例
   * @property {number} textOffsetX label x偏移
   * @property {number} textOffsetY label y偏移
   * @property {string} textFill label文字填充颜色
   * @property {string} textStroke label文字描边颜色
   * @property {number} textWidth label文字描边宽度
   */

export const DEFAULT_STYLE = new Style({
  image: new CircleStyle({
    fill: new Fill({
      color: 'rgba(253, 120, 26,0.4)',
    }),
    stroke: new Stroke({
      color: 'red',
      width: 1.25,
    }),
    radius: 5,
  }),
  fill: new Fill({
    color: 'rgba(253, 120, 26,0.4)',
  }),
  stroke: new Stroke({
    color: 'green',
    width: 2,
  })
});

export const DRAW_STYLE = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.2)',
  }),
  stroke: new Stroke({
    color: 'rgba(0, 0, 0, 0.5)',
    lineDash: [10, 10],
    width: 2,
  }),
  image: new CircleStyle({
    radius: 5,
    stroke: new Stroke({
      color: 'rgba(0, 0, 0, 0.7)',
      width: 1
    }),
    fill: new Fill({
      color: 'rgba(255, 255, 255, 0.2)',
    }),
  }),
});

export const RESULT_STYLE = new Style({
  fill: new Fill({
    color: 'rgba(255, 255, 255, 0.5)',
  }),
  stroke: new Stroke({
    color: '#ffcc33',
    width: 2,
  }),
  image: new CircleStyle({
    radius: 5,
    fill: new Fill({
      color: '#ffcc33',
    }),
  }),
});

export const LAYER_STYLE = new Style({
  fill: new Fill({
    color: 'rgba(255, 0, 0, 0.2)',
  }),
  stroke: new Stroke({
    color: 'red',
    width: 2,
  }),
  image: new CircleStyle({
    radius: 7,
    fill: new Fill({
      color: '#ffcc33',
    }),
  }),
});

/**
 * 点样式
 * @param {StyleOptions} options 
 * @returns {Style}
 * @api
 */
export function pointStyle(options) {
  return new Style({
    image: new Icon({
      src: options.img ? options.img : 'resources/img/2bj.png',
      scale: options.imgScale ? options.imgScale : 1,
      anchor: options.anchor ? options.anchor : [0.5, 0.5],
      size: options.size,
      offset: options.offset ? options.offset : [0, 0]
    }),
    text: options.text ? new Text({
      font: options.font ? options.font : '10px sans-serif',
      text: options.text,
      scale: options.textScale,
      offsetX: options.textOffsetX ? options.textOffsetX : 0,
      offsetY: options.textOffsetY ? options.textOffsetY : 0,
      fill: new Fill({
        color: options.textFill ? options.textFill : 'black',
      }),
      stroke: new Stroke({
        color: options.textStroke ? options.textStroke : 'white',
        width: options.textWidth ? options.textWidth : 1,
      })
    }) : null
  })
}

/**
 * 通用样式（线、面）
 * @param {StyleOptions} options 
 * @returns {Style}
 * @api
 */
export function commonStyle(options) {
  return new Style({
    fill: new Fill({
      color: options.fill ? options.fill : 'rgba(255, 0, 0, 0.2)',
    }),
    stroke: new Stroke({
      color: options.stroke ? options.stroke : 'rgba(255, 255, 255, 0.2)',
      width: options.width ? options.width : 1,
    }),
    text: options.text ? new Text({
      font: options.font ? options.font : '10px sans-serif',
      text: options.text,
      scale: options.textScale,
      offsetX: options.textOffsetX ? options.textOffsetX : 0,
      offsetY: options.textOffsetY ? options.textOffsetY : 0,
      fill: new Fill({
        color: options.textFill ? options.textFill : 'black',
      }),
      stroke: new Stroke({
        color: options.textStroke ? options.textStroke : 'white',
        width: options.textWidth ? options.textWidth : 2,
      })
    }) : null
  })
}
