/* eslint-disable @typescript-eslint/no-unused-vars */
import { calculateRequest } from "@notalk/core";
import { SQSBatchItemFailure, SQSHandler } from "aws-lambda";
import { report } from "../common/logger";
import { requestReducer } from "../reducers";
import { Class, Lambda } from "../types";

export const sqsAdapter =
  <T, K>(request: Class<T>, response: Class<K>) =>
  (lambda: Lambda<T, unknown>): SQSHandler =>
  async (event) => {
    const batchItemFailures: SQSBatchItemFailure[] = [];

    await Promise.all(
      event.Records.map(async (record) => {
        try {
          const input = calculateRequest({}, record, requestReducer, request);

          await lambda(input);
        } catch (error) {
          report("Exception :: ", error, record);

          batchItemFailures.push({
            itemIdentifier: record.messageId,
          });
        }
      }),
    );

    return {
      batchItemFailures,
    };
  };
