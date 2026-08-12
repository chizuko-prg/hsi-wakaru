/** About / 注意事項。免責は省略しない。 */

import { ROUTES } from '../app/routes';
import { ScreenHeader } from '../components/ScreenHeader/ScreenHeader';
import type { PageProps } from './pageProps';
import './AboutPage.css';

const REFERENCES = [
  {
    label: 'FAA-H-8083-15B: Instrument Flying Handbook',
    url: 'https://www.faa.gov/sites/faa.gov/files/pilots/FAA-H-8083-15B.pdf',
  },
  {
    label: 'FAA Aeronautical Information Manual, Chapter 1: Air Navigation',
    url: 'https://www.faa.gov/air_traffic/publications/atpubs/aim_html/chap1_section_1.html',
  },
];

export function AboutPage({ navigate }: PageProps) {
  return (
    <div className="stack">
      <ScreenHeader
        title="About / 注意事項"
        monoLabel="ABOUT / このアプリについて"
        onBack={() => navigate(ROUTES.home)}
        backLabel="トップへ"
      />

      <section className="card card-raised stack-tight">
        <span className="mono-label">STUDY ONLY / 学習専用</span>
        <p className="body-text">
          このアプリは、HSI（Horizontal Situation
          Indicator）の基本的な考え方を視覚的に学ぶための学習ツールです。実際の飛行、航法判断、訓練、試験、運航には使用できません。表示は概念理解のため簡略化されています。実際の機器、公式資料、訓練機関の教材および教官の指示を優先してください。
        </p>
      </section>

      <section className="about-section">
        <h2 className="card-heading">簡略化していること</h2>
        <ul className="about-list">
          <li>磁気偏差、電波伝搬誤差、受信範囲、地形による信号変動</li>
          <li>機器固有の表示差、レイアウトの違い、局上空の詳細な挙動</li>
          <li>実際の航空機運動、旋回の遅れ、姿勢変化</li>
          <li>風の扱いは概念理解のための簡略モデルです。実際の風は高度・時間で変化します。</li>
          <li>CDIは片側10度でフルスケールとしています。これは一般的な学習上の目安です。</li>
        </ul>
      </section>

      <section className="about-section">
        <h2 className="card-heading">実機との関係</h2>
        <p className="note-text">
          表示は特定の機種・製品の再現ではありません。実機を見たときに概念のズレが出ないことを目的として、
          コンパスローズの回転、自機シンボルの固定、コースとCDIの一体表示といった
          「HSIに共通する考え方」だけを取り入れ、意匠は独自に作成しています。
        </p>
      </section>

      <section className="about-section">
        <h2 className="card-heading">使用していないもの</h2>
        <ul className="about-list">
          <li>実在するVOR局、空港、航空路</li>
          <li>実際の航空図、実際の計器製品の意匠</li>
          <li>GPS、現在地</li>
          <li>ログイン、外部データベース、個人情報の保存</li>
        </ul>
        <p className="note-text">
          ※学習の記録はこの端末の中だけに保存します。外部へは送信しません。書体の読み込みのみ Google
          Fonts を利用しています。
        </p>
      </section>

      <section className="about-section">
        <h2 className="card-heading">参考にした公式資料</h2>
        <ul className="about-list">
          {REFERENCES.map((ref) => (
            <li key={ref.url}>
              <a className="about-link" href={ref.url} target="_blank" rel="noreferrer">
                {ref.label}
              </a>
            </li>
          ))}
        </ul>
        <p className="note-text">
          ※本アプリの角度計算、境界幅、表示範囲は、概念学習用として簡略化した実装であり、実機の認証仕様を再現するものではありません。
        </p>
      </section>

      <section className="about-section">
        <h2 className="card-heading">シリーズ</h2>
        <p className="note-text">
          Sky Apps 航空航法シリーズ。VORわかる？（公開済み）に続く第2弾です。
        </p>
      </section>
    </div>
  );
}
