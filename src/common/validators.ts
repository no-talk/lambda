import { APIGatewayProxyEvent, APIGatewayRequestAuthorizerEvent, EventBridgeEvent, SQSEvent, SQSRecord } from "aws-lambda";
import { LambdaEvent, RequestReducerEvent } from "../types";

export const isGatewayProxy = (event: LambdaEvent): event is APIGatewayProxyEvent => !("methodArn" in event || "Records" in event);

export const isAuthorizer = (event: LambdaEvent): event is APIGatewayRequestAuthorizerEvent => "methodArn" in event;

export const isSqs = (event: LambdaEvent): event is SQSEvent => "Records" in event;

export const isEventBridge = (event: LambdaEvent): event is EventBridgeEvent<string, any> => "detail" in event;

export const isGatewayProxyInReducer = (event: RequestReducerEvent): event is APIGatewayProxyEvent => !("methodArn" in event || "messageId" in event);

export const isAuthorizerInReducer = (event: RequestReducerEvent): event is APIGatewayRequestAuthorizerEvent => "methodArn" in event;

export const isSqsInReducer = (event: RequestReducerEvent): event is SQSRecord => "messageId" in event;

export const isEventBridgeInReducer = (event: RequestReducerEvent): event is EventBridgeEvent<string, any> => "detail" in event;
