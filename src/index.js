import { xyzAutoPeakPicking, xyAutoPeaksPicking } from 'nmr-processing';
/**
 * Returns an object with peak trying to use all input to optimize the peak picking.
 * @param {object} [input = {}] - object with spectra data.
 * @param {object} [input.proton] - chart of 1D proton spectrum.
 * @param {object} [input.carbon] -  chart of 1D carbon spectrum.
 * @return {number}
 */
export function peakPicking(input, options = {}) {

  let inputKey = Object.keys(input).map((e) => e.toLocaleLowerCase());
  let result = {};
  for (let key of inputKey) {
    let peaks = getPeaks(input, key, options[key].peakPicking);
    for (let i = 0; i < peaks.length; i++) {
      peaks[i] = putLabel(peaks[i], key);
    }
    result[`${key}pp`] = peaks;
  }

  let hasJres = !['proton', 'jres'].some((e) => inputKey.indexOf(e) < 0);
  if (hasJres) {
    assignProtonWithJres(result);
  }

  return result;
}

function assignProtonWithJres(peaks) {
  
}


function getPeaks(input, key) {
  switch (key) {
    case 'jres':
      return xyzAutoPeakPicking(input, {
        homonuclear: true,
        toleranceX: 20,
        toleranceY: 40,
      });
    case 'proton':
      return xyAutoPeaksPicking(input);
    case 'dept135':
      return xyAutoPeaksPicking(input, { lookNegative: true });
    case 'carbon':
      return xyAutoPeaksPicking(input);
    case 'hsqc':
      return xyzAutoPeakPicking(input, { homonuclear: false });
  }
}

function putLabel(peak, label) {
  if (!peak.labels) peak.labels = [];
  if (peak.labels.indexOf(label) < 0) peak.labels.push(label);
  return peak;
}
