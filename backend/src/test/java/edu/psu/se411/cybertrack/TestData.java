package edu.psu.se411.cybertrack;

import java.time.LocalDate;
import java.time.LocalDateTime;

import edu.psu.se411.cybertrack.model.Firewall;
import edu.psu.se411.cybertrack.model.FirewallRequest;

/** Sample objects shared by the tests. */
public final class TestData {

	private TestData() {
	}

	public static final LocalDateTime CREATED_AT = LocalDateTime.of(2026, 9, 1, 8, 0, 0);
	public static final LocalDateTime UPDATED_AT = LocalDateTime.of(2026, 10, 1, 9, 0, 0);

	public static FirewallRequest validRequest() {
		return new FirewallRequest("HQ-EDGE-FW-01", "Fortinet", "FortiGate 100F", "FGT100FTK2209A001", "10.0.0.1",
				"Riyadh HQ - Server Room A", "Active", "7.4.3", LocalDate.of(2024, 3, 15), "Primary perimeter firewall");
	}

	public static Firewall firewall(Long id) {
		return validRequest().toFirewall(id, CREATED_AT, UPDATED_AT);
	}

	public static Firewall firewall(Long id, String name, String ipAddress, String status) {
		return new Firewall(id, name, "Cisco", "Firepower 1120", null, ipAddress, "Dammam Branch", status, null, null,
				null, CREATED_AT, UPDATED_AT);
	}

	/** Valid JSON request body, as the React frontend sends it. */
	public static final String VALID_JSON = """
			{
			  "name": "NEW-FW-01",
			  "manufacturer": "Cisco",
			  "model": "Firepower 1010",
			  "serialNumber": "JAD2241088X",
			  "ipAddress": "10.50.0.1",
			  "location": "Medina Branch",
			  "status": "Active",
			  "firmwareVersion": "7.2.5",
			  "purchaseDate": "2024-01-25",
			  "notes": "Branch firewall"
			}
			""";
}
