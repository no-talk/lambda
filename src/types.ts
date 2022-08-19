import { APIGatewayProxyEvent, APIGatewayRequestAuthorizerEvent, SQSEvent, SQSRecord } from "aws-lambda";

export type Class<T> = { new (): T };

export type Lambda<Input, Output> = (input: Readonly<Input>) => Promise<Output>;

export type LambdaEvent = APIGatewayProxyEvent | APIGatewayRequestAuthorizerEvent | SQSEvent;

export type RequestReducerEvent = APIGatewayProxyEvent | APIGatewayRequestAuthorizerEvent | SQSRecord;

export type ResponseReducerEvent = APIGatewayProxyEvent | APIGatewayRequestAuthorizerEvent;
