import assignDeep from 'assign-deep';

const defaultDept135Options = { lookNegative: true };
const defaultProtonOptions = { optimize: true, factorWidth: 8 };
const defaultCarbonOptions = { optimize: true, factorWidth: 4 };
const defaultJresOptions = {
  tolerances: [5, 100],
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

export function checkOptions(inputKey = [], options = {}) {
  for (let i = 0; i < inputKey.length; i++) {
    let key = inputKey[i].toLowerCase();
    options[key] = autoCompletOption(options[key], key);
  }
  return options;
}

function autoCompletOption(options = {}, key) {
  switch (key.toLowerCase()) {
    case 'jres':
      return assignDeep({}, defaultJresOptions, options);
    case 'proton':
      return assignDeep({}, defaultProtonOptions, options);
    case 'dept135':
      return assignDeep({}, defaultDept135Options, options);
    case 'carbon':
      return assignDeep({}, defaultCarbonOptions, options);
    case 'hsqc':
      return assignDeep({}, defaultHsqcOptions, options);
    default:
      throw new Error(`kind of spectrum does not supported - ${key}`);
  }
}
