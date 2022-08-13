import { calculateRequest, calculateResponse } from "@notalk/core";
import { APIGatewayRequestAuthorizerHandler } from "aws-lambda";
import { report } from "../common/logger";
import { requestReducer } from "../reducers";
import { Class, Lambda } from "../types";

export const authorizerAdapter =
  <T, K>(request: Class<T>, response: Class<K>) =>
  (lambda: Lambda<T, K>): APIGatewayRequestAuthorizerHandler =>
  async (event) => {
    const input = calculateRequest({}, event, requestReducer, request);

    try {
      const output = await lambda(input);

      const { principalId, ...responseContext } = calculateResponse(output as any, event, requestReducer, response);

      if (!principalId) {
        return {
          principalId: "none",
          policyDocument: {
            Version: "2012-10-17",
            Statement: [
              {
                Action: "execute-api:Invoke",
                Effect: "Error",
                Resource: event.methodArn,
              },
            ],
          },
        };
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
        context: responseContext,
      };
    } catch (error) {
      report("Exception :: ", error, event);

      return {
        principalId: "none",
        policyDocument: {
          Version: "2012-10-17",
          Statement: [
            {
              Action: "execute-api:Invoke",
              Effect: "Unauthorized",
              Resource: event.methodArn,
            },
          ],
        },
      };
    }
  };
