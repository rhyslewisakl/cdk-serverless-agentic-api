import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
// import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';
import { Duration } from 'aws-cdk-lib';
import { LambdaFunctionEntry } from './types';

/**
 * Creates CloudWatch alarms for API Gateway metrics
 * 
 * @param scope The construct scope
 * @param api The API Gateway REST API
 * @param dashboard The CloudWatch dashboard to add widgets to
 * @param constructId The ID of the parent construct
 */
export function createApiGatewayAlarms(
  scope: Construct,
  api: apigateway.RestApi,
  dashboard: cloudwatch.Dashboard,
  constructId: string
): void {
  // Create alarm for API Gateway 4xx errors
  new cloudwatch.Alarm(scope, 'ApiGateway4xxAlarm', {
    alarmName: `${constructId}-api-4xx-errors`,
    alarmDescription: 'API Gateway 4xx error rate is too high',
    metric: new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '4XXError',
      dimensionsMap: {
        ApiName: api.restApiName,
        Stage: 'api',
      },
      statistic: 'Sum',
      period: Duration.minutes(5),
    }),
    threshold: 10,
    evaluationPeriods: 2,
    treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
  });

  // Create alarm for API Gateway 5xx errors
  new cloudwatch.Alarm(scope, 'ApiGateway5xxAlarm', {
    alarmName: `${constructId}-api-5xx-errors`,
    alarmDescription: 'API Gateway 5xx error rate is too high',
    metric: new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: '5XXError',
      dimensionsMap: {
        ApiName: api.restApiName,
        Stage: 'api',
      },
      statistic: 'Sum',
      period: Duration.minutes(5),
    }),
    threshold: 5,
    evaluationPeriods: 2,
    treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
  });

  // Create alarm for API Gateway latency
  new cloudwatch.Alarm(scope, 'ApiGatewayLatencyAlarm', {
    alarmName: `${constructId}-api-latency`,
    alarmDescription: 'API Gateway latency is too high',
    metric: new cloudwatch.Metric({
      namespace: 'AWS/ApiGateway',
      metricName: 'Latency',
      dimensionsMap: {
        ApiName: api.restApiName,
        Stage: 'api',
      },
      statistic: 'Average',
      period: Duration.minutes(5),
    }),
    threshold: 5000, // 5 seconds
    evaluationPeriods: 3,
    treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
  });

  // Add API Gateway metrics widget to dashboard
  dashboard.addWidgets(
    new cloudwatch.GraphWidget({
      title: 'API Gateway Metrics',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Count',
          dimensionsMap: {
            ApiName: api.restApiName,
            Stage: 'api',
          },
          statistic: 'Sum',
        }),
      ],
      right: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: 'Latency',
          dimensionsMap: {
            ApiName: api.restApiName,
            Stage: 'api',
          },
          statistic: 'Average',
        }),
      ],
    })
  );

  // Add error metrics widget
  dashboard.addWidgets(
    new cloudwatch.GraphWidget({
      title: 'API Gateway Errors',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '4XXError',
          dimensionsMap: {
            ApiName: api.restApiName,
            Stage: 'api',
          },
          statistic: 'Sum',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/ApiGateway',
          metricName: '5XXError',
          dimensionsMap: {
            ApiName: api.restApiName,
            Stage: 'api',
          },
          statistic: 'Sum',
        }),
      ],
    })
  );
}

/**
 * Creates CloudWatch alarms for Lambda function metrics
 * 
 * @param scope The construct scope
 * @param lambdaFunctions Map of Lambda functions
 * @param dashboard The CloudWatch dashboard to add widgets to
 * @param constructId The ID of the parent construct
 */
