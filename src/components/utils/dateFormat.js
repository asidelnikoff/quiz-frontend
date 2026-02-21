import moment from 'moment';

export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatFromMillisecondsTime = (milliseconds) => {
    const duration = moment.duration(milliseconds);
    return moment.utc(duration.asMilliseconds()).format('HH:mm:ss');
};

export const formatFromStringTime = (time) => {
  const formatString = 'HH:mm:ss'
  try {
    return moment(time, 'HH:mm').format(formatString)
  }
  catch {
    return moment(time, 'HH:mm:ss').format(formatString)
  }
}
