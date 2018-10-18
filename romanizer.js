
const STD_CHO = 'ᄀᄁᄂᄃᄄᄅᄆᄇᄈᄉᄊᄋᄌᄍᄎᄏᄐᄑᄒ'
const STD_JUNG = 'ᅡᅢᅣᅤᅥᅦᅧᅨᅩᅪᅫᅬᅭᅮᅯᅰᅱᅲᅳᅴᅵ'
const STD_JONG = 'ᆨᆩᆪᆫᆬᆭᆮᆯᆰᆱᆲᆳᆴᆵᆶᆷᆸᆹᆺᆻᆼᆽᆾᆿᇀᇁᇂ'

const ROMAN_CHO = "k kk n t tt r m p pp s ss  ch tch ch' k' t' p' h".split(' ')
const ROMAN_JUNG = "a ae ya yae ŏ e yŏ ye o wa wae oe yo u wŏ we wi yu ŭ ŭi i".split(' ')

const HANGEUL = 'ᄀᄁᄂᄃᄄᄅᄆᄇᄈᄉᄊᄋᄌᄍᄎᄏᄐᄑ하ᅢᅣᅤᅥᅦᅧᅨᅩᅪᅫᅬᅭᅮᅯᅰᅱᅲᅳᅴᅵᆨᆩᆪᆫᆬᆭᆮᆯᆰᆱᆲᆳᆴᆵᆶᆷᆸᆹᆺᆻᆼᆽᆾᆿᇀᇁᇂ'.split('')
const ROMAN = "g kk n d tt r m b pp s ss  j tch ch' k' t' p' h a ae ya yae ŏ e yŏ ye o wa wae oe yo u wŏ we wi yu ŭ ŭi i k kk k n n n t l k m p l t p l m p p t t ng t t k t p ".split(' ')
const ROMAN_VOICELESS = "k kk n t tt r m p pp s ss  ch tch ch' k' t' p' h a ae ya yae ŏ e yŏ ye o wa wae oe yo u wŏ we wi yu ŭ ŭi i k kk k n n n t l k m p l t p l m p p t t ng t t k t p ".split(' ')

const PAIR_ROW = {
  "g": "",
  "k": "",
  "kk": "",
  "n": "",
  "d": "",
  "t": "",
  "tt": "",
  "r": "",
  "m": "",
  "b": "",
  "p": "",
  "pp": "",
  "s": "",
  "ss": "",
  "ch": "",
  "tch": "",
  "ch'": "",
  "k'": "",
  "t'": "",
  "p'": "",
  "h": ""
}

const PAIR_COLUMN = " k ".split(' ')

const PAIRS = {
  'g': "g kk ngn kt ngn ngm kp ks kch kch' kk' kt' kp' kh".split(' '),
  'n': "n n'g nn nd ll nm nb ns nj nch' nk' nt' np' nh".split(' '),
  't': "d tk nn tt nn nm tp ss tch tch' tk' tt' tp' th".split(' '),
  'l': "r lg ll lt ll lm lb ls lch lch' lk' lt' lp' rh".split(' '),
  'm': "m mg mn md mn mm mb ms mj mch' mk' mt' mp' mh".split(' '),
  'p': "b pk mn pt mn mm pp ps pch pch' pk' pt' pp' ph".split(' '),
  'ng': "ng ngg ngn ngd ngn ngm ngb ngs ngj ngch' ngk' ngt' ngp' ngh".split(' ')
}

const isVoiceless = (prev, curr, next) => prev == ' ' || prev == undefined || HANGEUL.indexOf(next) < HANGEUL.indexOf('ᅡ') || ['k', 't', 'p'].includes(ROMAN[HANGEUL.indexOf(next)])

const convertVoiceless = (prev, curr, next) => ROMAN_VOICELESS[HANGEUL.indexOf(curr)]
const convertVoiced = (prev, curr, next) => ROMAN[HANGEUL.indexOf(curr)]

const convert = (prev, curr, next) => (curr == 'ᅦ' && (prev == 'ᅡ' || prev == 'ᅩ')) ? 'ë' : isVoiceless(prev, curr, next) ? convertVoiceless(prev, curr, next) : convertVoiced(prev, curr, next)

const mccuneReischauer = (str) => [...str.normalize('NFD')].filter(c => c != 'ᄋ').map((c, i, arr) => convert(arr[i-1], c, arr[i+1]) || c).join('')

module.exports = mccuneReischauer
