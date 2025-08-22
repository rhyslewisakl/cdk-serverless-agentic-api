#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { CloudscapeExampleStack } from '../lib/cloudscape-example-stack';

const app = new cdk.App();
new CloudscapeExampleStack(app, 'CloudscapeExampleStack', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: process.env.CDK_DEFAULT_REGION 
  },
});