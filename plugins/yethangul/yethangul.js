
const STD_CHO = 'ᄀᄁᄂᄃᄄᄅᄆᄇᄈᄉᄊᄋᄌᄍᄎᄏᄐᄑᄒ'
const STD_JUNG = 'ᅡᅢᅣᅤᅥᅦᅧᅨᅩᅪᅫᅬᅭᅮᅯᅰᅱᅲᅳᅴᅵ'
const STD_JONG = 'ᆨᆩᆪᆫᆬᆭᆮᆯᆰᆱᆲᆳᆴᆵᆶᆷᆸᆹᆺᆻᆼᆽᆾᆿᇀᇁᇂ'

const COMPAT_CHO = 'ㄱㄲㄳㄴㄵㄶㄷㄸㄹㄺㄻㄼㄽㄾㄿㅀㅁㅂㅃㅄㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ'
const COMPAT_JUNG = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ'

const CONVERT_CHO = 'ᄀᄁ\0ᄂ\0\0ᄃᄄᄅ\0\0\0\0\0\0\0ᄆᄇᄈ\0ᄉᄊᄋᄌᄍᄎᄏᄐᄑᄒ'
const CONVERT_JONG = 'ᆨᆩᆪᆫᆬᆭᆮ\0ᆯᆰᆱᆲᆳᆴᆵᆶᆷᆸ\0ᆹᆺᆻᆼᆽ\0ᆾᆿᇀᇁᇂ'

const CONVERT_COMPAT = COMPAT_CHO + COMPAT_JUNG + COMPAT_CHO
const CONVERT_STD = CONVERT_CHO + STD_JUNG + CONVERT_JONG

const YETHANGUL_SYLLABLE_3 = /([ᄀ-ᄒ]+)([ᅡ-ᅵ]+)([ᆨ-ᇂ]*)/g
const YETHANGUL_SYLLABLE_2 = /([ㄱ-ㅎ]{1,3})([ㅏ-ㅣ]{1,3})([ㄱ-ㅎ]{0,3})(?![ㅏ-ㅣ])/g

