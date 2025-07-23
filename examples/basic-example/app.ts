import { App, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { CDKServerlessAgenticAPI } from '../../src';

/**
 * Example stack that demonstrates basic usage of the CDKServerlessAgenticAPI
 */
class BasicExampleStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create the serverless web app construct with default settings
    const webApp = new CDKServerlessAgenticAPI(this, 'BasicWebApp');

    // Add a public API endpoint
    webApp.addResource({
      path: '/hello',
      lambdaSourcePath: './lambda/hello',
      requiresAuth: false
    });

    // Add an authenticated API endpoint
    webApp.addResource({
      path: '/profile',
      lambdaSourcePath: './lambda/profile',
      requiresAuth: true
    });
  }
}

// Initialize the CDK app
const app = new App();
new BasicExampleStack(app, 'BasicExampleStack');
app.synth();