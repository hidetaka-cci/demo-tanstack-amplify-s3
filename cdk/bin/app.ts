#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { ArtifactBucketStack } from '../lib/artifact-bucket-stack'

const app = new cdk.App()

const amplifyAppId = app.node.tryGetContext('amplifyAppId') as string | undefined
const branchName = (app.node.tryGetContext('branchName') as string | undefined) ?? 'main'

if (!amplifyAppId) {
  throw new Error(
    [
      'amplifyAppId is required.',
      'Create Amplify app/branch via AWS CLI first, then deploy:',
      '  npx cdk deploy -c amplifyAppId=<APP_ID> [-c branchName=main]',
    ].join('\n'),
  )
}

new ArtifactBucketStack(app, 'AmplifyS3DeployBucketStack', {
  amplifyAppId,
  branchName,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'ap-northeast-1',
  },
  description:
    'S3 bucket and bucket policy for Amplify Hosting S3 deploy (releases/*, state/*)',
})
