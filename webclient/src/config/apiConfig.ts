const baseUrl = 'https://4qo8xcutrn.execute-api.localhost.localstack.cloud:4566/prod';

export const apiConfig = {
    baseUrl,
    registerUrl: `${baseUrl}/auth/register`,
    exerciseUrl: `${baseUrl}/exercise`,
    loginUrl: `${baseUrl}/auth/login`,
    s3BucketUrl: `${baseUrl}/files`,
    profileUrl: `${baseUrl}/profile`,
};
