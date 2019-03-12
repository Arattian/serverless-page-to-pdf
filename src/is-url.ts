const protocolAndDomainRE = /^(?:\w+:)?\/\/(\S+)$/;
const localhostDomainRE = /^localhost[\:?\d]*(?:[^\:?\d]\S*)?$/;
const nonLocalhostDomainRE = /^[^\s\.]+\.\S{2,}$/;

export const isUrl = (url: string) => {
  if (typeof url !== 'string') {
    return false;
  }

  const match = url.match(protocolAndDomainRE);

  if (!match) {
    return false;
  }

  if (!match[1]) {
    return false;
  }

  return (
    localhostDomainRE.test(match[1]) || nonLocalhostDomainRE.test(match[1])
  );
};
