import i18n from 'i18next';

/**
 * Gets the current date in YYYY-MM-DD format for Bangladesh Timezone (UTC+6).
 */
export const getCurrentDateBD = (): string => {
  const now = new Date();
  const bdTime = new Date(now.getTime() + (6 * 60 * 60 * 1000) + (now.getTimezoneOffset() * 60 * 1000));
  
  const year = bdTime.getFullYear();
  const month = String(bdTime.getMonth() + 1).padStart(2, '0');
  const day = String(bdTime.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Gets the current timestamp in ISO format (UTC) for database saving.
 */
export const getCurrentTimestampBD = (): string => {
  return new Date().toISOString(); 
};

/**
 * Helper to safely parse SQLite timestamps that might lack a 'Z'.
 */
export const parseDatabaseTimestamp = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  
  // Handle simple "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    // Return date assuming it's local time (or add T00:00:00Z if UTC is intended)
    return new Date(`${dateStr}T00:00:00Z`);
  }
  
  let parseableStr = dateStr;
  if (!parseableStr.includes('T') && !parseableStr.includes('Z')) {
    parseableStr = parseableStr.replace(' ', 'T') + 'Z';
  }
  return new Date(parseableStr);
};

/**
 * Formats a given date string into a readable local format in BD Timezone.
 */
export const formatDateLabel = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const date = parseDatabaseTimestamp(dateStr);
    const bdTime = new Date(date.getTime() + (6 * 60 * 60 * 1000) + (date.getTimezoneOffset() * 60 * 1000));
    
    const day = bdTime.getDate();
    const year = bdTime.getFullYear();
    const monthIndex = bdTime.getMonth();
    
    const isBn = i18n.language === 'bn';
    const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const bnMonths = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
    
    const monthStr = isBn ? bnMonths[monthIndex] : enMonths[monthIndex];
    
    // convert numbers to bengali if needed
    const toBn = (num: number) => {
      const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
      return num.toString().split('').map(c => bnDigits[parseInt(c)] || c).join('');
    };

    const dStr = isBn ? toBn(day).padStart(2, '০') : day.toString().padStart(2, '0');
    const yStr = isBn ? toBn(year) : year.toString();

    return `${dStr} ${monthStr} ${yStr}`;
  } catch (e) {
    return dateStr;
  }
};

/**
 * Formats a timestamp into a readable time in BD Timezone.
 */
export const formatTimeLabel = (timestamp: string): string => {
  if (!timestamp) return '';
  try {
    const date = parseDatabaseTimestamp(timestamp);
    const bdTime = new Date(date.getTime() + (6 * 60 * 60 * 1000) + (date.getTimezoneOffset() * 60 * 1000));
    
    let hours = bdTime.getHours();
    const minutes = bdTime.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    const strMinutes = minutes < 10 ? '0' + minutes : minutes;
    
    return hours + ':' + strMinutes + ' ' + ampm;
  } catch (e) {
    return '';
  }
};
