const { SSMClient, GetParameterCommand } = require("@aws-sdk/client-ssm");

const ssmClient = new SSMClient({ region: process.env.AWS_REGION || "us-east-1" });

async function getParameter(name, isSecure = false) {
    try {
        const command = new GetParameterCommand({
            Name: name,
            WithDecryption: isSecure,
        });
        const response = await ssmClient.send(command);
        return response.Parameter.Value;
    } catch (error) {
        console.error(`Error fetching parameter ${name}:`, error);
        throw error;
    }
}

async function loadSecrets() {
    if (process.env.NODE_ENV === "production" || process.env.USE_SSM === "true") {
        console.log("Loading secrets from AWS SSM Parameter Store...");
        process.env.DB_HOST_MAIN = await getParameter("/cloudretail/prod/DB_HOST_MAIN");
        process.env.DB_PASS_MAIN = await getParameter("/cloudretail/prod/DB_PASS_MAIN", true);
        process.env.DB_USER_MAIN = await getParameter("/cloudretail/prod/DB_USER_MAIN");
        process.env.SQS_QUEUE_URL = await getParameter("/cloudretail/prod/SQS_QUEUE_URL");
        console.log("Secrets loaded successfully.");
    }
}

module.exports = { loadSecrets };
