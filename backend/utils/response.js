// Standardized API response utility
export const createResponse = (success, data = null, message = '', statusCode = 200) => {
  const response = {
    success,
    message,
    timestamp: new Date().toISOString(),
    ...(data && { data }),
    ...(statusCode && { statusCode })
  };
  
  return response;
};

export const createSuccessResponse = (data, message = 'Success') => {
  return createResponse(true, data, message, 200);
};

export const createErrorResponse = (message, statusCode = 400, details = null) => {
  const response = createResponse(false, null, message, statusCode);
  if (details) {
    response.details = details;
  }
  return response;
};

export const createValidationError = (errors) => {
  return createErrorResponse('Validation failed', 400, { validationErrors: errors });
};

export const createNotFoundError = (resource) => {
  return createErrorResponse(`${resource} not found`, 404);
};

export const createUnauthorizedError = (message = 'Unauthorized') => {
  return createErrorResponse(message, 401);
};

export const createForbiddenError = (message = 'Forbidden') => {
  return createErrorResponse(message, 403);
};

export const createInternalError = (message = 'Internal server error') => {
  return createErrorResponse(message, 500);
};
