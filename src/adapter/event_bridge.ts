/* eslint-disable @typescript-eslint/no-unused-vars */
import { calculateRequest } from "@notalk/core";
import { EventBridgeHandler } from "aws-lambda";
import { report } from "../common/logger";
import { requestReducer } from "../reducers";
import { Class, Lambda } from "../types";

export const eventBridgeAdapter =
  <T, K>(request: Class<T>, response: Class<K>) =>
  (lambda: Lambda<T, K>): EventBridgeHandler<string, any, K | undefined> =>
  async (event) => {
    try {
      const input = calculateRequest({}, event, requestReducer, request);

      report("Input :: ", input);

      const result = await lambda(input);

      return result;
    } catch (error: any) {
      report("Exception :: ", error, event);
    }
  };
