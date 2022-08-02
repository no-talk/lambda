import { APIGatewayRequestAuthorizerEvent } from "aws-lambda";
import { RequestData } from "../types";

export const isAuthorizer = (event: RequestData): event is APIGatewayRequestAuthorizerEvent => "methodArn" in event;
