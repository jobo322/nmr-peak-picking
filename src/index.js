import kmean from 'ml-kmeans';
import { getPeaks } from './getPeaks';
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
  let result = {};
  for (let key of inputKey) {
    result[key] = getPeaks(input, key, options);
  }
  let allProjection = {};
  for (let k in result) {
    let projections = result[k].projection;
    for (let p in projections) {
      if (!allProjection[p]) allProjection[p] = [];
      for (let i = 0; i < projections[p].length; i++) {
        allProjection[p].push(projections[p][i]);
      }
    }
  }

  for (let p in allProjection) {
    // preparing for clustering
    let group = allProjection[p];
    let list = group.map((e) => [e.x]);
    let clusteringResult = kmean(list, nbSignals);
    let clusterIndices = clusteringResult.clusters;

    let clusters = new Array(nbSignals);
    for (let i = 0; i < clusterIndices.length; i++) {
      let clusterIndex = clusterIndices[i];
      if (!clusters[clusterIndex]) clusters[clusterIndex] = [];
      clusters[clusterIndex].push(group[i]);
    }

    clusters = joinClusters(clusters, ['jres']);
    // Here we try to split the cluster if it does not pass some rules.
    // console.log('clusters.length', clusters);
    let candidates = [];
    for (let cluster of clusters) {
      let candidate = getCandidates(cluster, inputKey);
      // candidates.push(candidate);
    }
  }
}

function getCandidates(cluster, inputKey) {
  let boxes = {};
  for (let i = 0; i < inputKey.length; i++) {
    let key = inputKey[i];
    if (!boxes[key]) boxes[key] = {};
    for (let element of cluster) {
      let eKey = element.label;
      let eSignal = element.signal;
      if (!boxes[eKey]) boxes[eKey] = {nbSignals: 0};
      if (!boxes[eKey][eSignal]) {
        boxes[eKey].nbSignals++;
        boxes[eKey][eSignal] = [];
      }
      boxes[eKey][eSignal].push(element);
    }
  }

  if (boxes.proton) {
    let proton = boxes.proton;
    if (proton.nbSignals) {
      if (boxes.hsqc && boxes.hsqc.nbSignals === 0) {
        let from = Math.min(inputKey.hsqc.minX, ...proton['0']);
        //try to reduce the noiseLevel factor on the range of data trying to get some peaks in hsqc
      }
    } else {
      //look for a reduction of noise level factor to proton pp
    }
  } 
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
