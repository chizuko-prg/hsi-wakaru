# HSIわかる？ 設計提案 v0.1（実装前確認用）

作成日: 2026-08-12 / 状態: **未承認・実装前**

---

## 1. 現在の環境確認

### 1.1 このフォルダ

| 項目 | 状態 |
|---|---|
| `01_Projects/HSI-wakaru/` | **空** |
| gitリポジトリ | 未初期化 |

### 1.2 ツールチェーン

| ツール | バージョン |
|---|---|
| Node.js | v24.17.0 |
| npm | 11.13.0 |
| git | 2.39.2 |
| pnpm / bun | 未インストール（npmを使う） |

### 1.3 参照できる既存資産

| 場所 | 内容 |
|---|---|
| `01_Projects/vor-wakaru/` | シリーズ第1弾。構成をそのまま踏襲できる |
| `04_Document/Design System/sky-apps-design-system-v1.0.md` | 共通デザインシステム（トークン・タイポ・禁止事項・リリース前レビュー7観点） |
| `Sky Apps/.claude/settings.json` | Bash実行前の `guard-git.sh` フック（git操作の安全確認）が有効 |
| `Sky Apps/.claude/launch.json` | 開発サーバ定義の置き場所。プロジェクト側にも `.claude/launch.json` を置く運用 |

### 1.4 VORわかる？から引き継ぐ設計原則（重要）

1. **判定値は1か所でのみ導出する** — `deriveVorState()` 相当を1本だけ持ち、CDIやTO/FROMを状態として二重に持たない
2. **機首方位は判定に使わない** — ラジアル・TO/FROM・CDIの計算に heading を一切渡さない
3. **正解データを問題に直書きしない** — レッスンの正解は判定ロジックの算出値から組み立て、テストで一致を担保する
4. **画面側にレッスン固有の分岐を書かない** — レッスンは純粋なデータ（`teach` / `interact` / `compare` / `quiz` / `summary`）

HSIわかる？でも、この4点をそのまま守る。

---

## 2. 推奨フォルダ構成

VORわかる？と同じ形にする。シリーズを横断して読めることを優先する。

```
HSI-wakaru/
├── .claude/launch.json          開発サーバ定義（port 5174）
├── .gitignore / .oxlintrc.json
├── index.html
├── package.json / vite.config.ts / tsconfig*.json
├── README.md
├── assets/                      アイコン元画像（配信物ではない）
├── public/                      favicon, manifest
└── src/
    ├── main.tsx / App.tsx / index.css
    ├── app/
    │   ├── routes.ts            画面定義（ハッシュルート）
    │   ├── useHashRoute.ts
    │   ├── useHsiState.ts       HSI状態の保持と操作
    │   └── useProgress.ts       学習記録
    ├── domain/hsi/              ★UIに依存しない純粋関数のみ
    │   ├── types.ts
    │   ├── angles.ts            正規化・符号付き差・最短経路補間
    │   ├── geometry.ts          世界座標（東=+x, 北=+y）
    │   ├── constants.ts         フルスケール角、境界幅など
    │   ├── deriveHsiState.ts    ★すべての表示の source of truth
    │   ├── wind.ts              Track / 偏流角（Lesson 5）
    │   └── describeState.ts     読み上げ・状態文の生成
    ├── lessons/
    │   ├── lessonTypes.ts       手順の型
    │   ├── lesson1.ts 〜 lesson5.ts
    │   ├── lessonCatalog.ts / lessonScore.ts / lessonResume.ts
    │   └── *.test.ts
    ├── components/
    │   ├── HsiIndicator/        ★主役の計器
    │   ├── PlanView/            上空図（Lesson 3以降）
    │   ├── AngleSlider/         Heading / Course / Wind 共通スライダー
    │   ├── WindControl/         Lesson 5
    │   ├── ExplanationCard/ ChoiceList/ ScreenHeader/
    │   ├── LessonComplete/ LiveStatus/ SafetyNote/ ConfirmSheet/
    ├── pages/                   Home / Lessons / Lesson / Instrument / About / ComingSoon
    ├── storage/progressStorage.ts
    └── styles/                  tokens.css / global.css
```

---

## 3. 技術方針

### 3.1 技術スタック（VORわかる？と同一）

