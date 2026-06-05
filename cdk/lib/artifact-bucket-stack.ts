import * as cdk from 'aws-cdk-lib'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'

/**
 * Amplify Hosting への S3 デプロイ用バケット。
 *
 * 記事の AWS CLI 手順に合わせ、成果物は次のプレフィックスで配置する想定:
 * - releases/{version}/  … バージョン別ビルド成果物
 * - state/               … current-release.txt などの状態ファイル
 *
 * バケットポリシー（Amplify からの List/Get 許可）は Amplify アプリ作成後に
 * AWS CLI で別途設定する。本スタックは S3 バケットのみを作成する。
 */
export class ArtifactBucketStack extends cdk.Stack {
  public readonly bucket: s3.Bucket

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    const accountId = cdk.Stack.of(this).account
    const stackSuffix = cdk.Fn.select(
      2,
      cdk.Fn.split('/', cdk.Stack.of(this).stackId),
    )

    this.bucket = new s3.Bucket(this, 'ArtifactBucket', {
      // 記事: amplify-s3-deploy-${ACCOUNT_ID}-$(date +%s)
      bucketName: `amplify-s3-deploy-${accountId}-${stackSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'Artifact bucket name (set BUCKET_NAME in shell/CI)',
      exportName: `${this.stackName}:BucketName`,
    })

    new cdk.CfnOutput(this, 'BucketArn', {
      value: this.bucket.bucketArn,
      description: 'Artifact bucket ARN',
      exportName: `${this.stackName}:BucketArn`,
    })

  }
}
