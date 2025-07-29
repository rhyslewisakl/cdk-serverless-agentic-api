"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_cdk_lib_1 = require("aws-cdk-lib");
const dynamodb = require("aws-cdk-lib/aws-dynamodb");
// import * as lambda from 'aws-cdk-lib/aws-lambda';
const src_1 = require("../../src");
/**
 * Example stack that demonstrates advanced usage of the CDKServerlessAgenticAPI
 * with custom domain and DynamoDB integration
 */
class AdvancedExampleStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Create a DynamoDB table for storing user data
        const userTable = new dynamodb.Table(this, 'UserTable', {
            partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
            sortKey: { name: 'dataType', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true
        });
        // Create a DynamoDB table for storing product data
        const productTable = new dynamodb.Table(this, 'ProductTable', {
            partitionKey: { name: 'productId', type: dynamodb.AttributeType.STRING },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            pointInTimeRecovery: true
        });
        // Create the serverless web app construct with custom domain
        const webApp = new src_1.CDKServerlessAgenticAPI(this, 'AdvancedWebApp', {
            domainName: 'example.com',
            certificateArn: 'arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012',
            enableLogging: true
        });
        // Add API resources for user management
        const getUsersFunction = webApp.addResource({
            path: '/users',
            method: 'GET',
            lambdaSourcePath: './lambda/users/get',
            requiresAuth: true,
            environment: {
                USER_TABLE_NAME: userTable.tableName
            }
        });
        const createUserFunction = webApp.addResource({
            path: '/users',
            method: 'POST',
            lambdaSourcePath: './lambda/users/create',
            requiresAuth: true,
            environment: {
                USER_TABLE_NAME: userTable.tableName
            }
        });
        const getUserProfileFunction = webApp.addResource({
            path: '/users/{userId}/profile',
            method: 'GET',
            lambdaSourcePath: './lambda/users/profile',
            requiresAuth: true,
            environment: {
                USER_TABLE_NAME: userTable.tableName
            }
        });
        // Add API resources for product management
        const getProductsFunction = webApp.addResource({
            path: '/products',
            method: 'GET',
            lambdaSourcePath: './lambda/products/get',
            requiresAuth: false,
            environment: {
                PRODUCT_TABLE_NAME: productTable.tableName
            }
        });
        const createProductFunction = webApp.addResource({
            path: '/products',
            method: 'POST',
            lambdaSourcePath: './lambda/products/create',
            requiresAuth: true,
            cognitoGroup: 'admin',
            environment: {
                PRODUCT_TABLE_NAME: productTable.tableName
            }
        });
        const getProductDetailsFunction = webApp.addResource({
            path: '/products/{productId}',
            method: 'GET',
            lambdaSourcePath: './lambda/products/details',
            requiresAuth: false,
            environment: {
                PRODUCT_TABLE_NAME: productTable.tableName
            }
        });
        // Grant permissions to Lambda functions
        userTable.grantReadData(getUsersFunction);
        userTable.grantReadWriteData(createUserFunction);
        userTable.grantReadData(getUserProfileFunction);
        productTable.grantReadData(getProductsFunction);
        productTable.grantReadWriteData(createProductFunction);
        productTable.grantReadData(getProductDetailsFunction);
        // Validate security configuration
        webApp.validateSecurity();
        // Outputs
        new aws_cdk_lib_1.CfnOutput(this, 'CloudFrontDomainName', {
            value: webApp.distribution.distributionDomainName,
            description: 'CloudFront domain name'
        });
        new aws_cdk_lib_1.CfnOutput(this, 'ApiEndpoint', {
            value: webApp.api.url,
            description: 'API Gateway endpoint URL'
        });
        new aws_cdk_lib_1.CfnOutput(this, 'UserPoolId', {
            value: webApp.userPool.userPoolId,
            description: 'Cognito User Pool ID'
        });
        new aws_cdk_lib_1.CfnOutput(this, 'UserPoolClientId', {
            value: webApp.userPoolClient.userPoolClientId,
            description: 'Cognito User Pool Client ID'
        });
    }
}
// Initialize the CDK app
const app = new aws_cdk_lib_1.App();
new AdvancedExampleStack(app, 'AdvancedExampleStack');
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQWdFO0FBRWhFLHFEQUFxRDtBQUNyRCxvREFBb0Q7QUFDcEQsbUNBQW9EO0FBRXBEOzs7R0FHRztBQUNILE1BQU0sb0JBQXFCLFNBQVEsbUJBQUs7SUFDdEMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFrQjtRQUMxRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixnREFBZ0Q7UUFDaEQsTUFBTSxTQUFTLEdBQUcsSUFBSSxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7WUFDdEQsWUFBWSxFQUFFLEVBQUUsSUFBSSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDckUsT0FBTyxFQUFFLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsUUFBUSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDbEUsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsZUFBZTtZQUNqRCxtQkFBbUIsRUFBRSxJQUFJO1NBQzFCLENBQUMsQ0FBQztRQUVILG1EQUFtRDtRQUNuRCxNQUFNLFlBQVksR0FBRyxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLGNBQWMsRUFBRTtZQUM1RCxZQUFZLEVBQUUsRUFBRSxJQUFJLEVBQUUsV0FBVyxFQUFFLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUN4RSxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxlQUFlO1lBQ2pELG1CQUFtQixFQUFFLElBQUk7U0FDMUIsQ0FBQyxDQUFDO1FBRUgsNkRBQTZEO1FBQzdELE1BQU0sTUFBTSxHQUFHLElBQUksNkJBQXVCLENBQUMsSUFBSSxFQUFFLGdCQUFnQixF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QUFJLEVBQUUsYUFBYSxFQUFFO1lBQ2pDLEtBQUssRUFBRSxNQUFNLENBQUMsR0FBRyxDQUFDLEdBQUc7WUFDckIsV0FBVyxFQUFFLDBCQUEwQjtTQUN4QyxDQUFDLENBQUM7UUFFSCxJQUFJLHVCQUFTLENBQUMsSUFBSSxFQUFFLFlBQVksRUFBRTtZQUNoQyxLQUFLLEVBQUUsTUFBTSxDQUFDLFFBQVEsQ0FBQyxVQUFVO1lBQ2pDLFdBQVcsRUFBRSxzQkFBc0I7U0FDcEMsQ0FBQyxDQUFDO1FBRUgsSUFBSSx1QkFBUyxDQUFDLElBQUksRUFBRSxrQkFBa0IsRUFBRTtZQUN0QyxLQUFLLEVBQUUsTUFBTSxDQUFDLGNBQWMsQ0FBQyxnQkFBZ0I7WUFDN0MsV0FBVyxFQUFFLDZCQUE2QjtTQUMzQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFFRCx5QkFBeUI7QUFDekIsTUFBTSxHQUFHLEdBQUcsSUFBSSxpQkFBRyxFQUFFLENBQUM7QUFDdEIsSUFBSSxvQkFBb0IsQ0FBQyxHQUFHLEVBQUUsc0JBQXNCLENBQUMsQ0FBQztBQUN0RCxHQUFHLENBQUMsS0FBSyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHAsIFN0YWNrLCBTdGFja1Byb3BzLCBDZm5PdXRwdXQgfSBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIGR5bmFtb2RiIGZyb20gJ2F3cy1jZGstbGliL2F3cy1keW5hbW9kYic7XG4vLyBpbXBvcnQgKiBhcyBsYW1iZGEgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxhbWJkYSc7XG5pbXBvcnQgeyBDREtTZXJ2ZXJsZXNzQWdlbnRpY0FQSSB9IGZyb20gJy4uLy4uL3NyYyc7XG5cbi8qKlxuICogRXhhbXBsZSBzdGFjayB0aGF0IGRlbW9uc3RyYXRlcyBhZHZhbmNlZCB1c2FnZSBvZiB0aGUgQ0RLU2VydmVybGVzc0FnZW50aWNBUElcbiAqIHdpdGggY3VzdG9tIGRvbWFpbiBhbmQgRHluYW1vREIgaW50ZWdyYXRpb25cbiAqL1xuY2xhc3MgQWR2YW5jZWRFeGFtcGxlU3RhY2sgZXh0ZW5kcyBTdGFjayB7XG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzPzogU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgLy8gQ3JlYXRlIGEgRHluYW1vREIgdGFibGUgZm9yIHN0b3JpbmcgdXNlciBkYXRhXG4gICAgY29uc3QgdXNlclRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdVc2VyVGFibGUnLCB7XG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3VzZXJJZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBzb3J0S2V5OiB7IG5hbWU6ICdkYXRhVHlwZScsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcG9pbnRJblRpbWVSZWNvdmVyeTogdHJ1ZVxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIGEgRHluYW1vREIgdGFibGUgZm9yIHN0b3JpbmcgcHJvZHVjdCBkYXRhXG4gICAgY29uc3QgcHJvZHVjdFRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdQcm9kdWN0VGFibGUnLCB7XG4gICAgICBwYXJ0aXRpb25LZXk6IHsgbmFtZTogJ3Byb2R1Y3RJZCcsIHR5cGU6IGR5bmFtb2RiLkF0dHJpYnV0ZVR5cGUuU1RSSU5HIH0sXG4gICAgICBiaWxsaW5nTW9kZTogZHluYW1vZGIuQmlsbGluZ01vZGUuUEFZX1BFUl9SRVFVRVNULFxuICAgICAgcG9pbnRJblRpbWVSZWNvdmVyeTogdHJ1ZVxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIHRoZSBzZXJ2ZXJsZXNzIHdlYiBhcHAgY29uc3RydWN0IHdpdGggY3VzdG9tIGRvbWFpblxuICAgIGNvbnN0IHdlYkFwcCA9IG5ldyBDREtTZXJ2ZXJsZXNzQWdlbnRpY0FQSSh0aGlzLCAnQWR2YW5jZWRXZWJBcHAnLCB7XG4gICAgICBkb21haW5OYW1lOiAnZXhhbXBsZS5jb20nLFxuICAgICAgY2VydGlmaWNhdGVBcm46ICdhcm46YXdzOmFjbTp1cy1lYXN0LTE6MTIzNDU2Nzg5MDEyOmNlcnRpZmljYXRlLzEyMzQ1Njc4LTEyMzQtMTIzNC0xMjM0LTEyMzQ1Njc4OTAxMicsXG4gICAgICBlbmFibGVMb2dnaW5nOiB0cnVlXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgQVBJIHJlc291cmNlcyBmb3IgdXNlciBtYW5hZ2VtZW50XG4gICAgY29uc3QgZ2V0VXNlcnNGdW5jdGlvbiA9IHdlYkFwcC5hZGRSZXNvdXJjZSh7XG4gICAgICBwYXRoOiAnL3VzZXJzJyxcbiAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICBsYW1iZGFTb3VyY2VQYXRoOiAnLi9sYW1iZGEvdXNlcnMvZ2V0JyxcbiAgICAgIHJlcXVpcmVzQXV0aDogdHJ1ZSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFVTRVJfVEFCTEVfTkFNRTogdXNlclRhYmxlLnRhYmxlTmFtZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgY3JlYXRlVXNlckZ1bmN0aW9uID0gd2ViQXBwLmFkZFJlc291cmNlKHtcbiAgICAgIHBhdGg6ICcvdXNlcnMnLFxuICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICBsYW1iZGFTb3VyY2VQYXRoOiAnLi9sYW1iZGEvdXNlcnMvY3JlYXRlJyxcbiAgICAgIHJlcXVpcmVzQXV0aDogdHJ1ZSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFVTRVJfVEFCTEVfTkFNRTogdXNlclRhYmxlLnRhYmxlTmFtZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgY29uc3QgZ2V0VXNlclByb2ZpbGVGdW5jdGlvbiA9IHdlYkFwcC5hZGRSZXNvdXJjZSh7XG4gICAgICBwYXRoOiAnL3VzZXJzL3t1c2VySWR9L3Byb2ZpbGUnLFxuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgIGxhbWJkYVNvdXJjZVBhdGg6ICcuL2xhbWJkYS91c2Vycy9wcm9maWxlJyxcbiAgICAgIHJlcXVpcmVzQXV0aDogdHJ1ZSxcbiAgICAgIGVudmlyb25tZW50OiB7XG4gICAgICAgIFVTRVJfVEFCTEVfTkFNRTogdXNlclRhYmxlLnRhYmxlTmFtZVxuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gQWRkIEFQSSByZXNvdXJjZXMgZm9yIHByb2R1Y3QgbWFuYWdlbWVudFxuICAgIGNvbnN0IGdldFByb2R1Y3RzRnVuY3Rpb24gPSB3ZWJBcHAuYWRkUmVzb3VyY2Uoe1xuICAgICAgcGF0aDogJy9wcm9kdWN0cycsXG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgbGFtYmRhU291cmNlUGF0aDogJy4vbGFtYmRhL3Byb2R1Y3RzL2dldCcsXG4gICAgICByZXF1aXJlc0F1dGg6IGZhbHNlLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgUFJPRFVDVF9UQUJMRV9OQU1FOiBwcm9kdWN0VGFibGUudGFibGVOYW1lXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBjcmVhdGVQcm9kdWN0RnVuY3Rpb24gPSB3ZWJBcHAuYWRkUmVzb3VyY2Uoe1xuICAgICAgcGF0aDogJy9wcm9kdWN0cycsXG4gICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgIGxhbWJkYVNvdXJjZVBhdGg6ICcuL2xhbWJkYS9wcm9kdWN0cy9jcmVhdGUnLFxuICAgICAgcmVxdWlyZXNBdXRoOiB0cnVlLFxuICAgICAgY29nbml0b0dyb3VwOiAnYWRtaW4nLFxuICAgICAgZW52aXJvbm1lbnQ6IHtcbiAgICAgICAgUFJPRFVDVF9UQUJMRV9OQU1FOiBwcm9kdWN0VGFibGUudGFibGVOYW1lXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICBjb25zdCBnZXRQcm9kdWN0RGV0YWlsc0Z1bmN0aW9uID0gd2ViQXBwLmFkZFJlc291cmNlKHtcbiAgICAgIHBhdGg6ICcvcHJvZHVjdHMve3Byb2R1Y3RJZH0nLFxuICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgIGxhbWJkYVNvdXJjZVBhdGg6ICcuL2xhbWJkYS9wcm9kdWN0cy9kZXRhaWxzJyxcbiAgICAgIHJlcXVpcmVzQXV0aDogZmFsc2UsXG4gICAgICBlbnZpcm9ubWVudDoge1xuICAgICAgICBQUk9EVUNUX1RBQkxFX05BTUU6IHByb2R1Y3RUYWJsZS50YWJsZU5hbWVcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIEdyYW50IHBlcm1pc3Npb25zIHRvIExhbWJkYSBmdW5jdGlvbnNcbiAgICB1c2VyVGFibGUuZ3JhbnRSZWFkRGF0YShnZXRVc2Vyc0Z1bmN0aW9uKTtcbiAgICB1c2VyVGFibGUuZ3JhbnRSZWFkV3JpdGVEYXRhKGNyZWF0ZVVzZXJGdW5jdGlvbik7XG4gICAgdXNlclRhYmxlLmdyYW50UmVhZERhdGEoZ2V0VXNlclByb2ZpbGVGdW5jdGlvbik7XG4gICAgXG4gICAgcHJvZHVjdFRhYmxlLmdyYW50UmVhZERhdGEoZ2V0UHJvZHVjdHNGdW5jdGlvbik7XG4gICAgcHJvZHVjdFRhYmxlLmdyYW50UmVhZFdyaXRlRGF0YShjcmVhdGVQcm9kdWN0RnVuY3Rpb24pO1xuICAgIHByb2R1Y3RUYWJsZS5ncmFudFJlYWREYXRhKGdldFByb2R1Y3REZXRhaWxzRnVuY3Rpb24pO1xuXG4gICAgLy8gVmFsaWRhdGUgc2VjdXJpdHkgY29uZmlndXJhdGlvblxuICAgIHdlYkFwcC52YWxpZGF0ZVNlY3VyaXR5KCk7XG4gICAgXG4gICAgLy8gT3V0cHV0c1xuICAgIG5ldyBDZm5PdXRwdXQodGhpcywgJ0Nsb3VkRnJvbnREb21haW5OYW1lJywge1xuICAgICAgdmFsdWU6IHdlYkFwcC5kaXN0cmlidXRpb24uZGlzdHJpYnV0aW9uRG9tYWluTmFtZSxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQ2xvdWRGcm9udCBkb21haW4gbmFtZSdcbiAgICB9KTtcbiAgICBcbiAgICBuZXcgQ2ZuT3V0cHV0KHRoaXMsICdBcGlFbmRwb2ludCcsIHtcbiAgICAgIHZhbHVlOiB3ZWJBcHAuYXBpLnVybCxcbiAgICAgIGRlc2NyaXB0aW9uOiAnQVBJIEdhdGV3YXkgZW5kcG9pbnQgVVJMJ1xuICAgIH0pO1xuICAgIFxuICAgIG5ldyBDZm5PdXRwdXQodGhpcywgJ1VzZXJQb29sSWQnLCB7XG4gICAgICB2YWx1ZTogd2ViQXBwLnVzZXJQb29sLnVzZXJQb29sSWQsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvZ25pdG8gVXNlciBQb29sIElEJ1xuICAgIH0pO1xuICAgIFxuICAgIG5ldyBDZm5PdXRwdXQodGhpcywgJ1VzZXJQb29sQ2xpZW50SWQnLCB7XG4gICAgICB2YWx1ZTogd2ViQXBwLnVzZXJQb29sQ2xpZW50LnVzZXJQb29sQ2xpZW50SWQsXG4gICAgICBkZXNjcmlwdGlvbjogJ0NvZ25pdG8gVXNlciBQb29sIENsaWVudCBJRCdcbiAgICB9KTtcbiAgfVxufVxuXG4vLyBJbml0aWFsaXplIHRoZSBDREsgYXBwXG5jb25zdCBhcHAgPSBuZXcgQXBwKCk7XG5uZXcgQWR2YW5jZWRFeGFtcGxlU3RhY2soYXBwLCAnQWR2YW5jZWRFeGFtcGxlU3RhY2snKTtcbmFwcC5zeW50aCgpOyJdfQ==