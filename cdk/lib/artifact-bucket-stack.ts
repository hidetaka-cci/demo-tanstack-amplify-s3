import * as cdk from 'aws-cdk-lib'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as s3 from 'aws-cdk-lib/aws-s3'
import { Construct } from 'constructs'

export interface ArtifactBucketStackProps extends cdk.StackProps {
  /** aws amplify create-app で取得した APP_ID */
  amplifyAppId: string
  /** aws amplify create-branch で作成したブランチ名（原稿デフォルト: main） */
  branchName?: string
}

/**
 * Amplify Hosting への S3 デプロイ用バケットとバケットポリシー。
 *
 * 成果物は次のプレフィックスで配置する想定:
 * - releases/{version}/  … バージョン別ビルド成果物
 * - state/               … current-release.txt などの状態ファイル
 *
 * Amplify アプリ・ブランチを CLI で作成したあと、appId を渡して cdk deploy する。
 */
export class ArtifactBucketStack extends cdk.Stack {
  public readonly bucket: s3.Bucket

  constructor(scope: Construct, id: string, props: ArtifactBucketStackProps) {
    super(scope, id, props)

    const branchName = props.branchName ?? 'main'
    const accountId = cdk.Stack.of(this).account
    const region = cdk.Stack.of(this).region
    // 原稿の $(date +%s) 相当。Stack ID の UUID 先頭 8 文字（最大 39 文字: 18+12+1+8）
    const bucketSuffix = cdk.Fn.select(
      0,
      cdk.Fn.split(
        '-',
        cdk.Fn.select(2, cdk.Fn.split('/', cdk.Aws.STACK_ID)),
      ),
    )

    const encodedBranchArn = cdk.Fn.sub(
      'arn%3Aaws%3Aamplify%3A${Region}%3A${Account}%3Aapps%2F${AppId}%2Fbranches%2F${Branch}',
      {
        Region: region,
        Account: accountId,
        AppId: props.amplifyAppId,
        Branch: branchName,
      },
    )

    this.bucket = new s3.Bucket(this, 'ArtifactBucket', {
      bucketName: `amplify-s3-deploy-${accountId}-${bucketSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    })

    const amplifySourceCondition = {
      StringEquals: {
        'aws:SourceAccount': accountId,
        'aws:SourceArn': encodedBranchArn,
      },
    }

    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowAmplifyToListBucket',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('amplify.amazonaws.com')],
        actions: ['s3:ListBucket'],
        resources: [this.bucket.bucketArn],
        conditions: amplifySourceCondition,
      }),
    )

    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowAmplifyToGetObject',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('amplify.amazonaws.com')],
        actions: ['s3:GetObject'],
        resources: [this.bucket.arnForObjects('*')],
        conditions: amplifySourceCondition,
      }),
    )

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

    new cdk.CfnOutput(this, 'AmplifyAppId', {
      value: props.amplifyAppId,
      description: 'Amplify app ID (set APP_ID in shell/CI)',
    })

    new cdk.CfnOutput(this, 'BranchName', {
      value: branchName,
      description: 'Amplify branch name (set BRANCH_NAME in shell/CI)',
    })
  }
}
