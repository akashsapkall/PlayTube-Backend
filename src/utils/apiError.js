class ApiError extends Error {
    constructor(
      statusCode,
      message = "Something went wrong",
      errors = [],
    ) {
      super(message);
      this.statusCode = statusCode;
      this.message=message;
      this.errors = errors;
      this.success = false;
  
      // Capture stack trace (optional but recommended)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  }

  export { ApiError };