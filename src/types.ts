import { APIGatewayProxyEvent, APIGatewayRequestAuthorizerEvent, SQSEvent, SQSRecord } from "aws-lambda";

export type Lambda<Input, Output> = (input: Input) => Promise<Output>;

export type RequestData = APIGatewayProxyEvent | APIGatewayRequestAuthorizerEvent | SQSEvent;

export type RequestReducerData = APIGatewayProxyEvent | APIGatewayRequestAuthorizerEvent | SQSRecord;
