import { calculateRequest, calculateResponse, Exception, RequestReducer, ResponseReducer } from "@notalk/core";
import { Callback, Context } from "aws-lambda";
import { isAuthorizer, isSqs } from "../common/functions";
import { log } from "../common/logger";
import { RequestData, Lambda, RequestReducerData } from "../types";

type Class<T> = { new (): T };

export const notalk =
  <Request, Response>(request: Class<Request>, response: Class<Response>) =>
  (requestReducer: RequestReducer<RequestReducerData>, responseReducer: ResponseReducer<RequestData>) =>
  (fn: Lambda<Request, Response>) =>
  async (event: RequestData, context: Context, callback: Callback): Promise<any> => {
    if (isSqs(event)) {
      const batchItemFailures = await Promise.all(
        event.Records.map(async (record) => {
          try {
            const input = calculateRequest({}, record, requestReducer, request);

            await fn(input);

            return;
          } catch (e) {
            log(e);

            return {
              itemIdentifier: record.messageId,
            };
          }
        }).filter((e) => e),
      );

      return {
        batchItemFailures,
      };
    } else {
      try {
        const input = calculateRequest({}, event, requestReducer, request);

        const output = await fn(input);

        const result = calculateResponse(output as any, event, responseReducer, response);

        return result;
      } catch (error: any) {
        log(error, event, context);

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
    }
  };
