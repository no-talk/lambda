import { APIGatewayProxyEvent, APIGatewayRequestAuthorizerEvent, SQSEvent, SQSRecord } from "aws-lambda";
import { RequestData, RequestReducerData } from "../types";

export const isGatewayProxy = (event: RequestData): event is APIGatewayProxyEvent => !("methodArn" in event || "Records" in event);

export const isAuthorizer = (event: RequestData): event is APIGatewayRequestAuthorizerEvent => "methodArn" in event;

export const isSqs = (event: RequestData): event is SQSEvent => "Records" in event;

export const isGatewayProxyInReducer = (event: RequestReducerData): event is APIGatewayProxyEvent => !("methodArn" in event || "messageId" in event);

export const isAuthorizerInReducer = (event: RequestReducerData): event is APIGatewayRequestAuthorizerEvent => "methodArn" in event;

export const isSqsInReducer = (event: RequestReducerData): event is SQSRecord => "messageId" in event;
