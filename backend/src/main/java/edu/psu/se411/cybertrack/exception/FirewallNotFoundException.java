package edu.psu.se411.cybertrack.exception;

public class FirewallNotFoundException extends RuntimeException {

	private static final long serialVersionUID = 1L;

	public FirewallNotFoundException(Long id) {
		super("Firewall " + id + " was not found");
	}
}
