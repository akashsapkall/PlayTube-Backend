class ApiError extends Error {
    constructor(
      statusCode,
      errors = [],
      message = "Something went wrong",
    ) {
      super(message);
      this.statusCode = statusCode;
      this.errors = errors;
      this.success = false;
  
      // Capture stack trace (optional but recommended)
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      }
    }
  }