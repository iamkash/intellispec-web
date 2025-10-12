// This script will be run in the browser console to check localStorage
console.log('=== CHECKING AUTHENTICATION DATA ===');

const userStr = localStorage.getItem('user');
const token = localStorage.getItem('authToken') || localStorage.getItem('token');

console.log('User exists:', !!userStr);
console.log('Token exists:', !!token);

if (userStr) {
  try {
    const user = JSON.parse(userStr);
    console.log('User data:', user);
    console.log('Available tenant fields:', {
      tenantId: user.tenantId,
      tenant_id: user.tenant_id,
      orgId: user.orgId,
      organizationId: user.organizationId,
      companyId: user.companyId,
      tenantSlug: user.tenantSlug
    });
  } catch (error) {
    console.error('Failed to parse user data:', error);
  }
} else {
  console.log('No user data found in localStorage');
}

console.log('All localStorage keys:', Object.keys(localStorage));
