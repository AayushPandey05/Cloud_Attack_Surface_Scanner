// Configuration for the AWS SDK
const awsConfig = {
  region: "ap-south-1", // Update to your region
  identityPoolId: "", // We will get this from Cognito later
  bucketName: "audit-evidence-hub",
};

console.log("AWS SDK Configured for SOC 2 Hub");
