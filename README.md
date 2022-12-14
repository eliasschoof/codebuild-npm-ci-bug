# CodeBuild: Minimum working example for `npm ci` bug

Minimum working example to reproduce some strange behaviour I am seeing when calling `npm ci` in a CodeBuild pipeline.

The [NPM docs](https://docs.npmjs.com/cli/v9/commands/npm-ci) recommend using `npm ci` ("clean install") instead of `npm install` in automated environments.
The AWS CDK follow this recommendation in their documentation on [CDK pipelines](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-cdk-lib.pipelines-readme.html):

```
// ...

const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
  synth: new pipelines.ShellStep('Synth', {
    // Use a connection created using the AWS console to authenticate to GitHub
    // Other sources are available.
    input: pipelines.CodePipelineSource.connection('my-org/my-app', 'main', {
      connectionArn: 'arn:aws:codestar-connections:us-east-1:222222222222:connection/7d2469ff-514a-4e4f-9003-5ca4a43cdc41', // Created using the AWS console * });',
    }),
    commands: [
      'npm ci',
      'npm run build',
      'npx cdk synth',
    ],
  }),
});

// ...
```

When I tried this, however, my pipelines failed at the `npm ci` command with a strange error message:
```
[Container] 2022/12/14 16:00:37 Running command npm ci
npm ERR! Cannot read property 'aws-cdk-lib' of undefined
```

The reason, it seems, is that `ShellStep` uses an old version of `npm` (6.14.17).
That version apparently has some trouble with installing dependencies from newer `package.json` and `package-lock.json` via `npm ci`.

A potential fix is to first update `npm`:
```
ShellStep('Synth', {
  input: ...,
  installCommands: ['npm i -g npm@global'], // update npm
  commands: [
    'npm ci',
    'npm run build',
    'npx cdk synth',
  ],
});
```

You can see this in this repo's [pipeline stack](lib/pipeline.stack.ts).
It defines two pipelines.
The first pipeline breaks at the synth step:
```
// Pipeline will fail
const brokenSynth = new ShellStep('BrokenSynth', {
  input: codeSource,
  commands: ['npm -v', 'npm ci', 'npm run build', 'npx cdk synth'],
});
```
The second pipeline succeeds:
```
// Pipeline will succeed
const workingSynth = new ShellStep('WorkingSynth', {
  input: codeSource,
  installCommands: ['npm i -g npm@latest'],
  commands: ['npm -v', 'npm ci', 'npm run build', 'npx cdk synth'],
});
```
