export const roleLabel = (role = '') => ({
  delivery_specialist: 'Delivery Specialist (Manager)',
  delivery_consultant: 'Delivery Consultant (Worker)',
}[role] || role.replaceAll('_', ' '));

export function matchesUser(user, search) {
  const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const text = [user.name, user.email, user.role, roleLabel(user.role), user.team,
    user.locked_site, user.active_site, ...(user.allowed_sites || []),
    ...(user.platform_access || []), user.active ? 'active' : 'inactive'].join(' ').toLowerCase();
  return terms.every((term) => text.includes(term));
}
