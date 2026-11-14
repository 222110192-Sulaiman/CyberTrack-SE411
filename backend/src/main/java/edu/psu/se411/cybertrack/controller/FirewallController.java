package edu.psu.se411.cybertrack.controller;

import java.net.URI;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

import edu.psu.se411.cybertrack.model.Firewall;
import edu.psu.se411.cybertrack.model.FirewallConstants;
import edu.psu.se411.cybertrack.model.FirewallRequest;
import edu.psu.se411.cybertrack.model.FirewallSummary;
import edu.psu.se411.cybertrack.model.PageResponse;
import edu.psu.se411.cybertrack.service.FirewallService;
import jakarta.validation.Valid;

/**
 * REST API for firewall assets: /api/v1/firewalls.
 * Validation, not-found and duplicate errors are turned into responses by GlobalExceptionHandler.
 */
@RestController
@RequestMapping("/api/v1/firewalls")
public class FirewallController {

	/** Newest firewalls first, so a firewall that was just added appears on the first page. */
	private static final Sort DEFAULT_SORT = Sort.by(Sort.Direction.DESC, "id");

	private final FirewallService firewallService;

	public FirewallController(FirewallService firewallService) {
		this.firewallService = firewallService;
	}

	/**
	 * GET /api/v1/firewalls?page=0&size=10&sort=name,asc&search=riyadh
	 * Returns one page of firewalls. search is optional.
	 */
	@GetMapping
	public ResponseEntity<PageResponse<Firewall>> getFirewalls(@PageableDefault(size = 10) Pageable pageable,
			@RequestParam(required = false) String search) {
		if (pageable.getPageSize() > FirewallConstants.MAX_PAGE_SIZE) {
			return ResponseEntity.badRequest().build();
		}
		for (Sort.Order order : pageable.getSort()) {
			if (!FirewallConstants.SORTABLE_PROPERTIES.contains(order.getProperty())) {
				return ResponseEntity.badRequest().build();
			}
		}
		Pageable request = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(),
				pageable.getSortOr(DEFAULT_SORT));
		Page<Firewall> page = firewallService.getFirewalls(request, search);
		return ResponseEntity.ok(PageResponse.from(page));
	}

	/** GET /api/v1/firewalls/summary - counts for the dashboard. */
	@GetMapping("/summary")
	public ResponseEntity<FirewallSummary> getSummary() {
		return ResponseEntity.ok(firewallService.getSummary());
	}

	/** GET /api/v1/firewalls/{id} - 200 with the firewall, or 404. */
	@GetMapping("/{id}")
	public ResponseEntity<Firewall> getFirewallById(@PathVariable Long id) {
		Optional<Firewall> firewall = firewallService.getFirewallById(id);
		if (firewall.isPresent()) {
			return ResponseEntity.ok(firewall.get());
		}
		return ResponseEntity.notFound().build();
	}

	/** POST /api/v1/firewalls - 201 with a Location header and the created firewall. */
	@PostMapping
	public ResponseEntity<Firewall> createFirewall(@Valid @RequestBody FirewallRequest request,
			UriComponentsBuilder ucb) {
		Firewall created = firewallService.createFirewall(request);
		URI location = ucb.path("/api/v1/firewalls/{id}").buildAndExpand(created.id()).toUri();
		return ResponseEntity.created(location).body(created);
	}

	/** PUT /api/v1/firewalls/{id} - 204 on success. */
	@PutMapping("/{id}")
	public ResponseEntity<Void> updateFirewall(@PathVariable Long id, @Valid @RequestBody FirewallRequest request) {
		firewallService.updateFirewall(id, request);
		return ResponseEntity.noContent().build();
	}

	/** DELETE /api/v1/firewalls/{id} - 204 on success. */
	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deleteFirewall(@PathVariable Long id) {
		firewallService.deleteFirewall(id);
		return ResponseEntity.noContent().build();
	}
}
