package edu.psu.se411.cybertrack.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
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

import edu.psu.se411.cybertrack.TestData;
import edu.psu.se411.cybertrack.exception.DuplicateFirewallException;
import edu.psu.se411.cybertrack.exception.FirewallNotFoundException;
import edu.psu.se411.cybertrack.model.Firewall;
import edu.psu.se411.cybertrack.model.FirewallRequest;
import edu.psu.se411.cybertrack.model.FirewallSummary;
import edu.psu.se411.cybertrack.repository.FirewallRepository;

/** Unit tests for the service layer. The repository is a Mockito mock, so no database is used. */
@ExtendWith(MockitoExtension.class)
class FirewallServiceImplTest {

	private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 14, 12, 30, 0);

	@Mock
	private FirewallRepository repository;

	private FirewallServiceImpl service;

	@BeforeEach
	void setUp() {
		Clock fixed = Clock.fixed(NOW.toInstant(ZoneOffset.UTC), ZoneOffset.UTC);
		service = new FirewallServiceImpl(repository, fixed);
	}

	/** Makes the mocked save() behave like the database: a new firewall receives the given id. */
	private void saveAssignsId(long newId) {
		when(repository.save(any(Firewall.class))).thenAnswer(invocation -> {
			Firewall f = invocation.getArgument(0);
			Long id = f.id() != null ? f.id() : newId;
			return new Firewall(id, f.name(), f.manufacturer(), f.model(), f.serialNumber(), f.ipAddress(),
					f.location(), f.status(), f.firmwareVersion(), f.purchaseDate(), f.notes(), f.createdAt(),
					f.updatedAt());
		});
	}

	@Nested
	@DisplayName("getFirewalls")
	class GetFirewalls {

		@Test
		void returnsThePageFromTheRepositoryWhenThereIsNoSearch() {
			Pageable pageable = PageRequest.of(0, 10, Sort.by("id"));
			Page<Firewall> page = new PageImpl<>(List.of(TestData.firewall(1L)), pageable, 1);
			when(repository.findAll(pageable)).thenReturn(page);

			assertThat(service.getFirewalls(pageable, null)).isSameAs(page);
			assertThat(service.getFirewalls(pageable, "   ")).isSameAs(page);
			verify(repository, never()).search(anyString(), anyInt(), anyLong());
		}

		@Test
		void searchesCaseInsensitivelyAndBuildsThePage() {
			Pageable pageable = PageRequest.of(1, 5);
			List<Firewall> found = List.of(TestData.firewall(7L));
			when(repository.search("%riyadh%", 5, 5L)).thenReturn(found);
			when(repository.countSearch("%riyadh%")).thenReturn(6L);

			Page<Firewall> page = service.getFirewalls(pageable, "  RIYADH ");

			assertThat(page.getContent()).isEqualTo(found);
			assertThat(page.getTotalElements()).isEqualTo(6);
			assertThat(page.getTotalPages()).isEqualTo(2);
			assertThat(page.getNumber()).isEqualTo(1);
		}

		@Test
		void escapesLikeWildcardsInTheSearchText() {
			Pageable pageable = PageRequest.of(0, 10);
			when(repository.search("%50\\%\\_off%", 10, 0L)).thenReturn(List.of());
			when(repository.countSearch("%50\\%\\_off%")).thenReturn(0L);

			Page<Firewall> page = service.getFirewalls(pageable, "50%_off");

			assertThat(page.getContent()).isEmpty();
			assertThat(page.getTotalElements()).isZero();
		}
	}

	@Nested
	@DisplayName("getFirewallById")
	class GetById {

		@Test
		void returnsTheFirewallWhenItExists() {
			Firewall firewall = TestData.firewall(3L);
			when(repository.findById(3L)).thenReturn(Optional.of(firewall));

			assertThat(service.getFirewallById(3L)).contains(firewall);
		}

		@Test
		void returnsEmptyWhenTheFirewallDoesNotExist() {
			when(repository.findById(99L)).thenReturn(Optional.empty());

			assertThat(service.getFirewallById(99L)).isEmpty();
		}
	}

	@Nested
	@DisplayName("createFirewall")
	class Create {

		@Test
		void savesANewFirewallWithoutIdAndWithServerTimestamps() {
			when(repository.countByNameExcludingId("HQ-EDGE-FW-01", 0L)).thenReturn(0L);
			when(repository.countByIpAddressExcludingId("10.0.0.1", 0L)).thenReturn(0L);
			saveAssignsId(11L);

			Firewall created = service.createFirewall(TestData.validRequest());

			ArgumentCaptor<Firewall> saved = ArgumentCaptor.forClass(Firewall.class);
			verify(repository).save(saved.capture());
			assertThat(saved.getValue().id()).isNull();
			assertThat(saved.getValue().createdAt()).isEqualTo(NOW);
			assertThat(saved.getValue().updatedAt()).isEqualTo(NOW);

			assertThat(created.id()).isEqualTo(11L);
			assertThat(created.name()).isEqualTo("HQ-EDGE-FW-01");
			assertThat(created.ipAddress()).isEqualTo("10.0.0.1");
		}

		@Test
		void rejectsADuplicateNameWithoutSaving() {
			when(repository.countByNameExcludingId("HQ-EDGE-FW-01", 0L)).thenReturn(1L);

			assertThatThrownBy(() -> service.createFirewall(TestData.validRequest()))
					.isInstanceOf(DuplicateFirewallException.class)
					.hasMessage("A firewall with this name already exists")
					.extracting("field").isEqualTo("name");
			verify(repository, never()).save(any(Firewall.class));
		}

		@Test
		void rejectsADuplicateIpAddressWithoutSaving() {
			when(repository.countByNameExcludingId("HQ-EDGE-FW-01", 0L)).thenReturn(0L);
			when(repository.countByIpAddressExcludingId("10.0.0.1", 0L)).thenReturn(1L);

			assertThatThrownBy(() -> service.createFirewall(TestData.validRequest()))
					.isInstanceOf(DuplicateFirewallException.class)
					.hasMessage("This IP address is already assigned")
					.extracting("field").isEqualTo("ipAddress");
			verify(repository, never()).save(any(Firewall.class));
		}
	}

	@Nested
	@DisplayName("updateFirewall")
	class Update {

		@Test
		void keepsIdAndCreatedAtAndRefreshesUpdatedAt() {
			when(repository.findById(4L)).thenReturn(Optional.of(TestData.firewall(4L)));
			when(repository.countByNameExcludingId("RENAMED-FW", 4L)).thenReturn(0L);
			when(repository.countByIpAddressExcludingId("10.0.0.1", 4L)).thenReturn(0L);
			saveAssignsId(999L);

			FirewallRequest change = new FirewallRequest("RENAMED-FW", "Cisco", "ASA 5516-X", null, "10.0.0.1",
					"Riyadh HQ", "Maintenance", null, null, null);
			Firewall updated = service.updateFirewall(4L, change);

			assertThat(updated.id()).isEqualTo(4L);
			assertThat(updated.name()).isEqualTo("RENAMED-FW");
			assertThat(updated.status()).isEqualTo("Maintenance");
			assertThat(updated.createdAt()).isEqualTo(TestData.CREATED_AT);
			assertThat(updated.updatedAt()).isEqualTo(NOW);
		}

		@Test
		void excludesTheFirewallItselfFromTheUniquenessChecks() {
			when(repository.findById(4L)).thenReturn(Optional.of(TestData.firewall(4L)));
			when(repository.countByNameExcludingId("HQ-EDGE-FW-01", 4L)).thenReturn(0L);
			when(repository.countByIpAddressExcludingId("10.0.0.1", 4L)).thenReturn(0L);
			saveAssignsId(999L);

			service.updateFirewall(4L, TestData.validRequest());

			verify(repository).countByNameExcludingId("HQ-EDGE-FW-01", 4L);
			verify(repository).countByIpAddressExcludingId("10.0.0.1", 4L);
		}

		@Test
		void throwsNotFoundForAnUnknownId() {
			when(repository.findById(42L)).thenReturn(Optional.empty());

			assertThatThrownBy(() -> service.updateFirewall(42L, TestData.validRequest()))
					.isInstanceOf(FirewallNotFoundException.class)
					.hasMessage("Firewall 42 was not found");
			verify(repository, never()).save(any(Firewall.class));
		}

		@Test
		void rejectsTheNameOfAnotherFirewall() {
			when(repository.findById(4L)).thenReturn(Optional.of(TestData.firewall(4L)));
			when(repository.countByNameExcludingId(eq("HQ-EDGE-FW-01"), eq(4L))).thenReturn(1L);

			assertThatThrownBy(() -> service.updateFirewall(4L, TestData.validRequest()))
					.isInstanceOf(DuplicateFirewallException.class);
			verify(repository, never()).save(any(Firewall.class));
		}
	}

	@Nested
	@DisplayName("deleteFirewall")
	class Delete {

		@Test
		void deletesAnExistingFirewall() {
			when(repository.existsById(5L)).thenReturn(true);

			service.deleteFirewall(5L);

			verify(repository).deleteById(5L);
		}

		@Test
		void throwsNotFoundAndDeletesNothingForAnUnknownId() {
			when(repository.existsById(5L)).thenReturn(false);

			assertThatThrownBy(() -> service.deleteFirewall(5L)).isInstanceOf(FirewallNotFoundException.class);
			verify(repository, never()).deleteById(anyLong());
		}
	}

	@Test
	void summaryCountsEveryStatusInOrder() {
		when(repository.count()).thenReturn(10L);
		when(repository.countWithStatus("Active")).thenReturn(6L);
		when(repository.countWithStatus("Inactive")).thenReturn(2L);
		when(repository.countWithStatus("Maintenance")).thenReturn(1L);
		when(repository.countWithStatus("Decommissioned")).thenReturn(1L);

		FirewallSummary summary = service.getSummary();

		assertThat(summary.total()).isEqualTo(10);
		assertThat(summary.byStatus()).containsExactly(
				org.assertj.core.api.Assertions.entry("Active", 6L),
				org.assertj.core.api.Assertions.entry("Inactive", 2L),
				org.assertj.core.api.Assertions.entry("Maintenance", 1L),
				org.assertj.core.api.Assertions.entry("Decommissioned", 1L));
	}

	@Test
	void publicConstructorUsesTheSystemClock() {
		FirewallServiceImpl real = new FirewallServiceImpl(repository);
		when(repository.countByNameExcludingId(anyString(), anyLong())).thenReturn(0L);
		when(repository.countByIpAddressExcludingId(anyString(), anyLong())).thenReturn(0L);
		saveAssignsId(1L);

		Instant before = Instant.now().minusSeconds(2);
		Firewall created = real.createFirewall(TestData.validRequest());

		assertThat(created.createdAt()).isAfter(LocalDateTime.ofInstant(before, Clock.systemDefaultZone().getZone()));
	}
}
