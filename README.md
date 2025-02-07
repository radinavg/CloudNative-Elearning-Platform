# Cloud-Native E-Learning Platform 🚀

## Project Overview 📚
This project implements a cloud-native e-learning platform using AWS services. The platform demonstrates the use of serverless computing principles, including Function-as-a-Service (FaaS) and Backend-as-a-Service (BaaS). It leverages Amazon Web Services (AWS) for infrastructure and LocalStack for local development.

This project was developed as part of a university group project for the **Advanced Internet Computing (AIC)** course at TU Wien. I was a member of **Team Lambda** and contributed to the backend implementation using AWS Lambda and other cloud-native services.

## Key Features ✨
- **Serverless Architecture:** Fully serverless using AWS Lambda, DynamoDB, API Gateway, Cognito, SNS, and SQS.
- **Exercise Management:** Automatic generation, storage, and evaluation of exercises for users (Addition, Multiplication, Derivatives).
- **User Authentication:** Managed with AWS Cognito, allowing user registration, login, and profile management.
- **Scalable Data Storage:** Leveraging DynamoDB for highly available and scalable data persistence.
- **Local Development:** Using LocalStack to emulate AWS services for faster iteration cycles.

## Tech Stack 🛠️
- **Languages:** Python for AWS Lambda functions.
- **Infrastructure as Code (IaC):** AWS CDK (Cloud Development Kit).
- **Cloud Emulation:** LocalStack for running AWS services locally.
- **Frontend:** Functional but minimal, customizable with any frontend technology.

## Setup Instructions 🏗️

1. **Clone the Repository**
   ```bash
   git clone https://github.com/radinavg/CloudNative-Elearning-Platform.git
   cd CloudNative-Elearning
   ```

2. **Install Prerequisites** ⚙️
   - AWS CLI, Node.js, and Python 3.8+
   - LocalStack: `pip install localstack`
   - AWS CDK: `npm install -g aws-cdk`

3. **Run the Application** ▶️
   - You must have a `.env` file with your LocalStack API key to run the application.
   - Start the stack (both frontend and backend) using:
     ```bash
     docker-compose up
     ```
   - Access the homepage: 🌍
     [http://localhost:5173/](http://localhost:5173/)
   - Stop the stack:
     ```bash
     docker-compose down
     