| 種別 | 採用 | 理由 |
|---|---|---|
| UI | React 19 + TypeScript | 既存と同じ。学習コスト0 |
| ビルド | Vite | 同上 |
| テスト | Vitest | HSI判定・風計算・レッスンデータの単体テスト |
| Lint | oxlint | 同上 |
| ルーティング | ハッシュベース自作 | ライブラリ非依存、Vercel側の設定不要 |
| 状態管理 | **Reactのみ**（Context・外部ライブラリなし） | 状態が1オブジェクトで完結するため |
| スタイル | 素のCSS + カスタムプロパティ | Design System v1.0 準拠 |
| 描画 | **インラインSVG** | 回転・目盛り・矢印を1つの座標系で扱えるため |
| アニメ | **CSS transition のみ** | ライブラリ不要。§7参照 |
| 配信 | Vercel + @vercel/analytics | 既存と同じ |

バックエンド・ログイン・外部DB・GPSは**なし**。

### 3.2 HSIドメインの設計（ここが本アプリの核）

**状態（保持するのはこれだけ）**

```ts
interface HsiState {
  station: Point;        // 基準局（コースの基準点）
  aircraft: Point;       // 自機位置（世界座標）
  headingDeg: number;    // 0..359 機首方位
  courseDeg: number;     // 0..359 選択コース（CRS）
  wind: Wind | null;     // Lesson 5 のみ。{ fromDeg, speedKt }
  tasKt: number;         // 対気速度（風計算用。既定100kt）
}
```

**導出（`deriveHsiState()` が全部つくる。画面はここからしか描かない）**

```ts
interface HsiDerivedState {
  // --- VORわかる？と同じ判定（headingは一切使わない）---
  radialDeg, bearingToStationDeg,
  toFrom, toFromBoundary,
  cdiDirection, cdiDeflectionNormalized, cdiAngularErrorDeg, isStationZone,

  // --- HSI固有（表示の回転量）---
  roseRotationDeg,        // = -heading。コンパスローズの回転
  courseOnRoseDeg,        // = course - heading。ローズ上のコース矢印の向き
  // --- Lesson 4 ---
  interceptAngleDeg,      // heading と course の差
  interceptTrend,         // 'closing' | 'holding' | 'opening'
  // --- Lesson 5 ---
  trackDeg,               // 風を考慮した対地進路。無風なら heading と同値
  driftAngleDeg,          // track - heading
  requiredHeadingDeg,     // course を維持するために必要な機首方位
}
```

**守るルール（指示書の要件をコードの制約に落としたもの）**

| 指示書のルール | 実装での担保 |
|---|---|
| 自機シンボルは上向き固定 | 機体シンボルは回転レイヤの**外**に置く。SVG上で定数 |
| Heading変化でローズが回転 | `roseRotationDeg = -heading` のみ。他に回転源を作らない |
| CourseはHeadingと独立 | `courseDeg` は独立した state。heading変更で書き換えない（テストで担保） |
| CDIはCourseに対する偏位 | CDI計算に heading を渡さない（VORわかる？の原則を継承。テストで担保） |
| 実機コピー禁止 | 目盛り・書体・配色は自作。Garmin系の**概念**（ローズ回転・コース矢印一体のCDI）のみ参照 |

### 3.3 スライダー方式の実装

- ネイティブ `<input type="range">` を使う
  - 理由：キーボード操作・スクリーンリーダー・タップ判定が無料で手に入る。自作ノブはドラッグ必須になり、VORわかる？の「ドラッグ必須の操作を作らない」方針に反する
- 高さ44px以上、つまみは大きめ。現在値は mono 30px で常時表示（例 `HDG 045°`）
- 3桁ゼロ埋め表示（`005°`）で計器らしさを出す
- スライダー本体は `0..359`。**±1 / ±10 の微調整ボタンを併設**する

> **確認事項A**：360°の折り返し（359→0）で、スライダーのつまみが端から端へ飛びます。
> 案1：上記のとおり「スライダー + ±ボタン」（推奨。素直で実装も単純）
> 案2：内部で累積角を持ち、`-360..+720` の広いレンジにする（連続操作は滑らかだが、値と位置の対応が直感に反する）
> 案1で進める想定です。

---

## 4. 画面構成案

### 4.1 画面一覧（ハッシュルート）

