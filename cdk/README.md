# cdk

Amplify Hosting の S3 デプロイ用に、成果物バケットとバケットポリシーを管理する AWS CDK スタック。

## スタック

| 項目 | 値 |
|---|---|
| スタック名 | `AmplifyS3DeployBucketStack` |
| ソース | [`lib/artifact-bucket-stack.ts`](lib/artifact-bucket-stack.ts) |
| デフォルトリージョン | `ap-northeast-1`（`CDK_DEFAULT_REGION` で上書き可） |

### 作成するリソース

- **S3 バケット** — ビルド成果物の保存先（`removalPolicy: DESTROY`）
- **バケットポリシー** — 指定した Amplify ブランチからの `s3:ListBucket` / `s3:GetObject` を許可

Amplify アプリ・ブランチは CDK では作成しない。先に AWS CLI で作成し、`amplifyAppId` をコンテキストで渡す。

### S3 のレイアウト

CircleCI が以下のプレフィックスに書き込む想定:

```
s3://{bucket}/
├── releases/{version}/   # バージョン別ビルド成果物（git タグ名）
└── state/
    └── current-release.txt
```

## 前提

- Node.js 22+
- AWS CLI（認証済み）
- CDK ブートストラップ済み（初回のみ `npx cdk bootstrap`）
- **Amplify アプリ・ブランチが作成済み**（[ルート README](../README.md) の手順 1）

## セットアップ

```bash
pnpm install
```

## デプロイ

```bash
export APP_ID=<amplify-app-id>

npx cdk deploy AmplifyS3DeployBucketStack \
  -c amplifyAppId="$APP_ID" \
  -c branchName=main
```

### コンテキストパラメータ

| パラメータ | 必須 | デフォルト | 説明 |
|---|---|---|---|
| `amplifyAppId` | はい | — | `aws amplify create-app` で取得したアプリ ID |
| `branchName` | いいえ | `main` | `aws amplify create-branch` で作成したブランチ名 |

### スタック出力

デプロイ後、以下を CircleCI コンテキスト `aws-oidc` に設定する:

| 出力キー | CircleCI 変数 |
|---|---|
| `BucketName` | `BUCKET_NAME` |
| `AmplifyAppId` | `APP_ID` |
| `BranchName` | `BRANCH_NAME` |

```bash
aws cloudformation describe-stacks \
  --stack-name AmplifyS3DeployBucketStack \
  --region ap-northeast-1 \
  --query "Stacks[0].Outputs"
```

## その他のコマンド

```bash
npx cdk synth AmplifyS3DeployBucketStack -c amplifyAppId="$APP_ID"  # テンプレート生成
npx cdk diff AmplifyS3DeployBucketStack -c amplifyAppId="$APP_ID"    # 差分確認
```

## 削除

バケットにオブジェクトが残っていると削除できない。先に空にする:

```bash
aws s3 rm s3://<bucket-name> --recursive --region <region>

npx cdk destroy AmplifyS3DeployBucketStack \
  -c amplifyAppId="$APP_ID" \
  -c branchName=main \
  --force
```

Amplify アプリ自体は CDK 外で管理しているため、別途削除する:

```bash
aws amplify delete-app --app-id "$APP_ID" --region <region>
```
