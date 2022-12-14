import { Stack, StackProps } from 'aws-cdk-lib';
import { CodePipeline, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { ApplicationStage } from './application.stage';

interface PipelineStackProps extends StackProps {
  githubConnectionArn: string;
}

export class PipelineStack extends Stack {
  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const codeSource = CodePipelineSource.connection('estrehle/codebuild-npm-ci-bug', 'main', {
      connectionArn: props.githubConnectionArn,
    });

    // Pipeline will fail
    const brokenSynth = new ShellStep('BrokenSynth', {
      input: codeSource,
      commands: ['npm -v', 'npm ci', 'npm run build', 'npx cdk synth'],
    });

    const brokenPipeline = new CodePipeline(this, 'BrokenPipeline', { synth: brokenSynth });

    brokenPipeline.addStage(new ApplicationStage(this, 'BrokenStage'));

    // When installing the newest version of npm, pipeline will succeed
    const workingSynth = new ShellStep('WorkingSynth', {
      input: codeSource,
      installCommands: ['npm i -g npm@latest'],
      commands: ['npm -v', 'npm ci', 'npm run build', 'npx cdk synth'],
    });

    const workingPipeline = new CodePipeline(this, 'WorkingPipeline', { synth: workingSynth });

    workingPipeline.addStage(new ApplicationStage(this, 'WorkingStage'));
  }
}
