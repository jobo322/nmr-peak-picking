import { readFileSync } from 'fs';
import { resolve } from 'path';

import { fromJCAMP } from 'nmr-parser';

import { peakPicking } from '../index';

describe('test myModule', () => {
  it('should return 42', () => {
    const pathProton =
      'C:\\Users\\alejo\\Documents\\doctorado\\spectra_nmr_Airwave-38-40-1.jdx';
    const pathJres =
      'C:\\Users\\alejo\\Documents\\doctorado\\spectra_nmr_Airwave-38-41-1.jdx';

    const jcampProton = readFileSync(resolve(pathProton), 'utf8');
    const jcampJres = readFileSync(resolve(pathJres), 'utf8');

    const proton = fromJCAMP(jcampProton);
    const jres = fromJCAMP(jcampJres);

    console.log(proton);
    expect(true).toEqual(true);
  });
});
