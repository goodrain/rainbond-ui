const { normalizeMarketArch } = require('./marketArch');

describe('market arch normalization', () => {
  it('uses the only cluster architecture as the market filter', () => {
    expect(normalizeMarketArch(undefined, ['arm64'])).toEqual('arm64');
  });

  it('does not force filtering when the cluster supports multiple architectures', () => {
    expect(normalizeMarketArch(undefined, ['amd64', 'arm64'])).toEqual('');
  });

  it('keeps explicit caller arch when provided', () => {
    expect(normalizeMarketArch('arm64', ['amd64'])).toEqual('arm64');
  });
});
