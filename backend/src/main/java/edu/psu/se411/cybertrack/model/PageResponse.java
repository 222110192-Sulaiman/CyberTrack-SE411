package edu.psu.se411.cybertrack.model;

import java.util.List;

import org.springframework.data.domain.Page;

/**
 * One page of results plus the information a client needs to show page controls.
 * Spring's Page object is not returned directly because its JSON form is not a stable contract.
 */
public record PageResponse<T>(List<T> content, int page, int size, long totalElements, int totalPages) {

	public static <T> PageResponse<T> from(Page<T> page) {
		return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(), page.getTotalElements(),
				page.getTotalPages());
	}
}
