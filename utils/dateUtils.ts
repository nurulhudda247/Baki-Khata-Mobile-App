import i18n from 'i18next';

/**
 * Gets the current date in YYYY-MM-DD format for Bangladesh Timezone (UTC+6).
 */
export const getCurrentDateBD = (): string => {
  const now = new Date();
  // BD is UTC+6. Calculate offset in ms.
  const bdTime = new Date(now.getTime() + (6 * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000));
  
  const year = bdTime.getFullYear();
  const month = String(bdTime.getMonth() + 1).padStart(2, '0');
  const day = String(bdTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Gets the current timestamp in ISO format forced to BD local time string.
 */
export const getCurrentTimestampBD = (): string => {
  const now = new Date();
  const bdTime = new Date(now.getTime() + (6 * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000));
  return bdTime.toISOString(); 
};

/**
 * Formats a given date string into a readable local format in BD Timezone.
 * Language follows current i18n settings.
 */
export const formatDateLabel = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const now = new Date(dateStr);
    const bdTime = new Date(now.getTime() + (6 * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000));
    
    const locale = i18n.language === 'bn' ? 'bn-BD' : 'en-US';
    return bdTime.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  } catch (e) {
    return dateStr;
  }
};

/**
 * Formats a timestamp into a readable time in BD Timezone (Forced).
 */
export const formatTimeLabel = (timestamp: string): string => {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    // Manual shift to BD time
    const bdTime = new Date(date.getTime() + (6 * 60 * 60 * 1000) + (date.getTimezoneOffset() * 60 * 1000));
    
    let hours = bdTime.getHours();
    const minutes = bdTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    const strMinutes = minutes < 10 ? '0' + minutes : minutes;
    
    return hours + ':' + strMinutes + ' ' + ampm;
  } catch (e) {
    return '';
  }
};
