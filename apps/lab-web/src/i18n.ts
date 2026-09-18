export type Locale = 'ja' | 'en';

const en = {
  kicker: 'TypeSafe Jev use cases',
  title: 'Jev Lab',
  lead: 'A collection of products where Jev only chooses the next move. Engines keep the rules, the clock, and the world.',
  hundredTitle: 'Hundred',
  hundredBody:
    'One hundred people in a tiny town. Jev chooses what someone should do next. Hunger, work, rain, and festivals change the options.',
  hundredCta: 'Open the town',
  shogiTitle: 'Jev Shogi',
  shogiBody:
    'A real shogi board. You play Sente. Jev plays Gote by choosing among legal moves, never inventing a move the engine would reject.',
  shogiCta: 'Sit at the board',
  note: 'Hundred stays on local rules unless you set DECISION_PROVIDER=jev. Shogi uses Jev when the API key is present.',
  language: 'Language',
};

const ja = {
  kicker: 'TypeSafe Jev のユースケース',
  title: 'Jev Lab',
  lead: 'Jevが「次の一手」だけを選ぶプロダクト集。ルール・時計・世界はエンジンが持つ。',
  hundredTitle: 'Hundred',
  hundredBody:
    '小さな町に100人。Jevは「この人が次に何をするか」だけを選ぶ。空腹、仕事、雨、祭りが選択肢を変える。',
  hundredCta: '町を開く',
  shogiTitle: 'Jev将棋',
  shogiBody: '実物に近い将棋盤。あなたは先手。Jevは後手として、合法手の中から次の一手だけを選ぶ。',
  shogiCta: '対局する',
  note: 'Hundredはルールモードのまま。将棋はAPIキーがあればJevが後手を指す。',
  language: '言語',
};

const dictionaries = { en, ja } as const;

export const t = (locale: Locale, key: keyof typeof en): string =>
  dictionaries[locale][key] ?? dictionaries.en[key];
