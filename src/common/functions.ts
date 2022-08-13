import { APIGatewayProxyEvent, APIGatewayRequestAuthorizerEvent, SQSEvent } from "aws-lambda";
import { RequestData } from "../types";

export const isGatewayProxy = (event: RequestData): event is APIGatewayProxyEvent => !("methodArn" in event || "Records" in event);

export const isAuthorizer = (event: RequestData): event is APIGatewayRequestAuthorizerEvent => "methodArn" in event;

export const isSqs = (event: RequestData): event is SQSEvent => "Records" in event;
