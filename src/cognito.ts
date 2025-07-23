import * as cognito from 'aws-cdk-lib/aws-cognito';
import { RemovalPolicy, Duration } from 'aws-cdk-lib';
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
export function createUserPool(
  scope: Construct,
  id: string,
  props?: CDKServerlessAgenticAPIProps
): { userPool: cognito.UserPool, userPoolClient: cognito.UserPoolClient } {
  const userPool = new cognito.UserPool(scope, 'UserPool', {
    userPoolName: props?.userPoolName || `${id}-user-pool`,
    // Configure email-based authentication
    signInAliases: {
      email: true,
      username: false,
      phone: false,
    },
    // Configure sign-up settings
    selfSignUpEnabled: true,
    autoVerify: {
      email: true,
    },
    // Configure password policy
    passwordPolicy: {
      minLength: 8,
      requireLowercase: true,
      requireUppercase: true,
      requireDigits: true,
      requireSymbols: true,
    },
    // Configure account recovery
    accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    // Configure email settings
    email: cognito.UserPoolEmail.withCognito(),
    // Configure user verification
    userVerification: {
      emailSubject: 'Verify your email for our app',
      emailBody: 'Hello {username}, Thanks for signing up! Your verification code is {####}',
      emailStyle: cognito.VerificationEmailStyle.CODE,
    },
    // Configure user invitation
    userInvitation: {
      emailSubject: 'Invite to join our app',
      emailBody: 'Hello {username}, you have been invited to join our app! Your temporary password is {####}',
    },
    // Configure standard attributes
    standardAttributes: {
      email: {
        required: true,
        mutable: true,
      },
      givenName: {
        required: false,
        mutable: true,
      },
      familyName: {
        required: false,
        mutable: true,
      },
    },
    // Configure MFA
    mfa: cognito.Mfa.OPTIONAL,
    mfaSecondFactor: {
      sms: false,
      otp: true,
    },
    // Configure device tracking
    deviceTracking: {
      challengeRequiredOnNewDevice: true,
      deviceOnlyRememberedOnUserPrompt: false,
    },
    // Configure removal policy
    removalPolicy: RemovalPolicy.DESTROY,
  });

  // Create user pool client for API Gateway integration
  const userPoolClient = createUserPoolClient(scope, id, userPool);

  // Create default user groups for role-based access control
  createUserGroups(scope, userPool);

  return { userPool, userPoolClient };
}

/**
 * Creates the Cognito User Pool Client for API Gateway integration
 * 
 * @param scope The construct scope
 * @param id The construct ID
 * @param userPool The user pool to create the client for
 * @returns The created user pool client
 */
export function createUserPoolClient(
  scope: Construct,
  id: string,
  userPool: cognito.UserPool
): cognito.UserPoolClient {
  return new cognito.UserPoolClient(scope, 'UserPoolClient', {
    userPool,
    userPoolClientName: `${id}-client`,
    // Configure authentication flows
    authFlows: {
      userPassword: true,
      userSrp: true,
      custom: false,
      adminUserPassword: false,
    },
    // Configure OAuth settings
    oAuth: {
      flows: {
        authorizationCodeGrant: true,
        implicitCodeGrant: false,
        clientCredentials: false,
      },
      scopes: [
        cognito.OAuthScope.EMAIL,
        cognito.OAuthScope.OPENID,
        cognito.OAuthScope.PROFILE,
      ],
      callbackUrls: ['http://localhost:3000/callback'], // Will be updated when domain is configured
      logoutUrls: ['http://localhost:3000/logout'],
    },
    // Configure token validity
    accessTokenValidity: Duration.hours(1),
    idTokenValidity: Duration.hours(1),
    refreshTokenValidity: Duration.days(30),
    // Configure token generation
    generateSecret: false, // Required for JavaScript SDK
    // Configure supported identity providers
    supportedIdentityProviders: [
      cognito.UserPoolClientIdentityProvider.COGNITO,
    ],
    // Configure read and write attributes
    readAttributes: new cognito.ClientAttributes()
      .withStandardAttributes({
        email: true,
        emailVerified: true,
        givenName: true,
        familyName: true,
      }),
    writeAttributes: new cognito.ClientAttributes()
      .withStandardAttributes({
        email: true,
        givenName: true,
        familyName: true,
      }),
    // Prevent user existence errors for security
    preventUserExistenceErrors: true,
  });
}

/**
 * Creates default user groups for role-based access control
 * 
 * @param scope The construct scope
 * @param userPool The user pool to create groups for
 */
export function createUserGroups(
  scope: Construct,
  userPool: cognito.UserPool
): void {
  // Create admin group with elevated privileges
  new cognito.CfnUserPoolGroup(scope, 'AdminGroup', {
    userPoolId: userPool.userPoolId,
    groupName: 'admin',
    description: 'Administrator group with full access to all resources',
    precedence: 1,
  });

  // Create user group for regular users
  new cognito.CfnUserPoolGroup(scope, 'UserGroup', {
    userPoolId: userPool.userPoolId,
    groupName: 'user',
    description: 'Regular user group with limited access to resources',
    precedence: 10,
  });

  // Create moderator group with intermediate privileges
  new cognito.CfnUserPoolGroup(scope, 'ModeratorGroup', {
    userPoolId: userPool.userPoolId,
    groupName: 'moderator',
    description: 'Moderator group with intermediate access to resources',
    precedence: 5,
  });
}