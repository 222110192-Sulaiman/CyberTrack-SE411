/** Thrown when firewall data fails validation. `errors` maps a field name to its message. */
export class ValidationError extends Error {
  constructor(errors) {
    super('Firewall data is invalid');
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class NotFoundError extends Error {
  constructor(id) {
    super(`Firewall ${id} was not found`);
    this.name = 'NotFoundError';
  }
}

/** Thrown when the backend cannot be reached or answers with an unexpected error. */
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}
