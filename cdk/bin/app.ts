#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'
import { ArtifactBucketStack } from '../lib/artifact-bucket-stack'

const app = new cdk.App()

new ArtifactBucketStack(app, 'AmplifyS3DeployBucketStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION ?? 'ap-northeast-1',
  },
  description:
    'S3 bucket for Amplify Hosting S3 deploy artifacts (releases/*, state/*)',
})
