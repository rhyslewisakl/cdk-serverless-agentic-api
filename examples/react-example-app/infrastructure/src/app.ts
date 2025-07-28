#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { ReactExampleAppStack } from './react-example-app-stack';

const app = new cdk.App();

new ReactExampleAppStack(app, 'ReactExampleAppStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});