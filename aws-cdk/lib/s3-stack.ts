import { Stack, StackProps } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export class S3Stack extends Stack {
    public readonly bucket: s3.Bucket;

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // Create an S3 bucket
        this.bucket = new s3.Bucket(this, 'ProfilePicBucket', {
            bucketName: 'profile-pic-bucket-1',
            versioned: true,
        });

        this.bucket.addCorsRule({
            allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.POST, s3.HttpMethods.PUT],
            allowedOrigins: ['*'],
            allowedHeaders: ['*'],
        });
    }
}
