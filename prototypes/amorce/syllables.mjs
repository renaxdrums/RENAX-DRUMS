// Diagnostic syllabification, NOT an independently verified acoustic landmark.
// Language-specific onset inventories are phoneme rules, never a label whitelist.
const vowels = /[aeiouyɑɒæɐɜɞəɛɪɨʉʊɔœøɤɯɶ]/u;
const clean = id => id.replace(/[ˈˌːˑ\u0303\u032f]/gu, '');
const clusters = {
  fr: new Set(['pl','bl','kl','ɡl','fl','pʁ','bʁ','tʁ','dʁ','kʁ','ɡʁ','fʁ','vʁ','sj','zj','tj','dj','nj','lj','ʁj','pj','bj','kj','ɡj','fj','vj','mj','pw','bw','tw','dw','kw','ɡw','fw','vw','sw','ʃw','tɥ','dɥ','nɥ','lɥ','sɥ','ʁɥ']),
  en: new Set(['pl','bl','kl','ɡl','fl','sl','pɹ','bɹ','tɹ','dɹ','kɹ','ɡɹ','fɹ','θɹ','ʃɹ','sp','st','sk','sm','sn','sw','tw','dw','kw','ɡw','θw','pj','bj','tj','dj','kj','ɡj','fj','vj','mj','nj','hj','spl','spɹ','stɹ','skɹ','skw']),
};

export function lastSyllableCandidate(events, language) {
  if (!clusters[language]) throw new Error('UNSUPPORTED_LANGUAGE');
  const phones = events.filter(e => e.type === 'phoneme' && e.id?.trim());
  if (!phones.length) throw new Error('NO_PHONEME_EVENTS');
  // A final syllabic consonant is a nucleus too (e.g. English "bottle").
  const nuclei = phones.map((e,i) => vowels.test(clean(e.id)) || /\u0329/u.test(e.id) ? i : -1).filter(i=>i>=0);
  if (!nuclei.length) throw new Error('NO_SYLLABLE_NUCLEUS');
  const nucleus = nuclei.at(-1);
  const word = phones[nucleus].text_position;
  const previous = nuclei.filter(i=>i<nucleus && phones[i].text_position===word).at(-1);
  const wordStart = phones.findIndex(e=>e.text_position===word);
  const lower = previous === undefined ? wordStart : previous+1;
  let onset=nucleus;
  // Longest permissible suffix of the consonant run: k-s-j-ɔ̃ => s-j-ɔ̃,
  // not k-s-j-ɔ̃, and not just the vowel ɔ̃.
  for (let i=nucleus-1;i>=lower;i--) {
    if (phones.slice(i,nucleus).some(e=>e.text_position!==word)) break;
    const consonants=phones.slice(i,nucleus).map(e=>clean(e.id)).join('');
    if (i===nucleus-1 || clusters[language].has(consonants)) onset=i;
  }
  return {
    anchorSeconds:phones[onset].audio_position/1000,
    onsetPhone:phones[onset].id,nucleusPhone:phones[nucleus].id,
    phones:phones.slice(onset).map(e=>e.id),
    method:'phonotactic-candidate',anchorVerified:false,
    limitation:'Syllabification and acoustic attack require independent review; phoneme event timestamps are not acoustic ground truth.',
  };
}
