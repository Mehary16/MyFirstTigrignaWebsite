export function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return { firstName: '—', lastName: '—' };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '—' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' ')
  };
}

export function buildFullName(firstName: string, lastName: string) {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(' ');
}
