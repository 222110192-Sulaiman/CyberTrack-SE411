package edu.psu.se411.cybertrack.service;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import edu.psu.se411.cybertrack.model.Firewall;
import edu.psu.se411.cybertrack.model.FirewallRequest;
import edu.psu.se411.cybertrack.model.FirewallSummary;

/**
 * Business operations on firewalls. The controller depends on this interface,
 * so the implementation can be replaced (or mocked in tests) without changing the controller.
 */
public interface FirewallService {

	/**
	 * Returns one page of firewalls.
	 * @param search optional text matched against name, manufacturer, IP address and location; blank means all
	 */
	Page<Firewall> getFirewalls(Pageable pageable, String search);

	Optional<Firewall> getFirewallById(Long id);

	/** @throws edu.psu.se411.cybertrack.exception.DuplicateFirewallException if the name or IP is taken */
	Firewall createFirewall(FirewallRequest request);

	/**
	 * @throws edu.psu.se411.cybertrack.exception.FirewallNotFoundException if no firewall has this id
	 * @throws edu.psu.se411.cybertrack.exception.DuplicateFirewallException if the name or IP is taken
	 */
	Firewall updateFirewall(Long id, FirewallRequest request);

	/** @throws edu.psu.se411.cybertrack.exception.FirewallNotFoundException if no firewall has this id */
	void deleteFirewall(Long id);

	FirewallSummary getSummary();
}
