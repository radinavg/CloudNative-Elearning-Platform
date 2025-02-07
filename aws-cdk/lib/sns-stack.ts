import {Stack, StackProps} from "aws-cdk-lib";
import * as sns from "aws-cdk-lib/aws-sns";
import {Construct} from "constructs";

export class AmazonSnsStack extends Stack {
    public readonly exerciseTypeList = ["addition", "multiplication", "derivatives"];
    public readonly exerciseGenerateTopic: sns.Topic;
    public readonly exerciseEvaluateTopic: sns.Topic;

    // public readonly exerciseGenerateTopics: Record<string, sns.Topic> = {};
    // public readonly exerciseEvaluateTopics: Record<string, sns.Topic> = {};

    constructor(scope: Construct, id: string, props?: StackProps) {
        super(scope, id, props);

        // for (let exerciseType in this.exerciseTypeList) {
        //     this.exerciseGenerateTopics[exerciseType] = new sns.Topic(this, "ExerciseGenerateTopic", {
        //         topicName: exerciseType + "ExerciseGenerateTopic"
        //     });
    
        //     this.exerciseEvaluateTopics[exerciseType] = new sns.Topic(this, "ExerciseEvaluateTopic", {
        //         topicName: exerciseType + "ExerciseEvaluateTopic"
        //     }); 
        // }

        this.exerciseGenerateTopic = new sns.Topic(this, "ExerciseGenerateTopic", {
            topicName: "ExerciseGenerateTopic"
        });

        this.exerciseEvaluateTopic = new sns.Topic(this, "ExerciseEvaluateTopic", {
            topicName: "ExerciseEvaluateTopic"
        });
    }
}