/**
 * @module ol/utils/BufferDraw
 */
import GeoJSON from '../format/GeoJSON.js'
import { fromCircle } from '../geom/Polygon.js'
import * as turf from '@turf/turf'

/**
 * @classdesc
 * 缓冲区绘制
 *
 * @api
 */
class BufferDraw {
  /**
   * 
   * @param {*} map 
   */
  constructor(map) {
    this.map_ = map;
    this.layerManage_ = map.utils.LayerManage;
  }

  /**
   * 点缓冲
   * @param {string} layerId 图层Id
   * @param {*} info Array|Geometry
   * @param {*} distance 缓冲距离 km
   * @param {*} clearLast 是否清除上一次绘制结果
   * @returns {Promise} resolve(Geometry)
   * @api
   */
  point(layerId, info, distance, clearLast) {
    return new Promise((resolve, reject) => {
      let layer = this.layerManage_.getLayer(layerId);
      if (layer == undefined) {
        layer = this.layerManage_.addLayer(layerId);
      }
      clearLast ? layer.getSource().clear() : "";
      let point, buffered;
      switch (info.constructor.name) {
        case 'Array':
          point = turf.point(info);
          break;
        case 'Point':
          point = turf.point(info.getCoordinates());
          break;
        default: reject('请传入正确的参数类型: Array|Point');
          break;
      }
      buffered = turf.buffer(point, distance, { units: 'kilometers' });
      //创建数据geojson对象和数据源对象
      let format = new GeoJSON();
      //读取geojson数据
      let a = format.readFeature(point);
      let b = format.readFeature(buffered);
      layer.getSource().addFeature(b);
      resolve(b.getGeometry());
    });

  }

