// @ts-nocheck
/**
 * @module ol/utils/CoordTransform
 */
import { toStringHDMS, createStringXY } from '../coordinate.js'

const x_PI = 3.14159265358979324 * 3000.0 / 180.0;
const PI = 3.1415926535897932384626;
const a = 6378245.0;
const ee = 0.00669342162296594323;

/**
 * @classdesc
 * 坐标转换工具类
 *
 * @api
 */
class CoordTransform {
  /**
   * BD09->GCJ02
   * @param {number} bd_lon 
   * @param {number} bd_lat 
   * @param {number} len 
   * @returns {array}
   * @api
   */
  bd09togcj02(bd_lon, bd_lat, len) {
    let x_pi = 3.14159265358979324 * 3000.0 / 180.0;
    let x = bd_lon - 0.0065;
    let y = bd_lat - 0.006;
    let z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * x_pi);
    let theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * x_pi);
    let gg_lng = z * Math.cos(theta);
    let gg_lat = z * Math.sin(theta);
    return [gg_lng.toFixed(len ? len : 6), gg_lat.toFixed(len ? len : 6)]
  }

  /**
   * GCJ02->BD09
   * @param {number} lng 
   * @param {number} lat 
   * @param {number} len 
   * @returns {array}
   * @api
   */
  gcj02tobd09(lng, lat, len) {
    let z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * x_PI);
    let theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * x_PI);
    let bd_lng = z * Math.cos(theta) + 0.0065;
    let bd_lat = z * Math.sin(theta) + 0.006;
    return [bd_lng.toFixed(len ? len : 6), bd_lat.toFixed(len ? len : 6)]
  }

  /**
   * WGS84->GCJ02
   * @param {number} lng 
   * @param {number} lat 
   * @param {number} len 
   * @returns {array}
   * @api
   */
  wgs84togcj02(lng, lat, len) {
    if (CoordTransform.out_of_china(lng, lat)) {
      return [lng, lat]
    }
    else {
      let dlat = CoordTransform.transformlat(lng - 105.0, lat - 35.0);
      let dlng = CoordTransform.transformlng(lng - 105.0, lat - 35.0);
      let radlat = lat / 180.0 * PI;
      let magic = Math.sin(radlat);
      magic = 1 - ee * magic * magic;
      let sqrtmagic = Math.sqrt(magic);
      dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI);
      dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI);
      let mglat = lat + dlat;
      let mglng = lng + dlng;
      return [mglng.toFixed(len ? len : 6), mglat.toFixed(len ? len : 6)];
    }
  }

  /**
   * GCJ02->WGS84
   * @param {number} lng 
   * @param {number} lat 
   * @param {number} len 
   * @returns {array}
   * @api
   */
  gcj02towgs84(lng, lat, len) {
    if (CoordTransform.out_of_china(lng, lat)) {
      return [lng, lat];
    }
    else {
      let dlat = CoordTransform.transformlat(lng - 105.0, lat - 35.0);
      let dlng = CoordTransform.transformlng(lng - 105.0, lat - 35.0);
      let radlat = lat / 180.0 * PI;
      let magic = Math.sin(radlat);
      magic = 1 - ee * magic * magic;
      let sqrtmagic = Math.sqrt(magic);
      dlat = (dlat * 180.0) / ((a * (1 - ee)) / (magic * sqrtmagic) * PI);
      dlng = (dlng * 180.0) / (a / sqrtmagic * Math.cos(radlat) * PI);
      return [(lng * 2 - lng + dlng).toFixed(len ? len : 6), (lat * 2 - lat + dlat).toFixed(len ? len : 6)];
    }
  }

  static transformlat(lng, lat) {
    let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng));
    ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(lat * PI) + 40.0 * Math.sin(lat / 3.0 * PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(lat / 12.0 * PI) + 320 * Math.sin(lat * PI / 30.0)) * 2.0 / 3.0;
    return ret;
  }

  static transformlng(lng, lat) {
    let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng));
    ret += (20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(lng * PI) + 40.0 * Math.sin(lng / 3.0 * PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(lng / 12.0 * PI) + 300.0 * Math.sin(lng / 30.0 * PI)) * 2.0 / 3.0;
    return ret;
  }


  static out_of_china(lng, lat) {
    return (lng < 72.004 || lng > 137.8347) || ((lat < 0.8293 || lat > 55.8271) || false);
  }

  /**
   * 度°分′秒″ 转 十进制
   * @param {*} strDu 
   * @param {*} strFen 
   * @param {*} strMiao 
   * @param {*} len 
   * @returns {string}
   * @api
   */
  toDigital(strDu, strFen, strMiao, len) {
    len = (len > 6 || typeof (len) == "undefined") ? 6 : len;//精确到小数点后最多六位   
    strDu = (typeof (strDu) == "undefined" || strDu == "") ? 0 : parseFloat(strDu);
    strFen = (typeof (strFen) == "undefined" || strFen == "") ? 0 : parseFloat(strFen) / 60;
    strMiao = (typeof (strMiao) == "undefined" || strMiao == "") ? 0 : parseFloat(strMiao) / 3600;
    let digital = strDu + strFen + strMiao;
    return digital === 0 ? "" : digital.toFixed(len);
  }

  /**
   * 十进制 转 度°分′秒″
   * @param {array} sjzCoord 
   * @returns {Object} 
   * @api
   */
  toDegree(sjzCoord) {
    let res = toStringHDMS([sjzCoord[1],sjzCoord[0]]);
    return {
      format: res,
      obj: {
        jd: {
          d: parseFloat(res.split(" ")[0]),
          f: parseFloat(res.split(" ")[1]),
          m: parseFloat(res.split(" ")[2])
        },
        wd: {
          d: parseFloat(res.split(" ")[4]),
          f: parseFloat(res.split(" ")[5]),
          m: parseFloat(res.split(" ")[6])
        }
      }
    }
  }

  /**
   * 4326十进制--高斯6度直角坐标
   * @param {array} lonlat 
   * @returns {CoordinateFormat}
   * @api
   */
  sjzToZj(lonlat) {
    let latitude = lonlat[1];
    let longitude = lonlat[0];
    let ProjNo = 0;
    let longitude1, latitude1, longitude0, X0, Y0, xval, yval, a, f, e2, ee, NN, T, C, A, M, iPI, ZoneWide;
    iPI = 0.0174532925199433; // 3.1415926535898/180.0;
    ZoneWide = 6; // 6度带宽（高斯投影 3度或6度）
    a = 6378137.0;// 地球半径
    f = 1.0 / 298.26; // CGC2000坐标系参数
    ProjNo = parseInt(longitude / ZoneWide);
    longitude0 = ProjNo * ZoneWide + ZoneWide / 2;
    longitude0 = longitude0 * iPI; // 中央子午线
    longitude1 = longitude * iPI; // 经度转换为弧度
    latitude1 = latitude * iPI; // 纬度转换为弧度
    e2 = 2 * f - f * f;
    ee = e2 / (1.0 - e2);
    NN = a
      / Math.sqrt(1.0 - e2 * Math.sin(latitude1)
        * Math.sin(latitude1));
    T = Math.tan(latitude1) * Math.tan(latitude1);
    C = ee * Math.cos(latitude1) * Math.cos(latitude1);
    A = (longitude1 - longitude0) * Math.cos(latitude1);
    M = a
      * ((1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256)
        * latitude1
        - (3 * e2 / 8 + 3 * e2 * e2 / 32 + 45 * e2 * e2 * e2
          / 1024) * Math.sin(2 * latitude1)
        + (15 * e2 * e2 / 256 + 45 * e2 * e2 * e2 / 1024)
        * Math.sin(4 * latitude1) - (35 * e2 * e2 * e2 / 3072)
        * Math.sin(6 * latitude1));
    // 因为是以赤道为Y轴的，与我们南北为Y轴是相反的，所以xy与高斯投影的标准xy正好相反;
    xval = NN
      * (A + (1 - T + C) * A * A * A / 6 + (5 - 18 * T + T * T + 14
        * C - 58 * ee)
        * A * A * A * A * A / 120);
    yval = M
      + NN
      * Math.tan(latitude1)
      * (A * A / 2 + (5 - T + 9 * C + 4 * C * C) * A * A * A * A / 24 + (61
        - 58 * T + T * T + 270 * C - 330 * ee)
        * A * A * A * A * A * A / 720);
    X0 = 1000000 * (ProjNo + 1) + 500000;
    Y0 = 0;
    xval = xval + X0;
    yval = yval + Y0;
    let coord = [yval, xval];
    let stringifyFunc = createStringXY();
    let out = stringifyFunc(coord);
    return out;
  }

  /**
   * 高斯6度--4326十进制
   * @param {*} X 
   * @param {*} Y 
   * @returns {array}
   */
  zjToSjz(X, Y) {
    let longitude1, latitude1, longitude0, X0, Y0, xval, yval, e1, e2, f, a, ee, NN, T, C, M, D, R, u, fai, iPI, ProjNo, ZoneWide; // ,latitude0
    iPI = 0.0174532925199433; // π/180
    a = 6378137.0;
    f = 1.0 / 298.26; // CGC2000坐标系参数
    ZoneWide = 6; // 6度带宽
    ProjNo = parseInt(X / 1000000); // 查找带号
    longitude0 = (ProjNo - 1) * ZoneWide + ZoneWide / 2;
    longitude0 = longitude0 * iPI; // 中央经线
    X0 = ProjNo * 1000000 + 500000;
    Y0 = 0;
    xval = X - X0;
    yval = Y - Y0; // 带内大地坐标
    e2 = 2 * f - f * f;
    e1 = (1.0 - Math.sqrt(1 - e2)) / (1.0 + Math.sqrt(1 - e2));
    ee = e2 / (1 - e2);
    M = yval;
    u = M / (a * (1 - e2 / 4 - 3 * e2 * e2 / 64 - 5 * e2 * e2 * e2 / 256));
    fai = u + (3 * e1 / 2 - 27 * e1 * e1 * e1 / 32) * Math.sin(2 * u)
      + (21 * e1 * e1 / 16 - 55 * e1 * e1 * e1 * e1 / 32)
      * Math.sin(4 * u) + (151 * e1 * e1 * e1 / 96) * Math.sin(6 * u)
      + (1097 * e1 * e1 * e1 * e1 / 512) * Math.sin(8 * u);
    C = ee * Math.cos(fai) * Math.cos(fai);
    T = Math.tan(fai) * Math.tan(fai);
    NN = a / Math.sqrt(1.0 - e2 * Math.sin(fai) * Math.sin(fai)); // 字串1
    R = a
      * (1 - e2)
      / Math.sqrt((1 - e2 * Math.sin(fai) * Math.sin(fai))
        * (1 - e2 * Math.sin(fai) * Math.sin(fai))
        * (1 - e2 * Math.sin(fai) * Math.sin(fai)));
    D = xval / NN;
    // 计算经度(Longitude) 纬度(Latitude)
    longitude1 = longitude0
      + (D - (1 + 2 * T + C) * D * D * D / 6 + (5 - 2 * C + 28 * T
        - 3 * C * C + 8 * ee + 24 * T * T)
        * D * D * D * D * D / 120) / Math.cos(fai);
    latitude1 = fai
      - (NN * Math.tan(fai) / R)
      * (D * D / 2 - (5 + 3 * T + 10 * C - 4 * C * C - 9 * ee) * D
        * D * D * D / 24 + (61 + 90 * T + 298 * C + 45 * T * T
          - 256 * ee - 3 * C * C)
        * D * D * D * D * D * D / 720);
    // 转换为度 DD
    jd = longitude1 / iPI;
    wd = latitude1 / iPI;
    return [jd, wd];
  }

}
export default CoordTransform
