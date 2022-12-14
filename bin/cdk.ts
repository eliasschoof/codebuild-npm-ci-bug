#!/usr/bin/env node
import * as dotenv from 'dotenv';
import { join } from 'path';
dotenv.config({ path: join(__dirname, '..', '.env') });

import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PipelineStack } from '../lib/pipeline.stack';

const GITHUB_CONNECTION_ARN = process.env['GITHUB_CONNECTION_ARN'] ?? '';

const app = new cdk.App();

new PipelineStack(app, 'PipelineStack', {
  githubConnectionArn: GITHUB_CONNECTION_ARN,
});