  /**
   * 线缓冲
   * @param {string} layerId 图层Id
   * @param {*} info array|geometry
   * @param {string} type around|right|left|side
   * @param {number} distance 缓冲距离 km
   * @param {*} clearLast 是否清除上一次绘制结果
   * @returns {Promise} resolve(Geometry)
   * @api
   */
  lineString(layerId, info, type, distance, clearLast) {
    return new Promise((resolve, reject) => {
      let layer = this.layerManage_.getLayer(layerId);
      if (layer == undefined) {
        layer = this.layerManage_.addLayer(layerId);
      }
      clearLast ? layer.getSource().clear() : "";
      //创建缓冲数据
      let gsonline;
      switch (info.constructor.name) {
        case 'Array':
          gsonline = turf.lineString(info);
          break;
        case 'LineString':
          gsonline = turf.lineString(info.getCoordinates());
          break;
        default: reject('请传入正确的参数类型: Array|lineString');
          break;
      }
      //读取geojson数据
      let a = new GeoJSON().readFeature(gsonline);
      layer.getSource().addFeature(a);

      const endindex = gsonline.geometry.coordinates.length - 1;
      // 线的起点的左边
      let lsl = turf.transformRotate(gsonline, -90, {
        pivot: gsonline.geometry.coordinates[0]
      });
      const flsl = (new GeoJSON()).readFeature(lsl)
      // 线的起点的右边
      let lsr = turf.transformRotate(gsonline, 90, { //左
        pivot: gsonline.geometry.coordinates[0]
      });
      const flsr = (new GeoJSON()).readFeature(lsr)
      // 线的终点的左边
      let lel = turf.transformRotate(gsonline, 90, { //左
        pivot: gsonline.geometry.coordinates[endindex]
      });
      const flel = (new GeoJSON()).readFeature(lel)
      // 线的终点的右边
      let ler = turf.transformRotate(gsonline, -90, {
        pivot: gsonline.geometry.coordinates[endindex]
      });
      const fler = (new GeoJSON()).readFeature(ler)
      // 原始缓冲结果图形
      let buffered = turf.buffer(gsonline, distance, { units: 'kilometers' });
      // 原始圆头buffer
      const fbuffered = new GeoJSON().readFeature(buffered);
      // 构建buffer为点featureCollection
      let bufferedtoline = turf.polygonToLine(buffered);
      let pointsarr = [];
      // @ts-ignore
      bufferedtoline.geometry.coordinates.forEach((coord) => {
        const point = turf.point(coord);
        pointsarr.push(point)
      });
      let points = turf.featureCollection(pointsarr);
      // 遍历找出4个点(垂线与buffer相交的点)
      const four_gline = [lsl, lel, lsr, ler]; //lel, lsr肯定是在一侧的
      let intersectpointarr = [];
      four_gline.forEach((i) => {
        let intersects = turf.lineIntersect(i, buffered);
        const intersectpoint = intersects.features[0];
        intersectpointarr.push(intersectpoint);
      });

      let four_index = [];
      let intersectNearestOnBufferPointCoordArr = []; //前两个是在一侧的
      intersectpointarr.forEach((i) => {
        // @ts-ignore
        let nearest = turf.nearestPoint(i, points);
        intersectNearestOnBufferPointCoordArr.push(nearest.geometry.coordinates);
        const feaindex = nearest.properties.featureIndex;
        four_index.push(feaindex);
        // console.log(nearest.geometry.coordinates)
        const fi = (new GeoJSON()).readFeature(i);
        // @ts-ignore
        fi.feaindex = feaindex;
      })

      const issideobj1 = {};
      issideobj1[four_index[0]] = true;
      issideobj1[four_index[1]] = true;
      issideobj1[four_index[2]] = false;
      issideobj1[four_index[3]] = false;
      console.log('圆头时四个顶点的index');
      four_index.sort((a, b) => {
        return a - b
      });
      console.log(four_index); //[0, 25, 41, 57]
      if (four_index[0] === 0) {
        four_index.splice(0, 1, pointsarr.length - 1)
        four_index.sort((a, b) => {
          return a - b
        });
      }
      // 判断特殊 | 正常
      const bufferedcoordarry = buffered.geometry.coordinates[0];
      if (issideobj1[four_index[0]] && issideobj1[four_index[1]]) {
        const splicetoplen = four_index[2] - four_index[1] - 1;
        const splicebtmlen = four_index[0] + bufferedcoordarry.length - four_index[3];
        // console.log('切掉上圆头');
        bufferedcoordarry.splice(four_index[1] + 1, splicetoplen);

        // 确定下圆头从哪开始切
        // console.log('切掉下圆头');
        bufferedcoordarry.splice(four_index[3] - splicetoplen + 1);
        bufferedcoordarry.splice(0, four_index[0]);
        // source.addFeature((new ol.format.GeoJSON()).readFeature(buffered))
      } else {
        const splicetoplen = four_index[1] - four_index[0] - 1;
        const splicebtmlen = four_index[3] - four_index[2] - 1;
        // console.log('切掉上圆头');
        bufferedcoordarry.splice(four_index[0] + 1, splicetoplen);

        // 确定下圆头从哪开始切
        let start = four_index[2] + 1;
        if (four_index[0] > four_index[2]) {
          start = four_index[2] + 1;
        } else {
          start = Math.abs(four_index[2] + 1 - splicetoplen);
        }
        // console.log('切掉下圆头');
        bufferedcoordarry.splice(start, splicebtmlen);
        // source.addFeature((new ol.format.GeoJSON()).readFeature(buffered))
      }
      // 得到平头buffer
      const fbuffered2 = (new GeoJSON()).readFeature(buffered);

      /*截取左线
      右线--此时bufferedcoordarry是平头的了-------------------------------------------------------------------------------------*/
      // 平头之后 buffer上四个距离交点最近的点的index发生了变化
      let newIndexarr = []; //前两个是在一侧的
      intersectNearestOnBufferPointCoordArr.forEach(intersectpointcoord => {
        const index = bufferedcoordarry.findIndex((bufferedcoord) => {
          return (bufferedcoord[0] === intersectpointcoord[0] &&
            bufferedcoord[1] === intersectpointcoord[1])
        })
        newIndexarr.push(index);
      });
      intersectNearestOnBufferPointCoordArr.forEach((intersectpointcoord, index) => {
        const point = turf.point(intersectpointcoord);
        const fpoint = (new GeoJSON()).readFeature(point);
        // @ts-ignore
        fpoint.feaindex = newIndexarr[index];
        // 黑色的点是buffer上四个距离交点最近的点
      })

      /*
      0: 78
      1: 79
      2: 437
      3: 438 */
      //排序前先标记在一侧的
      const issideobj2 = {};
      issideobj2[newIndexarr[0]] = true;
      issideobj2[newIndexarr[1]] = true;
      issideobj2[newIndexarr[2]] = false;
      issideobj2[newIndexarr[3]] = false;
      /* 27: true
      28: false
      55: true
      56: false */
      console.log('平头时四个顶点的index');
      console.log(newIndexarr);
      newIndexarr.sort((a, b) => {
        return a - b
      }); //a>b 即return true, 就交互ab位置
      if (newIndexarr[0] === 0) {
        newIndexarr.splice(0, 1, bufferedcoordarry.length - 1)
        newIndexarr.sort((a, b) => {
          return a - b
        });
      } // [5, 6, 26, 27] 特殊5,6才是左线
      //[27, 28, 55, 56] 正常28,55是左线
      let rbuffline, slice1, slice2, lbuffline;
      // 判断特殊 | 正常
      if (issideobj2[newIndexarr[0]] && issideobj2[newIndexarr[1]]) {
        // 截取右线
        rbuffline = bufferedcoordarry.slice(newIndexarr[0], newIndexarr[1] + 1);
        // 截取左线
        lbuffline = bufferedcoordarry.slice(newIndexarr[2], newIndexarr[3] + 1);
      } else {
        // 截取右线
        rbuffline = bufferedcoordarry.slice(newIndexarr[1], newIndexarr[2] + 1);
        // 截取左线
        slice1 = bufferedcoordarry.slice(0, newIndexarr[0] + 1);
        slice2 = bufferedcoordarry.slice(newIndexarr[3], bufferedcoordarry.length);
        lbuffline = slice2.concat(slice1);
      }
      /*---------------------------------------------------------------------------------------*/
      /*----构建左/右buffer polygon-----------------------------------------------------------------------------------*/
      const gsonline1 = JSON.parse(JSON.stringify(gsonline));
      const gsonline2 = JSON.parse(JSON.stringify(gsonline));
      /*----------------右线跟主线拼接 构建右 buffer polygon-----------------------------------------------------------------------*/
      const gsonlinecoords1 = gsonline1.geometry.coordinates; //主线坐标
      const startgsonlinecoords1 = gsonlinecoords1[0];
      const endgsonlinecoords1 = gsonlinecoords1[gsonlinecoords1.length - 1];
      const startrbuffline = rbuffline[0];
      const endrbuffline = rbuffline[rbuffline.length - 1];
      let ee1 = turf.point(endgsonlinecoords1);
      let s1 = turf.point(startrbuffline);
      let e1 = turf.point(endrbuffline);
      let ees1 = turf.distance(ee1, s1, {
        units: 'meters'
      });
      let eee1 = turf.distance(ee1, e1, {
        units: 'meters'
      });
      if (ees1 <= eee1) {
        rbuffline.reverse()
      }
      gsonlinecoords1.splice(gsonlinecoords1.length, 0, ...(rbuffline.reverse())) //拼接坐标进主线坐标
      const flinel = (new GeoJSON()).readFeature(gsonline1)
      gsonlinecoords1.push(gsonlinecoords1[0]) //缺口封闭
      let rbuf = turf.polygon([
        gsonlinecoords1
      ])
      const frbuf = (new GeoJSON()).readFeature(rbuf)
      /*-----------------左线跟主线拼接 构建左 buffer polygon----------------------------------------------------------------------*/
      const gsonlinecoords2 = gsonline2.geometry.coordinates; //主线坐标
      const startgsonlinecoords2 = gsonlinecoords2[0]
      const endgsonlinecoords2 = gsonlinecoords2[gsonlinecoords2.length - 1]
      const startlbuffline = lbuffline[0]
      const endlbuffline = lbuffline[lbuffline.length - 1]
      let ee2 = turf.point(endgsonlinecoords2);
      let s2 = turf.point(startlbuffline);
      let e2 = turf.point(endlbuffline);
      let ees2 = turf.distance(ee2, s2, {
        units: 'meters'
      });
      let eee2 = turf.distance(ee2, e2, {
        units: 'meters'
      });
      if (ees2 >= eee2) {
        lbuffline.reverse()
      }
      gsonlinecoords2.splice(gsonlinecoords2.length, 0, ...(lbuffline)) //拼接坐标进主线坐标
      const fliner = (new GeoJSON()).readFeature(gsonline2)
      gsonlinecoords2.push(gsonlinecoords2[0]); //缺口封闭
      // gsonlinecoords2.splice(2,1)
      let lbuf = turf.polygon([
        gsonlinecoords2
      ])
      const flbuf = (new GeoJSON()).readFeature(lbuf);
      /*---------------------------------------------------------------------------------------*/

      //,fbuffered,, flinel, frbuf, fbuffered2, flbuf

      switch (type) {
        case "around":
          layer.getSource().addFeature(fbuffered);
          resolve(fbuffered.getGeometry());
          break;
        case "left":
          layer.getSource().addFeature(flbuf);
          resolve(flbuf.getGeometry());
          break;
        case "right":
          layer.getSource().addFeature(frbuf);
          resolve(frbuf.getGeometry());
          break;
        case "side":
          layer.getSource().addFeature(fbuffered2);
          resolve(fbuffered2.getGeometry());
          break;
        case null:
          reject("缺少线缓冲类型");
          break;
        default:
          reject("缓冲类型错误");
          break;
      }
    })
  }