export function createLambdaAlarms(
  scope: Construct,
  lambdaFunctions: Record<string, LambdaFunctionEntry>,
  dashboard: cloudwatch.Dashboard,
  constructId: string
): void {
  // Create alarms for each Lambda function
  Object.entries(lambdaFunctions).forEach(([path, entry]) => {
    // Generate a safe alarm ID from the path
    const safePath = path.replace(/[^a-zA-Z0-9]/g, '');
    const alarmIdPrefix = `Lambda${safePath}`;

    // Create alarm for Lambda errors
    new cloudwatch.Alarm(scope, `${alarmIdPrefix}ErrorAlarm`, {
      alarmName: `${constructId}-lambda${path}-errors`,
      alarmDescription: `Lambda function for ${path} error rate is too high`,
      metric: entry.function.metricErrors({
        period: Duration.minutes(5),
      }),
      threshold: 3,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Create alarm for Lambda duration
    new cloudwatch.Alarm(scope, `${alarmIdPrefix}DurationAlarm`, {
      alarmName: `${constructId}-lambda${path}-duration`,
      alarmDescription: `Lambda function for ${path} duration is too high`,
      metric: entry.function.metricDuration({
        period: Duration.minutes(5),
      }),
      threshold: 25000, // 25 seconds (close to 30s timeout)
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Add Lambda metrics to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: `Lambda ${path} Metrics`,
        left: [
          entry.function.metricInvocations(),
          entry.function.metricErrors(),
        ],
        right: [
          entry.function.metricDuration(),
        ],
      })
    );
  });
}

/**
 * Creates CloudWatch alarms for CloudFront metrics
 * 
 * @param scope The construct scope
 * @param distribution The CloudFront distribution
 * @param dashboard The CloudWatch dashboard to add widgets to
 * @param constructId The ID of the parent construct
 */
export function createCloudFrontAlarms(
  scope: Construct,
  distribution: cloudfront.Distribution,
  dashboard: cloudwatch.Dashboard,
  constructId: string
): void {
  // Create alarm for CloudFront 4xx errors
  new cloudwatch.Alarm(scope, 'CloudFront4xxAlarm', {
    alarmName: `${constructId}-cloudfront-4xx-errors`,
    alarmDescription: 'CloudFront 4xx error rate is too high',
    metric: new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: '4xxErrorRate',
      dimensionsMap: {
        DistributionId: distribution.distributionId,
      },
      statistic: 'Average',
      period: Duration.minutes(5),
    }),
    threshold: 5, // 5% error rate
    evaluationPeriods: 3,
    treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
  });

  // Create alarm for CloudFront 5xx errors
  new cloudwatch.Alarm(scope, 'CloudFront5xxAlarm', {
    alarmName: `${constructId}-cloudfront-5xx-errors`,
    alarmDescription: 'CloudFront 5xx error rate is too high',
    metric: new cloudwatch.Metric({
      namespace: 'AWS/CloudFront',
      metricName: '5xxErrorRate',
      dimensionsMap: {
        DistributionId: distribution.distributionId,
      },
      statistic: 'Average',
      period: Duration.minutes(5),
    }),
    threshold: 1, // 1% error rate
    evaluationPeriods: 2,
    treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
  });

  // Add CloudFront metrics to dashboard
  dashboard.addWidgets(
    new cloudwatch.GraphWidget({
      title: 'CloudFront Metrics',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/CloudFront',
          metricName: 'Requests',
          dimensionsMap: {
            DistributionId: distribution.distributionId,
          },
          statistic: 'Sum',
        }),
      ],
      right: [
        new cloudwatch.Metric({
          namespace: 'AWS/CloudFront',
          metricName: 'CacheHitRate',
          dimensionsMap: {
            DistributionId: distribution.distributionId,
          },
          statistic: 'Average',
        }),
      ],
    })
  );

  // Add error rate metrics
  dashboard.addWidgets(
    new cloudwatch.GraphWidget({
      title: 'CloudFront Error Rates',
      left: [
        new cloudwatch.Metric({
          namespace: 'AWS/CloudFront',
          metricName: '4xxErrorRate',
          dimensionsMap: {
            DistributionId: distribution.distributionId,
          },
          statistic: 'Average',
        }),
        new cloudwatch.Metric({
          namespace: 'AWS/CloudFront',
          metricName: '5xxErrorRate',
          dimensionsMap: {
            DistributionId: distribution.distributionId,
          },
          statistic: 'Average',
        }),
      ],
    })
  );
}

/**
 * Creates monitoring resources including CloudWatch alarms and dashboards
 * 
 * @param scope The construct scope
 * @param api The API Gateway REST API
 * @param lambdaFunctions Map of Lambda functions
 * @param distribution The CloudFront distribution
 * @param constructId The ID of the parent construct
 * @returns The created CloudWatch dashboard
 */
export function createMonitoringResources(
  scope: Construct,
  api: apigateway.RestApi,
  lambdaFunctions: Record<string, LambdaFunctionEntry>,
  distribution: cloudfront.Distribution,
  constructId: string
): cloudwatch.Dashboard {
  // Create CloudWatch dashboard for monitoring
  const dashboard = new cloudwatch.Dashboard(scope, 'MonitoringDashboard', {
    dashboardName: `${constructId}-monitoring`,
  });

  // Add API Gateway metrics to dashboard
  createApiGatewayAlarms(scope, api, dashboard, constructId);

  // Add Lambda function metrics to dashboard
  createLambdaAlarms(scope, lambdaFunctions, dashboard, constructId);

  // Add CloudFront metrics to dashboard
  createCloudFrontAlarms(scope, distribution, dashboard, constructId);

  return dashboard;
}