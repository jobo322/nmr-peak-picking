import assignDeep from 'assign-deep';
import { xyzAutoPeaksPicking, xyAutoPeaksPicking } from 'nmr-processing';

const defaultDept135Options = { lookNegative: true };
const defaultProtonOptions = { optimize: true, factorWidth: 8 };
const defaultCarbonOptions = { optimize: true, factorWidth: 4 };
const defaultJresOptions = {
  tolerances: [5, 40],
  observeFrequencies: [600, 600],
  nucleus: ['1H', '1H'],
  isHomoNuclear: true,
};
const defaultHsqcOptions = {
  thresholdFactor: 5,
  tolerances: [30, 30],
  observeFrequencies: [600, 600],
  nucleus: ['1H', '13C'],
  isHomoNuclear: false,
};

export function getPeaks(input, key, options = {}) {
  let peaks = [];
  let projection = {};
  switch (key.toLowerCase()) {
    case 'jres':
      let { jres: jresInOptions = {} } = options;
      let jresOptions = assignDeep({}, defaultJresOptions, jresInOptions);
      let peakList = xyzAutoPeaksPicking(input[key], jresOptions);
      [peaks, projection] = projectJres(peakList, key);
      break;
    case 'proton':
      let { proton: protonInOptions = {} } = options;
      let protonOptions = assignDeep({}, defaultProtonOptions, protonInOptions);
      peaks = xyAutoPeaksPicking(input[key], { optimize: true }, protonOptions);
      peaks.forEach((e, i, arr) => {
        arr[i].label = key;
        arr[i].signal = 0;
        arr[i].index = i;
      });
      projection.proton = peaks.slice();
      break;
    case 'dept135':
      let { dept135: dept135InOptions = {} } = options;
      let dept135Options = assignDeep(
        {},
        defaultDept135Options,
        dept135InOptions,
      );
      peaks = xyAutoPeaksPicking(input[key], dept135Options);
      peaks.forEach((e, i, arr) => {
        arr[i].label = key;
        arr[i].index = i;
      });
      projection.proton = peaks.slice();
      break;
    case 'carbon':
      let { carbon: carbonInOptions = {} } = options;
      let carbonOptions = assignDeep({}, defaultCarbonOptions, carbonInOptions);
      peaks = xyAutoPeaksPicking(input[key], carbonOptions);
      peaks.forEach((e, i, arr) => {
        arr[i].label = key;
        arr[i].signal = 0;
        arr[i].index = i;
      });
      projection.proton = peaks.slice();
      break;
    case 'hsqc':
      let { hsqc: hsqcInOptions = {} } = options;
      let hsqcOptions = assignDeep({}, defaultHsqcOptions, hsqcInOptions);
      peaks = xyzAutoPeaksPicking(input[key], hsqcOptions);
      [peaks, projection] = projectHeteroNuclear2D(peakList, key);
      break;
    default:
      throw new Error(`kind of spectrum does not supported - ${key}`);
  }
  return { projection, peaks };
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
    let xAxis = getProjectionName(signal.nucleusX);
    let yAxis = getProjectionName(signal.nucleusY);
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
  return [peaks, projection];
}

function getProjectionName(nucleus) {
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

  return [jres, { proton: peaks1D }];
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