  /**
   * 多边形缓冲
   * @param {string} layerId 图层Id
   * @param {*} info array|geometry
   * @param {number} distance 缓冲距离 km
   * @param {*} clearLast 是否清除上一次绘制结果
   * @returns {Promise} resolve(Geometry)
   * @api
   */
  polygon(layerId, info, distance, clearLast) {
    return new Promise((resolve, reject) => {
      let layer = this.layerManage_.getLayer(layerId);
      if (layer == undefined) {
        layer = this.layerManage_.addLayer(layerId);
      }
      clearLast ? layer.getSource().clear() : "";
      let polygon, buffered
      // 创建缓冲数据
      switch (info.constructor.name) {
        case 'Array':
          polygon = turf.polygon(info);
          break;
        case 'Circle':
        case 'Polygon':
          const coords = info.constructor.name === 'Circle' ? fromCircle(info).getCoordinates() : info.getCoordinates();
          coords[0].push(coords[0][coords.length - 1]);
          polygon = turf.polygon(coords);
          break;
        default: reject('请传入正确的参数类型: Array|Polygon');
          break;
      }
      buffered = turf.buffer(polygon, distance, { units: 'kilometers' });
      //创建数据geojson对象和数据源对象
      let format = new GeoJSON();
      //读取geojson数据
      let a = format.readFeature(polygon);
      let b = format.readFeature(buffered);
      layer.getSource().addFeature(b);
      resolve(b.getGeometry());
    })
  }

}

export default BufferDraw