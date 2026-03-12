const isDev = process.env.NODE_ENV !== 'production';

const log = {
  error: (label, err) => {
    if (isDev) {
      console.error(`\n[ERROR] ${label}`);
      console.error('  Message:', err?.message || err);
      if (err?.code) console.error('  Code:', err.code);
      if (err?.details) console.error('  Details:', err.details);
      if (err?.hint) console.error('  Hint:', err.hint);
      console.error('---');
    }
  },
  info: (msg) => { if (isDev) console.log(`[INFO] ${msg}`); },
};

module.exports = log;
