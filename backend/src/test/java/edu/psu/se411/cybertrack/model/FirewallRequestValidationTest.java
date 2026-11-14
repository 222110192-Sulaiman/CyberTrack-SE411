package edu.psu.se411.cybertrack.model;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.Set;
import java.util.stream.Collectors;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import edu.psu.se411.cybertrack.TestData;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;

/** Unit tests for the validation rules on FirewallRequest (plain JUnit, no Spring). */
class FirewallRequestValidationTest {

	private static ValidatorFactory factory;
	private static Validator validator;

	@BeforeAll
	static void createValidator() {
		factory = Validation.buildDefaultValidatorFactory();
		validator = factory.getValidator();
	}

	@AfterAll
	static void closeValidator() {
		factory.close();
	}

	/** Field names that have at least one violation. */
	private static Set<String> invalidFields(FirewallRequest request) {
		return validator.validate(request).stream()
				.map(v -> v.getPropertyPath().toString())
				.collect(Collectors.toSet());
	}

	private static Set<String> messagesFor(FirewallRequest request, String field) {
		return validator.validate(request).stream()
				.filter(v -> v.getPropertyPath().toString().equals(field))
				.map(ConstraintViolation::getMessage)
				.collect(Collectors.toSet());
	}

	private static FirewallRequest withName(String name) {
		FirewallRequest r = TestData.validRequest();
		return new FirewallRequest(name, r.manufacturer(), r.model(), r.serialNumber(), r.ipAddress(), r.location(),
				r.status(), r.firmwareVersion(), r.purchaseDate(), r.notes());
	}

	private static FirewallRequest withIp(String ip) {
		FirewallRequest r = TestData.validRequest();
		return new FirewallRequest(r.name(), r.manufacturer(), r.model(), r.serialNumber(), ip, r.location(),
				r.status(), r.firmwareVersion(), r.purchaseDate(), r.notes());
	}

	@Test
	void aCompleteRequestIsValid() {
		assertThat(invalidFields(TestData.validRequest())).isEmpty();
	}

	@Test
	void onlyTheRequiredFieldsAreNeeded() {
		FirewallRequest minimal = new FirewallRequest("FW-1", "Other", "X1", null, "192.168.1.1", "HQ", "Inactive",
				null, null, null);
		assertThat(invalidFields(minimal)).isEmpty();
	}

	@Test
	void everyRequiredFieldIsReportedWhenMissing() {
		FirewallRequest empty = new FirewallRequest(null, null, null, null, null, null, null, null, null, null);
		assertThat(invalidFields(empty))
				.containsExactlyInAnyOrder("name", "manufacturer", "model", "ipAddress", "location", "status");
	}

	@ParameterizedTest
	@ValueSource(strings = { "A", "this-name-is-way-too-long-for-a-firewall-name-really-yes" })
	void nameMustBeTwoToFiftyCharacters(String name) {
		assertThat(messagesFor(withName(name), "name")).containsExactly("Name must be 2–50 characters");
	}

	@ParameterizedTest
	@ValueSource(strings = { "<script>", "FW/01", "FW@HQ" })
	void nameRejectsSpecialCharacters(String name) {
		assertThat(messagesFor(withName(name), "name"))
				.contains("Name may contain only letters, digits, spaces, hyphens, underscores and dots");
	}

	@ParameterizedTest
	@ValueSource(strings = { "0.0.0.0", "10.0.0.1", "192.168.1.254", "255.255.255.255" })
	void acceptsValidIpv4Addresses(String ip) {
		assertThat(invalidFields(withIp(ip))).isEmpty();
	}

	@ParameterizedTest
	@ValueSource(strings = { "256.0.0.1", "10.0.0", "10.0.0.1.5", "01.2.3.4", "abc.def.ghi.jkl", "10.0.0.-1" })
	void rejectsInvalidIpv4Addresses(String ip) {
		assertThat(messagesFor(withIp(ip), "ipAddress"))
				.containsExactly("Enter a valid IPv4 address (e.g. 192.168.1.1)");
	}

