# Getting Started

## Prerequisites

- Docker installed and running.
- Node.js installed (LTS version recommended).
- Set the region of AWS in your `~/.aws/config` file to:

```bash
region = eu-central-1
```

---

### Setup Instructions

#### 1. Install Dependencies

Install the required Node.js packages:

```bash
npm install
```

#### 2. Set Up Environment Variables

For LocalStack you need to provide the pro key. Also when you run aws commands, the AWS CLI expects some credentials to be set, therefore:

1. Create a `.env` file in the `aws-cdk` directory.
2. Add your configuration:

    ```plaintext
    LOCALSTACK_API_KEY=your_pro_key
    ```

#### 2.1 Add fake credentials (for bootstrap, endpoint calls etc.)

export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test

#### 3. Start LocalStack

Use Docker Compose to start LocalStack:

```bash
docker-compose up
```

#### 4. Bootstrap the CDK Environment

Bootstrap your CDK environment to prepare it for deployment:

```bash
npm run bootstrap
```

#### 5. Synthesize the CloudFormation Template

Generate the CloudFormation template to verify the infrastructure:

```bash
npm run synth
```

#### 6. Deploy and Verify Resources

1. Deploy the defined AWS resources to LocalStack:

    ```bash
    npm run deploy
    ```

2. Verify that the resources (e.g., S3 bucket) were successfully created:

    ```bash
    aws --endpoint-url=http://localhost:4566 s3 ls
    ```

#### 7. (Optional) Execute All Steps at Once

Instead of running steps 4 - 6 manually, you can execute the entire process using:

```bash
npm run all
```

### 8. Configure the React client

1. After running `docker-compose up` and `npm run all`, you will receive an API Gateway URL.  
   Example: `https://<API-ID>.execute-api.localhost.localstack.cloud:4566/prod/`.

2. Set this URL in your `web client` folder create an `.env` file as:

    ```bash
    VITE_API_GATEWAY_URL=https://<API-ID>.execute-api.localhost.localstack.cloud:4566/prod/
    ```

3. To get the API-ID you can use following command and extract the id:

    ```bash
    aws --endpoint-url=http://localhost:4566 apigateway get-rest-apis
    ```

#### 9. Run the React Client

If your project includes a React client:

1. Navigate to the client directory:

    ```bash
    cd webclient
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Start the development server:

    ```bash
    npm start
    ```

---

### Useful Commands

| Command                                                                                                      | Description                                     |
| ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| `aws --endpoint-url=http://localhost:4566 s3 ls`                                                             | List all S3 buckets in LocalStack               |
| `aws --endpoint-url=http://localhost:4566 s3 ls s3://profile-pic-bucket-1`                                   | Check the contents of a specific bucket         |
| `aws --endpoint-url=http://localhost:4566 cloudformation describe-stack-events --stack-name ApiGatewayStack` | View CloudFormation stack events                |
| `aws --endpoint-url=http://localhost:4566 apigateway get-rest-apis`                                          | List all REST APIs and their IDs in API Gateway |
| `aws --endpoint-url=http://localhost:4566 apigateway get-resources --rest-api-id <API-ID>`                   | List all resources and methods in API Gateway   |
| `docker-compose up`                                                                                          | Start LocalStack services using Docker Compose  |
