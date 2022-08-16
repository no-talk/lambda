import { InternalServerError } from "@notalk/common";
import { calculateRequest, calculateResponse, Exception } from "@notalk/core";
import { APIGatewayProxyHandler } from "aws-lambda";
import { report } from "../common/logger";
import { requestReducer, responseReducer } from "../reducers";
import { Class, Lambda } from "../types";

export const gatewayProxyAdapter =
  <T, K>(request: Class<T>, response: Class<K>) =>
  (lambda: Lambda<T, K>): APIGatewayProxyHandler =>
  async (event) => {
    try {
      const input = calculateRequest({}, event, requestReducer, request);

      const output = await lambda(input);

      const { statusCode, headers, body } = calculateResponse(output as any, event, responseReducer, response);

      if (!statusCode) {
        throw new InternalServerError("status code를 제공해야 해요.");
      }

      if (body["principalId"] || body["principal_id"]) {
        delete body["principalId"];

        delete body["principal_id"];
      }

      return {
        statusCode,
        headers,
        body: body ? JSON.stringify(body) : "",
      };
    } catch (error: any) {
      report("Exception :: ", error, event);

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
