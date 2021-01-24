import { gsd } from 'ml-gsd';
import { xyzAutoPeakPicking } from 'nmr-processing';
/**
 * Returns an object with peak trying to use all input to optimize the peak picking.
 * @param {object} [input = {}] - object with spectra data.
 * @param {object} [input.proton] - chart of 1D proton spectrum.
 * @param {object} [input.carbon] -  chart of 1D carbon spectrum.
 * @return {number}
 */
export function peakPicking(input, options = {}) {
  let inputKey = Object.keys(input);
  let result = {};
  for (let key of inputKey) {
    result[`${key}pp`] = getPeaks(input, key);
  }
  return result;
}

function getPeaks(input, key) {
  switch (key) {
    case 'jres':
      return xyzAutoPeakPicking(input, { homonuclear: true });
    case 'proton':
      return gsd(input);
  }
}
