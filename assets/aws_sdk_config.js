// assets/aws_sdk_config.js

// Using AWS SDK v3 Modular Imports (This is what we will pull from the CDN in index.html)
const awsConfig = {
  region: "ap-south-1", // Your AWS Region
  // We will use Cognito Identity Pools later for secure, temporary credentials
  identityPoolId: "",
};

console.log(
  "AWS SDK Configuration initialized for region: " + awsConfig.region,
);
