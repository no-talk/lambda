import { ResponseMetadata, SnakeCaseMetadata } from "@notalk/common";
import { ResponseReducer } from "@notalk/core";
import { isAuthorizer } from "../../common/functions";
import { RequestData } from "../../types";

export const responseReducer: ResponseReducer<RequestData> = (value, event, metadata) => {
  if (metadata instanceof ResponseMetadata) {
    if (isAuthorizer(event)) {
      return {
        principalId: (value.body as any)?.id || "none",
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
      };
    }

    const statusCode = metadata.args.value;

    const body = JSON.stringify(value.body);

    return {
      ...value,
      statusCode,
      body,
    };
  }

  if (metadata instanceof SnakeCaseMetadata) {
    const toSnakeCase = (value: any): any => {
      if (value === null || value === undefined) {
        return undefined;
      }

      if (Array.isArray(value)) {
        return value.map(toSnakeCase);
      }

      if (value.constructor === Object) {
        const result: Record<string, any> = {};

        Object.entries(value).forEach(([key, value]) => {
          const mappedKey = key.replace(/[a-z][A-Z]/g, ([first, second]) => {
            return `${first}_${second.toLowerCase()}`;
          });

          result[mappedKey] = toSnakeCase(value);
        });

        return result;
      }

      return value;
    };

    return {
      ...value,
      [metadata.dist]: toSnakeCase(value[metadata.dist]),
    };
  }

  throw Error(`${Object.getPrototypeOf(metadata)?.constructor?.name} is not supported yet.`);
};
