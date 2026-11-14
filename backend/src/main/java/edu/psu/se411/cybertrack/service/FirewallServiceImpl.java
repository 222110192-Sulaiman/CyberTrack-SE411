package edu.psu.se411.cybertrack.service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import edu.psu.se411.cybertrack.exception.DuplicateFirewallException;
import edu.psu.se411.cybertrack.exception.FirewallNotFoundException;
import edu.psu.se411.cybertrack.model.Firewall;
import edu.psu.se411.cybertrack.model.FirewallConstants;
import edu.psu.se411.cybertrack.model.FirewallRequest;
import edu.psu.se411.cybertrack.model.FirewallSummary;
import edu.psu.se411.cybertrack.repository.FirewallRepository;

@Service
public class FirewallServiceImpl implements FirewallService {

	/** Used instead of a real id when checking uniqueness for a new firewall (database ids start at 1). */
	private static final long NO_ID = 0L;

	private final FirewallRepository firewallRepository;
	private final Clock clock;

	/** Constructor used by Spring (dependency injection). @Autowired picks it because there are two constructors. */
	@Autowired
	public FirewallServiceImpl(FirewallRepository firewallRepository) {
		this(firewallRepository, Clock.systemDefaultZone());
	}

	/** Lets tests supply a fixed clock so timestamps are predictable. */
	FirewallServiceImpl(FirewallRepository firewallRepository, Clock clock) {
		this.firewallRepository = firewallRepository;
		this.clock = clock;
	}

	@Override
	public Page<Firewall> getFirewalls(Pageable pageable, String search) {
		if (search == null || search.isBlank()) {
			return firewallRepository.findAll(pageable);
		}
		String pattern = "%" + escapeLike(search.trim().toLowerCase(Locale.ROOT)) + "%";
		List<Firewall> content = firewallRepository.search(pattern, pageable.getPageSize(), pageable.getOffset());
		long total = firewallRepository.countSearch(pattern);
		return new PageImpl<>(content, pageable, total);
	}

	@Override
	public Optional<Firewall> getFirewallById(Long id) {
		return firewallRepository.findById(id);
	}

	@Override
	public Firewall createFirewall(FirewallRequest request) {
		checkUnique(request, NO_ID);
		LocalDateTime now = now();
		// id is null, so Spring Data inserts a new row and the database generates the id.
		return firewallRepository.save(request.toFirewall(null, now, now));
	}

	@Override
	public Firewall updateFirewall(Long id, FirewallRequest request) {
		Firewall existing = firewallRepository.findById(id).orElseThrow(() -> new FirewallNotFoundException(id));
		checkUnique(request, id);
		// Same id, so save() updates the row. createdAt is kept; updatedAt is refreshed.
		return firewallRepository.save(request.toFirewall(id, existing.createdAt(), now()));
	}

	@Override
	public void deleteFirewall(Long id) {
		if (!firewallRepository.existsById(id)) {
			throw new FirewallNotFoundException(id);
		}
		firewallRepository.deleteById(id);
	}

	@Override
	public FirewallSummary getSummary() {
		Map<String, Long> byStatus = new LinkedHashMap<>();
		for (String status : FirewallConstants.STATUSES) {
			byStatus.put(status, firewallRepository.countWithStatus(status));
		}
		return new FirewallSummary(firewallRepository.count(), byStatus);
	}

	private void checkUnique(FirewallRequest request, long excludeId) {
		if (firewallRepository.countByNameExcludingId(request.name(), excludeId) > 0) {
			throw new DuplicateFirewallException("name", "A firewall with this name already exists");
		}
		if (firewallRepository.countByIpAddressExcludingId(request.ipAddress(), excludeId) > 0) {
			throw new DuplicateFirewallException("ipAddress", "This IP address is already assigned");
		}
	}

	private LocalDateTime now() {
		return LocalDateTime.now(clock).truncatedTo(ChronoUnit.SECONDS);
	}

	/** Makes %, _ and \ in the user's text match literally inside a LIKE pattern. */
	static String escapeLike(String text) {
		return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
	}
}
