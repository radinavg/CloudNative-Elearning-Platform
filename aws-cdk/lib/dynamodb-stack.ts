import {Stack, StackProps} from 'aws-cdk-lib';
import {Construct} from 'constructs';
import {AttributeType, ProjectionType, StreamViewType, Table,} from 'aws-cdk-lib/aws-dynamodb';
import {AmazonSnsStack} from "./sns-stack";

interface DynamoDBStackProps extends StackProps {
    readonly stage: string;
}

export class DynamoDBStack extends Stack {
    public readonly userTable: Table;
    public readonly userCountTable: Table;
    public readonly exerciseTables: Record<string, Table> = {};

    constructor(scope: Construct, id: string, snsStack: AmazonSnsStack, props?: DynamoDBStackProps) {
        super(scope, id, props);

        this.userTable = new Table(this, 'User', {
            tableName: 'User',
            partitionKey: {
                name: 'id',
                type: AttributeType.STRING,
            }
        });

        this.userCountTable = new Table(this, 'UserCount', {
            tableName: 'UserCount',
            partitionKey: {
                name: 'uid',
                type: AttributeType.STRING,
            },
            sortKey: {
                name: 'etype',
                type: AttributeType.STRING,
            }
        });

        for(let exerciseType of snsStack.exerciseTypeList) {
            const table = new Table(this, 'Exercise'+exerciseType, {
                tableName: 'Exercise'+exerciseType,
                partitionKey: {
                    name: 'uid',
                    type: AttributeType.STRING,
                },
                sortKey: {
                    name: 'id',  // has to be unique for all exercise types
                    type: AttributeType.STRING,
                },
                stream: StreamViewType.KEYS_ONLY
            });

            table.addLocalSecondaryIndex({
                indexName: 'Exercise'+exerciseType+"LSI",
                sortKey: {
                    name: "solveTime",
                    type: AttributeType.NUMBER,
                },
                projectionType: ProjectionType.ALL
            });

            this.exerciseTables[exerciseType] = table;
        }

    }
}