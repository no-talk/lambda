import {
  BadRequestException,
  BearerAuthMetadata,
  BodyMetadata,
  DomainMetadata,
  HeaderMetadata,
  IsBooleanArrayMetadata,
  IsBooleanMetadata,
  IsDateMetadata,
  IsMatchedMetadata,
  IsNestedArrayMetadata,
  IsNestedMetadata,
  IsNumberArrayMetadata,
  IsNumberMetadata,
  IsOneOfArrayMetadata,
  IsOneOfMetadata,
  IsStringArrayMetadata,
  IsStringMetadata,
  MethodNotAllowed,
  NotFoundException,
  PathMetadata,
  QueryMetadata,
  RequestMetadata,
  RequiredMetadata,
} from "@notalk/common";
import { calculateRequest, RequestReducer } from "@notalk/core";
import { isAuthorizer } from "../../common/functions";
import { RequestData } from "../../types";
import { validate, each, isBoolean, isString, isNumber, isOneOf, isMatched } from "./validate";

const ALIAS_BODY = "__body__";

export const requestReducer: RequestReducer<RequestData> = (value, event, metadata) => {
  if (metadata instanceof DomainMetadata) {
    if (event.requestContext.domainName !== metadata.args.value) {
      throw new BadRequestException();
    }

    return value;
  }

  if (metadata instanceof RequestMetadata) {
    const { method, path } = metadata.args;

    if (event.httpMethod.toLowerCase() !== method.toLowerCase()) {
      throw new MethodNotAllowed();
    }

    const pathRegex = new RegExp(path?.startsWith("/") ? "" : "/" + (path ? path.replace(/\/:.*\//, "/.*/") : ""));

    if (!pathRegex.test(event.path)) {
      throw new NotFoundException();
    }

    return value;
  }

  if (metadata instanceof RequiredMetadata) {
    if (!value[metadata.dist]) {
      throw new BadRequestException();
    }

    return value;
  }

  if (metadata instanceof QueryMetadata) {
    return {
      ...value,
      [metadata.dist]: event.queryStringParameters?.[metadata.args.key],
    };
  }

  if (metadata instanceof PathMetadata) {
    return {
      ...value,
      [metadata.dist]: event.pathParameters?.[metadata.args.key],
    };
  }

  if (metadata instanceof BodyMetadata) {
    if (isAuthorizer(event)) {
      return value;
    } else {
      if (!value[ALIAS_BODY]) {
        if (!event.body) {
          value[ALIAS_BODY] = {};
        } else {
          value[ALIAS_BODY] = JSON.parse(event.body);
        }
      }

      if (metadata.args.key) {
        const result = (value[ALIAS_BODY] as Record<string, unknown>)[metadata.args.key];

        return {
          ...value,
          [metadata.dist]: result,
        };
      }

      const result = value[ALIAS_BODY];

      delete value[ALIAS_BODY];

      return {
        ...value,
        [metadata.dist]: result,
      };
    }
  }

  if (metadata instanceof HeaderMetadata) {
    return {
      ...value,
      [metadata.dist]: event.headers?.[metadata.args.key],
    };
  }

  if (metadata instanceof BearerAuthMetadata) {
    return {
      ...value,
      [metadata.dist]: event.headers?.[isAuthorizer(event) ? "authorization" : "Authorization"]?.replace("Bearer ", ""),
    };
  }

  if (metadata instanceof IsBooleanMetadata) {
    validate(value[metadata.dist])(isBoolean);

    return value;
  }

  if (metadata instanceof IsBooleanArrayMetadata) {
    validate(value[metadata.dist])(each(isBoolean));

    return value;
  }

  if (metadata instanceof IsStringMetadata) {
    validate(value[metadata.dist])(isString);

    return value;
  }

  if (metadata instanceof IsStringArrayMetadata) {
    validate(value[metadata.dist])(each(isString));

    return value;
  }

  if (metadata instanceof IsNumberMetadata) {
    validate(value[metadata.dist])(isNumber);

    return value;
  }

  if (metadata instanceof IsNumberArrayMetadata) {
    validate(value[metadata.dist])(each(isNumber));

    return value;
  }

  if (metadata instanceof IsDateMetadata) {
    const prop = value[metadata.dist];

    if (!prop) {
      return value;
    }

    if (typeof prop !== "string" && typeof prop !== "number") {
      throw new BadRequestException();
    }

    const date = new Date(prop);

    if (isNaN(date.getTime())) {
      throw new BadRequestException();
    }

    return {
      ...value,
      [metadata.dist]: date,
    };
  }

  if (metadata instanceof IsOneOfMetadata) {
    validate(value[metadata.dist])(isOneOf(metadata.args.array));

    return value;
  }

  if (metadata instanceof IsOneOfArrayMetadata) {
    validate(value[metadata.dist])(each(isOneOf(metadata.args.array)));

    return value;
  }

  if (metadata instanceof IsMatchedMetadata) {
    validate(value[metadata.dist])(isMatched(metadata.args.regex));

    return value;
  }

  if (metadata instanceof IsNestedMetadata) {
    if (!value[metadata.dist]) {
      return value;
    }

    return {
      ...value,
      [metadata.dist]: calculateRequest({ [ALIAS_BODY]: value[metadata.dist] }, event, requestReducer, metadata.args.type),
    };
  }

  if (metadata instanceof IsNestedArrayMetadata) {
    const prop = value[metadata.dist];

    if (!prop) {
      return value;
    }

    if (!Array.isArray(prop)) {
      throw new BadRequestException();
    }

    return {
      ...value,
      [metadata.dist]: prop.map((element) => calculateRequest({ [ALIAS_BODY]: element }, event, requestReducer, metadata.args.type)),
    };
  }

  throw Error(`${Object.getPrototypeOf(metadata)?.constructor?.name} is not supported yet.`);
};
