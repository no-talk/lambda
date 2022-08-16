import { calculateRequest, calculateResponse } from "@notalk/core";
import { APIGatewayRequestAuthorizerEvent, Callback, Context } from "aws-lambda";
import { report } from "../common/logger";
import { requestReducer } from "../reducers";
import { Class, Lambda } from "../types";

export const authorizerAdapter =
  <T, K>(request: Class<T>, response: Class<K>) =>
  (lambda: Lambda<T, K>) =>
  async (event: APIGatewayRequestAuthorizerEvent, _: Context, callback: Callback) => {
    try {
      const input = calculateRequest({}, event, requestReducer, request);

      const output = await lambda(input);

      const { principalId, ...context } = calculateResponse(output as any, event, requestReducer, response);

      if (!principalId) {
        return callback("Error :: Princial id is not provided");
      }

      return {
        principalId,
        policyDocument: {
          Version: "2012-10-17",
          Statement: [
            {
              Action: "execute-api:Invoke",
              Effect: "Allow",
              Resource: event.methodArn,
            },
          ],
        },
        context,
      };
    } catch (error) {
      report("Exception :: ", error, event);

      callback("Unauthorized");
    }
  };
