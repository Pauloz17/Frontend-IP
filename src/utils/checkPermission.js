export function hasPermission(permissionCode) {
    // Obtenemos los permisos guardados en el login
    const permissions = JSON.parse(localStorage.getItem('userPermissions')) || [];
    return permissions.includes(permissionCode);
}