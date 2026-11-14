package edu.psu.se411.cybertrack.exception;

/** Thrown when a firewall would reuse the name or IP address of another firewall. */
public class DuplicateFirewallException extends RuntimeException {

	private static final long serialVersionUID = 1L;

	private final String field;

	public DuplicateFirewallException(String field, String message) {
		super(message);
		this.field = field;
	}

	/** The request field that caused the conflict (name or ipAddress). */
	public String getField() {
		return field;
	}
}
