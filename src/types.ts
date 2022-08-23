import { APIGatewayProxyEvent, APIGatewayRequestAuthorizerEvent, EventBridgeEvent, SQSEvent, SQSRecord } from "aws-lambda";

export type Class<T> = { new (): T };

export type Lambda<Input, Output> = (input: Readonly<Input>) => Promise<Output>;

export type LambdaEvent = APIGatewayProxyEvent | APIGatewayRequestAuthorizerEvent | SQSEvent | EventBridgeEvent<string, any>;

export type RequestReducerEvent = APIGatewayProxyEvent | APIGatewayRequestAuthorizerEvent | SQSRecord | EventBridgeEvent<string, any>;

export type ResponseReducerEvent = APIGatewayProxyEvent | APIGatewayRequestAuthorizerEvent;
