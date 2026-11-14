package edu.psu.se411.cybertrack.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request body for creating (POST) or updating (PUT) a firewall.
 * It holds only the fields a user may edit: the id and the timestamps are set by the server,
 * so a client cannot choose or change them.
 */
public record FirewallRequest(
		@NotBlank(message = "Name is required")
		@Size(min = 2, max = 50, message = "Name must be 2–50 characters")
		@Pattern(regexp = FirewallConstants.NAME_REGEX,
				message = "Name may contain only letters, digits, spaces, hyphens, underscores and dots")
		String name,

		@NotBlank(message = "Select a manufacturer")
		@Pattern(regexp = FirewallConstants.MANUFACTURER_REGEX, message = "Select a manufacturer")
		String manufacturer,

		@NotBlank(message = "Model is required")
		@Size(max = 50, message = "Model cannot exceed 50 characters")
		String model,

		@Size(max = 40, message = "Serial number cannot exceed 40 characters")
		@Pattern(regexp = FirewallConstants.SERIAL_REGEX,
				message = "Serial number may contain only letters, digits and hyphens")
		String serialNumber,

		@NotBlank(message = "IP address is required")
		@Pattern(regexp = FirewallConstants.IPV4_REGEX, message = "Enter a valid IPv4 address (e.g. 192.168.1.1)")
		String ipAddress,

		@NotBlank(message = "Location is required")
		@Size(min = 2, max = 100, message = "Location must be 2–100 characters")
		String location,

		@NotBlank(message = "Select a status")
		@Pattern(regexp = FirewallConstants.STATUS_REGEX, message = "Select a status")
		String status,

		@Size(max = 20, message = "Firmware version cannot exceed 20 characters")
		String firmwareVersion,

		@PastOrPresent(message = "Purchase date cannot be in the future")
		LocalDate purchaseDate,

		@Size(max = 500, message = "Notes cannot exceed 500 characters")
		String notes) {

	/** Trims every text value, and stores empty optional values as null, before validation runs. */
	public FirewallRequest {
		name = trim(name);
		manufacturer = trim(manufacturer);
		model = trim(model);
		serialNumber = trimToNull(serialNumber);
		ipAddress = trim(ipAddress);
		location = trim(location);
		status = trim(status);
		firmwareVersion = trimToNull(firmwareVersion);
		notes = trimToNull(notes);
	}

	/** Builds the entity to save, with the id and timestamps decided by the service. */
	public Firewall toFirewall(Long id, LocalDateTime createdAt, LocalDateTime updatedAt) {
		return new Firewall(id, name, manufacturer, model, serialNumber, ipAddress, location, status, firmwareVersion,
				purchaseDate, notes, createdAt, updatedAt);
	}

	private static String trim(String value) {
		return value == null ? null : value.trim();
	}

	private static String trimToNull(String value) {
		String trimmed = trim(value);
		return trimmed == null || trimmed.isEmpty() ? null : trimmed;
	}
}
