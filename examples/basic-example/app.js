"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_cdk_lib_1 = require("aws-cdk-lib");
const src_1 = require("../../src");
/**
 * Example stack that demonstrates basic usage of the CDKServerlessAgenticAPI
 */
class BasicExampleStack extends aws_cdk_lib_1.Stack {
    constructor(scope, id, props) {
        super(scope, id, props);
        // Create the serverless web app construct with default settings
        const webApp = new src_1.CDKServerlessAgenticAPI(this, 'BasicWebApp');
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
const app = new aws_cdk_lib_1.App();
new BasicExampleStack(app, 'BasicExampleStack');
app.synth();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYXBwLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiYXBwLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsNkNBQXFEO0FBRXJELG1DQUFvRDtBQUVwRDs7R0FFRztBQUNILE1BQU0saUJBQWtCLFNBQVEsbUJBQUs7SUFDbkMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUFrQjtRQUMxRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztRQUV4QixnRUFBZ0U7UUFDaEUsTUFBTSxNQUFNLEdBQUcsSUFBSSw2QkFBdUIsQ0FBQyxJQUFJLEVBQUUsYUFBYSxDQUFDLENBQUM7UUFFaEUsNEJBQTRCO1FBQzVCLE1BQU0sQ0FBQyxXQUFXLENBQUM7WUFDakIsSUFBSSxFQUFFLFFBQVE7WUFDZCxnQkFBZ0IsRUFBRSxnQkFBZ0I7WUFDbEMsWUFBWSxFQUFFLEtBQUs7U0FDcEIsQ0FBQyxDQUFDO1FBRUgsb0NBQW9DO1FBQ3BDLE1BQU0sQ0FBQyxXQUFXLENBQUM7WUFDakIsSUFBSSxFQUFFLFVBQVU7WUFDaEIsZ0JBQWdCLEVBQUUsa0JBQWtCO1lBQ3BDLFlBQVksRUFBRSxJQUFJO1NBQ25CLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQUVELHlCQUF5QjtBQUN6QixNQUFNLEdBQUcsR0FBRyxJQUFJLGlCQUFHLEVBQUUsQ0FBQztBQUN0QixJQUFJLGlCQUFpQixDQUFDLEdBQUcsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO0FBQ2hELEdBQUcsQ0FBQyxLQUFLLEVBQUUsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcCwgU3RhY2ssIFN0YWNrUHJvcHMgfSBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCB7IENES1NlcnZlcmxlc3NBZ2VudGljQVBJIH0gZnJvbSAnLi4vLi4vc3JjJztcblxuLyoqXG4gKiBFeGFtcGxlIHN0YWNrIHRoYXQgZGVtb25zdHJhdGVzIGJhc2ljIHVzYWdlIG9mIHRoZSBDREtTZXJ2ZXJsZXNzQWdlbnRpY0FQSVxuICovXG5jbGFzcyBCYXNpY0V4YW1wbGVTdGFjayBleHRlbmRzIFN0YWNrIHtcbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM/OiBTdGFja1Byb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkLCBwcm9wcyk7XG5cbiAgICAvLyBDcmVhdGUgdGhlIHNlcnZlcmxlc3Mgd2ViIGFwcCBjb25zdHJ1Y3Qgd2l0aCBkZWZhdWx0IHNldHRpbmdzXG4gICAgY29uc3Qgd2ViQXBwID0gbmV3IENES1NlcnZlcmxlc3NBZ2VudGljQVBJKHRoaXMsICdCYXNpY1dlYkFwcCcpO1xuXG4gICAgLy8gQWRkIGEgcHVibGljIEFQSSBlbmRwb2ludFxuICAgIHdlYkFwcC5hZGRSZXNvdXJjZSh7XG4gICAgICBwYXRoOiAnL2hlbGxvJyxcbiAgICAgIGxhbWJkYVNvdXJjZVBhdGg6ICcuL2xhbWJkYS9oZWxsbycsXG4gICAgICByZXF1aXJlc0F1dGg6IGZhbHNlXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgYW4gYXV0aGVudGljYXRlZCBBUEkgZW5kcG9pbnRcbiAgICB3ZWJBcHAuYWRkUmVzb3VyY2Uoe1xuICAgICAgcGF0aDogJy9wcm9maWxlJyxcbiAgICAgIGxhbWJkYVNvdXJjZVBhdGg6ICcuL2xhbWJkYS9wcm9maWxlJyxcbiAgICAgIHJlcXVpcmVzQXV0aDogdHJ1ZVxuICAgIH0pO1xuICB9XG59XG5cbi8vIEluaXRpYWxpemUgdGhlIENESyBhcHBcbmNvbnN0IGFwcCA9IG5ldyBBcHAoKTtcbm5ldyBCYXNpY0V4YW1wbGVTdGFjayhhcHAsICdCYXNpY0V4YW1wbGVTdGFjaycpO1xuYXBwLnN5bnRoKCk7Il19