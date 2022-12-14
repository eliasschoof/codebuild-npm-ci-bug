import { Stack, StackProps } from 'aws-cdk-lib';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';

interface PipelineStackProps extends StackProps {
  githubConnectionArn: string;
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const codeSource = CodePipelineSource.connection('estrehle/codebuild-npm-ci-bug', 'main', {
      connectionArn: props.githubConnectionArn,
    })

    // Pipeline with 'npm ci' will fail
    const brokenSynth = new ShellStep('BrokenSynth', {
      input: codeSource,
      commands: ['npm i -g npm@latest', 'npm ci'],
    });

    new CodePipeline(this, 'BrokenPipeline', { synth: brokenSynth });

    // Pipeline with 'npm install' will succeed
    const workingSynth = new ShellStep('WorkingSynth', {
      input: codeSource,
      commands: ['npm install'],
    });

    new CodePipeline(this, 'WorkingPipeline', { synth: workingSynth });
  }
}
