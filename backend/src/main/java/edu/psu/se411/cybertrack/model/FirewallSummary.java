package edu.psu.se411.cybertrack.model;

import java.util.Map;

/** Dashboard statistics: the total number of firewalls and the number in each status. */
public record FirewallSummary(long total, Map<String, Long> byStatus) {
}
