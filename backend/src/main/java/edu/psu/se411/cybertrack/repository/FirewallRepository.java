package edu.psu.se411.cybertrack.repository;

import java.util.List;

import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.PagingAndSortingRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import edu.psu.se411.cybertrack.model.Firewall;

/**
 * Data access for firewalls. CRUD and paginated findAll come from Spring Data;
 * the custom queries below support search, uniqueness checks and dashboard counts.
 */
@Repository
public interface FirewallRepository
		extends CrudRepository<Firewall, Long>, PagingAndSortingRepository<Firewall, Long> {

	String SEARCH_CONDITION = " WHERE LOWER(name) LIKE :pattern OR LOWER(manufacturer) LIKE :pattern"
			+ " OR LOWER(ip_address) LIKE :pattern OR LOWER(location) LIKE :pattern";

	/** One page of firewalls whose name, manufacturer, IP address or location matches the pattern (newest first). */
	@Query("SELECT * FROM firewall" + SEARCH_CONDITION + " ORDER BY id DESC LIMIT :limit OFFSET :offset")
	List<Firewall> search(@Param("pattern") String pattern, @Param("limit") int limit, @Param("offset") long offset);

	/** Total number of firewalls matching the search pattern. */
	@Query("SELECT COUNT(*) FROM firewall" + SEARCH_CONDITION)
	long countSearch(@Param("pattern") String pattern);

	/** Number of other firewalls (id different from excludeId) that already use this name, ignoring case. */
	@Query("SELECT COUNT(*) FROM firewall WHERE LOWER(name) = LOWER(:name) AND id <> :excludeId")
	long countByNameExcludingId(@Param("name") String name, @Param("excludeId") long excludeId);

	/** Number of other firewalls (id different from excludeId) that already use this IP address. */
	@Query("SELECT COUNT(*) FROM firewall WHERE ip_address = :ipAddress AND id <> :excludeId")
	long countByIpAddressExcludingId(@Param("ipAddress") String ipAddress, @Param("excludeId") long excludeId);

	/** Number of firewalls in the given status. */
	@Query("SELECT COUNT(*) FROM firewall WHERE status = :status")
	long countWithStatus(@Param("status") String status);
}