	@Test
	void rejectsUnknownManufacturerAndStatus() {
		FirewallRequest r = new FirewallRequest("FW-1", "Acme", "X1", null, "10.0.0.1", "HQ", "Broken", null, null,
				null);
		assertThat(invalidFields(r)).containsExactlyInAnyOrder("manufacturer", "status");
	}

	@Test
	void rejectsAPurchaseDateInTheFuture() {
		FirewallRequest r = new FirewallRequest("FW-1", "Other", "X1", null, "10.0.0.1", "HQ", "Active", null,
				LocalDate.now().plusDays(1), null);
		assertThat(messagesFor(r, "purchaseDate")).containsExactly("Purchase date cannot be in the future");
	}

	@Test
	void acceptsTodayAsThePurchaseDate() {
		FirewallRequest r = new FirewallRequest("FW-1", "Other", "X1", null, "10.0.0.1", "HQ", "Active", null,
				LocalDate.now(), null);
		assertThat(invalidFields(r)).isEmpty();
	}

	@Test
	void enforcesMaximumLengthsOfOptionalFields() {
		FirewallRequest r = new FirewallRequest("FW-1", "Other", "X1", "S".repeat(41), "10.0.0.1", "HQ", "Active",
				"1".repeat(21), null, "n".repeat(501));
		assertThat(invalidFields(r)).containsExactlyInAnyOrder("serialNumber", "firmwareVersion", "notes");
	}

	@Test
	void serialNumberAllowsOnlyLettersDigitsAndHyphens() {
		FirewallRequest r = new FirewallRequest("FW-1", "Other", "X1", "ABC 123", "10.0.0.1", "HQ", "Active", null,
				null, null);
		assertThat(messagesFor(r, "serialNumber"))
				.containsExactly("Serial number may contain only letters, digits and hyphens");
	}

	@Test
	void trimsValuesBeforeValidating() {
		FirewallRequest r = new FirewallRequest("  FW-1  ", "Other", "X1", "   ", " 10.0.0.1 ", " HQ ", "Active", "",
				null, " ");
		assertThat(invalidFields(r)).isEmpty();
		assertThat(r.name()).isEqualTo("FW-1");
		assertThat(r.ipAddress()).isEqualTo("10.0.0.1");
		assertThat(r.serialNumber()).isNull();
		assertThat(r.firmwareVersion()).isNull();
		assertThat(r.notes()).isNull();
	}

	@Test
	void blankTextCountsAsMissing() {
		assertThat(messagesFor(withName("   "), "name")).contains("Name is required");
	}

	@Test
	void toFirewallCopiesEveryFieldAndUsesTheGivenIdAndTimestamps() {
		Firewall f = TestData.validRequest().toFirewall(3L, TestData.CREATED_AT, TestData.UPDATED_AT);
		assertThat(f.id()).isEqualTo(3L);
		assertThat(f.name()).isEqualTo("HQ-EDGE-FW-01");
		assertThat(f.manufacturer()).isEqualTo("Fortinet");
		assertThat(f.model()).isEqualTo("FortiGate 100F");
		assertThat(f.serialNumber()).isEqualTo("FGT100FTK2209A001");
		assertThat(f.ipAddress()).isEqualTo("10.0.0.1");
		assertThat(f.location()).isEqualTo("Riyadh HQ - Server Room A");
		assertThat(f.status()).isEqualTo("Active");
		assertThat(f.firmwareVersion()).isEqualTo("7.4.3");
		assertThat(f.purchaseDate()).isEqualTo(LocalDate.of(2024, 3, 15));
		assertThat(f.notes()).isEqualTo("Primary perimeter firewall");
		assertThat(f.createdAt()).isEqualTo(TestData.CREATED_AT);
		assertThat(f.updatedAt()).isEqualTo(TestData.UPDATED_AT);
	}
}
