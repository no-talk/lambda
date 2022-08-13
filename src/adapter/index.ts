export * from "./gateway_proxy";
export * from "./authorizer";
export * from "./sqs";

import { Handler } from "aws-lambda";
import { report } from "../common/logger";
import { isAuthorizer, isGatewayProxy, isSqs } from "../common/validators";
import { Lambda, Class } from "../types";
import { authorizerAdapter } from "./authorizer";
import { gatewayProxyAdapter } from "./gateway_proxy";
import { sqsAdapter } from "./sqs";

export const notalk =
  <Request, Response>(request: Class<Request>, response: Class<Response>) =>
  (lambda: Lambda<Request, Response>): Handler =>
  async (event, context, callback) => {
    if (isSqs(event)) {
      return sqsAdapter(request, response)(lambda)(event, context, callback);
    }

    if (isAuthorizer(event)) {
      return authorizerAdapter(request, response)(lambda)(event, context, callback);
    }

    if (isGatewayProxy(event)) {
      return gatewayProxyAdapter(request, response)(lambda)(event, context, callback);
    }

    report("NotSupportedEventError :: ", event);
  };
