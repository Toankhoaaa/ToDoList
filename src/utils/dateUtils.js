// Hàm kiểm tra xem một ngày có phải là hôm nay không
export const isToday = (someDate) => {
  if (!someDate) return false;
  const today = new Date();
  const date = new Date(someDate);
  return date.getDate() === today.getDate() &&
         date.getMonth() === today.getMonth() &&
         date.getFullYear() === today.getFullYear();
};

// Hàm lấy ngày hôm qua
export const getYesterday = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday;
};

