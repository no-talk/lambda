import { PrincipalIdMetadata, ResponseBodyMetadata, SnakeCaseMetadata, StatusCodeMetadata } from "@notalk/common";
import { calculateResponse, ResponseReducer } from "@notalk/core";
import { ResponseReducerEvent } from "../../types";

export const responseReducer: ResponseReducer<ResponseReducerEvent> = (value, event, metadata) => {
  if (metadata instanceof StatusCodeMetadata) {
    const statusCode = metadata.args.value;

    return {
      ...value,
      statusCode,
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

    return toSnakeCase(value);
  }

  if (metadata instanceof ResponseBodyMetadata) {
    if (!value[metadata.dist]) {
      return value;
    }

    return {
      ...value,
      body: calculateResponse(value[metadata.dist] as any, event, responseReducer, metadata.args.type),
    };
  }

  if (metadata instanceof PrincipalIdMetadata) {
    const principalId = value[metadata.dist];

    return {
      ...value,
      principalId,
    };
  }

  throw Error(`${Object.getPrototypeOf(metadata)?.constructor?.name} is not supported yet.`);
};
