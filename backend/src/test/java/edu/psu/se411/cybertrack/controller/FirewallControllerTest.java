package edu.psu.se411.cybertrack.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasSize;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableHandlerMethodArgumentResolver;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import edu.psu.se411.cybertrack.TestData;
import edu.psu.se411.cybertrack.exception.DuplicateFirewallException;
import edu.psu.se411.cybertrack.exception.FirewallNotFoundException;
import edu.psu.se411.cybertrack.exception.GlobalExceptionHandler;
import edu.psu.se411.cybertrack.model.Firewall;
import edu.psu.se411.cybertrack.model.FirewallRequest;
import edu.psu.se411.cybertrack.model.FirewallSummary;
import edu.psu.se411.cybertrack.service.FirewallService;

/**
 * Unit tests for the REST controller. The service is a Mockito mock and MockMvc sends HTTP requests
 * to the controller without starting a server or a database.
 */
@ExtendWith(MockitoExtension.class)
class FirewallControllerTest {

	private static final String URL = "/api/v1/firewalls";

	@Mock
	private FirewallService service;

	private MockMvc mvc;

	@BeforeEach
	void setUp() {
		LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
		validator.afterPropertiesSet();
		mvc = MockMvcBuilders.standaloneSetup(new FirewallController(service))
				.setControllerAdvice(new GlobalExceptionHandler())
				.setCustomArgumentResolvers(new PageableHandlerMethodArgumentResolver())
				.setValidator(validator)
				.build();
	}

	@Nested
	@DisplayName("GET /api/v1/firewalls (paginated list)")
	class GetAll {

		@Test
		void returnsTheFirstPageNewestFirstByDefault() throws Exception {
			Pageable expected = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "id"));
			Page<Firewall> page = new PageImpl<>(List.of(TestData.firewall(2L), TestData.firewall(1L)), expected, 2);
			when(service.getFirewalls(eq(expected), isNull())).thenReturn(page);

