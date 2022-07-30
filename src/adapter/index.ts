import { calculateRequest, calculateResponse, Exception } from "@notalk/core";
import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { requestReducer } from "../reducers/request_reducer";
import { responseReducer } from "../reducers/response_reducer";
import { Lambda, ResponseData } from "../types";

export const notalk =
  <Request, Response extends ResponseData>(request: Class<Request>, response: Class<Response>) =>
  (fn: Lambda<Request, Response>) =>
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
      const input = calculateRequest<APIGatewayProxyEvent, Request>({}, event, requestReducer, request);

      const output = await fn(input);

      const { statusCode, headers, body } = calculateResponse(output, responseReducer, response);

      return {
        statusCode: statusCode || 200,
        headers,
        body: body ? JSON.stringify(body) : "",
      };
    } catch (error: any) {
      if (error instanceof Exception) {
        const { statusCode, message, headers } = error;

        return {
          statusCode,
          headers,
          body: JSON.stringify({
            message,
          }),
        };
      }

      const { message } = error;

      return {
        statusCode: 500,
        body: JSON.stringify({ message }),
      };
    }
  };

type Class<T> = { new (): T };
