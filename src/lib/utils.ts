export const isValidString = (value: unknown): boolean => {
  return typeof value === 'string' && value.trim().length > 0;
};

export const isValidDomain = (value: unknown): boolean => {
  const domainRegex = /^[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,}$/i;
  return domainRegex.test(value as string);
};

export const isURL = (value: unknown): boolean => {
  try {
    new URL(value as string);
    return true;
  } catch (err) {
    return false;
  }
};

export const isNumber = (value: unknown): boolean => {
  return typeof value === 'number' && !isNaN(value);
};

export const isDate = (value: unknown): boolean => {
  return value instanceof Date;
};
