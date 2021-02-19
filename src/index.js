import kmean from 'ml-kmeans';
import { getPeaks } from './getPeaks';
import { checkOptions } from './util/checkOptions';
/**
 * Returns an object with peak trying to use all input to optimize the peak picking.
 * @param {object} [input = {}] - object with spectra data.
 * @param {object} [input.proton] - chart of 1D proton spectrum.
 * @param {object} [input.carbon] -  chart of 1D carbon spectrum.
 * @return {number}
 */
export function peakPicking(input, options = {}) {
  let { nbSignals = 1 } = options;
  let inputKey = Object.keys(input);
  options = checkOptions(inputKey, options);
  let result = {};
  for (let key of inputKey) {
    result[key] = getPeaks(input[key], key, options[key]);
  }
  // console.log(result)
  let projected = {};
  let allProjection = {};
  for (let k in result) {
    let projections = result[k].projection;
    for (let p in projections) {
      if (!allProjection[p]) allProjection[p] = [];
      if (!projected[p]) projected[p] = new Set();
      projected[p].add(k);
      for (let i = 0; i < projections[p].length; i++) {
        allProjection[p].push(projections[p][i]);
      }
    }
  }

  console.log('projected', projected);
  console.log('projectionall', allProjection);
  for (let p in allProjection) {
    // preparing for clustering
    let clusters = clusterize(allProjection[p], nbSignals);

    clusters = joinClusters(clusters, ['jres']);

    for (let cluster of clusters) {
      let boxes = {};
      for (let key of projected[p]) boxes[key] = { nbSignals: 0 };
      for (let element of cluster) {
        let eKey = element.label;
        let eSignal = element.signal;
        if (!boxes[eKey][eSignal]) {
          boxes[eKey].nbSignals++;
          boxes[eKey][eSignal] = [];
        }
        boxes[eKey][eSignal].push(element);
      }
      if (boxes[p]) {
        let currentProjection = boxes[p];
        // console.log('current', currentProjection)
        if (currentProjection.nbSignals) {
          let minMax = getMinMax(currentProjection['0']);
          // if (boxes.hsqc && boxes.hsqc.nbSignals === 0) {
          for (let bk in boxes) {
            if (bk === p) continue;
            if (boxes[bk] && boxes[bk].nbSignals === 0) {
              //try to reduce the noiseLevel factor on the range of data trying to get some peaks in hsqc
              let { minX, maxX, minY, maxY } = input[bk];

              let subMatrix = getSubMatrix(input[bk], {
                fromX: Math.max(minX, minMax.min - 0.05),
                toX: Math.min(maxX, minMax.max + 0.05),
                fromY: minY,
                toY: maxY,
              });
              for (let i = 5; i >= 1; i--) {
                options.jres.thresholdFactor = i;
                let { peaks, projection } = getPeaks(
                  subMatrix,
                  bk,
                  options[bk],
                );
                if (peaks.length > 0) {
                  for (let proj in projection) {
                    for (let peak of projection[proj])
                      allProjection[proj].push(peak);
                  }
                  break;
                }
              }
            }
          }
        } else {
          //look for a reduction of noise level factor to proton pp
        }
      }
      // candidates.push(candidate);
    }
  }
}

function clusterize(group, nbSignals) {
  let list = group.map((e) => [e.x]);
  let clusteringResult = kmean(list, nbSignals);
  let clusterIndices = clusteringResult.clusters;

  let clusters = new Array(nbSignals);
  for (let i = 0; i < clusterIndices.length; i++) {
    let clusterIndex = clusterIndices[i];
    if (!clusters[clusterIndex]) clusters[clusterIndex] = [];
    clusters[clusterIndex].push(group[i]);
  }
  return clusters;
}
function getMinMax(peaks) {
  if (!peaks.length) {
    throw new Error('getMinMax should receive a list of peaks');
  }
  let min = Number.MAX_SAFE_INTEGER;
  let max = Number.MIN_SAFE_INTEGER;
  for (let peak of peaks) {
    if (min > peak.x) min = peak.x;
    if (max < peak.x) max = peak.x;
  }
  return { min, max };
}

function joinClusters(clusters, lookFor) {
  for (let i = 0; i < clusters.length - 1; i++) {
    let c1 = clusters[i];
    for (let j = i + 1; j < clusters.length; j++) {
      let c2 = clusters[j];
      if (isJoinable(c1, c2, lookFor)) {
        for (let e1 of c1) {
          clusters[j].push(e1);
        }
        clusters.splice(i, 1);
        break;
      }
    }
  }
  return clusters;
}

function isJoinable(clusterOne, clusterTwo, lookFor) {
  for (let key of lookFor) {
    for (let c1 of clusterOne) {
      if (c1.label !== key) continue;
      for (let c2 of clusterTwo) {
        if (c2.label !== key) continue;
        if (c2.signal === c1.signal) return true;
      }
    }
  }
  return false;
}

function putLabel(peak, label) {
  if (!peak.labels) peak.labels = [];
  if (peak.labels.indexOf(label) < 0) peak.labels.push(label);
  return peak;
}

function getSubMatrix(data, selectedZone) {
  const { fromX, toX, fromY, toY } = selectedZone;
  const xStep = (data.maxX - data.minX) / data.z[0].length;
  const yStep = (data.maxY - data.minY) / data.z.length;
  let xIndexFrom = Math.floor((fromX - data.minX) / xStep);
  let yIndexFrom = Math.floor((fromY - data.minY) / yStep);
  let xIndexTo = Math.floor((toX - data.minX) / xStep);
  let yIndexTo = Math.floor((toY - data.minY) / yStep);
  let dataMatrix = {
    z: [],
    maxX: data.minX + xIndexTo * xStep,
    minX: data.minX + xIndexFrom * xStep,
    maxY: data.minY + yIndexTo * yStep,
    minY: data.minY + yIndexFrom * yStep,
  };
  // console.log('datamatrix', xIndexFrom, xIndexTo, yIndexFrom, xIndexTo)
  let maxZ = Number.MIN_SAFE_INTEGER;
  let minZ = Number.MAX_SAFE_INTEGER;

  if (xIndexFrom > xIndexTo) [xIndexFrom, xIndexTo] = [xIndexTo, xIndexFrom];
  if (yIndexFrom > yIndexTo) [yIndexFrom, yIndexTo] = [yIndexTo, yIndexFrom];

  let nbXPoints = xIndexTo - xIndexFrom + 1;
  // let nbYPoints = yIndexTo - yIndexFrom + 1;
  for (let j = yIndexFrom; j < yIndexTo; j++) {
    let row = new Float32Array(nbXPoints);
    for (let i = xIndexFrom, index = 0; i < xIndexTo; i++, index++) {
      row[index] = data.z[j][i];
      if (maxZ < row[index]) maxZ = row[index];
      if (minZ > row[index]) minZ = row[index];
    }
    dataMatrix.z.push(Array.from(row));
  }
  dataMatrix.minZ = minZ;
  dataMatrix.maxZ = maxZ;

  return dataMatrix;
}
