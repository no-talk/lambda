import { calculateRequest, calculateResponse, Exception, RequestReducer, ResponseReducer } from "@notalk/core";
import { Callback, Context } from "aws-lambda";
import { isAuthorizer } from "../common/functions";
import { RequestData, Lambda } from "../types";

type Class<T> = { new (): T };

export const notalk =
  <Request, Response>(request: Class<Request>, response: Class<Response>) =>
  (requestReducer: RequestReducer<RequestData>, responseReducer: ResponseReducer<RequestData>) =>
  (fn: Lambda<Request, Response>) =>
  async (event: RequestData, context: Context, callback: Callback): Promise<any> => {
    try {
      const input = calculateRequest<RequestData, Request>({}, event, requestReducer, request);

      const output = await fn(input);

      const result = calculateResponse(output as any, event, responseReducer, response);

      return result;
    } catch (error: any) {
      if (isAuthorizer(event)) {
        return callback("Unauthorized");
      }

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