			mvc.perform(get(URL))
					.andExpect(status().isOk())
					.andExpect(jsonPath("$.content", hasSize(2)))
					.andExpect(jsonPath("$.content[0].id").value(2))
					.andExpect(jsonPath("$.content[0].name").value("HQ-EDGE-FW-01"))
					.andExpect(jsonPath("$.page").value(0))
					.andExpect(jsonPath("$.size").value(10))
					.andExpect(jsonPath("$.totalElements").value(2))
					.andExpect(jsonPath("$.totalPages").value(1));
		}

		@Test
		void passesPageSizeSortAndSearchToTheService() throws Exception {
			ArgumentCaptor<Pageable> pageable = ArgumentCaptor.forClass(Pageable.class);
			when(service.getFirewalls(pageable.capture(), eq("riyadh")))
					.thenAnswer(inv -> new PageImpl<Firewall>(List.of(), inv.getArgument(0), 12));

			mvc.perform(get(URL).param("page", "2").param("size", "5").param("sort", "name,asc")
					.param("search", "riyadh"))
					.andExpect(status().isOk())
					.andExpect(jsonPath("$.page").value(2))
					.andExpect(jsonPath("$.size").value(5))
					.andExpect(jsonPath("$.totalElements").value(12))
					.andExpect(jsonPath("$.totalPages").value(3));

			assertThat(pageable.getValue().getPageNumber()).isEqualTo(2);
			assertThat(pageable.getValue().getPageSize()).isEqualTo(5);
			assertThat(pageable.getValue().getSort()).isEqualTo(Sort.by(Sort.Direction.ASC, "name"));
		}

		@Test
		void rejectsPagesLargerThanOneHundred() throws Exception {
			mvc.perform(get(URL).param("size", "101")).andExpect(status().isBadRequest());
			verifyNoInteractions(service);
		}

		@Test
		void rejectsSortingByAnUnknownProperty() throws Exception {
			mvc.perform(get(URL).param("sort", "password")).andExpect(status().isBadRequest());
			verifyNoInteractions(service);
		}
	}

	@Nested
	@DisplayName("GET /api/v1/firewalls/{id}")
	class GetById {

		@Test
		void returnsTheFirewall() throws Exception {
			when(service.getFirewallById(7L)).thenReturn(Optional.of(TestData.firewall(7L)));

			mvc.perform(get(URL + "/7"))
					.andExpect(status().isOk())
					.andExpect(jsonPath("$.id").value(7))
					.andExpect(jsonPath("$.name").value("HQ-EDGE-FW-01"))
					.andExpect(jsonPath("$.manufacturer").value("Fortinet"))
					.andExpect(jsonPath("$.ipAddress").value("10.0.0.1"))
					.andExpect(jsonPath("$.status").value("Active"));
		}

		@Test
		void returns404WhenTheFirewallDoesNotExist() throws Exception {
			when(service.getFirewallById(99L)).thenReturn(Optional.empty());

			mvc.perform(get(URL + "/99")).andExpect(status().isNotFound());
		}

		@Test
		void returns400ForAnIdThatIsNotANumber() throws Exception {
			mvc.perform(get(URL + "/abc")).andExpect(status().isBadRequest());
			verifyNoInteractions(service);
		}
	}

	@Test
	void summaryReturnsTotalAndCountsPerStatus() throws Exception {
		Map<String, Long> byStatus = new LinkedHashMap<>();
		byStatus.put("Active", 6L);
		byStatus.put("Inactive", 2L);
		byStatus.put("Maintenance", 1L);
		byStatus.put("Decommissioned", 1L);
		when(service.getSummary()).thenReturn(new FirewallSummary(10, byStatus));

		mvc.perform(get(URL + "/summary"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total").value(10))
				.andExpect(jsonPath("$.byStatus.Active").value(6))
				.andExpect(jsonPath("$.byStatus.Decommissioned").value(1));
	}

	@Nested
	@DisplayName("POST /api/v1/firewalls")
	class Create {

		@Test
		void returns201WithLocationAndTheCreatedFirewall() throws Exception {
			when(service.createFirewall(any(FirewallRequest.class))).thenReturn(TestData.firewall(11L));

			mvc.perform(post(URL).contentType(MediaType.APPLICATION_JSON).content(TestData.VALID_JSON))
					.andExpect(status().isCreated())
					.andExpect(header().string("Location", "http://localhost/api/v1/firewalls/11"))
					.andExpect(jsonPath("$.id").value(11));
		}

		@Test
		void trimsTextAndTurnsEmptyOptionalFieldsIntoNull() throws Exception {
			when(service.createFirewall(any(FirewallRequest.class))).thenReturn(TestData.firewall(11L));
			String body = """
					{"name": "  NEW-FW-01  ", "manufacturer": "Cisco", "model": " Firepower 1010 ",
					 "serialNumber": "  ", "ipAddress": " 10.50.0.1 ", "location": "Medina Branch",
					 "status": "Active", "firmwareVersion": "", "purchaseDate": null, "notes": "   "}
					""";

			mvc.perform(post(URL).contentType(MediaType.APPLICATION_JSON).content(body))
					.andExpect(status().isCreated());

			ArgumentCaptor<FirewallRequest> request = ArgumentCaptor.forClass(FirewallRequest.class);
			verify(service).createFirewall(request.capture());
			assertThat(request.getValue().name()).isEqualTo("NEW-FW-01");
			assertThat(request.getValue().model()).isEqualTo("Firepower 1010");
			assertThat(request.getValue().ipAddress()).isEqualTo("10.50.0.1");
			assertThat(request.getValue().serialNumber()).isNull();
			assertThat(request.getValue().firmwareVersion()).isNull();
			assertThat(request.getValue().notes()).isNull();
		}

		@Test
		void returns400WithAMessageForEachInvalidField() throws Exception {
			String body = """
					{"name": "", "manufacturer": "Acme", "model": "", "ipAddress": "999.1.1.1",
					 "location": "", "status": "Broken", "purchaseDate": "2999-01-01"}
					""";

			mvc.perform(post(URL).contentType(MediaType.APPLICATION_JSON).content(body))
					.andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.status").value(400))
					.andExpect(jsonPath("$.errors.name").value("Name is required"))
					.andExpect(jsonPath("$.errors.manufacturer").value("Select a manufacturer"))
					.andExpect(jsonPath("$.errors.model").value("Model is required"))
					.andExpect(jsonPath("$.errors.ipAddress").value("Enter a valid IPv4 address (e.g. 192.168.1.1)"))
					.andExpect(jsonPath("$.errors.location").value("Location is required"))
					.andExpect(jsonPath("$.errors.status").value("Select a status"))
					.andExpect(jsonPath("$.errors.purchaseDate").value("Purchase date cannot be in the future"));
			verify(service, never()).createFirewall(any(FirewallRequest.class));
		}

		@Test
		void returns400WhenRequiredFieldsAreMissing() throws Exception {
			mvc.perform(post(URL).contentType(MediaType.APPLICATION_JSON).content("{}"))
					.andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.errors.name").value("Name is required"))
					.andExpect(jsonPath("$.errors.ipAddress").value("IP address is required"));
			verifyNoInteractions(service);
		}

		@Test
		void returns400ForMalformedJson() throws Exception {
			mvc.perform(post(URL).contentType(MediaType.APPLICATION_JSON).content("{\"name\": "))
					.andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.message").value("The request body could not be read"));
			verifyNoInteractions(service);
		}

		@Test
		void returns409WhenTheIpAddressIsTaken() throws Exception {
			when(service.createFirewall(any(FirewallRequest.class)))
					.thenThrow(new DuplicateFirewallException("ipAddress", "This IP address is already assigned"));

			mvc.perform(post(URL).contentType(MediaType.APPLICATION_JSON).content(TestData.VALID_JSON))
					.andExpect(status().isConflict())
					.andExpect(jsonPath("$.errors.ipAddress").value("This IP address is already assigned"));
		}
	}

	@Nested
	@DisplayName("PUT /api/v1/firewalls/{id}")
	class Update {

		@Test
		void returns204AndPassesTheIdAndBodyToTheService() throws Exception {
			when(service.updateFirewall(eq(4L), any(FirewallRequest.class))).thenReturn(TestData.firewall(4L));

			mvc.perform(put(URL + "/4").contentType(MediaType.APPLICATION_JSON).content(TestData.VALID_JSON))
					.andExpect(status().isNoContent());

			ArgumentCaptor<FirewallRequest> request = ArgumentCaptor.forClass(FirewallRequest.class);
			verify(service).updateFirewall(eq(4L), request.capture());
			assertThat(request.getValue().name()).isEqualTo("NEW-FW-01");
		}

		@Test
		void returns404ForAnUnknownId() throws Exception {
			when(service.updateFirewall(eq(42L), any(FirewallRequest.class)))
					.thenThrow(new FirewallNotFoundException(42L));

			mvc.perform(put(URL + "/42").contentType(MediaType.APPLICATION_JSON).content(TestData.VALID_JSON))
					.andExpect(status().isNotFound())
					.andExpect(jsonPath("$.message").value("Firewall 42 was not found"));
		}

		@Test
		void returns400AndDoesNotUpdateWhenTheBodyIsInvalid() throws Exception {
			String body = TestData.VALID_JSON.replace("\"10.50.0.1\"", "\"not-an-ip\"");

			mvc.perform(put(URL + "/4").contentType(MediaType.APPLICATION_JSON).content(body))
					.andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.errors.ipAddress").exists());
			verify(service, never()).updateFirewall(any(), any(FirewallRequest.class));
		}

		@Test
		void returns409WhenTheNameBelongsToAnotherFirewall() throws Exception {
			when(service.updateFirewall(eq(4L), any(FirewallRequest.class)))
					.thenThrow(new DuplicateFirewallException("name", "A firewall with this name already exists"));

			mvc.perform(put(URL + "/4").contentType(MediaType.APPLICATION_JSON).content(TestData.VALID_JSON))
					.andExpect(status().isConflict())
					.andExpect(jsonPath("$.errors.name").value("A firewall with this name already exists"));
		}
	}

	@Nested
	@DisplayName("DELETE /api/v1/firewalls/{id}")
	class Delete {

		@Test
		void returns204WhenDeleted() throws Exception {
			mvc.perform(delete(URL + "/5")).andExpect(status().isNoContent());
			verify(service).deleteFirewall(5L);
		}

		@Test
		void returns404ForAnUnknownId() throws Exception {
			doThrow(new FirewallNotFoundException(9L)).when(service).deleteFirewall(9L);

			mvc.perform(delete(URL + "/9")).andExpect(status().isNotFound());
		}
	}
}
