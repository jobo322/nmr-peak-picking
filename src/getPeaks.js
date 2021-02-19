import { xyzAutoPeaksPicking, xyAutoPeaksPicking } from 'nmr-processing';

export function getPeaks(input, key, options = {}) {
    console.log('options', options)
  switch (key.toLowerCase()) {
    case 'jres':
      let peakList = xyzAutoPeaksPicking(input, options);
      return projectJres(peakList, key);
    case 'proton':
    case 'dept135':
    case 'carbon':
      return peakPicking1D(input, key, options);
    case 'hsqc':
      let peaks = xyzAutoPeaksPicking(input, options);
      return projectHeteroNuclear2D(peakList, key);
    default:
      throw new Error(`kind of spectrum does not supported - ${key}`);
  }
}

function peakPicking1D(input, key, options) {
  let projection = {};
  let projectionName = getProjectionNameFromExperiment(key);
  let peaks = xyAutoPeaksPicking(input, options);
  projection[projectionName] = peaks.map((_, i, arr) => {
    arr[i].label = key;
    arr[i].signal = 0;
    arr[i].index = i;
    return arr[i];
  });
  return { peaks, projection };
}

/**
 * generate two projection of the same zone
 * @param {} zoneList
 * @param {*} key
 */
function projectHeteroNuclear2D(zoneList, key) {
  let projection = {};
  for (let i = 0; i < zoneList.length; i++) {
    let signal = zoneList[i];
    let peaks = mergePeaks2D(signal.peaks, 1e-5);
    let xAxis = getProjectionNameFromNucleus(signal.nucleusX);
    let yAxis = getProjectionNameFromNucleus(signal.nucleusY);
    if (!projection[xAxis]) projection[xAxis] = [];
    if (!projection[yAxis]) projection[yAxis] = [];

    for (let j = 0; j < peaks.length; j++) {
      peaks[j].index = j;
      projection[xAxis].push({
        x: peaks[j].x,
        y: peaks[j].z,
        label: key,
        signal: i,
        index: j,
      });
      projection[yAxis].push({
        x: peaks[j].y,
        y: peaks[j].z,
        label: key,
        signal: i,
        index: j,
      });
    }
  }
  return { peaks, projection };
}

function getProjectionNameFromExperiment(experiment) {
  let expName = experiment.toLowerCase().replace(/\s*[0-9]*/g, '');
  switch (expName) {
    case 'carbon':
    case 'dept':
    case 'apt':
      return 'carbon';
    case 'proton':
    case 'noesy':
      return 'proton';
  }
}

function getProjectionNameFromNucleus(nucleus) {
  let nucleusName = nucleus.toLowerCase().replace(/ /g, '');
  switch (nucleusName) {
    case '1h':
    case 'h':
      return 'proton';
    case 'c':
    case '13c':
      return 'carbon';
  }
}

function projectJres(jres, key) {
  let peaks1D = [];
  for (let i = 0; i < jres.length; i++) {
    let signal = jres[i];
    let peaks = mergePeaks2D(signal.peaks, 1e-5);
    for (let j = 0; j < peaks.length; j++) {
      peaks[j].index = j;
      peaks1D.push({
        x: peaks[j].x + peaks[j].y,
        y: peaks[j].z,
        label: key,
        signal: i,
        index: j,
      });
    }
    signal.peaks = peaks;
  }

  return { peaks: jres, projection: { proton: peaks1D } };
}

function mergePeaks2D(peaks, tolerance) {
  let result = [];
  for (let i = 0; i < peaks.length; i++) {
    let addIt = true;
    for (let j = 0, peak = peaks[i]; j < result.length; j++) {
      if (Math.abs(peak.x - result[j].x) < tolerance) {
        if (Math.abs(peak.y - result[j].y) < tolerance) {
          addIt = false;
          break;
        }
      }
    }
    if (addIt) result.push(peaks[i]);
  }
  return result;
}