| ルート | 画面 | 初期リリース |
|---|---|---|
| `/` | ホーム | R0 |
| `/lessons` | レッスン一覧（5つ） | R2 |
| `/lesson/lesson1..5` | 学習画面（修了表示も同画面内） | R2〜R5 |
| `/instrument` | 計器を見る（各部をタップして意味を確認） | R1 |
| `/free` | 自由に動かす | R6（それまで「準備中」） |
| `/about` | 注意事項・免責・参考資料 | R0 |
| `/course-complete` | 基本コース修了 | R6（それまで「準備中」） |

未実装は必ず「準備中」画面にし、**行き止まりを作らない**（Design System UXルール4）。

### 4.2 学習画面のレイアウト（スマホ縦・上から順）

```
┌─────────────────────────┐
│ ScreenHeader  LESSON 2 / 進捗 ●●○○  [戻る] │
├─────────────────────────┤
│ 上空図 PlanView          ← Lesson 3 以降のみ  │
├─────────────────────────┤
│                          │
│      HSI計器（主役）       │   ← ダーク背景・円形
│                          │
├─────────────────────────┤
│ LiveStatus（状態を文でも通知）           │
├─────────────────────────┤
│ 操作パネル                │
│  HDG ──●────  045°  [-10][-1][+1][+10] │
│  CRS ────●──  090°  [-10][-1][+1][+10] │
│  （Lesson 5のみ）WIND 270°/20kt         │
├─────────────────────────┤
│ 説明カード（この手順で伝えること）        │
├─────────────────────────┤
│ 主ボタン（1画面に1つだけ）  次へ →        │
└─────────────────────────┘
```

**Lesson 1・2 では上空図を出さない。** HSI計器だけに集中させる。
「向いている方向」と「選んだコース」の違いは計器の中だけで完結する話で、
上空図を先に出すと情報量が増えて Lesson 1 の目的（部品名を教えない）とぶつかるため。
上空図は **Lesson 3 で初めて登場**させ、「図と計器が同じ状態を映している」ことを見せる。

### 4.3 HSI計器の構成（実機の概念に沿った層構造）

```
HsiIndicator（SVG 1枚）
├─ 固定層（絶対に回さない）
│   ├─ ベゼル・ラバーライン（上部の指標）
│   ├─ 自機シンボル（常に上向き）
│   └─ 上部の HDG 数値窓
├─ 回転層1  rotate(-heading)   ← コンパスローズ
│   ├─ 目盛り（10°刻み・30°ごとに数字）
│   └─ 回転層2  rotate(course) ← コース矢印とCDIは一体で回る
│       ├─ コース矢印（頭・尾）
│       ├─ CDIバー（偏位に応じて横スライド）
│       ├─ 偏位ドット
│       └─ TO/FROM 三角
└─ 補助層（レッスンで出し入れ）
    └─ Track指標（Lesson 5）
```

**回転層2を回転層1の内側に置く**のが実機HSIの本質。これにより
`heading` を変えるとローズごとコース矢印も回り、`course` を変えるとコース矢印だけが回る。
つまり指示書の Lesson 2 の体験が、**条件分岐なしに構造から自然に出る**。

### 4.4 レッスン別の表示部品

| Lesson | 上空図 | ローズ | コース矢印 | CDI | TO/FROM | 風 |
|---|---|---|---|---|---|---|
| 1 HSIって何？ | − | ● | − | − | − | − |
| 2 HeadingとCourse | − | ● | ● | − | − | − |
| 3 CDIを読む | ● | ● | ● | ● | ●(復習) | − |
| 4 Intercept | ● | ● | ● | ● | ● | − |
| 5 Tracking | ● | ● | ● | ● | ● | ● |

「不要な部品は出さない」は VORわかる？の `VisibleElements` と同じ仕組みで実現する。

### 4.5 Lesson 4 の設計制約（承認済み・必須）

**「CDIが右に出たら右へ曲がる」という方向の暗記教材にしてはならない。**
上空図とHSI表示の**対応関係から判断させる**設計を維持する。

実装上の担保：

1. **問いの立て方** — 「CDIはどちらに出ますか」ではなく、
   「上空図のこの位置と機首のとき、HSIはどう見えますか」／
   「このHSI表示のとき、上空図での自分はどこにいますか」の**双方向**で問う
2. **図と計器を必ず同時に出す** — Lesson 4 の全手順で `planView: true`。
   片方だけを見て答えられる手順を作らない