const COMBINATION = {ᄀᄀ: "ᄁ", ᄀᄃ: "ᅚ", ᄂᄀ: "ᄓ", ᄂᄂ: "ᄔ", ᄂᄃ: "ᄕ", ᄂᄇ: "ᄖ", ᄂᄉ: "ᅛ", ᄂᄌ: "ᅜ", ᄂᄒ: "ᅝ", ᄃᄀ: "ᄗ", ᄃᄃ: "ᄄ", ᄃᄅ: "ᅞ", ᄃᄆ: "ꥠ", ᄃᄇ: "ꥡ", ᄃᄉ: "ꥢ", ᄃᄌ: "ꥣ", ᄅᄀ: "ꥤ", ᄅᄁ: "ꥥ", ᄅᄂ: "ᄘ", ᄅᄃ: "ꥦ", ᄅᄄ: "ꥧ", ᄅᄅ: "ᄙ", ᄅᄆ: "ꥨ", ᄅᄇ: "ꥩ", ᄅᄈ: "ꥪ", ᄅᄉ: "ꥬ", ᄅᄋ: "ᄛ", ᄅᄌ: "ꥭ", ᄅᄏ: "ꥮ", ᄅᄒ: "ᄚ", ᄅᄫ: "ꥫ", ᄆᄀ: "ꥯ", ᄆᄃ: "ꥰ", ᄆᄇ: "ᄜ", ᄆᄉ: "ꥱ", ᄆᄋ: "ᄝ", ᄇᄀ: "ᄞ", ᄇᄂ: "ᄟ", ᄇᄃ: "ᄠ", ᄇᄇ: "ᄈ", ᄇᄉ: "ᄡ", ᄇᄊ: "ᄥ", ᄇᄋ: "ᄫ", ᄇᄌ: "ᄧ", ᄇᄎ: "ᄨ", ᄇᄏ: "ꥳ", ᄇᄐ: "ᄩ", ᄇᄑ: "ᄪ", ᄇᄒ: "ꥴ", ᄇᄫ: "ᄬ", ᄇᄭ: "ᄢ", ᄇᄯ: "ᄣ", ᄇᄲ: "ᄤ", ᄇᄶ: "ᄦ", ᄇᄹ: "ꥲ", ᄈᄋ: "ᄬ", ᄉᄀ: "ᄭ", ᄉᄂ: "ᄮ", ᄉᄃ: "ᄯ", ᄉᄅ: "ᄰ", ᄉᄆ: "ᄱ", ᄉᄇ: "ᄲ", ᄉᄉ: "ᄊ", ᄉᄊ: "ᄴ", ᄉᄋ: "ᄵ", ᄉᄌ: "ᄶ", ᄉᄎ: "ᄷ", ᄉᄏ: "ᄸ", ᄉᄐ: "ᄹ", ᄉᄑ: "ᄺ", ᄉᄒ: "ᄻ", ᄉᄞ: "ᄳ", ᄉᄲ: "ꥵ", ᄊᄇ: "ꥵ", ᄊᄉ: "ᄴ", ᄋᄀ: "ᅁ", ᄋᄃ: "ᅂ", ᄋᄅ: "ꥶ", ᄋᄆ: "ᅃ", ᄋᄇ: "ᅄ", ᄋᄉ: "ᅅ", ᄋᄋ: "ᅇ", ᄋᄌ: "ᅈ", ᄋᄎ: "ᅉ", ᄋᄐ: "ᅊ", ᄋᄑ: "ᅋ", ᄋᄒ: "ꥷ", ᄋᅀ: "ᅆ", ᄌᄋ: "ᅍ", ᄌᄌ: "ᄍ", ᄍᄒ: "ꥸ", ᄎᄏ: "ᅒ", ᄎᄒ: "ᅓ", ᄐᄐ: "ꥹ", ᄑᄇ: "ᅖ", ᄑᄋ: "ᅗ", ᄑᄒ: "ꥺ", ᄒᄉ: "ꥻ", ᄒᄒ: "ᅘ", ᄡᄀ: "ᄢ", ᄡᄃ: "ᄣ", ᄡᄇ: "ᄤ", ᄡᄉ: "ᄥ", ᄡᄌ: "ᄦ", ᄡᄐ: "ꥲ", ᄲᄀ: "ᄳ", ᄼᄼ: "ᄽ", ᄾᄾ: "ᄿ", ᅎᅎ: "ᅏ", ᅐᅐ: "ᅑ", ᅙᅙ: "ꥼ", ᅡᅡ: "ᆞ", ᅡᅩ: "ᅶ", ᅡᅮ: "ᅷ", ᅡᅳ: "ᆣ", ᅡᅵ: "ᅢ", ᅣᅩ: "ᅸ", ᅣᅭ: "ᅹ", ᅣᅮ: "ᆤ", ᅣᅵ: "ᅤ", ᅥᅩ: "ᅺ", ᅥᅮ: "ᅻ", ᅥᅳ: "ᅼ", ᅥᅵ: "ᅦ", ᅧᅣ: "ᆥ", ᅧᅩ: "ᅽ", ᅧᅮ: "ᅾ", ᅧᅵ: "ᅨ", ᅩᅡ: "ᅪ", ᅩᅢ: "ᅫ", ᅩᅣ: "ᆦ", ᅩᅤ: "ᆧ", ᅩᅥ: "ᅿ", ᅩᅦ: "ᆀ", ᅩᅧ: "ힰ", ᅩᅨ: "ᆁ", ᅩᅩ: "ᆂ", ᅩᅮ: "ᆃ", ᅩᅵ: "ᅬ", ᅪᅵ: "ᅫ", ᅭᅡ: "ힲ", ᅭᅢ: "ힳ", ᅭᅣ: "ᆄ", ᅭᅤ: "ᆅ", ᅭᅥ: "ힴ", ᅭᅧ: "ᆆ", ᅭᅩ: "ᆇ", ᅭᅵ: "ᆈ", ᅮᅡ: "ᆉ", ᅮᅢ: "ᆊ", ᅮᅥ: "ᅯ", ᅮᅦ: "ᅰ", ᅮᅧ: "ힵ", ᅮᅨ: "ᆌ", ᅮᅮ: "ᆍ", ᅮᅵ: "ᅱ", ᅮᅼ: "ᆋ", ᅮퟄ: "ힶ", ᅯᅳ: "ᆋ", ᅯᅵ: "ᅰ", ᅱᅵ: "ힶ", ᅲᅡ: "ᆎ", ᅲᅢ: "ힷ", ᅲᅥ: "ᆏ", ᅲᅦ: "ᆐ", ᅲᅧ: "ᆑ", ᅲᅨ: "ᆒ", ᅲᅩ: "ힸ", ᅲᅮ: "ᆓ", ᅲᅵ: "ᆔ", ᅳᅡ: "ힹ", ᅳᅥ: "ힺ", ᅳᅦ: "ힻ", ᅳᅩ: "ힼ", ᅳᅮ: "ᆕ", ᅳᅳ: "ᆖ", ᅳᅵ: "ᅴ", ᅴᅮ: "ᆗ", ᅵᅡ: "ᆘ", ᅵᅣ: "ᆙ", ᅵᅤ: "ힾ", ᅵᅧ: "ힿ", ᅵᅨ: "ퟀ", ᅵᅩ: "ᆚ", ᅵᅭ: "ퟂ", ᅵᅮ: "ᆛ", ᅵᅲ: "ퟃ", ᅵᅳ: "ᆜ", ᅵᅵ: "ퟄ", ᅵᅸ: "ힽ", ᅵᆞ: "ᆝ", ᆂᅵ: "ힱ", ᆙᅩ: "ힽ", ᆚᅵ: "ퟁ", ᆞᅡ: "ퟅ", ᆞᅥ: "ᆟ", ᆞᅦ: "ퟆ", ᆞᅮ: "ᆠ", ᆞᅵ: "ᆡ", ᆞᆞ: "ᆢ", ᆨᆨ: "ᆩ", ᆨᆫ: "ᇺ", ᆨᆯ: "ᇃ", ᆨᆸ: "ᇻ", ᆨᆺ: "ᆪ", ᆨᆾ: "ᇼ", ᆨᆿ: "ᇽ", ᆨᇂ: "ᇾ", ᆨᇧ: "ᇄ", ᆪᆨ: "ᇄ", ᆫᆨ: "ᇅ", ᆫᆫ: "ᇿ", ᆫᆮ: "ᇆ", ᆫᆯ: "ퟋ", ᆫᆺ: "ᇇ", ᆫᆽ: "ᆬ", ᆫᆾ: "ퟌ", ᆫᇀ: "ᇉ", ᆫᇂ: "ᆭ", ᆫᇫ: "ᇈ", ᆮᆨ: "ᇊ", ᆮᆮ: "ퟍ", ᆮᆯ: "ᇋ", ᆮᆸ: "ퟏ", ᆮᆺ: "ퟐ", ᆮᆽ: "ퟒ", ᆮᆾ: "ퟓ", ᆮᇀ: "ퟔ", ᆮᇧ: "ퟑ", ᆮퟏ: "ퟎ", ᆯᆨ: "ᆰ", ᆯᆩ: "ퟕ", ᆯᆪ: "ᇌ", ᆯᆫ: "ᇍ", ᆯᆮ: "ᇎ", ᆯᆯ: "ᇐ", ᆯᆷ: "ᆱ", ᆯᆸ: "ᆲ", ᆯᆹ: "ᇓ", ᆯᆺ: "ᆳ", ᆯᆻ: "ᇖ", ᆯᆼ: "ퟝ", ᆯᆿ: "ᇘ", ᆯᇀ: "ᆴ", ᆯᇁ: "ᆵ", ᆯᇂ: "ᆶ", ᆯᇘ: "ퟗ", ᆯᇚ: "ᇑ", ᆯᇝ: "ᇒ", ᆯᇡ: "ퟘ", ᆯᇤ: "ퟚ", ᆯᇥ: "ᇔ", ᆯᇦ: "ᇕ", ᆯᇫ: "ᇗ", ᆯᇰ: "ퟛ", ᆯᇹ: "ᇙ", ᆯᇾ: "ퟖ", ᆯퟣ: "ퟙ", ᆰᆨ: "ퟕ", ᆰᆺ: "ᇌ", ᆰᇂ: "ퟖ", ᆱᆨ: "ᇑ", ᆱᆺ: "ᇒ", ᆱᇂ: "ퟘ", ᆲᆮ: "ퟙ", ᆲᆺ: "ᇓ", ᆲᆼ: "ᇕ", ᆲᇁ: "ퟚ", ᆲᇂ: "ᇔ", ᆳᆺ: "ᇖ", ᆷᆨ: "ᇚ", ᆷᆫ: "ퟞ", ᆷᆯ: "ᇛ", ᆷᆷ: "ퟠ", ᆷᆸ: "ᇜ", ᆷᆹ: "ퟡ", ᆷᆺ: "ᇝ", ᆷᆻ: "ᇞ", ᆷᆼ: "ᇢ", ᆷᆽ: "ퟢ", ᆷᆾ: "ᇠ", ᆷᇂ: "ᇡ", ᆷᇫ: "ᇟ", ᆷᇿ: "ퟟ", ᆸᆮ: "ퟣ", ᆸᆯ: "ᇣ", ᆸᆵ: "ퟤ", ᆸᆷ: "ퟥ", ᆸᆸ: "ퟦ", ᆸᆺ: "ᆹ", ᆸᆼ: "ᇦ", ᆸᆽ: "ퟨ", ᆸᆾ: "ퟩ", ᆸᇁ: "ᇤ", ᆸᇂ: "ᇥ", ᆸᇨ: "ퟧ", ᆹᆮ: "ퟧ", ᆺᆨ: "ᇧ", ᆺᆮ: "ᇨ", ᆺᆯ: "ᇩ", ᆺᆷ: "ퟪ", ᆺᆸ: "ᇪ", ᆺᆺ: "ᆻ", ᆺᆽ: "ퟯ", ᆺᆾ: "ퟰ", ᆺᇀ: "ퟱ", ᆺᇂ: "ퟲ", ᆺᇦ: "ퟫ", ᆺᇧ: "ퟬ", ᆺᇨ: "ퟭ", ᆺᇫ: "ퟮ", ᆻᆨ: "ퟬ", ᆻᆮ: "ퟭ", ᆽᆸ: "ퟷ", ᆽᆽ: "ퟹ", ᆽퟦ: "ퟸ", ᇁᆸ: "ᇳ", ᇁᆺ: "ퟺ", ᇁᆼ: "ᇴ", ᇁᇀ: "ퟻ", ᇂᆫ: "ᇵ", ᇂᆯ: "ᇶ", ᇂᆷ: "ᇷ", ᇂᆸ: "ᇸ", ᇎᇂ: "ᇏ", ᇐᆿ: "ퟗ", ᇙᇂ: "ퟜ", ᇜᆺ: "ퟡ", ᇝᆺ: "ᇞ", ᇣᇁ: "ퟤ", ᇪᆼ: "ퟫ", ᇫᆸ: "ퟳ", ᇫᇦ: "ퟴ", ᇬᆨ: "ᇭ", ᇰᆨ: "ᇬ", ᇰᆩ: "ᇭ", ᇰᆷ: "ퟵ", ᇰᆺ: "ᇱ", ᇰᆿ: "ᇯ", ᇰᇂ: "ퟶ", ᇰᇫ: "ᇲ", ᇰᇰ: "ᇮ", ꥤᄀ: "ꥥ", ꥦᄃ: "ꥧ", ꥩᄇ: "ꥪ", ꥩᄋ: "ꥫ", ퟅᅡ: "ᆢ", ퟍᆸ: "ퟎ", ퟐᆨ: "ퟑ", ퟞᆫ: "ퟟ", ퟳᆼ: "ퟴ", ퟷᆸ: "ퟸ"}

const convertCompatibleCho = (c) => [...c].map(d => CONVERT_CHO[COMPAT_CHO.indexOf(d)]).join('')
const convertCompatibleJung = (c) => [...c].map(d => STD_JUNG[COMPAT_JUNG.indexOf(d)]).join('')
const convertCompatibleJong = (c) => c === '' ? '' : [...c].map(d => CONVERT_JONG[COMPAT_CHO.indexOf(d)]).join('')

const convertToCompatible = (str) => [...str].map(c => CONVERT_COMPAT[CONVERT_STD.indexOf(c)] || c).join('')

const combination = (c) => COMBINATION[c.substr(0, 2)] ? combination(COMBINATION[c.substr(0, 2)]+c.substr(2)) : c

const composeYethangul = (str) => convertToCompatible(str.normalize('NFD')).replace(YETHANGUL_SYLLABLE_2, (match, cho, jung, jong) => combination(convertCompatibleCho(cho)) + combination(convertCompatibleJung(jung)) + combination(convertCompatibleJong(jong))).normalize('NFC').replace(/;/g, '')

module.exports = composeYethangul
