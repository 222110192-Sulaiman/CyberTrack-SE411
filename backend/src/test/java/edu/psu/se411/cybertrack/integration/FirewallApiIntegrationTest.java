package edu.psu.se411.cybertrack.integration;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import edu.psu.se411.cybertrack.TestData;

/**
 * End-to-end tests of the API with the real Spring configuration and the H2 database
 * (seeded by data.sql with 10 firewalls). Each test runs in a transaction that is rolled back.
 */
@SpringBootTest
@Transactional
class FirewallApiIntegrationTest {

	private static final String URL = "/api/v1/firewalls";

	@Autowired
	private WebApplicationContext context;

	private MockMvc mvc;

	@BeforeEach
	void setUp() {
		mvc = MockMvcBuilders.webAppContextSetup(context).build();
	}

	@Test
	void listsTheSeededFirewallsNewestFirst() throws Exception {
		mvc.perform(get(URL))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content", hasSize(10)))
				.andExpect(jsonPath("$.content[0].name").value("LEGACY-FW-OLD"))
				.andExpect(jsonPath("$.content[9].name").value("HQ-EDGE-FW-01"))
				.andExpect(jsonPath("$.totalElements").value(10))
				.andExpect(jsonPath("$.totalPages").value(1));
	}

	@Test
	void paginatesAndSorts() throws Exception {
		mvc.perform(get(URL).param("page", "1").param("size", "3").param("sort", "name,asc"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.content", hasSize(3)))
				.andExpect(jsonPath("$.content[0].name").value("DMZ-FW-01"))
				.andExpect(jsonPath("$.page").value(1))
				.andExpect(jsonPath("$.totalPages").value(4));
	}

	@Test
	void searchesAcrossTextFieldsIgnoringCase() throws Exception {
		mvc.perform(get(URL).param("search", "JEDDAH"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalElements").value(2))
				.andExpect(jsonPath("$.content[0].name").value("DC-CORE-FW-01"))
				.andExpect(jsonPath("$.content[1].name").value("DMZ-FW-01"));

		mvc.perform(get(URL).param("search", "172.16."))
				.andExpect(jsonPath("$.totalElements").value(2));

		mvc.perform(get(URL).param("search", "cisco").param("size", "1"))
				.andExpect(jsonPath("$.content", hasSize(1)))
				.andExpect(jsonPath("$.totalElements").value(2))
				.andExpect(jsonPath("$.totalPages").value(2));
	}

	@Test
	void findsAFirewallByIdWithIsoDates() throws Exception {
		mvc.perform(get(URL + "/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.id").value(1))
				.andExpect(jsonPath("$.name").value("HQ-EDGE-FW-01"))
				.andExpect(jsonPath("$.ipAddress").value("10.0.0.1"))
				.andExpect(jsonPath("$.location").value("Riyadh HQ – Server Room A"))
				.andExpect(jsonPath("$.purchaseDate").value("2024-03-15"))
				.andExpect(jsonPath("$.createdAt").value("2026-09-01T08:00:00"));

		mvc.perform(get(URL + "/9999")).andExpect(status().isNotFound());
	}

	@Test
	void createsReadsUpdatesAndDeletesAFirewall() throws Exception {
		String location = mvc.perform(post(URL).contentType(MediaType.APPLICATION_JSON).content(TestData.VALID_JSON))
				.andExpect(status().isCreated())
				.andExpect(header().exists("Location"))
				.andExpect(jsonPath("$.name").value("NEW-FW-01"))
				.andExpect(jsonPath("$.createdAt").exists())
				.andReturn().getResponse().getHeader("Location");

		mvc.perform(get(location))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.ipAddress").value("10.50.0.1"))
				.andExpect(jsonPath("$.purchaseDate").value("2024-01-25"));

		String changed = TestData.VALID_JSON.replace("\"Active\"", "\"Maintenance\"");
		mvc.perform(put(location).contentType(MediaType.APPLICATION_JSON).content(changed))
				.andExpect(status().isNoContent());
		mvc.perform(get(location)).andExpect(jsonPath("$.status").value("Maintenance"));

		mvc.perform(delete(location)).andExpect(status().isNoContent());
		mvc.perform(get(location)).andExpect(status().isNotFound());
		mvc.perform(delete(location)).andExpect(status().isNotFound());
	}

	@Test
	void rejectsDuplicateNamesAndIpAddresses() throws Exception {
		String duplicateIp = TestData.VALID_JSON.replace("\"10.50.0.1\"", "\"10.0.0.1\"");
		mvc.perform(post(URL).contentType(MediaType.APPLICATION_JSON).content(duplicateIp))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.errors.ipAddress").value("This IP address is already assigned"));

		String duplicateName = TestData.VALID_JSON.replace("\"NEW-FW-01\"", "\"hq-edge-fw-01\"");
		mvc.perform(post(URL).contentType(MediaType.APPLICATION_JSON).content(duplicateName))
				.andExpect(status().isConflict())
				.andExpect(jsonPath("$.errors.name").value("A firewall with this name already exists"));
	}

	@Test
	void anUpdateMayKeepItsOwnNameAndIpAddress() throws Exception {
		String same = """
				{"name": "HQ-EDGE-FW-01", "manufacturer": "Fortinet", "model": "FortiGate 200F",
				 "ipAddress": "10.0.0.1", "location": "Riyadh HQ", "status": "Active"}
				""";
		mvc.perform(put(URL + "/1").contentType(MediaType.APPLICATION_JSON).content(same))
				.andExpect(status().isNoContent());
		mvc.perform(get(URL + "/1"))
				.andExpect(jsonPath("$.model").value("FortiGate 200F"))
				.andExpect(jsonPath("$.createdAt").value("2026-09-01T08:00:00"));
	}

	@Test
	void rejectsInvalidData() throws Exception {
		mvc.perform(post(URL).contentType(MediaType.APPLICATION_JSON).content("{\"name\": \"x\"}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.errors.name").value("Name must be 2–50 characters"))
				.andExpect(jsonPath("$.errors.ipAddress").value("IP address is required"));
	}

	@Test
	void summarisesTheInventoryByStatus() throws Exception {
		mvc.perform(get(URL + "/summary"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(10))
				.andExpect(jsonPath("$.byStatus.Active").value(6))
				.andExpect(jsonPath("$.byStatus.Inactive").value(2))
				.andExpect(jsonPath("$.byStatus.Maintenance").value(1))
				.andExpect(jsonPath("$.byStatus.Decommissioned").value(1));
	}
}
