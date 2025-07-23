import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { CDKServerlessAgenticAPIProps } from './types';
/**
 * Creates the Cognito User Pool for authentication
 *
 * @param scope The construct scope
 * @param id The construct ID
 * @param props Configuration properties
 * @returns The created Cognito User Pool and User Pool Client
 */
export declare function createUserPool(scope: Construct, id: string, props?: CDKServerlessAgenticAPIProps): {
    userPool: cognito.UserPool;
    userPoolClient: cognito.UserPoolClient;
};
/**
 * Creates the Cognito User Pool Client for API Gateway integration
 *
 * @param scope The construct scope
 * @param id The construct ID
 * @param userPool The user pool to create the client for
 * @returns The created user pool client
 */
export declare function createUserPoolClient(scope: Construct, id: string, userPool: cognito.UserPool): cognito.UserPoolClient;
/**
 * Creates default user groups for role-based access control
 *
 * @param scope The construct scope
 * @param userPool The user pool to create groups for
 */
export declare function createUserGroups(scope: Construct, userPool: cognito.UserPool): void;
