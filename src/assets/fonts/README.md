# 同梱フォント

外部のフォント配信（Google Fonts など）は使わない。ここにあるファイルだけを同一オリジンから配信する。

| ファイル | 書体 | ウェイト | サブセット | サイズ | SHA-256 |
|---|---|---|---|---|---|
| `ibm-plex-mono-latin-600-normal.woff2` | IBM Plex Mono | 600 | latin | 15,620 B | `0d1f0b8d0722224e32e9f28261bdc86c79115be73444ae5eceb73976a1bcdf83` |
| `ibm-plex-mono-latin-700-normal.woff2` | IBM Plex Mono | 700 | latin | 14,908 B | `4f84d86cfd060f4ded334358ff8a4c81d4db2ed5addd568359d693f44a87765a` |

- 出所: npm `@fontsource/ibm-plex-mono` **5.3.0** の `files/`（無加工でコピー）
- 書体の原典: IBM Plex（https://github.com/IBM/plex）
- ライセンス: SIL Open Font License 1.1（`IBM-Plex-OFL-LICENSE.txt`）。再配布は無改変で行う。
- 日本語は同梱しない。`--font-ui`（`src/styles/tokens.css`）のとおり、端末のシステムフォントで表示する。
- 追加・更新するときは、この表と `src/styles/fonts.css` を一緒に直す。
