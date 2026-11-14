package edu.psu.se411.cybertrack.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import edu.psu.se411.cybertrack.model.ApiError;

/** Turns exceptions into JSON error responses with standard HTTP status codes. */
@RestControllerAdvice
public class GlobalExceptionHandler {

	/** 400: one or more fields failed Bean Validation. */
	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
		Map<String, String> errors = new LinkedHashMap<>();
		for (FieldError error : ex.getBindingResult().getFieldErrors()) {
			// Keep one message per field. "Required" messages win over format messages.
			boolean isRequiredError = "NotBlank".equals(error.getCode()) || "NotNull".equals(error.getCode());
			if (isRequiredError || !errors.containsKey(error.getField())) {
				errors.put(error.getField(), error.getDefaultMessage());
			}
		}
		return ResponseEntity.badRequest()
				.body(new ApiError(HttpStatus.BAD_REQUEST.value(), "Firewall data is invalid", errors));
	}

	/** 400: the body is not valid JSON, or a value has the wrong type (for example an invalid date). */
	@ExceptionHandler(HttpMessageNotReadableException.class)
	public ResponseEntity<ApiError> handleUnreadable(HttpMessageNotReadableException ex) {
		return ResponseEntity.badRequest()
				.body(new ApiError(HttpStatus.BAD_REQUEST.value(), "The request body could not be read"));
	}

	/** 400: a path or query parameter has the wrong type, for example /api/v1/firewalls/abc. */
	@ExceptionHandler(MethodArgumentTypeMismatchException.class)
	public ResponseEntity<ApiError> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
		return ResponseEntity.badRequest()
				.body(new ApiError(HttpStatus.BAD_REQUEST.value(), "Invalid value for '" + ex.getName() + "'"));
	}

	/** 404: no firewall has the requested id. */
	@ExceptionHandler(FirewallNotFoundException.class)
	public ResponseEntity<ApiError> handleNotFound(FirewallNotFoundException ex) {
		return ResponseEntity.status(HttpStatus.NOT_FOUND)
				.body(new ApiError(HttpStatus.NOT_FOUND.value(), ex.getMessage()));
	}

	/** 409: the name or IP address is already used by another firewall. */
	@ExceptionHandler(DuplicateFirewallException.class)
	public ResponseEntity<ApiError> handleDuplicate(DuplicateFirewallException ex) {
		return ResponseEntity.status(HttpStatus.CONFLICT).body(
				new ApiError(HttpStatus.CONFLICT.value(), ex.getMessage(), Map.of(ex.getField(), ex.getMessage())));
	}

	/** 409: a database constraint was broken (safety net behind the service's own checks). */
	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<ApiError> handleDataIntegrity(DataIntegrityViolationException ex) {
		return ResponseEntity.status(HttpStatus.CONFLICT).body(new ApiError(HttpStatus.CONFLICT.value(),
				"The firewall conflicts with an existing record"));
	}
}