3. **同じCDI表示で答えが変わる場面を必ず入れる** —
   CDI偏位が同じでも、機首（インターセプト角）が違えば
   「近づいている／維持している／離れている」が変わることを `compare` 手順で見せる。
   これが方向暗記を成立させない決定打になる
4. **`interceptTrend`（closing / holding / opening）は CDIの左右ではなく、
   コース線と機首の関係から導出する** — CDIの符号だけからは求めない
5. **捕捉後の手順を必ず置く** — 「CDI中央＝終了」ではなく、
   そこから機首をコース方向へ合わせるところまでを1本の流れにする

---

---

## 5. コンポーネント設計

**原則：判定は `domain/hsi` だけ。コンポーネントは受け取った値を描くだけ（Presentational）。**

| コンポーネント | 受け取るもの | 責務 |
|---|---|---|
| `HsiIndicator` | `state`, `derived`, `visible` | 計器全体。SVG 1枚 |
| `CompassRose` | `rotationDeg` | 目盛りと数字。回転だけ |
| `CourseNeedle` | `rotationDeg`, `deflection`, `toFrom` | コース矢印＋CDI＋TO/FROM |
| `AircraftSymbol` | （なし） | 固定シンボル |
| `PlanView` | `state`, `derived`, `visible` | 上空図。コース線・自機・風 |
| `AngleSlider` | `label`, `value`, `onChange` | Heading / Course / Wind で共通利用 |
| `WindControl` | `wind`, `onChange` | 風向・風速 |
| `LiveStatus` | `text` | `aria-live` による状態通知（画面に1つだけ） |

`ExplanationCard` / `ChoiceList` / `ScreenHeader` / `LessonComplete` / `SafetyNote` / `ConfirmSheet`
は VORわかる？から**考え方を移植**する（コピペではなく、HSI向けに文言と props を作り直す）。

---

## 6. 状態管理

- 外部ライブラリなし。`useHsiState()` が `HsiState` を保持し、`useMemo` で `deriveHsiState()` を通す
- **Context は使わない**。画面をまたぐ共有状態を持たず、各画面が開いたときに必要な状態を組み立てる（VORわかる？と同じ）
- レッスンの手順は「基準状態 + 手順ごとの差分」で組み立てる（`buildStepState()` 相当）
- 学習記録：`localStorage` キー `hsiWakaru.progress.v1`
  - 保存するもの：各レッスンの状態（未開始/進行中/完了）、再開位置、完了日時
  - 保存しないもの：回答内容、正解数、スライダーの位置
  - 壊れた値・未知のスキーマは初期値へ安全に戻す（アプリを止めない）

---

## 7. アニメーション方針

**ライブラリは使わない。** 動かすのは実質「角度」だけなので、CSSで足りる。

1. SVGの `<g>` に `style={{ transform: 'rotate(Xdeg)' }}` を当て、`transition: transform 320ms cubic-bezier(.22,.61,.36,1)` を効かせる
2. **最短経路で回す** — 359°→1° のとき357°逆走しないよう、`domain/hsi/angles.ts` に「前回値を基準に連続角へ展開する」関数（unwrap）を置き、表示用の角度は単調に伸ばした値を使う
3. CDIバーの横移動も同じく `transform: translateX()` の transition
4. `@media (prefers-reduced-motion: reduce)` で全 transition を無効化（Design System アクセシビリティ要件）
5. スライダー操作中は値が連続で来るため、transition時間を短く（80ms）に落とす。手を離した後の自動変化（レッスンの手順切替）は320msでゆっくり見せる

`requestAnimationFrame` を使うのは、Lesson 4 の「インターセプトの様子を再生する」を入れる場合のみ。
R4で必要性を判断する（まずはスライダー操作だけで成立させる）。

---

## 8. データ構造（レッスン定義）

VORわかる？の `lessonTypes.ts` を土台に、HSI向けに拡張する。

```ts
type StepKind = 'teach' | 'interact' | 'compare' | 'quiz' | 'summary';

// 手順の中で利用者が動かせるもの（VOR版の 'obs' | 'heading' | 'courseOffset' を置き換え）
type InteractControl = 'heading' | 'course' | 'position' | 'wind';

interface LessonStepBase {
  id: string;
  title: string;
  visible: VisibleElements;   // この手順で出す部品
  headingDeg?: number;        // 手順の初期 heading
  courseDeg?: number;         // 手順の初期 course
  courseOffsetDeg?: number;   // コースからの横ずれで自機を置く
  wind?: Wind | null;
  spotlight?: 'rose' | 'courseArrow' | 'cdi' | 'toFrom' | 'track';
  showPlanView?: boolean;
}
```

