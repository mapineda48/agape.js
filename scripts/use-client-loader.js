module.exports = function (source) {
  if (!source.startsWith('"use client";')) {
    return `"use client";\n${source}`;
  }
  return source;
};
