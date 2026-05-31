// src/utils/dateHelpers.ts
export const getDefaultDates = () => {
  const today = new Date();
  const nextMonth = new Date(today);
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  
  return {
    today: today.toISOString().split('T')[0],
    nextMonth: nextMonth.toISOString().split('T')[0],
  };
};

export const getDaysDifference = (startDate: string, endDate: string): number => {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  return Math.floor((end - start) / (1000 * 60 * 60 * 24));
};

export const isDateInPast = (date: string): boolean => {
  return new Date(date) < new Date(new Date().setHours(0, 0, 0, 0));
};