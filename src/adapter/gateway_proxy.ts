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
    const corsHeaders = {
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": event.headers?.["origin"],
      "Access-Control-Allow-Methods": event.httpMethod,
    };

    try {
      const input = calculateRequest({}, event, requestReducer, request);

      const output = await lambda(input);

      const { statusCode, headers, body } = calculateResponse(output as any, event, responseReducer, response);

      if (!statusCode) {
        throw new InternalServerError("status code를 제공해야 해요.");
      }

      if (!body) {
        return {
          statusCode,
          headers: {
            ...corsHeaders,
            ...headers,
          },
          body: "",
        };
      }

      if (body["principalId"] || body["principal_id"]) {
        delete body["principalId"];

        delete body["principal_id"];
      }

      return {
        statusCode,
        headers: {
          ...corsHeaders,
          ...headers,
        },
        body: JSON.stringify(body),
      };
    } catch (error: any) {
      report("Exception :: ", error, event);

      if (error instanceof Exception) {
        const { statusCode, message, headers } = error;

        return {
          statusCode,
          headers: {
            ...corsHeaders,
            ...headers,
          },
          body: JSON.stringify({
            message,
          }),
        };
      }

      const { message } = error;

      return {
        statusCode: 500,
        headers: {
          ...corsHeaders,
        },
        body: JSON.stringify({ message }),
      };
    }
  };
