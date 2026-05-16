export function hasPermission(permissionCode) {
  const permissions = JSON.parse(localStorage.getItem('userPermissions') || '[]');
  return permissions.includes(permissionCode);
}