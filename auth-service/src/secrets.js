const AWSXRay = require('aws-xray-sdk');
const { SecretsManagerClient, GetSecretValueCommand } = AWSXRay.captureAWSv3Client(require("@aws-sdk/client-secrets-manager"));

const client = new SecretsManagerClient({
    region: process.env.AWS_REGION || "us-east-1",
});

async function loadSecrets() {
    const secretName = "cloudretail/backend/secrets";

    try {
        console.log(`[SecretsManager] Fetching secret: ${secretName}`);
        const response = await client.send(
            new GetSecretValueCommand({
                SecretId: secretName,
            })
        );

        if (response.SecretString) {
            const secrets = JSON.parse(response.SecretString);

            // Map secrets to process.env
            // Note: We use specific names to avoid overwriting standard VPC/RDS env vars if they exist
            if (secrets.DB_HOST) process.env.DB_HOST_MAIN = secrets.DB_HOST;
            if (secrets.DB_USER) process.env.DB_USER_MAIN = secrets.DB_USER;
            if (secrets.DB_PASS) process.env.DB_PASS_MAIN = secrets.DB_PASS;
            if (secrets.JWT_SECRET) process.env.JWT_SECRET = secrets.JWT_SECRET;
            if (secrets.REDIS_HOST) process.env.REDIS_HOST = secrets.REDIS_HOST;

            console.log("[SecretsManager] Secrets successfully loaded and injected into process.env");
        }
    } catch (error) {
        console.error("[SecretsManager] Error loading secrets:", error.message);
        // In production, you might want to exit if secrets are critical
        // throw error; 
    }
}

module.exports = { loadSecrets };
