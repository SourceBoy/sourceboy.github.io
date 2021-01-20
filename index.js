'use strict';

const decoder = new TextDecoder();
const emitter = new EventEmitter3();

const chunks = [];
let chars = [];

const url = 'https://cors-anywhere.herokuapp.com/https://stuff.mit.edu/afs/sipb/contrib/pi/pi-billion.txt';
const cfg = {
  method: 'GET',
  headers: {},
  mode: 'cors',
  credentials: 'omit',
  cache: 'default',
  redirect: 'follow'
};

async function pump(rs) {
  const { done, value } = await rs.read();
  if (done) {
    console.info('done streaming');
    return;
  }
  console.info('chunk: %d', value.byteLength);
  emitter.emit('chunk', decoder.decode(value));
  return pump(rs);
}

async function fetchRange(start = 0, end = 16383) {
  cfg.headers['Range'] = `bytes=${start}-${end}`;

  const response = await fetch(url, cfg);
  const rs = response.body.getReader();
  const content_range = response.headers.get('content-range');
  let length = 0;

  if (content_range) {
    const [, _range] = content_range.split(' ');
    const [range, _length] = _range.split('/');
    ( [start, end] = range.split('-').map(n => Number(n)) );
    length = Number(_length);
  }

  await pump(rs);
  return { start, end, length };
}

emitter.once('chunk', () => {
  const $code = document.querySelector('code');
  let height = 0; // $code.offsetHeight;
  let waiting = false;
  let drainer;
  function process() {
    const has_chunks = !!chunks.length;
    const has_chars = !!chars.length;
    if (!has_chunks && !has_chars) {
      console.info('done outputting');
      return clearInterval(drainer);
    }
    if (!has_chars && has_chunks) {
      console.info('chunks -> chars');
      chars = Array.from(chunks.shift());
    }
    if (!has_chunks && !waiting) {
      emitter.emit('drained', true);
      waiting = true;
    }
    $code.textContent += chars.shift();
    const { offsetHeight } = $code;
    if (offsetHeight !== height) {
      window.scroll(0, offsetHeight);
      height = offsetHeight;
    }
  }
  emitter.on('refilled', () => {
    waiting = false;
  });
  drainer = setInterval(process, 10);
});

emitter.on('chunk', (chunk) => {
  chunks.push(chunk);
});

(function() {
  const size = 16383;
  let start = 0;
  let end = size;
  let length = 0;
  emitter.on('drained', () => {
    if ( length && (start >= (length - 1)) ) {
      console.info('No more content');
      return;
    }
    fetchRange(start, end).then((range) => {
      length = range.length;
      const max = length - 1;
      start = range.end + 1;
      end = start + size;
      if (end >= max) {
        end = max;
      }
      emitter.emit('refilled', true);
    });
  });
})();

emitter.emit('drained', true);
