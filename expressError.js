class ExpressError extends Error {
    constructor(message, status) {
      super();
      this.message = message;
      this.status = status;
    }
  }
  
  /** 404 NOT FOUND ERROR */
  class NotFoundError extends ExpressError {
    constructor(message = "Not Found") {
      super(message, 404);
    }
  }
  
  /** 401 UNAUTHORIZED ERROR */
  class UnauthorizedError extends ExpressError {
      constructor(message = "Unauthorized") {
          super(message, 401);
      }
  }
  
  /** 400 BAD REQUEST */
  class BadRequestError extends ExpressError {
      constructor(message = 'Bad Request') {
          super(message, 400);
      }
  }
  
  /** 403 FORBIDDEN REQUEST */
  class ForbiddenRequestError extends ExpressError {
      constructor(message = 'Forbidden Request') {
          super(message, 403);
      }
  }
  
  module.exports = {
      ExpressError,
      NotFoundError,
      UnauthorizedError,
      BadRequestError,
      ForbiddenRequestError
  }