`VisibleElements` は HSI 用に定義し直す：

```ts
interface VisibleElements {
  rose: boolean; headingReadout: boolean;
  courseArrow: boolean; courseReadout: boolean;
  cdi: boolean; toFrom: boolean;
  planView: boolean; track: boolean; wind: boolean;
}
```

**確認問題の正解は `deriveHsiState()` の算出値から組み立て、直書きしない。**
（VORわかる？と同じく、テストで「レッスンデータの正解＝ロジックの算出値」を検証する）

---

## 9. スマホ表示の確認方法

| 段階 | 方法 |
|---|---|
| 開発中 | `.claude/launch.json` に `hsi-wakaru` / port **5174** を定義（vor-wakaruの5173と衝突させない） |
| 随時 | ブラウザを 375×812（iPhone相当）にリサイズして確認。横スクロールが出ないことを毎回見る |
| 節目 | `npm run dev -- --host` で同一Wi-Fi内のLAN IPを出し、**iPhone Safari実機**で確認（Design System の合格基準） |
| リリース前 | Design System §9 の7観点レビュー（Logic / UX / Design / Aviation / Accessibility / Mobile / PC）を通す |

チェック項目：本文16.5px以上・データ値21px以上、タップ領域44px以上、`env(safe-area-inset-*)` 対応、
縦持ちで横スクロールなし、`prefers-reduced-motion` で回転停止。

---

## 10. 実装ステップ（段階リリース）

一気に作らず、各段で**動く状態**にして確認を挟む。

| # | 内容 | 完了の目安 |
|---|---|---|
| **R0** | 環境構築：Vite雛形、tokens/global.css、ハッシュルーター、ホーム／About（免責文を最初に入れる）、準備中画面 | ホームとAboutが表示され、行き止まりがない |
| **R1** | **HSIドメイン + HsiIndicator**：`deriveHsiState()` とテスト、計器SVG、Heading/Courseスライダー、`/instrument` 画面 | スライダーでローズとコース矢印が正しく動く。**ここで一度確認をもらう** |
| **R2** | レッスン基盤（データ型・学習画面・進捗保存）+ **Lesson 1** | Lesson 1が最後まで通せて、進捗が残る |
| **R3** | **Lesson 2**、PlanView実装、**Lesson 3** | 図と計器が同じ状態を映す |
| **R4** | **Lesson 4（Intercept）** | 「CDI中央＝終了ではない」まで伝わる |
| **R5** | **Lesson 5（Tracking / 風）** + `wind.ts` | 無風と有風の違いが体験できる |
| **R6** | 仕上げ：アイコン、自由に動かす、修了画面、README、Sky Apps Review 7観点、Vercel配信 | 公開可能 |

**R1が最大の山場**です。ここのSVGとドメインが固まれば、以降はデータを足していく作業になります。

---

## 11. 確認したいこと

| # | 項目 | 提案 |
|---|---|---|
| A | 360°折り返しのスライダー挙動（§3.3） | 「スライダー + ±1/±10ボタン」で進めたい |
| B | Lesson 1・2 で上空図を出さない方針（§4.2） | 情報量を絞るため、上空図はLesson 3から。これでよいか |
| C | git初期化 | `git init` して段階ごとにコミットしたい（実行前に確認します） |
| D | `/free`（自由に動かす）の優先度 | VORわかる？では未実装のまま。HSIでは R6 に置く想定 |
| E | アイコン（飛行機＋コックピット計器） | R6でまとめて作成。素材の用意方法を後で相談 |
| F | 風の扱いの深さ（Lesson 5） | 内部計算は正確に持ちつつ、画面には角度の数値を出さず「流される／機首を振る」の概念だけ見せる |

---

## 12. 免責（最初から入れる）

> **STUDY ONLY / 学習専用**
> このアプリは学習専用です。実際の飛行、航法判断、訓練、試験、運航には使用できません。

簡略化する点（About画面に明記）：磁気偏差、電波伝搬誤差・受信範囲、機器固有の表示差、
局上空の詳細な挙動、実際の航空機運動、CDIフルスケール角の機種差、風の詳細なモデル。
実在するVOR局・空港・航空路・航空図は使用しない。
