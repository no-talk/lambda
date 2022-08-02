import { APIGatewayProxyEvent, APIGatewayRequestAuthorizerEvent } from "aws-lambda";

export type Lambda<Input, Output> = (input: Input) => Promise<Output>;

export type RequestData = APIGatewayProxyEvent | APIGatewayRequestAuthorizerEvent;
