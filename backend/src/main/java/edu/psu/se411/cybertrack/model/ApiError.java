package edu.psu.se411.cybertrack.model;

import java.util.Map;

/**
 * JSON body returned for failed requests.
 * errors maps a field name to its message, so the frontend can show it next to the right input.
 */
public record ApiError(int status, String message, Map<String, String> errors) {

	public ApiError(int status, String message) {
		this(status, message, Map.of());
	}
}
