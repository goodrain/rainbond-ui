import axios from 'axios';

export default function sendUsageLog(data) {
  try {
    Promise.resolve(axios({
      credentials: 'same-origin',
      url: 'https://log.rainbond.com/log',
      method: 'post',
      timeout: 5000,
      data
    })).catch(() => {});
  } catch (error) {
    // Usage telemetry must never affect the business flow.
  }
}
