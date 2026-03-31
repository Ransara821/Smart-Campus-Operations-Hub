export const saveToken = (token) => localStorage.setItem('token', token);
export const getToken  = ()        => localStorage.getItem('token');
export const removeToken = ()      => localStorage.removeItem('token');
export const isLoggedIn = ()       => !!getToken();

export const getRole = () => {
  const token = getToken();
  if (!token) return null;
  // JWT payload is the middle part, base64-encoded
  const payload = JSON.parse(atob(token.split('.')[1]));
  return payload.role;
};