# Syunsaku - 中間地点駅・レストラン検索

二人のユーザーの位置情報から中間地点を算出し、その周辺の駅を表示して駅選択後に施設を検索するWebアプリケーションです。

## 機能

- **位置入力**: 住所入力、現在地取得、地図クリックで2つの位置を指定
- **中間地点計算**: 2点間の地理的中点を自動算出
- **駅検索**: 中間地点周辺の駅を距離順で表示（3km圏内）
- **駅選択**: 好みの駅をクリックして選択
- **施設検索**: 選択した駅周辺のレストラン・カフェ・ファストフードを検索
- **地図表示**: インタラクティブな地図で位置・駅・施設を可視化
- **フィルタリング**: カテゴリ別での絞り込み機能

## 使用方法

1. ブラウザで `index.html` を開く
2. 場所1と場所2を入力（住所入力、現在地取得、地図クリック）
3. 「中間地点を検索」ボタンをクリック
4. 表示された駅一覧から好みの駅を選択
5. 駅周辺の施設が自動表示され、クリックで地図確認可能

## 開発環境での実行方法

### 前提条件
- モダンなWebブラウザ（Chrome、Firefox、Safari、Edge）
- インターネット接続（API通信のため）

### ローカル開発サーバーの起動

静的ファイルのため、HTTPサーバーを起動してローカルで確認します：

**方法1: Python を使う場合**
```bash
# Python 3.x の場合
python -m http.server 8000

# Python 2.x の場合  
python -m SimpleHTTPServer 8000
```

**方法2: Node.js を使う場合**
```bash
# npx を使用（Node.js 5.2+）
npx http-server

# または http-server をグローバルインストール
npm install -g http-server
http-server -p 8000
```

**方法3: PHP を使う場合**
```bash
php -S localhost:8000
```

**方法4: Live Server (VS Code拡張) を使う場合**
1. VS Code で Live Server 拡張をインストール
2. `index.html` を右クリック → "Open with Live Server"

### ブラウザでアクセス

サーバー起動後、ブラウザで以下にアクセス：
- http://localhost:8000

### 開発者ツールでの確認・デバッグ

1. **開発者ツールを開く**: F12 または右クリック → "検証"
2. **Console タブ**: JavaScript エラーがないか確認
3. **Network タブ**: API通信（Nominatim、Overpass API）の状況を確認
4. **位置情報許可**: 現在地取得機能使用時は「許可」を選択

### トラブルシューティング

**地図が表示されない場合**
- インターネット接続を確認
- ブラウザのコンソールでエラーをチェック

**位置情報が取得できない場合**
- HTTPS接続が必要（本番環境）
- ブラウザの位置情報許可設定を確認

**API通信エラーの場合**
- Overpass API の応答時間が長い場合があります（最大25秒）
- Nominatim API のレート制限（1秒に1リクエスト）

## 技術スタック

- **HTML/CSS/JavaScript**: 純粋なWeb技術で実装
- **Leaflet.js**: インタラクティブ地図ライブラリ
- **OpenStreetMap**: 無料の地図データ
- **Nominatim API**: 住所検索・逆引き
- **Overpass API**: 駅・施設データ検索

## 特徴

- **APIキー不要**: OpenStreetMapとOverpass APIを使用
- **駅ベース検索**: より実用的な駅を中心とした施設検索
- **レスポンシブ対応**: モバイルデバイスでも利用可能
- **軽量**: 外部依存が少なくロードが高速
- **無料**: 完全無料で利用可能

## デプロイ

### GitHub Pages
1. GitHubリポジトリにファイルをプッシュ
2. Settings > Pages > Source で "Deploy from a branch" を選択
3. Branch で "main" を選択して Save

### Netlify Drop
1. [Netlify Drop](https://app.netlify.com/drop) にアクセス
2. プロジェクトフォルダをドラッグ&ドロップ

## ファイル構成

```
syunsaku/
├── index.html    # メインページ
├── style.css     # スタイルシート
├── script.js     # アプリケーションロジック
└── README.md     # このファイル
```