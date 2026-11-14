package edu.psu.se411.cybertrack.model;

import java.util.List;

/**
 * Allowed values and formats shared by validation and the service layer.
 * They match the rules used by the React frontend (src/data/constants.js and src/utils/validation.js).
 */
public final class FirewallConstants {

	private FirewallConstants() {
	}

	public static final List<String> MANUFACTURERS = List.of("Cisco", "Fortinet", "Palo Alto Networks", "Check Point",
			"Juniper Networks", "SonicWall", "Sophos", "Other");

	public static final List<String> STATUSES = List.of("Active", "Inactive", "Maintenance", "Decommissioned");

	/** Regular expressions must be compile-time constants to be used inside annotations. */
	public static final String MANUFACTURER_REGEX = "Cisco|Fortinet|Palo Alto Networks|Check Point|Juniper Networks|SonicWall|Sophos|Other";

	public static final String STATUS_REGEX = "Active|Inactive|Maintenance|Decommissioned";

	public static final String NAME_REGEX = "^[A-Za-z0-9 ._-]*$";

	public static final String SERIAL_REGEX = "^[A-Za-z0-9-]*$";

	private static final String OCTET = "(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)";

	public static final String IPV4_REGEX = "^" + OCTET + "(\\." + OCTET + "){3}$";

	/** Properties a client may sort the inventory by. */
	public static final List<String> SORTABLE_PROPERTIES = List.of("id", "name", "manufacturer", "model", "ipAddress",
			"location", "status", "purchaseDate", "createdAt", "updatedAt");

	public static final int MAX_PAGE_SIZE = 100;
}
