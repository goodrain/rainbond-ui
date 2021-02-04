/* eslint-disable no-shadow */
/* eslint-disable no-void */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-underscore-dangle */
import axios from 'axios';
import cookie from './cookie';

function _download(content, fileName) {
  const blob = new Blob([content]);
  const url = window.URL.createObjectURL(blob);
  const dom = document.createElement('a');
  dom.style.display = 'none';
  dom.href = url;
  dom.setAttribute('download', fileName);
  document.body.appendChild(dom);
  dom.click();
}

export default function download(url, fileName, options) {
  const defaultOptions = {
    credentials: 'include'
  };
  const newOptions = {
    ...defaultOptions,
    ...options
  };
  const headers = newOptions.headers || {};

  newOptions.headers = {
    ...headers
  };
  newOptions.url = url;
  const token = cookie.get('token');
  if (token) {
    newOptions.headers.Authorization = `GRJWT ${token}`;
  }
  newOptions.responseType = 'blob';
  newOptions.method = 'get';
  axios(newOptions).then(res => {
    const reader = new FileReader();
    const { data } = res;
    reader.onload = () => {
      // if (!fileName) {
      //   const contentDisposition = res.headers['content-disposition'];
      //   if (contentDisposition) {
      //     fileName = window.decodeURI(
      //       res.headers['content-disposition'].split('=')[2].split("''")[1],
      //       'UTF-8'
      //     );
      //   }
      // }
      _download(data, fileName);
    };
    reader.readAsText(data);
  });
}
